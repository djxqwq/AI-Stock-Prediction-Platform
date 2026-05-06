#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import os
import urllib3
from config import DEEPSEEK_API_KEY, DEEPSEEK_API_BASE, DEEPSEEK_MODEL, STOCK_QA_SYSTEM_PROMPT, REQUEST_TIMEOUT, MAX_TOKENS, TEMPERATURE

# 禁用SSL警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class DeepSeekClient:
    def __init__(self):
        self.api_key = DEEPSEEK_API_KEY
        self.base_url = DEEPSEEK_API_BASE
        self.model = DEEPSEEK_MODEL
        
    def is_configured(self):
        """检查API是否已配置"""
        return bool(self.api_key)
    
    def ask_question(self, question, stock_code=None):
        """向DeepSeek API提问"""
        if not self.is_configured():
            return {
                'success': False,
                'error': 'DeepSeek API未配置，请设置API密钥'
            }
        
        # 构建系统提示词
        system_prompt = STOCK_QA_SYSTEM_PROMPT
        if stock_code:
            system_prompt += f"\n\n当前关注的股票代码：{stock_code}"
        
        # 构建用户消息
        user_message = question
        if stock_code:
            user_message = f"关于股票{stock_code}：{question}"
        
        # 构建请求
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.model,
            'messages': [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': user_message}
            ],
            'max_tokens': MAX_TOKENS,
            'temperature': TEMPERATURE,
            'stream': False
        }
        
        try:
            # 添加SSL验证和连接配置
            session = requests.Session()
            session.verify = False  # 禁用SSL证书验证
            session.headers.update(headers)
            
            # 设置连接适配器
            from requests.adapters import HTTPAdapter
            from urllib3.util.retry import Retry
            
            # 配置重试策略
            retry_strategy = Retry(
                total=3,
                backoff_factor=1,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            
            adapter = HTTPAdapter(max_retries=retry_strategy)
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            
            response = session.post(
                f'{self.base_url}/chat/completions',
                json=data,
                timeout=REQUEST_TIMEOUT
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result['choices'][0]['message']['content']
                
                return {
                    'success': True,
                    'answer': answer,
                    'model': self.model,
                    'usage': result.get('usage', {})
                }
            else:
                return {
                    'success': False,
                    'error': f'API请求失败: {response.status_code} - {response.text}'
                }
                
        except requests.exceptions.Timeout:
            return {
                'success': False,
                'error': 'API请求超时'
            }
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': f'网络错误: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'未知错误: {str(e)}'
            }

# 创建全局客户端实例
deepseek_client = DeepSeekClient()
