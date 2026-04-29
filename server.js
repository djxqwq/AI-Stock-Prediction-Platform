#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 解析URL
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // 处理根路径
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // 构建文件路径
    const filePath = path.join(__dirname, pathname);
    
    // 获取文件扩展名
    const ext = path.parse(filePath).ext;
    const contentType = mimeTypes[ext] || 'text/plain';
    
    console.log(`📄 请求: ${req.method} ${pathname}`);
    
    // 读取文件
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在
                console.log(`❌ 文件不存在: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - 页面未找到</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #ff6b6b; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - 页面未找到</h1>
                        <p>请求的文件 <strong>${pathname}</strong> 不存在</p>
                        <p><a href="/">返回首页</a></p>
                    </body>
                    </html>
                `);
            } else {
                // 其他错误
                console.log(`❌ 服务器错误: ${err}`);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 - 内部服务器错误');
            }
        } else {
            // 成功读取文件
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end(data);
        }
    });
});

// 启动服务器
server.listen(PORT, () => {
    console.log('🚀 AI智能股票预测平台启动成功!');
    console.log('📁 服务目录:', __dirname);
    console.log('🌐 访问地址:', `http://localhost:${PORT}`);
    console.log('📄 首页地址:', `http://localhost:${PORT}/index.html`);
    console.log('⚹ 按 Ctrl+C 停止服务器');
    console.log('-'.repeat(50));
    
    // 尝试自动打开浏览器
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    
    switch (process.platform) {
        case 'win32':
            exec(`start ${url}`);
            break;
        case 'darwin':
            exec(`open ${url}`);
            break;
        default:
            exec(`xdg-open ${url}`);
    }
});

// 处理错误
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用`);
        console.error(`💡 请尝试其他端口或关闭占用该端口的程序`);
        console.error(`🔧 可以修改 server.js 中的 PORT 变量`);
    } else {
        console.error('❌ 服务器启动失败:', err);
    }
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
