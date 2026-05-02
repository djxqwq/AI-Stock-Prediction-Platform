# AI智能股票预测平台 - 后端Flask应用

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import datetime
import sqlite3
import hashlib
import json
import random
import os
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-in-production'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(days=7)
app.config['DATABASE'] = 'aistock.db'

# 初始化扩展
CORS(app)
jwt = JWTManager(app)

# JWT错误处理
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'success': False, 'code': 401, 'message': 'Token已过期'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'success': False, 'code': 401, 'message': 'Token无效'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'success': False, 'code': 401, 'message': '需要Token'}), 401

# 数据库初始化
def init_db():
    """初始化数据库"""
    conn = sqlite3.connect(app.config['DATABASE'])
    cursor = conn.cursor()
    
    # 创建用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            avatar_url TEXT,
            points INTEGER DEFAULT 0,
            prediction_accuracy REAL DEFAULT 0.0,
            user_level TEXT DEFAULT 'bronze',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    ''')
    
    # 创建股票表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_code TEXT UNIQUE NOT NULL,
            stock_name TEXT NOT NULL,
            market TEXT NOT NULL,
            industry TEXT,
            current_price REAL,
            open_price REAL,
            high_price REAL,
            low_price REAL,
            volume INTEGER,
            turnover REAL,
            change_amount REAL,
            change_percent REAL,
            market_cap REAL,
            pe_ratio REAL,
            pb_ratio REAL,
            roe REAL,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建AI预测表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_id INTEGER NOT NULL,
            user_id INTEGER,
            prediction_type TEXT NOT NULL,
            target_price REAL NOT NULL,
            confidence_score REAL NOT NULL,
            prediction_direction TEXT NOT NULL,
            analysis_text TEXT,
            model_version TEXT,
            prediction_date DATE NOT NULL,
            target_date DATE NOT NULL,
            is_public BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (stock_id) REFERENCES stocks(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 创建用户预测表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,
            prediction_type TEXT NOT NULL,
            target_price REAL NOT NULL,
            prediction_direction TEXT NOT NULL,
            confidence_level TEXT NOT NULL,
            analysis_reason TEXT,
            prediction_date DATE NOT NULL,
            target_date DATE NOT NULL,
            is_public BOOLEAN DEFAULT 1,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            accuracy_score REAL,
            is_verified BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (stock_id) REFERENCES stocks(id)
        )
    ''')
    
    # 创建区块链存证表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blockchain_proofs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_type TEXT NOT NULL,
            content_id INTEGER NOT NULL,
            data_hash TEXT UNIQUE NOT NULL,
            block_hash TEXT,
            transaction_hash TEXT,
            block_number INTEGER,
            timestamp TIMESTAMP NOT NULL,
            is_verified BOOLEAN DEFAULT 0,
            verification_attempts INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建积分记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS points_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            points_change INTEGER NOT NULL,
            points_type TEXT NOT NULL,
            reason TEXT NOT NULL,
            related_id INTEGER,
            related_type TEXT,
            balance_after INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 创建社区话题表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            stock_id INTEGER,
            is_pinned BOOLEAN DEFAULT 0,
            is_top BOOLEAN DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (stock_id) REFERENCES stocks(id)
        )
    ''')
    
    # 创建话题评论表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS topic_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            parent_id INTEGER,
            content TEXT NOT NULL,
            likes_count INTEGER DEFAULT 0,
            is_deleted BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (topic_id) REFERENCES community_topics(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (parent_id) REFERENCES topic_comments(id)
        )
    ''')
    
    # 创建用户收藏表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stock_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE CASCADE,
            UNIQUE(user_id, stock_id)
        )
    ''')
    
    # 创建AI问答记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_qa_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            question_type TEXT,
            stock_id INTEGER,
            session_id TEXT,
            is_useful BOOLEAN,
            feedback_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (stock_id) REFERENCES stocks(id) ON DELETE SET NULL
        )
    ''')
    
    # 创建系统日志表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS system_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id INTEGER,
            ip_address TEXT,
            user_agent TEXT,
            status TEXT DEFAULT 'success',
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 创建积分兑换记录表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS points_redemptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            points_cost INTEGER NOT NULL,
            item_type TEXT NOT NULL,
            item_value INTEGER,
            status TEXT DEFAULT 'pending',
            redemption_code TEXT,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 创建市场指数表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS market_indices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            index_code TEXT UNIQUE NOT NULL,
            index_name TEXT NOT NULL,
            current_value REAL,
            change_amount REAL,
            change_percent REAL,
            high_value REAL,
            low_value REAL,
            volume INTEGER,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建预测点赞表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prediction_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            prediction_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (prediction_id) REFERENCES user_predictions(id) ON DELETE CASCADE,
            UNIQUE(user_id, prediction_id)
        )
    ''')
    
    conn.commit()
    conn.close()

# 数据库连接
def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(app.config['DATABASE'])
    conn.row_factory = sqlite3.Row
    return conn

# 生成盐值
def generate_salt():
    """生成随机盐值"""
    return os.urandom(16).hex()

# 生成密码哈希
def hash_password(password, salt):
    """生成密码哈希"""
    return hashlib.sha256((password + salt).encode()).hexdigest()

# 生成区块链哈希
def generate_blockchain_hash(data):
    """生成区块链哈希"""
    data_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(data_str.encode()).hexdigest()

# 记录系统日志
def log_action(user_id, action, resource_type=None, resource_id=None, status='success', details=None):
    """记录系统操作日志"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO system_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, status, details)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, action, resource_type, resource_id, 
          request.remote_addr, request.headers.get('User-Agent'), status, details))
    conn.commit()
    conn.close()

# 更新用户积分
def update_user_points(user_id, points_change, reason, related_id=None, related_type=None):
    """更新用户积分"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取当前积分
    cursor.execute('SELECT points FROM users WHERE id = ?', (user_id,))
    current_points = cursor.fetchone()['points']
    new_points = current_points + points_change
    
    # 更新用户积分
    cursor.execute('UPDATE users SET points = ? WHERE id = ?', (new_points, user_id))
    
    # 记录积分变动
    cursor.execute('''
        INSERT INTO points_records (user_id, points_change, points_type, reason, related_id, related_type, balance_after)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, points_change, 'earn' if points_change > 0 else 'spend', reason, related_id, related_type, new_points))
    
    conn.commit()
    conn.close()
    
    return new_points

# 路由：用户注册
@app.route('/api/auth/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        phone = data.get('phone')
        password = data.get('password')
        confirm_password = data.get('confirmPassword')
        
        # 验证输入
        if not username or not email or not password:
            return jsonify({'success': False, 'code': 400, 'message': '请填写必要信息'}), 400
        
        if password != confirm_password:
            return jsonify({'success': False, 'code': 400, 'message': '两次密码输入不一致'}), 400
        
        if len(password) < 8:
            return jsonify({'success': False, 'code': 400, 'message': '密码长度至少8位'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 检查用户名和邮箱是否已存在
        cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', (username, email))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'code': 400, 'message': '用户名或邮箱已存在'}), 400
        
        # 创建用户
        salt = generate_salt()
        password_hash = hash_password(password, salt)
        
        cursor.execute('''
            INSERT INTO users (username, email, phone, password_hash, salt)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, email, phone, password_hash, salt))
        
        user_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # 注册奖励积分
        update_user_points(user_id, 20, '注册奖励')
        
        # 生成访问令牌
        access_token = create_access_token(identity=user_id)
        
        log_action(user_id, 'user_register')
        
        return jsonify({
            'success': True,
            'code': 201,
            'message': '注册成功',
            'data': {
                'userId': user_id,
                'username': username,
                'email': email,
                'token': access_token,
                'expiresIn': 604800
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'注册失败: {str(e)}'}), 500

# 路由：用户登录
@app.route('/api/auth/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'code': 400, 'message': '请输入用户名和密码'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 查找用户
        cursor.execute('SELECT id, username, email, password_hash, salt, points FROM users WHERE (username = ? OR email = ?) AND is_active = 1', 
                      (username, username))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'code': 401, 'message': '用户名或密码错误'}), 401
        
        # 验证密码
        if user['password_hash'] != hash_password(password, user['salt']):
            conn.close()
            return jsonify({'success': False, 'code': 401, 'message': '用户名或密码错误'}), 401
        
        # 更新最后登录时间
        cursor.execute('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', (user['id'],))
        conn.commit()
        conn.close()
        
        # 生成访问令牌
        access_token = create_access_token(identity=user['id'])
        
        log_action(user['id'], 'user_login')
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '登录成功',
            'data': {
                'userId': user['id'],
                'username': user['username'],
                'email': user['email'],
                'points': user['points'],
                'token': access_token,
                'expiresIn': 604800
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'登录失败: {str(e)}'}), 500

# 路由：重置密码
@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    """重置密码"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'success': False, 'code': 400, 'message': '请输入邮箱地址'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 检查邮箱是否存在
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        if not user:
            # 为了安全，不透露邮箱是否存在
            return jsonify({'success': True, 'code': 200, 'message': '如果邮箱存在，重置链接已发送'})
        
        # 生成重置token
        reset_token = generate_reset_token()
        
        # 这里应该发送邮件，暂时模拟
        print(f"重置密码链接: http://localhost:8080/reset-password?token={reset_token}")
        
        conn.close()
        
        return jsonify({
            'success': True, 
            'code': 200, 
            'message': '重置链接已发送到您的邮箱'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'重置失败: {str(e)}'}), 500

# 路由：检查AI配置
@app.route('/api/ai/config', methods=['GET'])
def check_ai_config():
    """检查AI配置状态"""
    from deepseek_client import deepseek_client
    
    return jsonify({
        'success': True,
        'data': {
            'deepseek_configured': deepseek_client.is_configured(),
            'model': deepseek_client.model,
            'api_base': deepseek_client.base_url
        }
    })

# 路由：AI问答
@app.route('/api/ai/qa/ask', methods=['POST'])
@jwt_required()
def ai_qa_ask():
    """AI问答"""
    try:
        # 调试信息
        print(f"🔍 JWT验证成功，用户ID: {get_jwt_identity()}")
        
        user_id = get_jwt_identity()
        data = request.get_json()
        
        question = data.get('question', '')
        stock_code = data.get('stockCode')
        session_id = data.get('sessionId', f'session_{user_id}_{int(time.time())}')
        
        if not question:
            return jsonify({'success': False, 'code': 400, 'message': '请输入问题'}), 400
        
        # 使用DeepSeek API生成AI回答
        from deepseek_client import deepseek_client
        
        if deepseek_client.is_configured():
            # 使用真实的DeepSeek API
            result = deepseek_client.ask_question(question, stock_code)
            if result['success']:
                answer = result['answer']
            else:
                answer = f"抱歉，AI服务暂时不可用：{result['error']}"
        else:
            # API未配置时使用模拟回答
            answer = generate_ai_answer(question, stock_code)
            answer += "\n\n💡 提示：要获得更准确的AI回答，请在后端配置DeepSeek API密钥。"
        
        # 保存问答记录
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO ai_qa_records 
            (user_id, question, answer, question_type, stock_id, session_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, question, answer, 'stock_question', None, session_id, datetime.datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '回答生成成功',
            'data': {
                'questionId': cursor.lastrowid,
                'question': question,
                'answer': answer,
                'sessionId': session_id,
                'relatedStocks': [stock_code] if stock_code else []
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'问答失败: {str(e)}'}), 500

# 路由：获取问答历史
@app.route('/api/ai/qa/history', methods=['GET'])
@jwt_required()
def get_qa_history():
    """获取问答历史"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        session_id = request.args.get('sessionId')
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = '''
            SELECT id, question, answer, question_type, stock_id, session_id, created_at
            FROM ai_qa_records 
            WHERE user_id = ?
        '''
        params = [user_id]
        
        if session_id:
            query += ' AND session_id = ?'
            params.append(session_id)
        
        query += ' ORDER BY created_at DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': {
                'total': len(records),
                'page': page,
                'limit': limit,
                'records': [dict(record) for record in records]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：发布社区预测
@app.route('/api/community/predictions', methods=['POST'])
@jwt_required()
def create_community_prediction():
    """发布社区预测"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        stock_code = data.get('stockCode')
        prediction_type = data.get('predictionType', 'short_term')
        target_price = data.get('targetPrice')
        prediction_direction = data.get('predictionDirection')
        confidence_level = data.get('confidenceLevel', 'medium')
        analysis_reason = data.get('analysisReason', '')
        is_public = data.get('isPublic', True)
        
        if not all([stock_code, target_price, prediction_direction]):
            return jsonify({'success': False, 'code': 400, 'message': '请填写必要信息'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 获取股票ID
        cursor.execute('SELECT id FROM stocks WHERE stock_code = ?', (stock_code,))
        stock = cursor.fetchone()
        
        if not stock:
            conn.close()
            return jsonify({'success': False, 'code': 404, 'message': '股票不存在'}), 404
        
        # 保存预测
        cursor.execute('''
            INSERT INTO user_predictions 
            (user_id, stock_id, prediction_type, target_price, prediction_direction, 
             confidence_level, analysis_reason, prediction_date, target_date, is_public)
            VALUES (?, ?, ?, ?, ?, ?, ?, date('now'), date('now', '+7 days'), ?)
        ''', (user_id, stock['id'], prediction_type, target_price, prediction_direction,
              confidence_level, analysis_reason, is_public))
        
        prediction_id = cursor.lastrowid
        
        # 奖励积分
        update_user_points(user_id, 10, '发布有效预测', prediction_id, 'user_prediction')
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 201,
            'message': '发布成功',
            'data': {'predictionId': prediction_id}
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'发布失败: {str(e)}'}), 500

# 路由：获取社区预测列表
@app.route('/api/community/predictions', methods=['GET'])
def get_community_predictions():
    """获取社区预测列表"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        sort = request.args.get('sort', 'time')
        stock_code = request.args.get('stockCode')
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = '''
            SELECT up.id, up.target_price, up.prediction_direction, up.confidence_level,
                   up.analysis_reason, up.likes_count, up.comments_count, up.created_at,
                   u.username, u.avatar_url, u.prediction_accuracy,
                   s.stock_code, s.stock_name, s.current_price
            FROM user_predictions up
            JOIN users u ON up.user_id = u.id
            JOIN stocks s ON up.stock_id = s.id
            WHERE up.is_public = 1
        '''
        params = []
        
        if stock_code:
            query += ' AND s.stock_code = ?'
            params.append(stock_code)
        
        # 排序
        if sort == 'hot':
            query += ' ORDER BY up.likes_count DESC, up.created_at DESC'
        elif sort == 'accuracy':
            query += ' ORDER BY u.prediction_accuracy DESC, up.created_at DESC'
        else:
            query += ' ORDER BY up.created_at DESC'
        
        query += ' LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        predictions = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': {
                'total': len(predictions),
                'page': page,
                'limit': limit,
                'predictions': [dict(p) for p in predictions]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：点赞预测
@app.route('/api/community/predictions/<int:prediction_id>/like', methods=['POST'])
@jwt_required()
def like_prediction(prediction_id):
    """点赞预测"""
    try:
        user_id = get_jwt_identity()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 检查是否已点赞
        cursor.execute('''
            SELECT id FROM prediction_likes 
            WHERE user_id = ? AND prediction_id = ?
        ''', (user_id, prediction_id))
        
        existing_like = cursor.fetchone()
        
        if existing_like:
            # 取消点赞
            cursor.execute('DELETE FROM prediction_likes WHERE user_id = ? AND prediction_id = ?', (user_id, prediction_id))
            cursor.execute('UPDATE user_predictions SET likes_count = likes_count - 1 WHERE id = ?', (prediction_id,))
            message = '取消点赞'
        else:
            # 添加点赞
            cursor.execute('INSERT INTO prediction_likes (user_id, prediction_id) VALUES (?, ?)', (user_id, prediction_id))
            cursor.execute('UPDATE user_predictions SET likes_count = likes_count + 1 WHERE id = ?', (prediction_id,))
            message = '点赞成功'
            
            # 奖励积分
            update_user_points(user_id, 2, '评论点赞', prediction_id, 'user_prediction')
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': message
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'操作失败: {str(e)}'}), 500

# 路由：获取用户信息
@app.route('/api/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """获取用户信息"""
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, phone, avatar_url, points, prediction_accuracy, user_level, 
                   created_at, last_login
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'success': False, 'code': 404, 'message': '用户不存在'}), 404
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': dict(user)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：更新用户信息
@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """更新用户信息"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        email = data.get('email')
        phone = data.get('phone')
        avatar_url = data.get('avatar_url')
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 检查邮箱是否被其他用户使用
        if email:
            cursor.execute('SELECT id FROM users WHERE email = ? AND id != ?', (email, user_id))
            if cursor.fetchone():
                conn.close()
                return jsonify({'success': False, 'code': 400, 'message': '邮箱已被其他用户使用'}), 400
        
        # 更新用户信息
        update_fields = []
        params = []
        
        if email:
            update_fields.append('email = ?')
            params.append(email)
        if phone:
            update_fields.append('phone = ?')
            params.append(phone)
        if avatar_url:
            update_fields.append('avatar_url = ?')
            params.append(avatar_url)
        
        if update_fields:
            update_fields.append('updated_at = CURRENT_TIMESTAMP')
            params.append(user_id)
            
            query = f'UPDATE users SET {", ".join(update_fields)} WHERE id = ?'
            cursor.execute(query, params)
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '更新成功'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'更新失败: {str(e)}'}), 500

# 路由：修改密码
@app.route('/api/user/password', methods=['PUT'])
@jwt_required()
def update_user_password():
    """修改密码"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        
        if not old_password or not new_password:
            return jsonify({'success': False, 'code': 400, 'message': '请输入原密码和新密码'}), 400
        
        if len(new_password) < 8:
            return jsonify({'success': False, 'code': 400, 'message': '新密码长度至少8位'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 获取用户信息
        cursor.execute('SELECT password_hash, salt FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'code': 404, 'message': '用户不存在'}), 404
        
        # 验证原密码
        if user['password_hash'] != hash_password(old_password, user['salt']):
            conn.close()
            return jsonify({'success': False, 'code': 401, 'message': '原密码错误'}), 401
        
        # 更新密码
        new_salt = generate_salt()
        new_password_hash = hash_password(new_password, new_salt)
        
        cursor.execute('''
            UPDATE users SET password_hash = ?, salt = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ''', (new_password_hash, new_salt, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '密码修改成功'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'修改失败: {str(e)}'}), 500

# 路由：上传头像
@app.route('/api/user/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    """上传用户头像"""
    try:
        user_id = get_jwt_identity()
        
        # 检查是否有文件上传
        if 'avatar' not in request.files:
            return jsonify({'success': False, 'code': 400, 'message': '没有选择文件'}), 400
        
        file = request.files['avatar']
        
        # 检查文件名是否为空
        if file.filename == '':
            return jsonify({'success': False, 'code': 400, 'message': '没有选择文件'}), 400
        
        # 检查文件类型
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
        if not ('.' in file.filename and 
                file.filename.rsplit('.', 1)[1].lower() in allowed_extensions):
            return jsonify({'success': False, 'code': 400, 'message': '只支持图片文件'}), 400
        
        # 检查文件大小 (限制为5MB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            return jsonify({'success': False, 'code': 400, 'message': '文件大小不能超过5MB'}), 400
        
        # 创建上传目录
        upload_dir = 'uploads/avatars'
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 生成唯一文件名
        import uuid
        file_extension = file.filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{user_id}_{uuid.uuid4().hex[:8]}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # 保存文件
        file.save(file_path)
        
        # 更新数据库中的头像URL
        avatar_url = f"/{file_path}"
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', 
                      (avatar_url, user_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '头像上传成功',
            'data': {
                'avatar_url': avatar_url
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'上传失败: {str(e)}'}), 500

# 路由：获取积分余额
@app.route('/api/points/balance', methods=['GET'])
@jwt_required()
def get_points_balance():
    """获取积分余额"""
    try:
        user_id = get_jwt_identity()
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('SELECT points, user_level FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'code': 404, 'message': '用户不存在'}), 404
        
        # 计算下一等级所需积分
        current_points = user['points']
        next_level_points = calculate_next_level_points(user['user_level'])
        level_progress = min(100, (current_points / next_level_points) * 100) if next_level_points > 0 else 100
        
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': {
                'balance': current_points,
                'userLevel': user['user_level'],
                'nextLevelPoints': next_level_points,
                'levelProgress': level_progress
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：获取积分记录
@app.route('/api/points/records', methods=['GET'])
@jwt_required()
def get_points_records():
    """获取积分记录"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        points_type = request.args.get('type')
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = '''
            SELECT points_change, points_type, reason, related_id, related_type, balance_after, created_at
            FROM points_records 
            WHERE user_id = ?
        '''
        params = [user_id]
        
        if points_type:
            query += ' AND points_type = ?'
            params.append(points_type)
        
        query += ' ORDER BY created_at DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': {
                'total': len(records),
                'page': page,
                'limit': limit,
                'records': [dict(r) for r in records]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：积分兑换
@app.route('/api/points/redeem', methods=['POST'])
@jwt_required()
def redeem_points():
    """积分兑换"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        item_type = data.get('itemType')
        points_cost = data.get('pointsCost')
        
        if not item_type or not points_cost:
            return jsonify({'success': False, 'code': 400, 'message': '参数不完整'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 检查用户积分
        cursor.execute('SELECT points FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user or user['points'] < points_cost:
            conn.close()
            return jsonify({'success': False, 'code': 400, 'message': '积分不足'}), 400
        
        # 扣除积分
        new_balance = user['points'] - points_cost
        cursor.execute('UPDATE users SET points = ? WHERE id = ?', (new_balance, user_id))
        
        # 记录积分变动
        cursor.execute('''
            INSERT INTO points_records 
            (user_id, points_change, points_type, reason, related_type, balance_after, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, -points_cost, 'spend', f'兑换{item_type}', 'redemption', new_balance, datetime.datetime.now().isoformat()))
        
        # 保存兑换记录
        redemption_code = f'REDEEM_{user_id}_{int(time.time())}'
        cursor.execute('''
            INSERT INTO points_redemptions 
            (user_id, item_name, points_cost, item_type, status, redemption_code, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, item_type, points_cost, item_type, 'completed', redemption_code, datetime.datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '兑换成功',
            'data': {
                'redemptionCode': redemption_code,
                'newBalance': new_balance
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'兑换失败: {str(e)}'}), 500

# 路由：获取区块链记录
@app.route('/api/blockchain/records', methods=['GET'])
@jwt_required()
def get_blockchain_records():
    """获取区块链记录"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        content_type = request.args.get('contentType')
        
        conn = get_db()
        cursor = conn.cursor()
        
        query = '''
            SELECT id, content_type, content_id, data_hash, block_hash, transaction_hash, 
                   block_number, timestamp, is_verified
            FROM blockchain_proofs
        '''
        params = []
        
        # 这里可以添加用户过滤逻辑
        query += ' ORDER BY timestamp DESC LIMIT ?'
        params.append(limit)
        
        cursor.execute(query, params)
        records = cursor.fetchall()
        
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': {
                'total': len(records),
                'page': page,
                'limit': limit,
                'records': [dict(r) for r in records]
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：搜索股票
@app.route('/api/stocks/search', methods=['GET'])
def search_stocks():
    """搜索股票"""
    try:
        query = request.args.get('q', '').strip()
        limit = int(request.args.get('limit', 10))
        
        if not query:
            return jsonify({'success': False, 'code': 400, 'message': '请输入搜索关键词'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, stock_code, stock_name, market, current_price, change_amount, change_percent
            FROM stocks 
            WHERE (stock_code LIKE ? OR stock_name LIKE ?) AND is_active = 1
            ORDER BY change_percent DESC
            LIMIT ?
        ''', (f'%{query}%', f'%{query}%', limit))
        
        stocks = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '搜索成功',
            'data': {
                'total': len(stocks),
                'stocks': stocks
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'搜索失败: {str(e)}'}), 500

# 路由：获取股票详情
@app.route('/api/stocks/<stock_code>', methods=['GET'])
def get_stock_detail(stock_code):
    """获取股票详情"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, stock_code, stock_name, market, industry, current_price, open_price, high_price, 
                   low_price, volume, turnover, change_amount, change_percent, market_cap, pe_ratio, 
                   pb_ratio, roe, updated_at
            FROM stocks 
            WHERE stock_code = ? AND is_active = 1
        ''', (stock_code,))
        
        stock = cursor.fetchone()
        conn.close()
        
        if not stock:
            return jsonify({'success': False, 'code': 404, 'message': '股票不存在'}), 404
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': dict(stock)
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：创建AI预测
@app.route('/api/ai/predict', methods=['POST'])
@jwt_required()
def create_ai_prediction():
    """创建AI预测"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        stock_code = data.get('stockCode')
        prediction_type = data.get('predictionType', 'medium_term')
        model = data.get('model', 'advanced')
        include_community = data.get('includeCommunity', True)
        enable_risk_analysis = data.get('enableRiskAnalysis', True)
        
        if not stock_code:
            return jsonify({'success': False, 'code': 400, 'message': '请选择股票'}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 获取股票信息
        cursor.execute('SELECT id, current_price FROM stocks WHERE stock_code = ?', (stock_code,))
        stock = cursor.fetchone()
        
        if not stock:
            conn.close()
            return jsonify({'success': False, 'code': 404, 'message': '股票不存在'}), 404
        
        # 生成AI预测（模拟）
        current_price = stock['current_price'] or random.uniform(10, 100)
        
        # 根据模型类型设置基础置信度
        confidence_base = {'basic': 65, 'advanced': 75, 'premium': 85}[model]
        confidence = confidence_base + random.uniform(-5, 15)
        
        # 生成预测方向和目标价格
        directions = ['up', 'down', 'stable']
        direction = random.choice(directions)
        
        # 根据预测类型设置价格变动幅度
        multipliers = {'short_term': 0.02, 'medium_term': 0.08, 'long_term': 0.15}
        multiplier = multipliers[prediction_type]
        
        change_amount = (random.random() - 0.5) * current_price * multiplier
        target_price = current_price + change_amount
        
        # 生成分析文本
        technical_analysis = generate_technical_analysis(direction)
        fundamental_analysis = generate_fundamental_analysis()
        
        # 保存预测记录
        cursor.execute('''
            INSERT INTO ai_predictions 
            (stock_id, user_id, prediction_type, target_price, confidence_score, prediction_direction, analysis_text, model_version, prediction_date, target_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), date('now', '+' + {'short_term': '7 days', 'medium_term': '28 days', 'long_term': '90 days'}[prediction_type] + ''))
        ''', (stock['id'], user_id, prediction_type, target_price, confidence, direction, 
              f"技术分析: {technical_analysis}\n基本面分析: {fundamental_analysis}", model))
        
        prediction_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # 扣除积分（高级模型需要积分）
        if model == 'premium':
            update_user_points(user_id, -50, 'AI高级预测', prediction_id, 'ai_prediction')
        
        log_action(user_id, 'create_prediction', 'ai_prediction', prediction_id)
        
        return jsonify({
            'success': True,
            'code': 201,
            'message': '预测创建成功',
            'data': {
                'predictionId': f'pred_{prediction_id}',
                'stockCode': stock_code,
                'stockName': get_stock_name(stock_code),
                'currentPrice': current_price,
                'direction': direction,
                'targetPrice': target_price,
                'expectedReturn': ((target_price - current_price) / current_price) * 100,
                'confidence': confidence,
                'riskLevel': calculate_risk_level(((target_price - current_price) / current_price) * 100, prediction_type),
                'predictionType': prediction_type,
                'model': model,
                'technicalAnalysis': technical_analysis,
                'fundamentalAnalysis': fundamental_analysis,
                'priceRange': {
                    'min': target_price * 0.95,
                    'max': target_price * 1.05
                },
                'createdAt': datetime.datetime.now().isoformat()
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'预测失败: {str(e)}'}), 500

# 辅助函数：生成技术分析文本
def generate_technical_analysis(direction):
    """生成技术分析文本"""
    analyses = {
        'up': [
            'MACD指标显示金叉形态，RSI处于合理区间，成交量温和放大，短期技术面偏多。',
            'KDJ指标金叉向上，布林带开口扩大，价格突破重要阻力位，技术信号积极。',
            '均线系统呈多头排列，MACD红柱放大，资金流入明显，技术面强势。'
        ],
        'down': [
            'MACD指标死叉向下，RSI超买区域回落，成交量萎缩，短期技术面偏空。',
            'KDJ指标死叉向下，布林带收窄，价格跌破重要支撑位，技术信号消极。',
            '均线系统呈空头排列，MACD绿柱放大，资金流出明显，技术面弱势。'
        ],
        'stable': [
            'MACD指标在零轴附近震荡，RSI处于中性区域，成交量平稳，技术面震荡。',
            'KDJ指标中性，布林带水平运行，价格在区间内波动，技术信号中性。',
            '均线系统交织，MACD柱体较短，资金进出平衡，技术面盘整。'
        ]
    }
    return random.choice(analyses[direction])

# 辅助函数：生成基本面分析文本
def generate_fundamental_analysis():
    """生成基本面分析文本"""
    analyses = [
        '公司Q3业绩超预期，营收同比增长18.5%，净利润增长22.3%，行业地位稳固。',
        '公司基本面良好，毛利率持续提升，费用控制有效，盈利能力增强。',
        '行业景气度回升，公司作为龙头企业充分受益，市场份额稳步提升。',
        '公司新产品表现亮眼，海外市场拓展顺利，未来增长潜力巨大。'
    ]
    return random.choice(analyses)

# 辅助函数：获取股票名称
def get_stock_name(stock_code):
    """获取股票名称"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT stock_name FROM stocks WHERE stock_code = ?', (stock_code,))
    result = cursor.fetchone()
    conn.close()
    return result['stock_name'] if result else stock_code

# 辅助函数：计算风险等级
def calculate_risk_level(return_rate, period):
    """计算风险等级"""
    abs_return = abs(return_rate)
    
    if period == 'short_term':
        if abs_return > 5: return '高'
        if abs_return > 2: return '中等'
        return '低'
    elif period == 'medium_term':
        if abs_return > 15: return '高'
        if abs_return > 8: return '中等'
        return '低'
    else:
        if abs_return > 25: return '高'
        if abs_return > 12: return '中等'
        return '低'

# 路由：获取热门股票
@app.route('/api/stocks/hot', methods=['GET'])
def get_hot_stocks():
    """获取热门股票"""
    try:
        sort_type = request.args.get('type', 'change')
        limit = int(request.args.get('limit', 20))
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 根据排序类型确定排序字段
        sort_field = {
            'change': 'change_percent DESC',
            'volume': 'volume DESC',
            'turnover': 'turnover DESC'
        }.get(sort_type, 'change_percent DESC')
        
        cursor.execute(f'''
            SELECT stock_code, stock_name, current_price, change_percent, volume
            FROM stocks 
            WHERE is_active = 1 AND current_price IS NOT NULL
            ORDER BY {sort_field}
            LIMIT ?
        ''', (limit,))
        
        stocks = []
        for i, row in enumerate(cursor.fetchall()):
            stock = dict(row)
            stock['rank'] = i + 1
            stocks.append(stock)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': stocks
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：获取市场指数
@app.route('/api/market/indices', methods=['GET'])
def get_market_indices():
    """获取市场指数"""
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT index_code, index_name, current_value, change_amount, change_percent, 
                   high_value, low_value, volume, updated_at
            FROM market_indices
            ORDER BY updated_at DESC
        ''')
        
        indices = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        # 如果没有数据，返回模拟数据
        if not indices:
            indices = [
                {
                    'indexCode': 'SH000001',
                    'indexName': '上证指数',
                    'currentValue': 3245.67 + random.uniform(-50, 50),
                    'changeAmount': random.uniform(-20, 20),
                    'changePercent': random.uniform(-2, 2),
                    'highValue': 3268.45,
                    'lowValue': 3205.89,
                    'volume': 250000000000,
                    'updatedAt': datetime.datetime.now().isoformat()
                },
                {
                    'indexCode': 'SZ399001',
                    'indexName': '深证成指',
                    'currentValue': 10234.56 + random.uniform(-100, 100),
                    'changeAmount': random.uniform(-50, 50),
                    'changePercent': random.uniform(-2, 2),
                    'highValue': 10356.78,
                    'lowValue': 10123.45,
                    'volume': 180000000000,
                    'updatedAt': datetime.datetime.now().isoformat()
                }
            ]
        
        return jsonify({
            'success': True,
            'code': 200,
            'message': '获取成功',
            'data': indices
        })
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'获取失败: {str(e)}'}), 500

# 路由：区块链存证
@app.route('/api/blockchain/certify', methods=['POST'])
@jwt_required()
def create_blockchain_certify():
    """创建区块链存证"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        content_type = data.get('contentType')
        content_id = data.get('contentId')
        content_data = data.get('data')
        
        if not content_type or not content_id:
            return jsonify({'success': False, 'code': 400, 'message': '参数不完整'}), 400
        
        # 生成数据哈希
        data_hash = generate_blockchain_hash({
            'content_type': content_type,
            'content_id': content_id,
            'data': content_data,
            'timestamp': datetime.datetime.now().isoformat(),
            'user_id': user_id
        })
        
        conn = get_db()
        cursor = conn.cursor()
        
        # 检查是否已存在存证
        cursor.execute('SELECT id FROM blockchain_proofs WHERE data_hash = ?', (data_hash,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'code': 400, 'message': '该数据已存证'}), 400
        
        # 保存存证记录
        cursor.execute('''
            INSERT INTO blockchain_proofs 
            (content_type, content_id, data_hash, block_hash, transaction_hash, block_number, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (content_type, content_id, data_hash, 
              f"0x{hashlib.sha256(f'block_{data_hash}'.encode()).hexdigest()}",
              f"0x{hashlib.sha256(f'tx_{data_hash}'.encode()).hexdigest()}",
              random.randint(1000000, 9999999),
              datetime.datetime.now().isoformat()))
        
        certify_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        log_action(user_id, 'blockchain_certify', content_type, content_id)
        
        return jsonify({
            'success': True,
            'code': 201,
            'message': '存证创建成功',
            'data': {
                'certifyId': f'cert_{certify_id}',
                'dataHash': data_hash,
                'blockHash': f"0x{hashlib.sha256(f'block_{data_hash}'.encode()).hexdigest()}",
                'transactionHash': f"0x{hashlib.sha256(f'tx_{data_hash}'.encode()).hexdigest()}",
                'blockNumber': random.randint(1000000, 9999999),
                'timestamp': datetime.datetime.now().isoformat()
            }
        }), 201
        
    except Exception as e:
        return jsonify({'success': False, 'code': 500, 'message': f'存证失败: {str(e)}'}), 500

# 辅助函数：生成重置token
def generate_reset_token():
    """生成密码重置token"""
    import secrets
    return secrets.token_urlsafe(32)

# 辅助函数：生成AI回答
def generate_ai_answer(question, stock_code=None):
    """生成AI回答（模拟）"""
    answers = {
        '贵州茅台': '贵州茅台(600519)作为白酒行业龙头，具备强大的品牌护城河和稳定的盈利能力。从技术面看，近期股价在高位震荡，建议关注成交量变化和季度财报表现。长期来看，茅台依然是价值投资的优质标的。',
        '市盈率': '市盈率(PE)是衡量股票估值的重要指标，计算公式为：股价/每股收益。一般认为：PE<10为低估，10-20为合理，20-30为高估，>30为泡沫。但不同行业的合理PE水平不同，需结合行业特点分析。',
        'MACD': 'MACD(Moving Average Convergence Divergence)是一种趋势跟踪指标，由DIF线、DEA线和MACD柱线组成。金叉(DIF上穿DEA)为买入信号，死叉(DIF下穿DEA)为卖出信号。适用于趋势明显的市场，震荡市中容易产生假信号。',
        '投资策略': '建议采用多元化投资策略：1)资产配置：股票、债券、现金合理分配；2)行业分散：避免单一行业风险；3)长期持有：选择优质公司长期投资；4)定期定额：平摊成本降低风险；5)止损止盈：控制风险保护收益。',
        '新手': '新手投资建议：1)从指数基金开始，降低个股风险；2)学习基础知识，了解财务指标；3)小额试水，积累经验；4)建立投资纪律，不追涨杀跌；5)关注风险，收益第二；6)长期投资，避免频繁交易。',
        '大盘': '今日大盘走势主要受以下因素影响：1)宏观经济数据发布；2)政策面消息；3)外围市场表现；4)资金流向变化；5)市场情绪波动。建议关注成交量变化和关键支撑阻力位。'
    }
    
    # 检查是否包含关键词
    for keyword, answer in answers.items():
        if keyword in question:
            return answer
    
    # 默认回答
    return f'关于"{question}"这个问题，我建议您从以下几个方面分析：\n1. 基本面分析：公司财务状况、行业地位、竞争优势\n2. 技术面分析：价格趋势、技术指标、成交量变化\n3. 市场环境：宏观经济、政策导向、市场情绪\n4. 风险评估：投资风险、流动性风险、政策风险\n\n如需更详细的分析，建议您提供更具体的信息或关注相关的专业研究报告。'

# 辅助函数：计算下一等级所需积分
def calculate_next_level_points(current_level):
    """计算下一等级所需积分"""
    level_requirements = {
        'bronze': 1000,
        'silver': 2000,
        'gold': 5000,
        'platinum': 10000
    }
    
    levels = ['bronze', 'silver', 'gold', 'platinum']
    current_index = levels.index(current_level) if current_level in levels else 0
    
    if current_index < len(levels) - 1:
        return level_requirements[levels[current_index + 1]]
    else:
        return level_requirements[current_index]

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'code': 404, 'message': '接口不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'code': 500, 'message': '服务器内部错误'}), 500

# JWT错误处理
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({'success': False, 'code': 401, 'message': 'Token已过期'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({'success': False, 'code': 401, 'message': 'Token无效'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({'success': False, 'code': 401, 'message': '需要访问令牌'}), 401

# 静态文件服务
@app.route('/')
def serve_index():
    """服务首页"""
    return send_from_directory('../', 'index.html')

@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    """服务上传文件"""
    return send_from_directory('uploads', filename)

@app.route('/<path:path>')
def serve_static(path):
    """服务静态文件"""
    if path.startswith('pages/') or path.startswith('css/') or path.startswith('js/') or path.startswith('assets/'):
        return send_from_directory('../', path)
    return send_from_directory('../', 'index.html')

# 初始化示例数据
def init_sample_data():
    """初始化示例数据"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 插入示例股票数据
    sample_stocks = [
        ('000001', '平安银行', 'SZ', '银行', 12.45, 12.30, 12.58, 12.25, 120000000, 1500000000, 0.23, 1.88, 285600000000, 6.85, 0.75, 12.5),
        ('000002', '万科A', 'SZ', '房地产', 18.67, 18.45, 18.89, 18.23, 98000000, 1830000000, -0.22, -1.17, 205600000000, 8.23, 0.82, 10.2),
        ('000858', '五粮液', 'SZ', '白酒', 156.78, 155.23, 158.45, 154.89, 25000000, 3920000000, 1.55, 0.99, 607800000000, 25.6, 5.8, 22.3),
        ('600036', '招商银行', 'SH', '银行', 32.45, 32.12, 32.89, 31.98, 45000000, 1460000000, 0.33, 1.02, 823500000000, 7.2, 0.95, 15.8),
        ('600519', '贵州茅台', 'SH', '白酒', 1678.90, 1665.45, 1689.23, 1658.67, 2500000, 4197000000, 13.45, 0.81, 2105600000000, 28.9, 8.7, 31.2)
    ]
    
    cursor.executemany('''
        INSERT OR REPLACE INTO stocks 
        (stock_code, stock_name, market, industry, current_price, open_price, high_price, low_price, volume, turnover, change_amount, change_percent, market_cap, pe_ratio, pb_ratio, roe)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_stocks)
    
    # 插入市场指数数据
    sample_indices = [
        ('SH000001', '上证指数', 3245.67, 39.82, 1.24, 3268.45, 3205.89, 250000000000),
        ('SZ399001', '深证成指', 10234.56, 125.34, 1.24, 10356.78, 10123.45, 180000000000),
        ('SZ399006', '创业板指', 2123.45, 45.67, 2.19, 2156.78, 2089.23, 95000000000)
    ]
    
    cursor.executemany('''
        INSERT OR REPLACE INTO market_indices 
        (index_code, index_name, current_value, change_amount, change_percent, high_value, low_value, volume)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', sample_indices)
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    # 初始化数据库
    init_db()
    
    # 初始化示例数据
    init_sample_data()
    
    print("AI智能股票预测平台后端服务启动中...")
    print("数据库初始化完成")
    print("示例数据加载完成")
    print("服务地址: http://localhost:5000")
    print("API文档: http://localhost:5000/api")
    
    # 启动Flask应用
    app.run(debug=True, host='0.0.0.0', port=5000)
