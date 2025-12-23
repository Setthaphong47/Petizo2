// Check if admin is accessing non-admin pages and logout
function checkAdminAccess() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        try {
            const userData = JSON.parse(user);
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';

            // If user is admin and NOT on admin.html
            if (userData.role === 'admin' && currentPage !== 'admin.html') {
                console.log('Admin trying to access non-admin page. Logging out...');
                localStorage.clear();
                window.location.href = 'login.html';
                return false;
            }
        } catch (e) {
            console.error('Error checking admin access:', e);
        }
    }
    return true;
}

function checkLoginStatus() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    const navActionsGuest = document.getElementById('navActionsGuest');
    const navActionsUser = document.getElementById('navActionsUser');
    const userDisplayName = document.getElementById('userDisplayName');

    if (token && user) {
        // User Logged In
        if (navActionsGuest) navActionsGuest.classList.add('hidden');
        if (navActionsUser) navActionsUser.classList.remove('hidden');

        // Display user
        if (userDisplayName) {
            try {
                const userData = JSON.parse(user);
                userDisplayName.textContent = userData.full_name || userData.username || 'ผู้ใช้';
            } catch (e) {
                console.error('Error parsing user data:', e);
                userDisplayName.textContent = 'ผู้ใช้';
            }
        }
        return true;
    } else {
        // User Not Logged In
        if (navActionsGuest) navActionsGuest.classList.remove('hidden');
        if (navActionsUser) navActionsUser.classList.add('hidden');
        return false;
    }
}

// Logout function (confirmation is handled by navbar.js event delegation)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear browser history state to prevent back button access
    window.history.replaceState(null, '', 'index.html');
    window.location.href = 'index.html';
}

// Back to login page
function goToLogin() {
    window.location.href = 'login.html';
}

// Back to signup page
function goToSignup() {
    window.location.href = 'register.html';
}


function requireLogin() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Handle Your Pet click
function handleYourPetClick(event) {
    event.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) {
        alert('กรุณาเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า Your Pet');
        window.location.href = 'login.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Auto-run admin access check on page load
if (typeof window !== 'undefined') {
    // Run immediately
    checkAdminAccess();

    // Also run on DOMContentLoaded for safety
    document.addEventListener('DOMContentLoaded', checkAdminAccess);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAdminAccess,
        checkLoginStatus,
        logout,
        goToLogin,
        goToSignup,
        requireLogin,
        handleYourPetClick
    };
}