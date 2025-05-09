export class ShortcutService {
    async getUserShortcuts(userId) {
      const response = await fetch(`/api/shortcuts?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ynor_token')}`
        }
      });
  
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch shortcuts');
    }
  
    async getShortcut(shortcutId) {
      const response = await fetch(`/api/shortcuts/${shortcutId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ynor_token')}`
        }
      });
  
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch shortcut');
    }
  
    async createShortcut(formData) {
      const response = await fetch('/api/shortcuts', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ynor_token')}`
        }
      });
  
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to create shortcut');
    }
  
    async deleteShortcut(shortcutId) {
      const response = await fetch(`/api/shortcuts/${shortcutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('ynor_token')}`
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete shortcut');
      }
    }
  }