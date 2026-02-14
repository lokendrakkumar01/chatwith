// Authentication Check
const token = localStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
      window.location.href = '/';
}

const API_BASE = window.location.origin;

// DOM Elements
const backBtn = document.getElementById('backBtn');
const profileAvatar = document.getElementById('profileAvatar');
const avatarPreview = document.getElementById('avatarPreview');
const profilePhotoInput = document.getElementById('profilePhotoInput');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const bioInput = document.getElementById('bio');
const bioCount = document.getElementById('bioCount');
const updateProfileBtn = document.getElementById('updateProfileBtn');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const messageBox = document.getElementById('messageBox');

// Load user profile
async function loadProfile() {
      try {
            const response = await fetch(`${API_BASE}/api/profile`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  }
            });

            const data = await response.json();

            if (data.success) {
                  const user = data.user;
                  profileAvatar.src = user.profileImage || `https://ui-avatars.com/api/?name=${user.username}`;
                  usernameInput.value = user.username;
                  emailInput.value = user.email;
                  bioInput.value = user.bio || '';
                  updateBioCount();
            }
      } catch (error) {
            console.error('Load profile error:', error);
            showMessage('Failed to load profile', 'error');
      }
}

// Bio character count
bioInput.addEventListener('input', updateBioCount);

function updateBioCount() {
      const count = bioInput.value.length;
      bioCount.textContent = `${count}/150`;
}

// Profile photo upload
avatarPreview.addEventListener('click', () => {
      profilePhotoInput.click();
});

profilePhotoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Preview image
      const reader = new FileReader();
      reader.onload = (e) => {
            profileAvatar.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('profileImage', file);

      try {
            updateProfileBtn.disabled = true;
            updateProfileBtn.textContent = 'Uploading...';

            const response = await fetch(`${API_BASE}/api/upload/profile`, {
                  method: 'POST',
                  headers: {
                        'Authorization': `Bearer ${token}`
                  },
                  body: formData
            });

            const data = await response.json();

            if (data.success) {
                  // Update localStorage
                  const user = JSON.parse(localStorage.getItem('user'));
                  user.profileImage = data.profileImage;
                  localStorage.setItem('user', JSON.stringify(user));

                  showMessage('Profile photo updated successfully!', 'success');
            } else {
                  showMessage(data.message || 'Failed to upload photo', 'error');
            }
      } catch (error) {
            console.error('Upload error:', error);
            showMessage('Failed to upload photo', 'error');
      } finally {
            updateProfileBtn.disabled = false;
            updateProfileBtn.textContent = 'Save Profile';
      }
});

// Update Profile
updateProfileBtn.addEventListener('click', async () => {
      const username = usernameInput.value.trim();
      const bio = bioInput.value.trim();

      if (!username) {
            showMessage('Username is required', 'error');
            return;
      }

      if (username.length < 3) {
            showMessage('Username must be at least 3 characters', 'error');
            return;
      }

      try {
            updateProfileBtn.disabled = true;
            updateProfileBtn.textContent = 'Saving...';

            const response = await fetch(`${API_BASE}/api/profile`, {
                  method: 'PUT',
                  headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ username, bio })
            });

            const data = await response.json();

            if (data.success) {
                  // Update localStorage
                  const user = data.user;
                  localStorage.setItem('user', JSON.stringify(user));

                  showMessage('Profile updated successfully!', 'success');
            } else {
                  showMessage(data.message || 'Failed to update profile', 'error');
            }
      } catch (error) {
            console.error('Update profile error:', error);
            showMessage('Failed to update profile', 'error');
      } finally {
            updateProfileBtn.disabled = false;
            updateProfileBtn.textContent = 'Save Profile';
      }
});

// Change Password
changePasswordBtn.addEventListener('click', async () => {
      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      if (!currentPassword || !newPassword || !confirmPassword) {
            showMessage('All password fields are required', 'error');
            return;
      }

      if (newPassword.length < 6) {
            showMessage('New password must be at least 6 characters', 'error');
            return;
      }

      if (newPassword !== confirmPassword) {
            showMessage('New passwords do not match', 'error');
            return;
      }

      try {
            changePasswordBtn.disabled = true;
            changePasswordBtn.textContent = 'Changing...';

            const response = await fetch(`${API_BASE}/api/profile/password`, {
                  method: 'PUT',
                  headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                  showMessage('Password changed successfully!', 'success');
                  currentPasswordInput.value = '';
                  newPasswordInput.value = '';
                  confirmPasswordInput.value = '';
            } else {
                  showMessage(data.message || 'Failed to change password', 'error');
            }
      } catch (error) {
            console.error('Change password error:', error);
            showMessage('Failed to change password', 'error');
      } finally {
            changePasswordBtn.disabled = false;
            changePasswordBtn.textContent = 'Change Password';
      }
});

// Delete Account
deleteAccountBtn.addEventListener('click', async () => {
      const confirmed = confirm(
            'Are you absolutely sure you want to delete your account?\n\nThis action cannot be undone. All your messages and data will be permanently deleted.'
      );

      if (!confirmed) return;

      const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:');

      if (doubleConfirm !== 'DELETE') {
            showMessage('Account deletion cancelled', 'info');
            return;
      }

      try {
            deleteAccountBtn.disabled = true;
            deleteAccountBtn.textContent = 'Deleting...';

            const response = await fetch(`${API_BASE}/api/profile`, {
                  method: 'DELETE',
                  headers: {
                        'Authorization': `Bearer ${token}`
                  }
            });

            const data = await response.json();

            if (data.success) {
                  showMessage('Account deleted successfully', 'success');
                  setTimeout(() => {
                        localStorage.clear();
                        window.location.href = '/';
                  }, 2000);
            } else {
                  showMessage(data.message || 'Failed to delete account', 'error');
            }
      } catch (error) {
            console.error('Delete account error:', error);
            showMessage('Failed to delete account', 'error');
            deleteAccountBtn.disabled = false;
            deleteAccountBtn.textContent = 'Delete Account';
      }
});

// Back to chat
backBtn.addEventListener('click', () => {
      window.location.href = '/chat';
});

// Show message
function showMessage(message, type = 'info') {
      messageBox.textContent = message;
      messageBox.className = `message-box show ${type}`;

      setTimeout(() => {
            messageBox.classList.remove('show');
      }, 4000);
}

// Initialize
loadProfile();
