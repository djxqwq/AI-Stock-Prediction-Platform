// AI预测页面JavaScript文件

let selectedTimeRange = 'medium';
let currentPrediction = null;
let predictionChart = null;

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    initializePredictionForm();
    loadHistory();
    checkUrlParams();
});

// 检查URL参数
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const stockParam = urlParams.get('stock');
    if (stockParam) {
        document.getElementById('stockInput').value = stockParam;
    }
}

// 初始化预测表单
function initializePredictionForm() {
    const form = document.getElementById('predictionForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        startPrediction();
    });
    
    // 股票输入自动完成
    const stockInput = document.getElementById('stockInput');
    stockInput.addEventListener('input', handleStockInput);
}

// 处理股票输入
function handleStockInput(e) {
    const query = e.target.value.trim();
    if (query.length < 1) return;
    
    // 这里可以添加自动完成功能
    // 暂时使用简单的模拟数据
}

// 选择时间范围
function selectTimeRange(range) {
    selectedTimeRange = range;
    
    // 更新UI状态
    document.querySelectorAll('.time-range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-period="${range}"]`).classList.add('active');
}

// 开始预测
function startPrediction() {
    const stockInput = document.getElementById('stockInput').value.trim();
    const modelSelect = document.getElementById('modelSelect').value;
    const includeCommunity = document.getElementById('includeCommunity').checked;
    const enableRiskAnalysis = document.getElementById('enableRiskAnalysis').checked;
    
    if (!stockInput) {
        showNotification('请输入股票代码或名称', 'warning');
        return;
    }
    
    // 显示加载状态
    showLoadingOverlay();
    
    // 模拟AI预测过程
    setTimeout(() => {
        const prediction = generatePrediction(stockInput, {
            model: modelSelect,
            period: selectedTimeRange,
            includeCommunity,
            enableRiskAnalysis
        });
        
        currentPrediction = prediction;
        displayPredictionResult(prediction);
        hideLoadingOverlay();
        
        // 保存到历史记录
        saveToHistory(prediction);
        
        showNotification('AI预测完成！', 'success');
    }, 3000);
}

// 生成预测结果
function generatePrediction(stockCode, options) {
    const basePrice = 10 + Math.random() * 100;
    const directions = ['up', 'down', 'stable'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    const periodMultipliers = {
        short: 0.02,
        medium: 0.08,
        long: 0.15
    };
    
    const multiplier = periodMultipliers[options.period];
    const changeAmount = (Math.random() - 0.5) * basePrice * multiplier;
    const targetPrice = basePrice + changeAmount;
    const expectedReturn = (changeAmount / basePrice) * 100;
    
    const confidenceBase = options.model === 'premium' ? 85 : 
                         options.model === 'advanced' ? 75 : 65;
    const confidence = confidenceBase + Math.random() * 15;
    
    return {
        stockCode: stockCode,
        stockName: getStockName(stockCode),
        currentPrice: basePrice,
        targetPrice: targetPrice,
        direction: direction,
        expectedReturn: expectedReturn,
        confidence: confidence,
        period: options.period,
        model: options.model,
        riskLevel: calculateRiskLevel(expectedReturn, options.period),
        technicalAnalysis: generateTechnicalAnalysis(direction),
        fundamentalAnalysis: generateFundamentalAnalysis(),
        timestamp: new Date().toISOString(),
        priceRange: {
            min: targetPrice * 0.95,
            max: targetPrice * 1.05
        }
    };
}

// 获取股票名称
function getStockName(code) {
    const stockDatabase = [
        { code: '000001', name: '平安银行' },
        { code: '000002', name: '万科A' },
        { code: '000858', name: '五粮液' },
        { code: '600036', name: '招商银行' },
        { code: '600519', name: '贵州茅台' }
    ];
    
    const stock = stockDatabase.find(s => s.code === code);
    return stock ? stock.name : code;
}

// 计算风险等级
function calculateRiskLevel(returnRate, period) {
    const absReturn = Math.abs(returnRate);
    
    if (period === 'short') {
        if (absReturn > 5) return '高';
        if (absReturn > 2) return '中等';
        return '低';
    } else if (period === 'medium') {
        if (absReturn > 15) return '高';
        if (absReturn > 8) return '中等';
        return '低';
    } else {
        if (absReturn > 25) return '高';
        if (absReturn > 12) return '中等';
        return '低';
    }
}

// 生成技术分析
function generateTechnicalAnalysis(direction) {
    const analyses = {
        up: [
            'MACD指标显示金叉形态，RSI处于合理区间，成交量温和放大，短期技术面偏多。',
            'KDJ指标金叉向上，布林带开口扩大，价格突破重要阻力位，技术信号积极。',
            '均线系统呈多头排列，MACD红柱放大，资金流入明显，技术面强势。'
        ],
        down: [
            'MACD指标死叉向下，RSI超买区域回落，成交量萎缩，短期技术面偏空。',
            'KDJ指标死叉向下，布林带收窄，价格跌破重要支撑位，技术信号消极。',
            '均线系统呈空头排列，MACD绿柱放大，资金流出明显，技术面弱势。'
        ],
        stable: [
            'MACD指标在零轴附近震荡，RSI处于中性区域，成交量平稳，技术面震荡。',
            'KDJ指标中性，布林带水平运行，价格在区间内波动，技术信号中性。',
            '均线系统交织，MACD柱体较短，资金进出平衡，技术面盘整。'
        ]
    };
    
    const directionAnalyses = analyses[direction];
    return directionAnalyses[Math.floor(Math.random() * directionAnalyses.length)];
}

// 生成基本面分析
function generateFundamentalAnalysis() {
    const analyses = [
        '公司Q3业绩超预期，营收同比增长18.5%，净利润增长22.3%，行业地位稳固。',
        '公司基本面良好，毛利率持续提升，费用控制有效，盈利能力增强。',
        '行业景气度回升，公司作为龙头企业充分受益，市场份额稳步提升。',
        '公司新产品表现亮眼，海外市场拓展顺利，未来增长潜力巨大。'
    ];
    
    return analyses[Math.floor(Math.random() * analyses.length)];
}

// 显示预测结果
function displayPredictionResult(prediction) {
    const resultDiv = document.getElementById('predictionResult');
    resultDiv.style.display = 'block';
    
    // 更新方向指示器
    const directionIndicator = document.getElementById('directionIndicator');
    const directionText = document.getElementById('predictionDirection');
    const directionSummary = document.getElementById('predictionSummary');
    
    const directionData = {
        up: {
            class: 'direction-up',
            icon: 'bi-arrow-up',
            text: '看涨趋势',
            summary: '基于AI分析，该股票未来呈现上涨趋势'
        },
        down: {
            class: 'direction-down',
            icon: 'bi-arrow-down',
            text: '看跌趋势',
            summary: '基于AI分析，该股票未来呈现下跌趋势'
        },
        stable: {
            class: 'direction-stable',
            icon: 'bi-arrow-right',
            text: '震荡趋势',
            summary: '基于AI分析，该股票未来呈现震荡趋势'
        }
    };
    
    const dirInfo = directionData[prediction.direction];
    directionIndicator.className = `direction-indicator ${dirInfo.class}`;
    directionIndicator.innerHTML = `<i class="bi ${dirInfo.icon}"></i>`;
    directionText.textContent = dirInfo.text;
    directionSummary.textContent = dirInfo.summary;
    
    // 更新价格信息
    document.getElementById('targetPrice').textContent = `¥${prediction.targetPrice.toFixed(2)}`;
    document.getElementById('priceRange').textContent = 
        `区间: ¥${prediction.priceRange.min.toFixed(2)} - ¥${prediction.priceRange.max.toFixed(2)}`;
    
    // 更新收益信息
    const returnClass = prediction.expectedReturn >= 0 ? 'text-success' : 'text-danger';
    const returnSign = prediction.expectedReturn >= 0 ? '+' : '';
    document.getElementById('expectedReturn').className = returnClass;
    document.getElementById('expectedReturn').textContent = 
        `${returnSign}${prediction.expectedReturn.toFixed(2)}%`;
    
    // 更新风险等级
    const riskColors = { '低': 'text-success', '中等': 'text-warning', '高': 'text-danger' };
    document.getElementById('riskLevel').className = riskColors[prediction.riskLevel];
    document.getElementById('riskLevel').textContent = prediction.riskLevel;
    
    // 更新置信度
    document.getElementById('confidenceValue').textContent = `${prediction.confidence.toFixed(1)}%`;
    setTimeout(() => {
        document.getElementById('confidenceFill').style.width = `${prediction.confidence}%`;
    }, 100);
    
    // 更新分析内容
    document.getElementById('technicalAnalysis').textContent = prediction.technicalAnalysis;
    document.getElementById('fundamentalAnalysis').textContent = prediction.fundamentalAnalysis;
    
    // 绘制预测图表
    drawPredictionChart(prediction);
    
    // 滚动到结果区域
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 绘制预测图表
function drawPredictionChart(prediction) {
    // 检查Chart.js是否加载
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载');
        showNotification('图表库加载失败，请刷新页面重试', 'error');
        return;
    }
    
    const canvas = document.getElementById('predictionChart');
    if (!canvas) {
        console.error('找不到图表容器');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    if (predictionChart) {
        predictionChart.destroy();
    }
    
    // 生成历史数据（30天）
    const historicalData = [];
    const historicalLabels = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        historicalLabels.push(date.toLocaleDateString());
        historicalData.push(prediction.currentPrice + (Math.random() - 0.5) * 2);
    }
    
    // 生成预测数据
    const predictionData = [];
    const predictionLabels = [];
    const periodDays = {
        short: 7,
        medium: 28,
        long: 90
    };
    
    const days = periodDays[prediction.period];
    for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        predictionLabels.push(date.toLocaleDateString());
        
        const progress = i / days;
        const predictedPrice = prediction.currentPrice + 
            (prediction.targetPrice - prediction.currentPrice) * progress +
            (Math.random() - 0.5) * 0.5;
        predictionData.push(predictedPrice);
    }
    
    const labels = [...historicalLabels, ...predictionLabels];
    const prices = [...historicalData, ...predictionData];
    
    predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '价格走势',
                data: prices,
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // 强制设置容器高度
            onResize: function(chart, size) {
                // 防止高度自动变化
                chart.canvas.parentNode.style.height = '200px';
                chart.canvas.style.height = '200px';
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#1a73e8',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '价格: ¥' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0,0,0,0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toFixed(2);
                        },
                        color: '#666',
                        font: {
                            size: 11
                        },
                        padding: 8
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#666',
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 45,
                        padding: 8
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            layout: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            }
        }
    });
}

// 保存预测到历史记录
function saveToHistory(prediction) {
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    history.unshift({
        ...prediction,
        id: Date.now()
    });
    
    // 只保留最近50条记录
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem('predictionHistory', JSON.stringify(history));
}

// 加载历史记录
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    const container = document.getElementById('historyContainer');
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-clock-history" style="font-size: 3rem; color: var(--text-secondary);"></i>
                <h5 class="mt-3">暂无历史预测记录</h5>
                <p class="text-muted">开始您的第一次AI预测吧！</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.slice(0, 10).map(item => createHistoryItem(item)).join('');
}

// 创建历史记录项
function createHistoryItem(item) {
    const date = new Date(item.timestamp);
    const accuracyClass = item.confidence >= 80 ? 'accuracy-high' : 
                         item.confidence >= 60 ? 'accuracy-medium' : 'accuracy-low';
    
    const directionIcon = item.direction === 'up' ? '↑' : 
                         item.direction === 'down' ? '↓' : '→';
    const directionColor = item.direction === 'up' ? 'text-danger' : 
                           item.direction === 'down' ? 'text-success' : 'text-warning';
    
    return `
        <div class="history-item">
            <div class="row align-items-center">
                <div class="col-md-3">
                    <h6 class="mb-1">${item.stockCode} ${item.stockName}</h6>
                    <small class="text-muted">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</small>
                </div>
                <div class="col-md-2">
                    <div class="${directionColor} fw-bold">
                        ${directionIcon} ${item.expectedReturn >= 0 ? '+' : ''}${item.expectedReturn.toFixed(2)}%
                    </div>
                    <small class="text-muted">预期收益</small>
                </div>
                <div class="col-md-2">
                    <div>¥${item.targetPrice.toFixed(2)}</div>
                    <small class="text-muted">目标价格</small>
                </div>
                <div class="col-md-2">
                    <span class="accuracy-badge ${accuracyClass}">
                        ${item.confidence.toFixed(1)}%
                    </span>
                    <small class="text-muted d-block">置信度</small>
                </div>
                <div class="col-md-3 text-end">
                    <button class="btn btn-sm btn-outline-primary" onclick="viewHistoryDetail(${item.id})">
                        <i class="bi bi-eye"></i> 查看
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="deleteHistoryItem(${item.id})">
                        <i class="bi bi-trash"></i> 删除
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 查看历史详情
function viewHistoryDetail(id) {
    const history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    const item = history.find(h => h.id === id);
    
    if (item) {
        currentPrediction = item;
        displayPredictionResult(item);
        showNotification('已加载历史预测记录', 'info');
    }
}

// 删除历史记录
function deleteHistoryItem(id) {
    if (!confirm('确定要删除这条预测记录吗？')) return;
    
    let history = JSON.parse(localStorage.getItem('predictionHistory') || '[]');
    history = history.filter(h => h.id !== id);
    localStorage.setItem('predictionHistory', JSON.stringify(history));
    
    loadHistory();
    showNotification('预测记录已删除', 'success');
}

// 保存预测
function savePrediction() {
    if (!currentPrediction) {
        showNotification('没有可保存的预测结果', 'warning');
        return;
    }
    
    // 这里可以调用后端API保存预测
    showNotification('预测结果已保存到个人中心', 'success');
}

// 区块链存证
function blockchainCertify() {
    if (!currentPrediction) {
        showNotification('没有可存证的预测结果', 'warning');
        return;
    }
    
    showNotification('正在生成区块链存证...', 'info');
    
    setTimeout(() => {
        const hash = generateBlockchainHash(currentPrediction);
        saveBlockchainRecord(hash, currentPrediction);
        showNotification(`区块链存证成功！哈希值: ${hash.substring(0, 16)}...`, 'success');
    }, 2000);
}

// 生成区块链哈希
function generateBlockchainHash(data) {
    const content = JSON.stringify({
        stockCode: data.stockCode,
        prediction: data.direction,
        targetPrice: data.targetPrice,
        confidence: data.confidence,
        timestamp: new Date().toISOString()
    });
    
    return btoa(content).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
}

// 保存区块链记录
function saveBlockchainRecord(hash, data) {
    const records = JSON.parse(localStorage.getItem('blockchainRecords') || '[]');
    records.push({
        hash: hash,
        type: 'prediction',
        data: data,
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('blockchainRecords', JSON.stringify(records));
}

// 分享预测
function sharePrediction() {
    if (!currentPrediction) {
        showNotification('没有可分享的预测结果', 'warning');
        return;
    }
    
    const shareText = `AI预测: ${currentPrediction.stockName}(${currentPrediction.stockCode})\n` +
                     `预测方向: ${currentPrediction.direction === 'up' ? '看涨' : currentPrediction.direction === 'down' ? '看跌' : '震荡'}\n` +
                     `目标价格: ¥${currentPrediction.targetPrice.toFixed(2)}\n` +
                     `预期收益: ${currentPrediction.expectedReturn >= 0 ? '+' : ''}${currentPrediction.expectedReturn.toFixed(2)}%\n` +
                     `置信度: ${currentPrediction.confidence.toFixed(1)}%`;
    
    if (navigator.share) {
        navigator.share({
            title: 'AI股票预测分享',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + '\n\n' + window.location.href);
        showNotification('分享内容已复制到剪贴板', 'success');
    }
}

// 下载报告
function downloadPredictionReport() {
    if (!currentPrediction) {
        showNotification('没有可下载的预测报告', 'warning');
        return;
    }
    
    const report = generateReportContent(currentPrediction);
    const blob = new Blob([report], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI预测报告_${currentPrediction.stockCode}_${new Date().toLocaleDateString()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('预测报告下载成功', 'success');
}

// 生成报告内容
function generateReportContent(prediction) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AI股票预测报告 - ${prediction.stockName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #1A85FF; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .highlight { background: #f8f9fa; padding: 15px; border-left: 4px solid #1A85FF; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI股票预测报告</h1>
        <h2>${prediction.stockName} (${prediction.stockCode})</h2>
        <p>生成时间: ${new Date(prediction.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="section">
        <h3>预测概要</h3>
        <div class="highlight">
            <p><strong>预测方向:</strong> ${prediction.direction === 'up' ? '看涨' : prediction.direction === 'down' ? '看跌' : '震荡'}</p>
            <p><strong>目标价格:</strong> ¥${prediction.targetPrice.toFixed(2)}</p>
            <p><strong>预期收益:</strong> ${prediction.expectedReturn >= 0 ? '+' : ''}${prediction.expectedReturn.toFixed(2)}%</p>
            <p><strong>预测置信度:</strong> ${prediction.confidence.toFixed(1)}%</p>
            <p><strong>风险等级:</strong> ${prediction.riskLevel}</p>
        </div>
    </div>
    
    <div class="section">
        <h3>技术分析</h3>
        <p>${prediction.technicalAnalysis}</p>
    </div>
    
    <div class="section">
        <h3>基本面分析</h3>
        <p>${prediction.fundamentalAnalysis}</p>
    </div>
    
    <div class="footer">
        <p>本报告由AI智能股票预测平台生成，仅供参考，投资有风险，入市需谨慎。</p>
    </div>
</body>
</html>
    `;
}

// 显示加载遮罩
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载遮罩
function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
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

// 下载报告
function downloadReport() {
    if (!currentPrediction) {
        showNotification('没有可下载的预测结果', 'warning');
        return;
    }
    
    // 生成报告内容
    const reportContent = generateReportContent(currentPrediction);
    
    // 创建下载
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AI预测报告_${currentPrediction.stockCode}_${new Date().toLocaleDateString('zh-CN')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showNotification('报告下载成功', 'success');
}

// 生成报告内容
function generateReportContent(prediction) {
    const reportDate = new Date().toLocaleString('zh-CN');
    
    return `
========================================
AI股票预测分析报告
========================================

报告生成时间: ${reportDate}
分析来源: AI智能股票预测系统

========================================
基本信息
========================================
股票代码: ${prediction.stockCode}
股票名称: ${prediction.stockName}
当前价格: ¥${prediction.currentPrice.toFixed(2)}
预测方向: ${prediction.direction === 'up' ? '看涨' : prediction.direction === 'down' ? '看跌' : '震荡'}
目标价格: ¥${prediction.targetPrice.toFixed(2)}
预期收益: ${prediction.expectedReturn >= 0 ? '+' : ''}${prediction.expectedReturn.toFixed(2)}%
置信度: ${prediction.confidence.toFixed(1)}%
预测周期: ${prediction.period === 'short' ? '短期' : prediction.period === 'medium' ? '中期' : '长期'}

========================================
技术分析
========================================
${prediction.technicalAnalysis}

========================================
基本面分析
========================================
${prediction.fundamentalAnalysis}

========================================
风险提示
========================================
1. 本报告仅供参考，不构成投资建议
2. 股市有风险，投资需谨慎
3. 请根据自身风险承受能力做出投资决策
4. 建议分散投资，控制仓位

========================================
免责声明
========================================
本报告由AI系统生成，信息可能存在误差，投资者应结合多方信息进行综合分析，并自行承担投资风险。

========================================
报告结束
========================================
    `.trim();
}

// 导出函数供HTML调用
window.selectTimeRange = selectTimeRange;
window.selectModel = selectModel;
window.startPrediction = startPrediction;
window.savePrediction = savePrediction;
window.blockchainCertify = blockchainCertify;
window.sharePrediction = sharePrediction;
window.downloadReport = downloadReport;
window.loadHistory = loadHistory;
window.clearHistory = clearHistory;
window.viewHistoryDetail = viewHistoryDetail;
