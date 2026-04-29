// AI智能股票预测平台 - 主要JavaScript文件

// 全局变量
let currentUser = null;
let stockData = [];
let predictionData = [];

// 页面初始化
function initializeHomePage() {
    loadUserData();
    loadHotStocks();
    loadAIPredictions();
    loadCommunityPredictions();
    loadTopPredictors();
    initializeAccuracyChart();
    startRealTimeUpdates();
    
    // 搜索框事件监听
    document.getElementById('stockSearch').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
}

// 加载用户数据
function loadUserData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        
        // 检查每日登录奖励
        checkDailyLoginReward();
        
        document.getElementById('userPoints').textContent = currentUser.points || 0;
        updateNavbarForLoggedInUser();
    } else {
        updateNavbarForLoggedOutUser();
    }
}

// 检查每日登录奖励
function checkDailyLoginReward() {
    const today = new Date().toDateString();
    const lastLoginDate = localStorage.getItem('lastLoginDate');
    
    if (lastLoginDate !== today) {
        // 今天第一次登录，给予10积分奖励
        currentUser.points = (currentUser.points || 0) + 10;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('lastLoginDate', today);
        
        // 更新积分显示
        document.getElementById('userPoints').textContent = currentUser.points;
        
        // 显示奖励通知
        showNotification('🎉 每日登录奖励：+10积分！', 'success');
        
        // 记录积分变动
        addPointsRecord('每日登录奖励', 10, '系统奖励');
    }
}

// 添加积分记录
function addPointsRecord(reason, amount, type) {
    const records = JSON.parse(localStorage.getItem('pointsRecords') || '[]');
    records.unshift({
        id: Date.now(),
        reason: reason,
        amount: amount,
        type: type,
        timestamp: new Date().toISOString()
    });
    
    // 只保留最近50条记录
    if (records.length > 50) {
        records.splice(50);
    }
    
    localStorage.setItem('pointsRecords', JSON.stringify(records));
}

// 更新导航栏 - 已登录状态
function updateNavbarForLoggedInUser() {
    const loginLink = document.querySelector('a[href="pages/login.html"]');
    if (loginLink) {
        loginLink.style.display = 'none';
    }
    
    const userDropdown = document.querySelector('.nav-item.dropdown');
    if (userDropdown) {
        userDropdown.style.display = 'block';
    }
}

// 更新导航栏 - 未登录状态
function updateNavbarForLoggedOutUser() {
    const loginLink = document.querySelector('a[href="pages/login.html"]');
    if (loginLink) {
        loginLink.style.display = 'block';
    }
    
    const userDropdown = document.querySelector('.nav-item.dropdown');
    if (userDropdown) {
        userDropdown.style.display = 'none';
    }
}

// 搜索股票
function searchStock() {
    const searchValue = document.getElementById('stockSearch').value.trim();
    if (!searchValue) {
        showNotification('请输入股票代码或名称', 'warning');
        return;
    }
    
    // 保存搜索历史
    saveSearchHistory(searchValue);
    
    // 跳转到股票详情页
    window.location.href = `pages/stock-detail.html?search=${encodeURIComponent(searchValue)}`;
}

// 保存搜索历史
function saveSearchHistory(searchTerm) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(item => item !== searchTerm);
    history.unshift(searchTerm);
    history = history.slice(0, 10); // 只保留最近10条
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

// 加载热门股票
function loadHotStocks() {
    // 模拟热门股票数据
    const hotStocks = [
        { code: '000001', name: '平安银行', price: 12.45, change: 2.34, changePercent: 1.92 },
        { code: '000002', name: '万科A', price: 18.67, change: -0.23, changePercent: -1.21 },
        { code: '000858', name: '五粮液', price: 156.78, change: 3.45, changePercent: 2.25 },
        { code: '000001', name: '深发展A', price: 45.32, change: 1.67, changePercent: 3.82 },
        { code: '002415', name: '海康威视', price: 32.45, change: -0.89, changePercent: -2.67 }
    ];
    
    const container = document.getElementById('hotStocksList');
    container.innerHTML = '';
    
    hotStocks.forEach(stock => {
        const stockItem = createStockItem(stock);
        container.appendChild(stockItem);
    });
}

// 创建股票列表项
function createStockItem(stock) {
    const div = document.createElement('div');
    div.className = 'stock-item';
    div.onclick = () => goToStockDetail(stock.code);
    
    const changeClass = stock.changePercent >= 0 ? 'price-up' : 'price-down';
    const changeIcon = stock.changePercent >= 0 ? '↑' : '↓';
    
    div.innerHTML = `
        <div class="stock-info">
            <div class="stock-code">${stock.code}</div>
            <div class="stock-name">${stock.name}</div>
        </div>
        <div class="stock-price">
            <div class="current-price">¥${stock.price.toFixed(2)}</div>
            <div class="price-change ${changeClass}">
                ${changeIcon} ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
            </div>
        </div>
    `;
    
    return div;
}

// 加载AI预测
function loadAIPredictions() {
    // 模拟AI预测数据
    const predictions = [
        {
            stockCode: '000001',
            stockName: '平安银行',
            direction: 'up',
            confidence: 85,
            targetPrice: 13.20,
            currentPrice: 12.45,
            reason: '基于技术分析，MACD指标显示买入信号'
        },
        {
            stockCode: '000858',
            stockName: '五粮液',
            direction: 'up',
            confidence: 92,
            targetPrice: 165.50,
            currentPrice: 156.78,
            reason: '基本面良好，Q3业绩超预期'
        },
        {
            stockCode: '002415',
            stockName: '海康威视',
            direction: 'stable',
            confidence: 78,
            targetPrice: 32.80,
            currentPrice: 32.45,
            reason: '短期震荡，长期看好'
        }
    ];
    
    const container = document.getElementById('aiPredictionsList');
    container.innerHTML = '';
    
    predictions.forEach(prediction => {
        const predictionCard = createPredictionCard(prediction);
        container.appendChild(predictionCard);
    });
}

// 创建预测卡片
function createPredictionCard(prediction) {
    const div = document.createElement('div');
    div.className = 'prediction-card mb-3';
    
    const directionClass = prediction.direction === 'up' ? 'direction-up' : 
                          prediction.direction === 'down' ? 'direction-down' : 'direction-stable';
    const directionIcon = prediction.direction === 'up' ? '↑' : 
                         prediction.direction === 'down' ? '↓' : '→';
    const directionText = prediction.direction === 'up' ? '看涨' : 
                         prediction.direction === 'down' ? '看跌' : '震荡';
    
    div.innerHTML = `
        <div class="prediction-header">
            <div class="prediction-title">${prediction.stockCode} ${prediction.stockName}</div>
            <div class="confidence-badge">置信度 ${prediction.confidence}%</div>
        </div>
        <div class="prediction-direction ${directionClass}">
            <span style="font-size: 1.5rem; font-weight: bold;">${directionIcon}</span>
            <span>${directionText}</span>
            <span class="ms-auto">目标: ¥${prediction.targetPrice.toFixed(2)}</span>
        </div>
        <div class="text-muted small">
            当前价: ¥${prediction.currentPrice.toFixed(2)} | 
            预期收益: ${((prediction.targetPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)}%
        </div>
        <div class="mt-2">
            <small class="text-secondary">${prediction.reason}</small>
        </div>
    `;
    
    return div;
}

// 加载社区预测
function loadCommunityPredictions() {
    // 模拟社区预测数据
    const communityPredictions = [
        {
            username: '投资达人',
            avatar: '👨‍💼',
            accuracy: 78.5,
            stockCode: '000001',
            stockName: '平安银行',
            prediction: '看涨',
            likes: 234,
            comments: 45,
            time: '2小时前'
        },
        {
            username: '股市小白',
            avatar: '👩‍💻',
            accuracy: 65.2,
            stockCode: '000858',
            stockName: '五粮液',
            prediction: '看涨',
            likes: 156,
            comments: 23,
            time: '3小时前'
        },
        {
            username: '技术分析师',
            avatar: '👨‍🔬',
            accuracy: 82.3,
            stockCode: '002415',
            stockName: '海康威视',
            prediction: '震荡',
            likes: 189,
            comments: 34,
            time: '5小时前'
        }
    ];
    
    const container = document.getElementById('communityPredictions');
    container.innerHTML = '';
    
    communityPredictions.forEach((prediction, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = createCommunityPredictionCard(prediction);
        container.appendChild(col);
    });
}

// 创建社区预测卡片
function createCommunityPredictionCard(prediction) {
    const accuracyColor = prediction.accuracy >= 80 ? 'success' : 
                         prediction.accuracy >= 70 ? 'warning' : 'secondary';
    
    return `
        <div class="card h-100">
            <div class="card-body">
                <div class="d-flex align-items-center mb-2">
                    <div class="avatar me-2" style="font-size: 1.5rem;">${prediction.avatar}</div>
                    <div>
                        <div class="fw-bold">${prediction.username}</div>
                        <small class="text-muted">准确率 ${prediction.accuracy}%</small>
                    </div>
                </div>
                <h6 class="card-title">${prediction.stockCode} ${prediction.stockName}</h6>
                <p class="card-text">
                    <span class="badge bg-${accuracyColor}">${prediction.prediction}</span>
                </p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">${prediction.time}</small>
                    <div>
                        <span class="text-muted me-2">
                            <i class="bi bi-hand-thumbs-up"></i> ${prediction.likes}
                        </span>
                        <span class="text-muted">
                            <i class="bi bi-chat"></i> ${prediction.comments}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 加载预测排行榜
function loadTopPredictors() {
    // 模拟排行榜数据
    const topPredictors = [
        { rank: 1, username: '股神', accuracy: 92.5, points: 15420, avatar: '🏆' },
        { rank: 2, username: '投资大师', accuracy: 89.3, points: 12350, avatar: '🥈' },
        { rank: 3, username: '预测专家', accuracy: 87.8, points: 10200, avatar: '🥉' },
        { rank: 4, username: '技术高手', accuracy: 85.2, points: 8900, avatar: '🎯' },
        { rank: 5, username: '基本面王', accuracy: 83.6, points: 7650, avatar: '⭐' }
    ];
    
    const container = document.getElementById('topPredictors');
    container.innerHTML = '';
    
    topPredictors.forEach(predictor => {
        const item = document.createElement('div');
        item.className = 'd-flex align-items-center justify-content-between mb-3 p-2 rounded';
        item.style.backgroundColor = predictor.rank <= 3 ? '#f8f9fa' : 'transparent';
        
        item.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3" style="font-size: 1.2rem; font-weight: bold; color: ${predictor.rank <= 3 ? '#FFD700' : '#6c757d'}">
                    ${predictor.rank}
                </div>
                <div class="me-2" style="font-size: 1.5rem;">${predictor.avatar}</div>
                <div>
                    <div class="fw-bold">${predictor.username}</div>
                    <small class="text-muted">准确率 ${predictor.accuracy}%</small>
                </div>
            </div>
            <div class="text-end">
                <div class="fw-bold text-primary">${predictor.points}</div>
                <small class="text-muted">积分</small>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// 初始化准确率图表
function initializeAccuracyChart() {
    const ctx = document.getElementById('accuracyChart').getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(26, 133, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(26, 133, 255, 0.01)');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
            datasets: [{
                label: 'AI预测准确率',
                data: [75.2, 78.5, 82.3, 79.8, 85.6, 87.2, 89.5],
                borderColor: '#1A85FF',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#1A85FF',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: '社区平均准确率',
                data: [68.5, 70.2, 72.8, 71.5, 74.3, 76.8, 78.2],
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4,
                pointBackgroundColor: '#FFD700',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#1A85FF',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(0,0,0,0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// 刷新热门股票
function refreshHotStocks() {
    const container = document.getElementById('hotStocksList');
    container.innerHTML = '<div class="text-center py-3"><div class="loading-spinner mx-auto"></div></div>';
    
    // 模拟加载延迟
    setTimeout(() => {
        loadHotStocks();
        showNotification('热门股票已刷新', 'success');
    }, 1000);
}

// 跳转到股票详情页
function goToStockDetail(stockCode) {
    window.location.href = `pages/stock-detail.html?code=${stockCode}`;
}

// 实时更新数据
function startRealTimeUpdates() {
    // 每30秒更新一次市场数据
    setInterval(() => {
        updateMarketData();
    }, 30000);
    
    // 每5分钟更新一次热门股票
    setInterval(() => {
        loadHotStocks();
    }, 300000);
}

// 更新市场数据
function updateMarketData() {
    // 模拟实时数据更新
    const indices = {
        shIndex: { value: 3245.67 + (Math.random() - 0.5) * 50, change: (Math.random() - 0.5) * 2 },
        szIndex: { value: 10234.56 + (Math.random() - 0.5) * 100, change: (Math.random() - 0.5) * 2 },
        cyIndex: { value: 2123.45 + (Math.random() - 0.5) * 30, change: (Math.random() - 0.5) * 2 }
    };
    
    Object.keys(indices).forEach(key => {
        const element = document.getElementById(key);
        const data = indices[key];
        if (element) {
            element.textContent = data.value.toFixed(2);
            
            const changeElement = element.parentElement.querySelector('.stat-change');
            if (changeElement) {
                const isPositive = data.change >= 0;
                changeElement.className = `stat-change ${isPositive ? 'positive' : 'negative'}`;
                changeElement.innerHTML = `
                    <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i> 
                    ${isPositive ? '+' : ''}${data.change.toFixed(2)}%
                `;
            }
        }
    });
}

// 显示通知
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        document.body.removeChild(toast);
    });
}

// 用户退出登录
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateNavbarForLoggedOutUser();
    showNotification('已安全退出登录', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// 工具函数：格式化数字
function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

// 工具函数：格式化百分比
function formatPercent(value) {
    return (value >= 0 ? '+' : '') + value.toFixed(2) + '%';
}

// 工具函数：获取颜色类
function getChangeColorClass(value) {
    return value >= 0 ? 'text-danger' : 'text-success';
}

// 页面加载动画
document.addEventListener('DOMContentLoaded', function() {
    // 添加渐入动画
    const elements = document.querySelectorAll('.fade-in-up');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
});
