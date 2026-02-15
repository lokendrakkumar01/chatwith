// Mobile menu toggle functionality
document.addEventListener('DOMContentLoaded', () => {
      initializeMobileMenu();
});

// Also initialize when window is resized
window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
            // Remove mobile menu on desktop
            const existingToggle = document.querySelector('.mobile-menu-toggle');
            if (existingToggle) {
                  existingToggle.remove();
            }
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                  sidebar.classList.remove('active');
            }
      } else {
            // Reinitialize on mobile if not already present
            if (!document.querySelector('.mobile-menu-toggle')) {
                  initializeMobileMenu();
            }
      }
});

function initializeMobileMenu() {
      // Only add mobile menu on mobile devices
      if (window.innerWidth <= 768) {
            const chatContainer = document.querySelector('.chat-container');
            const sidebar = document.querySelector('.sidebar');

            if (chatContainer && sidebar && !document.querySelector('.mobile-menu-toggle')) {
                  // Create mobile menu toggle button
                  const toggleBtn = document.createElement('button');
                  toggleBtn.className = 'mobile-menu-toggle';
                  toggleBtn.innerHTML = '👥';
                  toggleBtn.setAttribute('aria-label', 'Toggle user list');

                  // Add to chat container
                  chatContainer.appendChild(toggleBtn);

                  // Toggle sidebar
                  toggleBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        sidebar.classList.toggle('active');
                        toggleBtn.innerHTML = sidebar.classList.contains('active') ? '✕' : '👥';
                  });

                  // Close sidebar when clicking on a user (use event delegation)
                  sidebar.addEventListener('click', (e) => {
                        const userItem = e.target.closest('.user-item');
                        if (userItem && window.innerWidth <= 768) {
                              setTimeout(() => {
                                    sidebar.classList.remove('active');
                                    toggleBtn.innerHTML = '👥';
                              }, 100);
                        }
                  });

                  // Close sidebar when clicking outside
                  document.addEventListener('click', (e) => {
                        if (window.innerWidth <= 768 &&
                              sidebar.classList.contains('active') &&
                              !sidebar.contains(e.target) &&
                              !toggleBtn.contains(e.target)) {
                              sidebar.classList.remove('active');
                              toggleBtn.innerHTML = '👥';
                        }
                  });
            }
      }

      // Add viewport meta tag if not present
      if (!document.querySelector('meta[name="viewport"]')) {
            const meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(meta);
      }
}
