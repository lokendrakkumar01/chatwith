// Authentication Check
const token = localStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
      window.location.href = '/';
}

// API Base URL
const API_BASE = window.location.origin;

// Initialize Socket.io with authentication
const socket = io({
      auth: {
            token: token
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
});

// State
let selectedUserId = null;
let selectedUsername = null;
let allUsers = [];
let currentPage = 1;
let hasMoreMessages = false;
let typingTimeout = null;

// DOM Elements
const currentUsername = document.getElementById('currentUsername');
const currentUserAvatar = document.getElementById('currentUserAvatar');
const userList = document.getElementById('userList');
const chatWelcome = document.getElementById('chatWelcome');
const chatWindow = document.getElementById('chatWindow');
const chatUsername = document.getElementById('chatUsername');
const chatUserAvatar = document.getElementById('chatUserAvatar');
const chatUserStatus = document.getElementById('chatUserStatus');
const messagesContainer = document.getElementById('messagesContainer');
const messages = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const userSearch = document.getElementById('userSearch');
const typingIndicator = document.getElementById('typingIndicator');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// Initialize
currentUsername.textContent = currentUser.username || 'User';
currentUserAvatar.src = currentUser.profileImage || 'https://ui-avatars.com/api/?name=' + (currentUser.username || 'User');

// Socket Connection Events
socket.on('connect', () => {
      console.log('✅ Connected to server');
});

socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      alert('Failed to connect to server. Please refresh the page.');
});

socket.on('disconnect', () => {
      console.log('⚠️ Disconnected from server');
});

// Load Users
async function loadUsers() {
      try {
            const response = await fetch(`${API_BASE}/api/auth/users`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  }
            });

            const data = await response.json();

            if (data.success) {
                  allUsers = data.users;
                  renderUsers(allUsers);
            }
      } catch (error) {
            console.error('Load users error:', error);
            userList.innerHTML = '<p style="text-align: center; color: var(--danger); padding: 1rem;">Failed to load users</p>';
      }
}

// Render Users
function renderUsers(users) {
      if (users.length === 0) {
            userList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 1rem;">No users found</p>';
            return;
      }

      userList.innerHTML = users.map(user => `
    <div class="user-item ${selectedUserId === user._id ? 'active' : ''}" data-user-id="${user._id}" data-username="${user.username}">
      <div style="position: relative;">
        <img src="${user.profileImage || 'https://ui-avatars.com/api/?name=' + user.username}" alt="${user.username}" class="avatar">
        ${user.isOnline ? '<span class="online-indicator"></span>' : ''}
      </div>
      <div class="user-item-info">
        <h4>${user.username}</h4>
        <p>${user.isOnline ? 'Online' : 'Offline'}</p>
      </div>
    </div>
  `).join('');

      // Add click events
      document.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                  const userId = item.dataset.userId;
                  const username = item.dataset.username;
                  selectUser(userId, username);
            });
      });
}

// Search Users
userSearch.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const filtered = allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
      );
      renderUsers(filtered);
});

// Select User to Chat
async function selectUser(userId, username) {
      selectedUserId = userId;
      selectedUsername = username;
      currentPage = 1;

      // Update UI
      document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
      });
      document.querySelector(`[data-user-id="${userId}"]`).classList.add('active');

      chatWelcome.style.display = 'none';
      chatWindow.style.display = 'flex';

      chatUsername.textContent = username;
      const user = allUsers.find(u => u._id === userId);
      chatUserAvatar.src = user?.profileImage || 'https://ui-avatars.com/api/?name=' + username;
      chatUserStatus.textContent = user?.isOnline ? 'Online' : 'Offline';

      // Clear messages
      messages.innerHTML = '';

      // Load message history
      await loadMessages(userId);

      // Focus input
      messageInput.focus();
}

// Load Messages
async function loadMessages(userId, page = 1) {
      try {
            const response = await fetch(`${API_BASE}/api/messages/${userId}?page=${page}&limit=50`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  }
            });

            const data = await response.json();

            if (data.success) {
                  const messageElements = data.messages.map(msg => createMessageElement(msg));

                  if (page === 1) {
                        messages.innerHTML = messageElements.join('');
                        scrollToBottom();
                  } else {
                        // Prepend older messages
                        const scrollHeight = messagesContainer.scrollHeight;
                        messages.innerHTML = messageElements.join('') + messages.innerHTML;
                        messagesContainer.scrollTop = messagesContainer.scrollHeight - scrollHeight;
                  }

                  hasMoreMessages = data.pagination.hasMore;
                  loadMoreBtn.style.display = hasMoreMessages ? 'block' : 'none';

                  // Mark messages as read
                  markMessagesAsRead(userId);
            }
      } catch (error) {
            console.error('Load messages error:', error);
      }
}

// Load More Messages
loadMoreBtn.addEventListener('click', async () => {
      currentPage++;
      await loadMessages(selectedUserId, currentPage);
});

// Create Message Element
function createMessageElement(msg) {
      const isSent = msg.senderId._id === currentUser.id || msg.senderId === currentUser.id;
      const messageClass = isSent ? 'sent' : 'received';
      const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const statusIcon = isSent ? (
            msg.status === 'read' ? '✓✓' :
                  msg.status === 'delivered' ? '✓✓' : '✓'
      ) : '';

      return `
    <div class="message ${messageClass}" data-message-id="${msg._id || msg.messageId}">
      <img src="${isSent ? currentUser.profileImage : (msg.senderId.profileImage || 'https://ui-avatars.com/api/?name=' + selectedUsername)}" alt="Avatar" class="avatar">
      <div class="message-content">
        <div class="message-bubble">${escapeHtml(msg.message)}</div>
        <div class="message-meta">
          <span class="message-time">${time}</span>
          ${statusIcon ? `<span class="message-status">${statusIcon}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Send Message
messageForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const message = messageInput.value.trim();

      if (!message || !selectedUserId) return;

      // Emit message via socket
      socket.emit('send_message', {
            receiverId: selectedUserId,
            message: message
      });

      // Clear input
      messageInput.value = '';
      adjustTextareaHeight();
      sendBtn.disabled = true;

      // Stop typing indicator
      socket.emit('stop_typing', { receiverId: selectedUserId });
});

// Enable/disable send button
messageInput.addEventListener('input', (e) => {
      sendBtn.disabled = !e.target.value.trim();
      adjustTextareaHeight();

      // Typing indicator
      if (selectedUserId && e.target.value.trim()) {
            socket.emit('typing', { receiverId: selectedUserId });

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                  socket.emit('stop_typing', { receiverId: selectedUserId });
            }, 2000);
      }
});

// Auto-resize textarea
function adjustTextareaHeight() {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Socket Events - Receive Message
socket.on('receive_message', (data) => {
      // Add message to UI if conversation is open
      if (data.senderId._id === selectedUserId || data.senderId === selectedUserId) {
            const messageHtml = createMessageElement(data);
            messages.innerHTML += messageHtml;
            scrollToBottom();

            // Mark as read
            socket.emit('message_read', {
                  messageId: data.messageId,
                  senderId: data.senderId._id || data.senderId
            });
      }

      // Update user list (could show unread indicator)
      loadUsers();
});

// Socket Events - Message Sent Confirmation
socket.on('message_sent', (data) => {
      const messageHtml = createMessageElement(data);
      messages.innerHTML += messageHtml;
      scrollToBottom();
});

// Socket Events - Message Delivered
socket.on('message_delivered', (data) => {
      updateMessageStatus(data.messageId, 'delivered');
});

// Socket Events - Message Status Update
socket.on('message_status_update', (data) => {
      updateMessageStatus(data.messageId, data.status);
});

// Update Message Status
function updateMessageStatus(messageId, status) {
      const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
            const statusEl = messageEl.querySelector('.message-status');
            if (statusEl) {
                  statusEl.textContent = status === 'read' ? '✓✓' : status === 'delivered' ? '✓✓' : '✓';
            }
      }
}

// Socket Events - User Online/Offline Status
socket.on('user_status', (data) => {
      // Update user in list
      const userItem = document.querySelector(`[data-user-id="${data.userId}"]`);
      if (userItem) {
            const indicator = userItem.querySelector('.online-indicator');
            const statusText = userItem.querySelector('.user-item-info p');

            if (data.isOnline) {
                  if (!indicator) {
                        const avatarContainer = userItem.querySelector('div[style*="position"]');
                        avatarContainer.innerHTML += '<span class="online-indicator"></span>';
                  }
                  if (statusText) statusText.textContent = 'Online';
            } else {
                  if (indicator) indicator.remove();
                  if (statusText) statusText.textContent = 'Offline';
            }
      }

      // Update chat header if chatting with this user
      if (data.userId === selectedUserId) {
            chatUserStatus.textContent = data.isOnline ? 'Online' : 'Offline';
      }

      // Update allUsers array
      const userIndex = allUsers.findIndex(u => u._id === data.userId);
      if (userIndex !== -1) {
            allUsers[userIndex].isOnline = data.isOnline;
      }
});

// Socket Events - Typing Indicator
socket.on('user_typing', (data) => {
      if (data.userId === selectedUserId) {
            typingIndicator.style.display = 'block';
            chatUserStatus.style.display = 'none';
      }
});

socket.on('user_stop_typing', (data) => {
      if (data.userId === selectedUserId) {
            typingIndicator.style.display = 'none';
            chatUserStatus.style.display = 'block';
      }
});

// Mark Messages as Read
function markMessagesAsRead(userId) {
      // This could be enhanced to mark specific messages
      // For now, handled via socket events
}

// Scroll to Bottom
function scrollToBottom() {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Escape HTML
function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
}

// Logout
logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
      }
});

// Error Handler
socket.on('error', (error) => {
      console.error('Socket error:', error);
      alert(error.message || 'An error occurred');
});

// Initialize App
loadUsers();
