class NavigationBar {
    constructor(options = {}) {
        this.currentPage = this.detectCurrentPage();
        this.API_URL = this.getApiUrl();
        this.eventListenersAttached = false;
        this.init();
    }

    getApiUrl() {
        return (typeof CONFIG !== 'undefined' && CONFIG.API_URL) 
            ? CONFIG.API_URL 
            : 'http://localhost:3000/api';
    }

    detectCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path.endsWith('/')) return 'home';
        if (path.includes('blog-detail')) return 'blog';
        if (path.includes('blog')) return 'blog';
        if (path.includes('your-pet')) return 'your-pet';
        if (path.includes('user-profile')) return 'your-pet';
        return '';
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.updateAuthState();
    }

    getNavbarHTML() {
        return `
            <nav class="navbar">
                <a href="index.html" class="navbar-brand">
                    <img src="/icon/logo.png" alt="Logo" style="width:35px;height:35px;">
                    <span class="brand-text">Petizo</span>
                </a>

                <button class="hamburger-btn" id="hamburgerBtn">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <ul class="nav-menu" id="navMenu">
                    <li><a href="index.html" class="nav-link ${this.currentPage === 'home' ? 'active' : ''}">Home</a></li>
                    <li><a href="blog.html" class="nav-link ${this.currentPage === 'blog' ? 'active' : ''}">Blog</a></li>
                    <li><a href="your-pet.html" class="nav-link ${this.currentPage === 'your-pet' ? 'active' : ''}" id="yourPetLink">Your Pet</a></li>
                </ul>

                <!-- Guest State -->
                <div class="nav-actions" id="navActionsGuest">
                    <button class="btn-login">Log in</button>
                    <button class="btn-signup">Sign up</button>
                </div>

                <!-- User State -->
                <div class="nav-actions hidden" id="navActionsUser">
                    <span id="userDisplayName" style="color: #666; font-weight: 500; margin-right: 12px;"></span>
                    <button class="icon-btn" id="notificationBtn">
                        <img src="/icon/alarm.png" alt="Notification" style="width:40px;height:40px;">
                        <span class="notification-badge" id="notificationBadge" style="display: none;">0</span>
                    </button>
                    <div class="profile-dropdown">
                        <button class="icon-btn" id="profileBtn" title="โปรไฟล์">
                            <img src="/icon/profile.png" alt="User" style="width:35px;height:35px;">
                        </button>
                        <div class="dropdown-menu" id="profileDropdown">
                            <a href="user-profile.html" class="dropdown-item">
                                <img src="/icon/profile.png" alt="User" style="width:30px;height:30px;">
                                <span>ข้อมูลผู้ใช้งาน</span>
                            </a>
                            <button class="dropdown-item logout">
                                <img src="/icon/logout.png" alt="Log Out" style="width:30px;height:30px;">
                                <span>ออกจากระบบ</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <!-- Notification Modal -->
            <div class="notification-modal" id="notificationModal">
                <div class="notification-content">
                    <div class="notification-header">
                        <h2>
                            <span><img src="/icon/alarm.png" alt="Notification" style="width:30px;height:30px;"></span>
                            <span>การแจ้งเตือนวัคซีน</span>
                        </h2>
                        <button class="close-modal-btn" id="closeNotificationBtn">×</button>
                    </div>
                    
                    <div class="notification-body" id="notificationList">
                        <div class="loading">
                            <div class="spinner"></div>
                            <div>กำลังโหลดการแจ้งเตือน</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    render() {
        const container = document.getElementById('navbar-container');
        if (container) {
            container.innerHTML = this.getNavbarHTML();
        }
    }

    attachEventListeners() {
        // Only attach document-level listeners once
        if (!this.eventListenersAttached) {
            this.attachDocumentListeners();
            this.eventListenersAttached = true;
        }

        // Attach element-specific listeners (these get new elements after re-render)
        this.attachElementListeners();
    }

    attachDocumentListeners() {
        // Global click handler for closing dropdowns and menus
        document.addEventListener('click', (e) => {
            const hamburgerBtn = document.getElementById('hamburgerBtn');
            const navMenu = document.getElementById('navMenu');
            const profileDropdown = document.getElementById('profileDropdown');

            // Close hamburger menu if clicking outside navbar
            if (hamburgerBtn && navMenu && !e.target.closest('.navbar')) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }

            // Close profile dropdown if clicking outside
            if (profileDropdown && !e.target.closest('.profile-dropdown')) {
                profileDropdown.classList.remove('show');
            }

            // Handle logout button click (event delegation)
            if (e.target.closest('.dropdown-item.logout')) {
                e.preventDefault();
                if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Clear browser history state to prevent back button access
                    window.history.replaceState(null, '', 'index.html');
                    window.location.href = 'index.html';
                }
            }
        });
    }

    attachElementListeners() {
        // Hamburger menu toggle
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const navMenu = document.getElementById('navMenu');

        if (hamburgerBtn && navMenu) {
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hamburgerBtn.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close menu when clicking on a link
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    hamburgerBtn.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profileBtn');
        const profileDropdown = document.getElementById('profileDropdown');

        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.classList.toggle('show');
            });
        }

        // Login/Signup buttons
        const loginBtn = document.querySelector('.btn-login');
        const signupBtn = document.querySelector('.btn-signup');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }

        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = 'register.html';
            });
        }

        // Logout button is handled by event delegation in attachDocumentListeners()

        // Your Pet link protection
        const yourPetLink = document.getElementById('yourPetLink');
        if (yourPetLink) {
            yourPetLink.addEventListener('click', (e) => {
                const token = localStorage.getItem('token');
                if (!token) {
                    e.preventDefault();
                    alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า Your Pet');
                    window.location.href = 'login.html';
                }
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.toggleNotificationModal();
            });
        }

        // Close notification modal
        const closeNotificationBtn = document.getElementById('closeNotificationBtn');
        if (closeNotificationBtn) {
            closeNotificationBtn.addEventListener('click', () => {
                this.toggleNotificationModal();
            });
        }

        // Close modal on backdrop click
        const notificationModal = document.getElementById('notificationModal');
        if (notificationModal) {
            notificationModal.addEventListener('click', (e) => {
                if (e.target.id === 'notificationModal') {
                    this.toggleNotificationModal();
                }
            });
        }
    }

    updateAuthState() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        const guestActions = document.getElementById('navActionsGuest');
        const userActions = document.getElementById('navActionsUser');
        const userDisplayName = document.getElementById('userDisplayName');

        if (token && user) {
            // ตรวจสอบว่า token ยังใช้งานได้หรือไม่
            this.verifyToken(token).then(isValid => {
                if (isValid) {
                    if (guestActions) guestActions.classList.add('hidden');
                    if (userActions) userActions.classList.remove('hidden');
                    
                    try {
                        const userData = JSON.parse(user);
                        if (userDisplayName) {
                            userDisplayName.textContent = userData.full_name || userData.username || 'User';
                        }
                    } catch (e) {
                        console.error('Error parsing user data:', e);
                    }

                    // Load notifications
                    this.loadNotifications();
                } else {
                    // Token หมดอายุหรือไม่ถูกต้อง - logout อัตโนมัติ
                    this.handleAutoLogout();
                }
            }).catch(() => {
                // เกิดข้อผิดพลาดในการตรวจสอบ - logout อัตโนมัติ
                this.handleAutoLogout();
            });
        } else {
            if (guestActions) guestActions.classList.remove('hidden');
            if (userActions) userActions.classList.add('hidden');
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch(`${this.API_URL}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    handleAutoLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const guestActions = document.getElementById('navActionsGuest');
        const userActions = document.getElementById('navActionsUser');
        if (guestActions) guestActions.classList.remove('hidden');
        if (userActions) userActions.classList.add('hidden');
    }

    toggleNotificationModal() {
        const modal = document.getElementById('notificationModal');
        if (modal) {
            const isShowing = modal.classList.contains('show');
            if (isShowing) {
                modal.classList.remove('show');
            } else {
                modal.classList.add('show');
                // Reload when opening
                this.loadNotifications();
            }
        }
    }

    async loadNotifications() {
        const token = localStorage.getItem('token');
        if (!token) return;

        const notificationList = document.getElementById('notificationList');
        const notificationBadge = document.getElementById('notificationBadge');

        if (!notificationList) return;

        try {
            // 1) Prefer client-side NotificationSystem (we added vaccine-notification.js)
            if (window.NotificationSystem && typeof window.NotificationSystem.loadNotifications === 'function') {
                // loadNotifications will fetch data, render list and update badge internally
                await window.NotificationSystem.loadNotifications();
                // Nothing more to do here (UI updated by NotificationSystem)
                return;
            }

            // 2) Fallback: call server endpoint /api/notifications
            const res = await fetch(`${this.API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                console.warn('Notifications endpoint not available, status', res.status);
                // show empty state
                notificationList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 16px;"><img src="/icon/alarm.png" alt="Notification" style="width:30px;height:30px;"></div>
                        <p>ไม่มีการแจ้งเตือน</p>
                    </div>
                `;
                if (notificationBadge) notificationBadge.style.display = 'none';
                return;
            }

            const notifications = await res.json();

            // Update badge (unread detection; fallback if property missing)
            const unreadCount = Array.isArray(notifications) 
                ? notifications.filter(n => !n.is_read && n.is_read !== undefined).length
                : 0;

            if (notificationBadge) {
                if (unreadCount > 0) {
                    notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    notificationBadge.style.display = 'block';
                } else {
                    notificationBadge.style.display = 'none';
                }
            }

            // Render list
            if (!Array.isArray(notifications) || notifications.length === 0) {
                notificationList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #999;">
                        <div style="font-size: 48px; margin-bottom: 16px;"><img src="/icon/alarm.png" alt="Notification" style="width:30px;height:30px;"></div>
                        <p>ไม่มีการแจ้งเตือน</p>
                    </div>
                `;
            } else {
                notificationList.innerHTML = notifications.map(notification => {
                    let daysUntilText = '';
                    let urgencyClass = '';
                    if (notification.next_due_date) {
                        const daysUntil = this.calculateDaysUntil(notification.next_due_date);
                        if (daysUntil < 0) {
                            daysUntilText = `เลยกำหนด ${Math.abs(daysUntil)} วัน`;
                            urgencyClass = 'urgent';
                        } else if (daysUntil === 0) {
                            daysUntilText = 'วันนี้';
                            urgencyClass = 'warning';
                        } else if (daysUntil <= 7) {
                            daysUntilText = `เหลือ ${daysUntil} วัน`;
                            urgencyClass = 'warning';
                        } else {
                            daysUntilText = `อีก ${daysUntil} วัน`;
                        }
                    } else if (notification.daysLeft !== undefined && notification.daysLeft !== null) {
                        const daysUntil = notification.daysLeft;
                        if (daysUntil < 0) {
                            daysUntilText = `เลยกำหนด ${Math.abs(daysUntil)} วัน`;
                            urgencyClass = 'urgent';
                        } else if (daysUntil <= 7) {
                            daysUntilText = `เหลือ ${daysUntil} วัน`;
                            urgencyClass = 'warning';
                        } else {
                            daysUntilText = `อีก ${daysUntil} วัน`;
                        }
                    }

                    const dueDateText = notification.next_due_date
                        ? new Date(notification.next_due_date).toLocaleDateString('th-TH')
                        : (notification.dueDate ? new Date(notification.dueDate).toLocaleDateString('th-TH') : '-');

                    return `
                        <div class="notification-item ${urgencyClass}" onclick="window.location.href='pet-details.html?id=${notification.petId || notification.pet_id}'">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                <strong style="color: #1a1a1a;">${notification.petName || notification.pet_name || 'ไม่ทราบชื่อสัตว์เลี้ยง'}</strong>
                                <span style="background: ${urgencyClass === 'urgent' ? '#ff4757' : '#00bcd4'}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                                    ${daysUntilText || '—'}
                                </span>
                            </div>
                            <div style="color: #666; font-size: 14px; margin-bottom: 4px;">
                                ${notification.vaccineName || notification.vaccine_name || notification.vaccineName || ''}
                            </div>
                            <div style="color: #999; font-size: 13px;">
                                ครั้งถัดไป: ${dueDateText}
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
            notificationList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #dc3545;">
                    <div style="font-size: 48px; margin-bottom: 16px;"><img src="/icon/warning.png" alt="Warning" style="width:50px;height:50px;"></div>
                    <p>ไม่สามารถโหลดการแจ้งเตือนได้</p>
                </div>
            `;
            if (notificationBadge) notificationBadge.style.display = 'none';
        }
    }

    calculateDaysUntil(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);
        
        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    // Static method for external use
    static updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    static refreshAuth() {
        // Use existing instance instead of creating new one
        if (window.navbar) {
            window.navbar.updateAuthState();
        }
    }
}

async function loadNotifications() {
    try {
        const res = await fetch(`${CONFIG.API_URL}/notifications`);
        if (!res.ok) {
            console.warn('Notifications endpoint not found (skipping)');
        } else {
            const notes = await res.json();
        }
        } catch(e) {
        console.warn('Failed to load notifications, skipping', e);
    }
}

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navbar = new NavigationBar();
    });
} else {
    window.navbar = new NavigationBar();
}

// Export for external use
window.NavigationBar = NavigationBar;