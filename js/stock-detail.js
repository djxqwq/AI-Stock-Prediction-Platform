// 股票详情页JavaScript文件

let currentStock = null;
let klineChart = null;
let predictionChart = null;
let favoriteStocks = JSON.parse(localStorage.getItem('favoriteStocks') || '[]');

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    initializeSearch();
    checkUrlParams();
    loadSearchHistory();
    
    // 搜索框事件监听
    const searchInput = document.getElementById('stockSearchInput');
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchStock();
        }
    });
    
    // 点击其他地方关闭搜索建议
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            document.getElementById('searchSuggestions').style.display = 'none';
        }
    });
});

// 检查URL参数
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const codeParam = urlParams.get('code');
    
    if (searchParam) {
        document.getElementById('stockSearchInput').value = searchParam;
        searchStock();
    } else if (codeParam) {
        loadStockDetail(codeParam);
    }
}

// 初始化搜索功能
function initializeSearch() {
    // 模拟股票数据库
    window.stockDatabase = [
        { code: '000001', name: '平安银行', market: 'SZ' },
        { code: '000002', name: '万科A', market: 'SZ' },
        { code: '000858', name: '五粮液', market: 'SZ' },
        { code: '002415', name: '海康威视', market: 'SZ' },
        { code: '300750', name: '宁德时代', market: 'SZ' },
        { code: '600036', name: '招商银行', market: 'SH' },
        { code: '600519', name: '贵州茅台', market: 'SH' },
        { code: '600887', name: '伊利股份', market: 'SH' },
        { code: '000725', name: '京东方A', market: 'SZ' },
        { code: '002594', name: '比亚迪', market: 'SZ' },
        // 添加更多常见股票
        { code: '000063', name: '中兴通讯', market: 'SZ' },
        { code: '000876', name: '新希望', market: 'SZ' },
        { code: '002304', name: '洋河股份', market: 'SZ' },
        { code: '300059', name: '东方财富', market: 'SZ' },
        { code: '300144', name: '宋城演艺', market: 'SZ' },
        { code: '000100', name: 'TCL科技', market: 'SZ' },
        { code: '000166', name: '申万宏源', market: 'SZ' },
        { code: '000858', name: '五粮液', market: 'SZ' },
        { code: '600000', name: '浦发银行', market: 'SH' },
        { code: '600016', name: '民生银行', market: 'SH' },
        { code: '600030', name: '中信证券', market: 'SH' },
        { code: '600048', name: '保利发展', market: 'SH' },
        { code: '600104', name: '上汽集团', market: 'SH' },
        { code: '600276', name: '恒瑞医药', market: 'SH' },
        { code: '600340', name: '华夏幸福', market: 'SH' },
        { code: '600585', name: '海螺水泥', market: 'SH' },
        { code: '600674', name: '川投能源', market: 'SH' },
        { code: '600690', name: '海尔智家', market: 'SH' },
        { code: '600703', name: '三安光电', market: 'SH' },
        { code: '600795', name: '国电电力', market: 'SH' },
        { code: '600837', name: '海通证券', market: 'SH' },
        { code: '600900', name: '长江电力', market: 'SH' },
        { code: '601012', name: '隆基绿能', market: 'SH' },
        { code: '601066', name: '中信建投', market: 'SH' },
        { code: '601111', name: '中国国航', market: 'SH' },
        { code: '601138', name: '工业富联', market: 'SH' },
        { code: '601166', name: '兴业银行', market: 'SH' },
        { code: '601288', name: '农业银行', market: 'SH' },
        { code: '601318', name: '中国平安', market: 'SH' },
        { code: '601328', name: '交通银行', market: 'SH' },
        { code: '601398', name: '工商银行', market: 'SH' },
        { code: '601668', name: '中国建筑', market: 'SH' },
        { code: '601688', name: '华泰证券', market: 'SH' },
        { code: '601728', name: '中国电信', market: 'SH' },
        { code: '601766', name: '中国中车', market: 'SH' },
        { code: '601788', name: '光大证券', market: 'SH' },
        { code: '601818', name: '光大银行', market: 'SH' },
        { code: '601857', name: '中国石油', market: 'SH' },
        { code: '601888', name: '中国中免', market: 'SH' },
        { code: '601988', name: '中国银行', market: 'SH' },
        { code: '601939', name: '建设银行', market: 'SH' },
        { code: '601985', name: '中国核电', market: 'SH' },
        { code: '601988', name: '中国交建', market: 'SH' },
        { code: '601998', name: '中信银行', market: 'SH' },
        { code: '601990', name: '南京证券', market: 'SH' },
        { code: '603259', name: '药明康德', market: 'SH' },
        { code: '603160', name: '汇川技术', market: 'SH' }
    ];
}

// 处理搜索输入
function handleSearchInput(e) {
    const query = e.target.value.trim();
    const suggestionsContainer = document.getElementById('searchSuggestions');
    
    if (query.length < 1) {
        suggestionsContainer.style.display = 'none';
        return;
    }
    
    const suggestions = getSearchSuggestions(query);
    
    if (suggestions.length > 0) {
        suggestionsContainer.innerHTML = suggestions.map(stock => `
            <div class="suggestion-item" onclick="selectStock('${stock.code}')">
                <strong>${stock.code}</strong> - ${stock.name}
            </div>
        `).join('');
        suggestionsContainer.style.display = 'block';
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

// 获取搜索建议
function getSearchSuggestions(query) {
    return window.stockDatabase.filter(stock => 
        stock.code.toLowerCase().includes(query.toLowerCase()) || 
        stock.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8);
}

// 选择股票
function selectStock(code) {
    document.getElementById('stockSearchInput').value = code;
    document.getElementById('searchSuggestions').style.display = 'none';
    searchStock();
}

// 搜索股票
function searchStock() {
    const searchValue = document.getElementById('stockSearchInput').value.trim();
    if (!searchValue) {
        showNotification('请输入股票代码或名称', 'warning');
        return;
    }
    
    // 模糊搜索股票
    const stock = window.stockDatabase.find(s => 
        s.code.toLowerCase() === searchValue.toLowerCase() || 
        s.name.toLowerCase() === searchValue.toLowerCase()
    );
    
    if (stock) {
        saveSearchHistory(searchValue);
        loadStockDetail(stock.code);
    } else {
        // 尝试部分匹配
        const partialMatches = window.stockDatabase.filter(s => 
            s.code.toLowerCase().includes(searchValue.toLowerCase()) || 
            s.name.toLowerCase().includes(searchValue.toLowerCase())
        );
        
        if (partialMatches.length > 0) {
            showNotification(`找到 ${partialMatches.length} 个相关股票，请选择具体股票`, 'info');
            // 可以在这里显示匹配的股票列表
        } else {
            showNotification('未找到相关股票，请检查输入', 'error');
        }
    }
}

// 保存搜索历史
function saveSearchHistory(searchTerm) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter(item => item !== searchTerm);
    history.unshift(searchTerm);
    history = history.slice(0, 10);
    localStorage.setItem('searchHistory', JSON.stringify(history));
}

// 加载搜索历史
function loadSearchHistory() {
    // 可以在搜索框下方显示搜索历史
}

// 加载股票详情
function loadStockDetail(stockCode) {
    console.log('开始加载股票详情:', stockCode);
    
    // 显示加载状态
    showLoadingState();
    
    // 模拟API调用
    setTimeout(() => {
        try {
            console.log('生成模拟股票数据...');
            currentStock = generateMockStockData(stockCode);
            console.log('股票数据生成完成:', currentStock);
            
            // 隐藏加载状态
            hideLoadingState();
            
            // 显示股票详情
            console.log('显示股票详情...');
            displayStockDetail(currentStock);
            
            // 隐藏空状态，显示详情
            const emptyState = document.getElementById('emptyState');
            const stockDetailContainer = document.getElementById('stockDetailContainer');
            console.log('emptyState:', emptyState);
            console.log('stockDetailContainer:', stockDetailContainer);
            
            if (emptyState) {
                emptyState.style.display = 'none';
                console.log('隐藏空状态');
            }
            if (stockDetailContainer) {
                stockDetailContainer.style.display = 'block';
                console.log('显示股票详情容器');
            }
            
            // 初始化图表
            initializeKLineChart();
            initializePredictionChart();
            initializePriceTrendChart();
            
            // 加载其他数据
            loadNews();
            
            // 更新收藏按钮
            updateFavoriteButton();
            
            // 设置全局股票代码供AI分析使用
            window.currentStockCode = stockCode;
            
            // 更新URL
            const url = new URL(window.location);
            url.searchParams.set('code', stockCode);
            window.history.pushState({}, '', url);
            
            console.log('股票详情加载完成');
            showNotification('股票信息加载成功', 'success');
        } catch (error) {
            console.error('加载股票详情失败:', error);
            showNotification('加载失败，请重试', 'error');
            hideLoadingState();
        }
    }, 800);
}

// 显示加载状态
function showLoadingState() {
    const container = document.getElementById('stockDetailContainer');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p class="text-muted mt-3">正在加载股票信息...</p>
            </div>
        `;
    }
}

// 隐藏加载状态
function hideLoadingState() {
    // 不清空容器，让displayStockDetail函数处理内容
}

// 生成模拟股票数据
function generateMockStockData(code) {
    const basePrice = 10 + Math.random() * 100;
    const change = (Math.random() - 0.5) * 10;
    const changePercent = (change / basePrice) * 100;
    
    return {
        code: code,
        name: getStockName(code),
        currentPrice: basePrice + change,
        change: change,
        changePercent: changePercent,
        openPrice: basePrice,
        highPrice: basePrice + Math.random() * 5,
        lowPrice: basePrice - Math.random() * 5,
        volume: Math.floor(Math.random() * 100000000),
        turnover: Math.floor(Math.random() * 1000000000),
        marketCap: Math.floor(basePrice * 1000000000),
        peRatio: 5 + Math.random() * 30,
        pbRatio: 0.5 + Math.random() * 3,
        roe: 5 + Math.random() * 20,
        prediction: {
            direction: changePercent > 0 ? 'up' : 'down',
            targetPrice: basePrice + (Math.random() - 0.5) * 20,
            confidence: 70 + Math.random() * 25,
            period: '短期'
        }
    };
}

// 获取股票名称
function getStockName(code) {
    const stock = window.stockDatabase.find(s => s.code === code);
    return stock ? stock.name : '未知股票';
}

// 显示股票详情
function displayStockDetail(stock) {
    console.log('🚀 displayStockDetail开始执行，股票数据:', stock);
    console.log('🔍 查找容器元素...');
    
    // 首先填充容器内容
    const container = document.getElementById('stockDetailContainer');
    console.log('📦 容器元素:', container);
    
    if (container) {
        console.log('✅ 找到容器，开始填充内容...');
        container.innerHTML = `
            <!-- 股票头部信息 -->
            <section class="stock-header mb-4">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h1 class="mb-2">
                                <span id="stockCode">${stock.code}</span> 
                                <span id="stockName">${stock.name}</span>
                            </h1>
                            <div class="price-display" id="currentPrice">¥${stock.currentPrice.toFixed(2)}</div>
                            <div class="price-change" id="priceChange">
                                <i class="bi bi-arrow-${stock.changePercent >= 0 ? 'up' : 'down'}"></i> 
                                ${stock.changePercent >= 0 ? '+' : ''}${stock.change.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
                            </div>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <button class="btn btn-light btn-lg me-2" onclick="toggleFavorite()">
                                <i class="bi bi-star" id="favoriteIcon"></i> 收藏
                            </button>
                            <button class="btn btn-outline-light btn-lg me-2" onclick="shareStock()">
                                <i class="bi bi-share"></i> 分享
                            </button>
                            <button class="btn btn-warning btn-lg" onclick="downloadReport()">
                                <i class="bi bi-download"></i> 下载报告
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- 关键指标 -->
            <section class="container mb-4">
                <div class="row">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="card-title">开盘价</h6>
                                <h5 class="text-primary" id="openPrice">¥${stock.openPrice.toFixed(2)}</h5>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="card-title">最高价</h6>
                                <h5 class="text-danger" id="highPrice">¥${stock.highPrice.toFixed(2)}</h5>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="card-title">最低价</h6>
                                <h5 class="text-success" id="lowPrice">¥${stock.lowPrice.toFixed(2)}</h5>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center">
                                <h6 class="card-title">成交量</h6>
                                <h5 class="text-info" id="volume">${stock.volume.toLocaleString()}</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            <!-- AI分析区域 -->
            <section class="container mb-4">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-robot"></i> AI智能分析
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="text-center">
                            <button class="btn btn-primary btn-lg" id="analyzeButton" onclick="analyzeStockWithAI('${stock.code}')">
                                <i class="bi bi-cpu"></i> 开始AI分析
                            </button>
                        </div>
                        <div id="analysisResult"></div>
                    </div>
                </div>
            </section>
        `;
        console.log('容器内容填充完成');
    }
    
    // 隐藏空状态
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
        console.log('隐藏空状态');
    }
    
    console.log('displayStockDetail执行完成');
}

// 格式化成交量
function formatVolume(volume) {
    if (volume >= 100000000) {
        return (volume / 100000000).toFixed(1) + '亿';
    } else if (volume >= 10000) {
        return (volume / 10000).toFixed(1) + '万';
    }
    return volume.toString();
}

// DeepSeek股票分析
async function analyzeStockWithAI(stockCode) {
    // 使用currentStock而不是重新查找
    const stock = currentStock || window.stockDatabase.find(s => s.code === stockCode);
    if (!stock) {
        showNotification('股票信息不存在', 'error');
        return;
    }
    
    console.log('AI分析股票数据:', stock);
    
    const analysisButton = document.getElementById('analyzeButton');
    const analysisResult = document.getElementById('analysisResult');
    
    if (analysisButton) {
        analysisButton.disabled = true;
        analysisButton.innerHTML = '<i class="bi bi-hourglass-split"></i> 分析中...';
    }
    
    if (analysisResult) {
        analysisResult.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">分析中...</span>
                </div>
                <p class="mt-2 text-muted">DeepSeek AI 正在分析股票数据...</p>
            </div>
        `;
    }
    
    try {
        // 添加属性验证
        const safeStock = {
            name: stock.name || '未知股票',
            code: stock.code || '000000',
            currentPrice: stock.currentPrice || 10,
            changePercent: stock.changePercent || 0,
            openPrice: stock.openPrice || 10,
            highPrice: stock.highPrice || 10,
            lowPrice: stock.lowPrice || 10,
            volume: stock.volume || 1000000
        };
        
        // 构建分析请求
        const analysisPrompt = `请分析股票 ${safeStock.name}(${safeStock.code}) 的当前情况：

基本信息：
- 当前价格: ¥${safeStock.currentPrice.toFixed(2)}
- 涨跌幅: ${safeStock.changePercent.toFixed(2)}%
- 开盘价: ¥${safeStock.openPrice.toFixed(2)}
- 最高价: ¥${safeStock.highPrice.toFixed(2)}
- 最低价: ¥${safeStock.lowPrice.toFixed(2)}
- 成交量: ${formatVolume(safeStock.volume)}

请从以下几个方面进行分析：
1. 技术面分析（价格走势、成交量等）
2. 市场情绪分析
3. 投资建议和风险提示
4. 未来走势预测

请用中文回答，格式清晰，包含具体的分析建议。`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-your-deepseek-api-key' // 需要配置真实的API密钥
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('API请求失败');
        }
        
        const result = await response.json();
        const analysis = result.choices[0].message.content;
        
        // 显示分析结果
        if (analysisResult) {
            analysisResult.innerHTML = `
                <div class="ai-analysis">
                    <div class="analysis-header">
                        <h6><i class="bi bi-robot"></i> DeepSeek AI 分析报告</h6>
                        <small class="text-muted">${new Date().toLocaleString('zh-CN')}</small>
                    </div>
                    <div class="analysis-content">
                        <pre class="analysis-text">${analysis}</pre>
                    </div>
                    <div class="analysis-footer">
                        <button class="btn btn-sm btn-outline-primary" onclick="copyAnalysis()">
                            <i class="bi bi-clipboard"></i> 复制分析
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="shareAnalysis()">
                            <i class="bi bi-share"></i> 分享分析
                        </button>
                    </div>
                </div>
            `;
        }
        
        showNotification('AI分析完成', 'success');
        
    } catch (error) {
        console.error('AI分析失败:', error);
        
        // 如果API失败，提供模拟分析
        const mockAnalysis = generateMockAnalysis(stock);
        
        if (analysisResult) {
            analysisResult.innerHTML = `
                <div class="ai-analysis">
                    <div class="analysis-header">
                        <h6><i class="bi bi-robot"></i> 股票分析报告 (模拟)</h6>
                        <small class="text-muted">${new Date().toLocaleString('zh-CN')}</small>
                    </div>
                    <div class="analysis-content">
                        <pre class="analysis-text">${mockAnalysis}</pre>
                    </div>
                    <div class="analysis-footer">
                        <button class="btn btn-sm btn-outline-primary" onclick="copyAnalysis()">
                            <i class="bi bi-clipboard"></i> 复制分析
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="shareAnalysis()">
                            <i class="bi bi-share"></i> 分享分析
                        </button>
                    </div>
                </div>
            `;
        }
        
        showNotification('AI分析完成（使用模拟数据）', 'info');
    } finally {
        if (analysisButton) {
            analysisButton.disabled = false;
            analysisButton.innerHTML = '<i class="bi bi-cpu"></i> AI分析';
        }
    }
}

// 生成模拟分析
function generateMockAnalysis(stock) {
    // 添加属性验证和默认值
    const safeStock = {
        name: stock.name || '未知股票',
        code: stock.code || '000000',
        currentPrice: stock.currentPrice || 10,
        changePercent: stock.changePercent || 0,
        openPrice: stock.openPrice || 10,
        volume: stock.volume || 1000000
    };
    
    const trend = safeStock.changePercent >= 0 ? '上涨' : '下跌';
    const strength = Math.abs(safeStock.changePercent) > 2 ? '较强' : '温和';
    
    return `📊 ${safeStock.name}(${safeStock.code}) 技术分析报告

🔍 技术面分析：
• 价格走势：当前股价${trend}趋势，${strength}的${trend}动能
• 价格位置：当前价格¥${safeStock.currentPrice.toFixed(2)}，处于当日${safeStock.currentPrice > safeStock.openPrice ? '高位' : '低位'}
• 成交量：${formatVolume(safeStock.volume)}，${safeStock.volume > 1000000 ? '放量' : '缩量'}状态

📈 技术指标：
• 短期趋势：${trend === '上涨' ? 'MACD金叉，RSI超买' : 'MACD死叉，RSI超卖'}
• 支撑位：¥${(safeStock.currentPrice * 0.95).toFixed(2)}
• 阻力位：¥${(safeStock.currentPrice * 1.05).toFixed(2)}

💰 投资建议：
• 短期操作：${safeStock.changePercent > 1 ? '谨慎追高' : safeStock.changePercent < -1 ? '可考虑抄底' : '观望为主'}
• 中长期：${safeStock.currentPrice > safeStock.openPrice ? '关注回调风险' : '关注反弹机会'}
• 仓位建议：建议轻仓试探，控制风险

⚠️ 风险提示：
• 市场波动风险：注意大盘走势影响
• 个股风险：关注公司基本面变化
• 止损建议：建议设置${(safeStock.currentPrice * 0.93).toFixed(2)}-5%止损位

🎯 预测目标：
• 短期目标：¥${(safeStock.currentPrice * (trend === '上涨' ? 1.03 : 0.97)).toFixed(2)}
• 中期目标：¥${(safeStock.currentPrice * (trend === '上涨' ? 1.05 : 0.95)).toFixed(2)}
• 时间周期：1-2周

⭐ 综合评级：${safeStock.changePercent > 2 ? '买入' : safeStock.changePercent < -2 ? '卖出' : '持有'}

*注：以上分析仅供参考，投资有风险，入市需谨慎*`;
}

// 复制分析结果
function copyAnalysis() {
    const analysisText = document.querySelector('.analysis-text');
    if (analysisText) {
        navigator.clipboard.writeText(analysisText.textContent).then(() => {
            showNotification('分析结果已复制到剪贴板', 'success');
        }).catch(() => {
            showNotification('复制失败，请手动复制', 'error');
        });
    }
}

// 分享分析结果
function shareAnalysis() {
    const stockCode = document.getElementById('stockCode')?.textContent || '';
    const stockName = document.getElementById('stockName')?.textContent || '';
    const shareText = `${stockName}(${stockCode}) AI分析报告 - 股票预测系统`;
    
    if (navigator.share) {
        navigator.share({
            title: '股票AI分析报告',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + '\n' + window.location.href).then(() => {
            showNotification('分享链接已复制到剪贴板', 'success');
        });
    }
}

function initializeKLineChart() {
    // 检查Chart.js是否加载
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载');
        showNotification('图表库加载失败，请刷新页面重试', 'error');
        return;
    }
    
    const ctx = document.getElementById('klineChart');
    if (!ctx) return;
    
    // 生成模拟K线数据
    const klineData = generateKLineData();
    
    if (klineChart) {
        klineChart.destroy();
    }
    
    klineChart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'K线',
                data: klineData,
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
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
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            }
        }
    });
}

// 生成K线数据
function generateKLineData() {
    const labels = [];
    const data = [];
    const days = 30;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        
        const open = 10 + Math.random() * 5;
        const close = open + (Math.random() - 0.5) * 2;
        const high = Math.max(open, close) + Math.random() * 1;
        const low = Math.min(open, close) - Math.random() * 1;
        
        data.push({
            x: i,
            o: open,
            h: high,
            l: low,
            c: close
        });
    }
    
    return { labels, data };
}

// 切换K线周期
function changeKLinePeriod(period) {
    // 更新按钮状态
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 重新加载K线数据
    showNotification(`已切换到${event.target.textContent}`, 'info');
    initializeKLineChart();
}

// 初始化价格趋势图
function initializePriceTrendChart() {
    // 检查Chart.js是否加载
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载');
        showNotification('图表库加载失败，请刷新页面重试', 'error');
        return;
    }
    
    const canvas = document.getElementById('priceTrendChart');
    if (!canvas) {
        // console.log('价格趋势图容器不存在，跳过初始化');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // 生成模拟价格趋势数据
    const trendData = generatePriceTrendData();
    
    if (window.priceTrendChart) {
        window.priceTrendChart.destroy();
    }
    
    window.priceTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trendData.labels,
            datasets: [{
                label: '价格走势',
                data: trendData.prices,
                borderColor: '#1a73e8',
                backgroundColor: 'rgba(26, 115, 232, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: '#1a73e8',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // 完全简化配置，避免任何可能导致拉伸的设置
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

// 生成价格趋势数据
function generatePriceTrendData() {
    const days = 30;
    const labels = [];
    const prices = [];
    const basePrice = currentStock ? currentStock.currentPrice : 50;
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        
        // 生成价格波动
        const randomChange = (Math.random() - 0.5) * 10;
        const price = basePrice + randomChange + (days - i) * 0.5;
        prices.push(price);
    }
    
    return { labels, prices };
}

// 初始化预测图表
function initializePredictionChart() {
    // 检查Chart.js是否加载
    if (typeof Chart === 'undefined') {
        console.error('Chart.js未加载');
        showNotification('图表库加载失败，请刷新页面重试', 'error');
        return;
    }
    
    const ctx = document.getElementById('predictionChart');
    if (!ctx) return;
    
    if (predictionChart) {
        predictionChart.destroy();
    }
    
    // 生成预测数据
    const historicalData = [];
    const predictionData = [];
    const labels = [];
    
    // 历史数据（30天）
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString());
        historicalData.push(currentStock.currentPrice + (Math.random() - 0.5) * 2);
    }
    
    // 预测数据（14天）
    for (let i = 1; i <= 14; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        labels.push(date.toLocaleDateString());
        const trend = currentStock.prediction.direction === 'up' ? 0.1 : -0.1;
        predictionData.push(currentStock.currentPrice + (i * trend * currentStock.currentPrice / 14) + (Math.random() - 0.5));
    }
    
    const trendData = {
        labels: labels,
        prices: [...historicalData, ...predictionData]
    };
    
    window.predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '历史价格',
                data: [...historicalData, ...Array(14).fill(null)],
                borderColor: '#1A85FF',
                backgroundColor: 'rgba(26, 133, 255, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }, {
                label: '预测价格',
                data: [...Array(30).fill(null), ...predictionData],
                borderColor: '#FFD700',
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                tension: 0.1
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
                    display: true,
                    position: 'top'
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

// ...

// 下载分析报告
function downloadReport() {
    if (!currentStock) {
        showNotification('请先加载股票信息', 'warning');
        return;
    }
    
    // 获取分析结果
    const analysisText = document.querySelector('.analysis-text');
    const analysisContent = analysisText ? analysisText.textContent : generateMockAnalysis(currentStock);
    
    // 生成报告内容
    const reportContent = generateReportContent(currentStock, analysisContent);
    
    // 创建下载
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentStock.name}_${currentStock.code}_分析报告_${new Date().toLocaleDateString('zh-CN')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showNotification('报告下载成功', 'success');
}

// 分享股票
function shareStock() {
    if (!currentStock) {
        showNotification('请先选择股票', 'warning');
        return;
    }
    
    const shareText = `${currentStock.name}(${currentStock.code})\n` +
                     `当前价格: ¥${currentStock.currentPrice.toFixed(2)}\n` +
                     `涨跌幅: ${currentStock.changePercent >= 0 ? '+' : ''}${currentStock.changePercent.toFixed(2)}%\n` +
                     `来自AI智能股票预测系统`;
    
    if (navigator.share) {
        navigator.share({
            title: '股票信息分享',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText + '\n\n' + window.location.href).then(() => {
            showNotification('分享链接已复制到剪贴板', 'success');
        });
    }
}

// 更新收藏按钮
function updateFavoriteButton() {
    if (!currentStock) return;
    
    const favoriteIcon = document.getElementById('favoriteIcon');
    if (!favoriteIcon) return;
    
    const favorites = JSON.parse(localStorage.getItem('favoriteStocks') || '[]');
    const isFavorite = favorites.includes(currentStock.code);
    
    if (isFavorite) {
        favoriteIcon.className = 'bi bi-star-fill';
        favoriteIcon.style.color = '#ffc107';
    } else {
        favoriteIcon.className = 'bi bi-star';
        favoriteIcon.style.color = '';
    }
}

// 切换收藏
function toggleFavorite() {
    if (!currentStock) {
        showNotification('请先选择股票', 'warning');
        return;
    }
    
    let favorites = JSON.parse(localStorage.getItem('favoriteStocks') || '[]');
    const isFavorite = favorites.includes(currentStock.code);
    
    if (isFavorite) {
        favorites = favorites.filter(code => code !== currentStock.code);
        showNotification('已取消收藏', 'info');
    } else {
        favorites.push(currentStock.code);
        showNotification('收藏成功', 'success');
    }
    
    localStorage.setItem('favoriteStocks', JSON.stringify(favorites));
    updateFavoriteButton();
}

// 生成报告内容
function generateReportContent(stock, analysis) {
    const reportDate = new Date().toLocaleString('zh-CN');
    
    return `
========================================
${stock.name}(${stock.code}) 股票分析报告
========================================

报告生成时间: ${reportDate}
分析来源: AI股票预测系统

========================================
基本信息
========================================
股票代码: ${stock.code}
股票名称: ${stock.name}
当前价格: ¥${stock.currentPrice.toFixed(2)}
涨跌金额: ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}
涨跌幅度: ${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%
开盘价格: ¥${stock.openPrice.toFixed(2)}
最高价格: ¥${stock.highPrice.toFixed(2)}
最低价格: ¥${stock.lowPrice.toFixed(2)}
成交量: ${stock.volume.toLocaleString()}
总市值: ¥${(stock.marketCap / 100000000).toFixed(2)}亿

========================================
技术指标
========================================
市盈率(PE): ${stock.peRatio.toFixed(2)}
市净率(PB): ${stock.pbRatio.toFixed(2)}
净资产收益率(ROE): ${stock.roe.toFixed(2)}%

========================================
AI分析报告
========================================
${analysis}

========================================
投资建议
========================================
风险提示:
1. 本报告仅供参考，不构成投资建议
2. 股市有风险，投资需谨慎
3. 请根据自身风险承受能力做出投资决策
4. 建议分散投资，控制仓位

免责声明:
本报告由AI系统生成，信息可能存在误差，投资者应结合多方信息进行综合分析，并自行承担投资风险。

========================================
报告结束
========================================
    `.trim();
}

// 强制测试函数
function forceTestDisplay() {
    console.log('🔧 强制测试显示函数');
    const container = document.getElementById('stockDetailContainer');
    if (container) {
        console.log('✅ 找到容器，强制填充测试内容');
        container.style.display = 'block';
        container.innerHTML = `
            <div class="container mt-4">
                <div class="alert alert-success">
                    <h2>🎯 强制测试成功！</h2>
                    <p>如果你能看到这个消息，说明页面加载功能正常</p>
                    <p>问题可能在于displayStockDetail函数没有被正确调用</p>
                    <button class="btn btn-primary" onclick="testLoadStock()">测试加载股票</button>
                </div>
            </div>
        `;
    } else {
        console.log('❌ 找不到容器');
    }
}

// 测试加载股票
function testLoadStock() {
    const testStock = {
        code: '000001',
        name: '平安银行',
        currentPrice: 12.45,
        change: 0.23,
        changePercent: 1.88,
        openPrice: 12.22,
        highPrice: 12.68,
        lowPrice: 12.15,
        volume: 12345678
    };
    
    console.log('🧪 测试加载股票:', testStock);
    displayStockDetail(testStock);
}

// 导出函数供HTML调用
window.downloadReport = downloadReport;
window.shareStock = shareStock;
window.toggleFavorite = toggleFavorite;
window.changeKLinePeriod = changeKLinePeriod;
window.analyzeStockWithAI = analyzeStockWithAI;
window.copyAnalysis = copyAnalysis;
window.shareAnalysis = shareAnalysis;
window.goToAIPrediction = goToAIPrediction;
window.saveToBlockchain = saveToBlockchain;
window.setAlert = setAlert;
window.forceTestDisplay = forceTestDisplay;
window.testLoadStock = testLoadStock;

// 跳转到AI预测页面
function goToAIPrediction() {
    if (!currentStock) return;
    window.location.href = `ai-prediction.html?stock=${currentStock.code}`;
}

// 区块链存证
function saveToBlockchain() {
    if (!currentStock) return;
    
    showNotification('正在生成区块链存证...', 'info');
    
    setTimeout(() => {
        const hash = generateBlockchainHash();
        showNotification(`存证成功！哈希值: ${hash.substring(0, 16)}...`, 'success');
        
        // 保存存证记录
        saveBlockchainRecord(hash);
    }, 2000);
}

// 生成区块链哈希
function generateBlockchainHash() {
    const data = {
        stockCode: currentStock.code,
        price: currentStock.currentPrice,
        timestamp: new Date().toISOString(),
        user: currentUser?.username || 'anonymous'
    };
    
    return btoa(JSON.stringify(data)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 64);
}

// 保存区块链记录
function saveBlockchainRecord(hash) {
    const records = JSON.parse(localStorage.getItem('blockchainRecords') || '[]');
    records.push({
        hash: hash,
        stockCode: currentStock.code,
        timestamp: new Date().toISOString(),
        type: 'stock_data'
    });
    localStorage.setItem('blockchainRecords', JSON.stringify(records));
}

// 设置价格提醒
function setAlert() {
    if (!currentStock) return;
    
    const price = prompt('请输入提醒价格:', currentStock.currentPrice.toFixed(2));
    if (price && !isNaN(price)) {
        const alerts = JSON.parse(localStorage.getItem('priceAlerts') || '[]');
        alerts.push({
            stockCode: currentStock.code,
            stockName: currentStock.name,
            targetPrice: parseFloat(price),
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('priceAlerts', JSON.stringify(alerts));
        showNotification(`已设置价格提醒: ¥${parseFloat(price).toFixed(2)}`, 'success');
    }
}

// 加载新闻
function loadNews() {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) {
        // console.log('新闻容器不存在，跳过加载');
        return;
    }
    
    const mockNews = [
        {
            title: `${currentStock.name}发布Q3财报，净利润同比增长18.5%`,
            source: '财经网',
            time: '2小时前',
            summary: '公司今日发布第三季度财务报告，营收和净利润均超市场预期...'
        },
        {
            title: '机构调研：多家基金公司密集调研${currentStock.name}',
            source: '证券时报',
            time: '5小时前',
            summary: '近一周以来，已有超过20家机构投资者对该公司进行了实地调研...'
        },
        {
            title: '行业分析：${currentStock.name}所在板块迎来政策利好',
            source: '上海证券报',
            time: '1天前',
            summary: '相关部门发布最新行业政策，对公司所在板块形成实质性利好...'
        }
    ];
    
    newsContainer.innerHTML = mockNews.map(news => `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">${news.title}</h5>
                <p class="card-text text-muted">${news.summary}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="bi bi-newspaper"></i> ${news.source}
                    </small>
                    <small class="text-muted">
                        <i class="bi bi-clock"></i> ${news.time}
                    </small>
                </div>
            </div>
        </div>
    `).join('');
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
