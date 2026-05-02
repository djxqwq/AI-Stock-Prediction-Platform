// 认证相关JavaScript文件

let currentCaptcha = '';

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果是注册页面，生成验证码
    if (document.getElementById('captchaCanvas')) {
        generateCaptcha();
    }
    
    // 绑定表单事件
    bindFormEvents();
});

// 绑定表单事件
function bindFormEvents() {
    // 登录表单
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // 注册表单
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        
        // 密码强度检测
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', checkPasswordStrength);
        }
        
        // 确认密码验证
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', validatePasswordMatch);
        }

        if (passwordInput && confirmPasswordInput) {
            passwordInput.addEventListener('input', function() {
                validatePasswordMatch({ target: confirmPasswordInput });
            });
        }
        
        // 用户名验证
        const usernameInput = document.getElementById('username');
        if (usernameInput) {
            usernameInput.addEventListener('blur', validateUsername);
        }
        
        // 邮箱验证
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', validateEmail);
        }
    }
    
    // 忘记密码表单
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // 清除之前的错误状态
    clearValidationErrors();
    
    // 基本验证
    if (!username) {
        showFieldError('username', '请输入用户名或邮箱');
        return;
    }
    
    if (!password) {
        showFieldError('password', '请输入密码');
        return;
    }
    
    // 显示加载状态
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>登录中...';
    submitBtn.disabled = true;
    
    try {
        // 调用登录API
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                rememberMe: rememberMe
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // 保存用户信息和token
            const userData = result.data;
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            if (rememberMe) {
                localStorage.setItem('rememberLogin', 'true');
            }
            
            showNotification('登录成功！正在跳转...', 'success');
            
            // 跳转到首页
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            showFieldError('username', result.message || '登录失败');
            showFieldError('password', result.message || '登录失败');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showNotification('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 处理注册
async function handleRegister(e) {
    e.preventDefault();
    
    const formData = {
        username: document.getElementById('username').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        captcha: document.getElementById('captcha').value.trim(),
        agreeTerms: document.getElementById('agreeTerms').checked,
        subscribeNewsletter: document.getElementById('subscribeNewsletter').checked
    };
    
    // 清除之前的错误状态
    clearValidationErrors();
    
    // 验证表单
    if (!validateRegisterForm(formData)) {
        return;
    }
    
    // 显示加载状态
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>注册中...';
    submitBtn.disabled = true;
    
    try {
        // 调用注册API
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                confirmPassword: formData.confirmPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('注册成功！正在自动登录...', 'success');
            
            // 自动登录
            setTimeout(() => {
                localStorage.setItem('currentUser', JSON.stringify(result.data));
                window.location.href = '../index.html';
            }, 1500);
        } else {
            showFieldError('username', result.message || '注册失败');
            generateCaptcha(); // 重新生成验证码
        }
    } catch (error) {
        console.error('注册错误:', error);
        showNotification('网络错误，请稍后重试', 'error');
    } finally {
        // 恢复按钮状态
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 验证注册表单
function validateRegisterForm(formData) {
    let isValid = true;
    
    // 用户名验证
    if (!formData.username) {
        showFieldError('username', '请输入用户名');
        isValid = false;
    } else if (formData.username.length < 3 || formData.username.length > 50) {
        showFieldError('username', '用户名长度应为3-50个字符');
        isValid = false;
    } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/.test(formData.username)) {
        showFieldError('username', '用户名只能包含字母、数字、中文和下划线');
        isValid = false;
    }
    
    // 邮箱验证
    if (!formData.email) {
        showFieldError('email', '请输入邮箱地址');
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showFieldError('email', '请输入有效的邮箱地址');
        isValid = false;
    }
    
    // 手机号验证（可选）
    if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
        showFieldError('phone', '请输入有效的手机号码');
        isValid = false;
    }
    
    // 密码验证
    if (!formData.password) {
        showFieldError('password', '请输入密码');
        isValid = false;
    } else if (formData.password.length < 8 || formData.password.length > 50) {
        showFieldError('password', '密码长度应为8-50个字符');
        isValid = false;
    } else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(formData.password)) {
        showFieldError('password', '密码必须包含字母和数字');
        isValid = false;
    }
    
    // 确认密码验证
    if (!formData.confirmPassword) {
        showFieldError('confirmPassword', '请确认密码');
        isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
        showFieldError('confirmPassword', '两次密码输入不一致');
        isValid = false;
    }
    
    // 验证码验证
    if (!formData.captcha) {
        showFieldError('captcha', '请输入验证码');
        isValid = false;
    } else if (formData.captcha.toLowerCase() !== currentCaptcha.toLowerCase()) {
        showFieldError('captcha', '验证码错误');
        isValid = false;
    }
    
    // 服务条款验证
    if (!formData.agreeTerms) {
        showNotification('请阅读并同意服务条款和隐私政策', 'warning');
        isValid = false;
    }
    
    return isValid;
}

// 检查密码强度
function checkPasswordStrength(e) {
    const password = e.target.value;
    const strengthBar = document.getElementById('passwordStrength');
    
    if (!password) {
        strengthBar.className = 'password-strength-bar';
        return;
    }
    
    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    
    // 复杂度检查
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    
    // 更新强度条
    if (strength <= 2) {
        strengthBar.className = 'password-strength-bar strength-weak';
    } else if (strength <= 4) {
        strengthBar.className = 'password-strength-bar strength-medium';
    } else {
        strengthBar.className = 'password-strength-bar strength-strong';
    }
}

// 验证密码匹配
function validatePasswordMatch(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = e.target.value;
    
    if (!confirmPassword) {
        const field = document.getElementById('confirmPassword');
        const invalidFeedback = field.parentElement.querySelector('.invalid-feedback') ||
                              field.parentElement.parentElement.querySelector('.invalid-feedback');
        const validFeedback = field.parentElement.querySelector('.valid-feedback') ||
                            field.parentElement.parentElement.querySelector('.valid-feedback');
        field.classList.remove('is-invalid', 'is-valid');
        if (invalidFeedback) {
            invalidFeedback.textContent = '';
            invalidFeedback.style.display = 'none';
        }
        if (validFeedback) {
            validFeedback.textContent = '';
            validFeedback.style.display = 'none';
        }
        return;
    }
    
    if (password !== confirmPassword) {
        showFieldError('confirmPassword', '两次密码输入不一致');
    } else {
        showFieldSuccess('confirmPassword', '密码匹配');
    }
}

// 验证用户名
async function validateUsername(e) {
    const username = e.target.value.trim();
    
    if (!username) {
        showFieldError('username', '请输入用户名');
        return;
    }
    
    if (username.length < 3 || username.length > 50) {
        showFieldError('username', '用户名长度应为3-50个字符');
        return;
    }
    
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_]+$/.test(username)) {
        showFieldError('username', '用户名只能包含字母、数字、中文和下划线');
        return;
    }
    
    // 检查用户名是否已存在（模拟）
    try {
        // 这里应该调用API检查用户名是否存在
        // const response = await fetch(`/api/check-username?username=${username}`);
        // const result = await response.json();
        
        // 模拟检查结果
        const isAvailable = !['admin', 'test', 'user'].includes(username.toLowerCase());
        
        if (isAvailable) {
            showFieldSuccess('username', '用户名可用');
        } else {
            showFieldError('username', '用户名已存在');
        }
    } catch (error) {
        console.error('用户名验证错误:', error);
    }
}

// 验证邮箱
async function validateEmail(e) {
    const email = e.target.value.trim();
    
    if (!email) {
        showFieldError('email', '请输入邮箱地址');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('email', '请输入有效的邮箱地址');
        return;
    }
    
    // 检查邮箱是否已存在（模拟）
    try {
        // 这里应该调用API检查邮箱是否存在
        // const response = await fetch(`/api/check-email?email=${email}`);
        // const result = await response.json();
        
        // 模拟检查结果
        const isAvailable = !email.includes('admin') && !email.includes('test');
        
        if (isAvailable) {
            showFieldSuccess('email', '邮箱可用');
        } else {
            showFieldError('email', '邮箱已被注册');
        }
    } catch (error) {
        console.error('邮箱验证错误:', error);
    }
}

// 生成验证码
function generateCaptcha() {
    const canvas = document.getElementById('captchaCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 设置背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 生成随机验证码
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    currentCaptcha = '';
    for (let i = 0; i < 4; i++) {
        currentCaptcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 绘制验证码文字
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#1A85FF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 添加干扰线
    for (let i = 0; i < 4; i++) {
        ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
    
    // 绘制文字（每个字符随机位置和角度）
    for (let i = 0; i < currentCaptcha.length; i++) {
        const char = currentCaptcha[i];
        const x = 20 + i * 25;
        const y = 25 + Math.random() * 10 - 5;
        const angle = (Math.random() - 0.5) * 0.4;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
    
    // 添加干扰点
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// 切换密码显示/隐藏
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggleIcon = document.getElementById(fieldId + 'Toggle');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.className = 'bi bi-eye-slash';
    } else {
        passwordField.type = 'password';
        toggleIcon.className = 'bi bi-eye';
    }
}

// 显示字段错误
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const feedback = field.parentElement.querySelector('.invalid-feedback') || 
                    field.parentElement.parentElement.querySelector('.invalid-feedback');
    const validFeedback = field.parentElement.querySelector('.valid-feedback') ||
                         field.parentElement.parentElement.querySelector('.valid-feedback');
    
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    if (validFeedback) {
        validFeedback.textContent = '';
        validFeedback.style.display = 'none';
    }

    if (feedback) {
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
}

// 显示字段成功
function showFieldSuccess(fieldId, message) {
    const field = document.getElementById(fieldId);
    const feedback = field.parentElement.querySelector('.valid-feedback') || 
                    field.parentElement.parentElement.querySelector('.valid-feedback');
    const invalidFeedback = field.parentElement.querySelector('.invalid-feedback') ||
                           field.parentElement.parentElement.querySelector('.invalid-feedback');
    
    field.classList.add('is-valid');
    field.classList.remove('is-invalid');

    if (invalidFeedback) {
        invalidFeedback.textContent = '';
        invalidFeedback.style.display = 'none';
    }
    
    if (feedback) {
        feedback.textContent = message;
        feedback.style.display = 'block';
    }
}

// 清除验证错误
function clearValidationErrors() {
    const fields = document.querySelectorAll('.form-control');
    fields.forEach(field => {
        field.classList.remove('is-invalid', 'is-valid');
    });
    
    const feedbacks = document.querySelectorAll('.invalid-feedback, .valid-feedback');
    feedbacks.forEach(feedback => {
        feedback.style.display = 'none';
    });
}

// 处理忘记密码
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!email) {
        showNotification('请输入邮箱地址', 'warning');
        return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotification('请输入有效的邮箱地址', 'warning');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>发送中...';
    submitBtn.disabled = true;
    
    try {
        // 调用重置密码API
        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('重置链接已发送到您的邮箱', 'success');
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            modal.hide();
            
            // 清空表单
            e.target.reset();
        } else {
            showNotification(result.message || '发送失败，请稍后重试', 'error');
        }
    } catch (error) {
        console.error('重置密码错误:', error);
        showNotification('网络错误，请稍后重试', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// 显示忘记密码模态框
function showForgotPassword() {
    const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    modal.show();
}

// 显示服务条款
function showTerms() {
    const modal = new bootstrap.Modal(document.getElementById('termsModal'));
    modal.show();
}

// 显示隐私政策
function showPrivacy() {
    const modal = new bootstrap.Modal(document.getElementById('privacyModal'));
    modal.show();
}

// 用户退出登录
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('rememberLogin');
    showNotification('已安全退出登录', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1500);
}

// 检查登录状态
function checkLoginStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const rememberLogin = localStorage.getItem('rememberLogin');
    
    if (!currentUser && !rememberLogin) {
        // 如果没有登录信息，跳转到登录页
        if (!window.location.pathname.includes('login.html') && 
            !window.location.pathname.includes('register.html')) {
            window.location.href = 'pages/login.html';
        }
    }
    
    return currentUser ? JSON.parse(currentUser) : null;
}

// 更新页面中的用户信息
function updateUserInfo() {
    const currentUser = checkLoginStatus();
    
    if (currentUser) {
        // 更新导航栏用户信息
        const userPointsElements = document.querySelectorAll('#userPoints');
        userPointsElements.forEach(element => {
            element.textContent = currentUser.points || 0;
        });
        
        // 更新用户名显示
        const usernameElements = document.querySelectorAll('.current-username');
        usernameElements.forEach(element => {
            element.textContent = currentUser.username;
        });
    }
}

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    updateUserInfo();
});
