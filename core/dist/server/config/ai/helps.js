// C:\Users\USER\OneDrive\Desktop\OpenSource\YNOR\ynor-browser\server\config\ai\helps.js
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration with validation
const CONFIG = {
  AI_DIR: path.join(__dirname, '../../src/data/ai'),
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_API_URL: 'https://api.deepseek.com/v1/chat/completions',
  MAX_HISTORY: 5
};

// Validate configuration on startup
if (!CONFIG.DEEPSEEK_API_KEY || !CONFIG.DEEPSEEK_API_KEY.startsWith('sk-')) {
  console.error('FATAL ERROR: Invalid or missing DEEPSEEK_API_KEY in environment variables');
  console.error('Key should start with "sk-" and be set in .env file');
  process.exit(1);
}

console.log('AI Assistant initialized with valid API key');

// Ensure AI directory exists
fs.ensureDirSync(CONFIG.AI_DIR);

class AIAssistant {
  constructor() {
    this.sessions = new Map();
    this.rateLimit = {
      lastRequest: 0,
      minInterval: 1000 // 1 second between requests
    };
  }

  async askQuestion(userId, question, context = []) {
    try {
      // Validate input
      if (!question || typeof question !== 'string') {
        throw new Error('Invalid question format');
      }

      const sessionId = this._getSessionId(userId);
      const session = this._getSession(sessionId);
      
      // Add user message to history
      session.history.push({
        role: 'user',
        content: question.trim(),
        timestamp: new Date().toISOString()
      });
      
      // Maintain history limit
      if (session.history.length > CONFIG.MAX_HISTORY) {
        session.history = session.history.slice(-CONFIG.MAX_HISTORY);
      }
      
      // Enforce rate limiting
      const now = Date.now();
      const timeSinceLast = now - this.rateLimit.lastRequest;
      if (timeSinceLast < this.rateLimit.minInterval) (
        await new Promise(resolve => 
          setTimeout(resolve, this.rateLimit.minInterval - timeSinceLast)
        ))
      this.rateLimit.lastRequest = Date.now();

      // Call API
      const aiResponse = await this._callDeepSeekAPI(session.history);
      
      // Add AI response to history
      session.history.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // Persist conversation
      await this._saveConversation(sessionId, session.history);
      
      return {
        response: aiResponse,
        sessionId,
        history: session.history
      };

    } catch (error) {
      console.error('AI Processing Error:', {
        message: error.message,
        stack: error.stack,
        userId: userId,
        question: question
      });
      
      return this._getFallbackResponse(error);
    }
  }

  async _callDeepSeekAPI(messages) {
    try {
      const payload = {
        model: 'deepseek-chat',
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature: 0.7,
        max_tokens: 1000
      };

      const response = await axios.post(CONFIG.DEEPSEEK_API_URL, payload, {
        headers: {
          'Authorization': `Bearer ${CONFIG.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 second timeout
      });

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid API response structure');
      }

      return response.data.choices[0].message.content;

    } catch (error) {
      console.error('DeepSeek API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          headers: {
            ...error.config?.headers,
            Authorization: 'Bearer [REDACTED]'
          }
        }
      });
      throw error;
    }
  }

  async _saveConversation(sessionId, history) {
    try {
      const filePath = path.join(CONFIG.AI_DIR, `${sessionId}.json`);
      await fs.writeJson(filePath, {
        sessionId,
        history,
        lastUpdated: new Date().toISOString()
      }, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  _getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        history: [],
        createdAt: new Date().toISOString()
      });
      this._loadSession(sessionId).catch(console.error);
    }
    return this.sessions.get(sessionId);
  }

  async _loadSession(sessionId) {
    const filePath = path.join(CONFIG.AI_DIR, `${sessionId}.json`);
    if (await fs.pathExists(filePath)) {
      try {
        const data = await fs.readJson(filePath);
        this.sessions.set(sessionId, {
          history: data.history || [],
          createdAt: data.createdAt || new Date().toISOString()
        });
      } catch (error) {
        console.error('Error loading session:', error);
      }
    }
  }

  _getSessionId(userId) {
    if (userId.startsWith('user-') || userId.startsWith('public-')) {
      return userId;
    }
    return `user-${userId}`;
  }

  _getFallbackResponse(error) {
    // Specific error messages for different scenarios
    const errorMessages = {
      401: "Authentication failed. Please check your API key.",
      402: "Our AI service quota has been exceeded. We're working to resolve this.",
      429: "Too many requests. Please wait a moment and try again.",
      default: "The AI service is currently unavailable. Please try again later."
    };
  
    const status = error.response?.status;
    const message = errorMessages[status] || errorMessages.default;
  
    return {
      response: message,
      sessionId: null,
      history: [],
      isError: true,
      errorCode: status || 'unknown'
    };
  }
}

module.exports = new AIAssistant();