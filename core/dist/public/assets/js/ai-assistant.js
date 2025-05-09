class AIAssistant {
    constructor() {
      this.aiButton = document.getElementById('ai-assistant-button');
      this.aiPanel = document.getElementById('ai-assistant-panel');
      this.aiInput = document.getElementById('ai-input');
      this.aiSubmit = document.getElementById('ai-submit');
      this.aiOutput = document.getElementById('ai-output');
      this.userId = localStorage.getItem('ynor-user-id') || `user-${Math.random().toString(36).substr(2, 9)}`;
      
      this.init();
    }
  
    init() {
      // Handle AI question submission
      this.aiSubmit.addEventListener('click', this.askQuestion.bind(this));
      this.aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.askQuestion();
      });
    }
  
    async askQuestion() {
      const question = this.aiInput.value.trim();
      if (!question) return;
      
      // Add user question to UI
      this.addMessage('user', question);
      this.aiInput.value = '';
      
      // Show loading state
      const loadingId = this.addMessage('assistant', 'Thinking...', true);
      
      try {
        // Call server endpoint
        const response = await fetch('/api/ai/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: this.userId,
            question
          })
        });
        
        const data = await response.json();
        
        // Update loading message with actual response
        this.updateMessage(loadingId, data.response);
        
        // Scroll to bottom
        this.aiOutput.scrollTop = this.aiOutput.scrollHeight;
      } catch (error) {
        this.updateMessage(loadingId, "Sorry, I couldn't process your request. Please try again.");
        console.error('AI error:', error);
      }
    }
  
    addMessage(role, content, isTemp = false) {
      const messageId = `msg-${Date.now()}`;
      const messageElement = document.createElement('div');
      messageElement.id = messageId;
      messageElement.className = `ai-message ${role}`;
      messageElement.innerHTML = content;
      
      if (isTemp) {
        messageElement.classList.add('temp');
      }
      
      this.aiOutput.appendChild(messageElement);
      return messageId;
    }
  
    updateMessage(id, newContent) {
      const message = document.getElementById(id);
      if (message) {
        message.textContent = newContent;
        message.classList.remove('temp');
      }
    }
  }
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
  });