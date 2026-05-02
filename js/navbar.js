// 导航栏管理 - 统一处理所有页面的导航栏状态

// 全局函数：更新导航栏状态
function updateNavbarStatus() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if (currentUser) {
        // 用户已登录 - 隐藏登录链接，显示用户菜单
        hideLoginLinks();
        showUserDropdown();
        updateUserPoints(currentUser.points || 0);
    } else {
        // 用户未登录 - 显示登录链接，隐藏用户菜单
        showLoginLinks();
        hideUserDropdown();
    }
}

// 隐藏登录链接
function hideLoginLinks() {
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    loginLinks.forEach(link => {
        const parentLi = link.closest('li');
        if (parentLi) {
            parentLi.style.display = 'none';
        } else {
            link.style.display = 'none';
        }
    });
}

// 显示登录链接
function showLoginLinks() {
    const loginLinks = document.querySelectorAll('a[href*="login.html"]');
    loginLinks.forEach(link => {
        const parentLi = link.closest('li');
        if (parentLi) {
            parentLi.style.display = 'block';
        } else {
            link.style.display = 'block';
        }
    });
}

// 显示用户下拉菜单
function showUserDropdown() {
    const userDropdowns = document.querySelectorAll('.nav-item.dropdown');
    userDropdowns.forEach(dropdown => {
        dropdown.style.display = 'block';
    });
}

// 隐藏用户下拉菜单
function hideUserDropdown() {
    const userDropdowns = document.querySelectorAll('.nav-item.dropdown');
    userDropdowns.forEach(dropdown => {
        dropdown.style.display = 'none';
    });
}

// 更新积分显示
function updateUserPoints(points) {
    const userPointsElements = document.querySelectorAll('#userPoints');
    userPointsElements.forEach(element => {
        element.textContent = points;
    });
}

// 页面加载时自动更新导航栏
document.addEventListener('DOMContentLoaded', function() {
    updateNavbarStatus();
});

// 导出函数供其他脚本使用
window.updateNavbarStatus = updateNavbarStatus;
window.hideLoginLinks = hideLoginLinks;
window.showLoginLinks = showLoginLinks;
window.showUserDropdown = showUserDropdown;
window.hideUserDropdown = hideUserDropdown;
window.updateUserPoints = updateUserPoints;
