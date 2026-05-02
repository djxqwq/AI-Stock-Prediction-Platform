# AI问答配置文件
import os
from pathlib import Path

# 加载 .env 文件
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # 如果没有 python-dotenv，手动读取 .env 文件
    env_file = Path(__file__).parent / '.env'
    if env_file.exists():
        with open(env_file, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# DeepSeek API 配置
DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_API_BASE = 'https://api.deepseek.com/v1'
DEEPSEEK_MODEL = 'deepseek-chat'

# AI问答系统提示词
STOCK_QA_SYSTEM_PROMPT = """你是一个专业的股票投资顾问AI助手，专门帮助用户解答股票相关的问题。

你的职责：
1. 提供股票市场分析和投资建议
2. 解答股票技术分析问题
3. 分析公司基本面和财务状况
4. 提供行业趋势和市场动态信息
5. 解答股票交易和投资策略问题

注意事项：
- 始终提醒用户投资有风险，入市需谨慎
- 不提供具体的买卖建议，只提供分析和参考
- 基于公开信息进行分析，不承诺准确性
- 保持客观中立，不推荐具体股票
- 涉及具体股票时，提醒用户自行深入研究

回答格式：
- 开头简要回答用户问题
- 提供相关的分析依据
- 给出风险提示
- 保持语言简洁易懂"""

# 请求配置
REQUEST_TIMEOUT = 30
MAX_TOKENS = 2000
TEMPERATURE = 0.7
