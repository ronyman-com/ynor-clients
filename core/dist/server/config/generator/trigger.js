// server/config/generator/trigger.js
const dataGenerator = require('./data');

class DataGenerationTrigger {
  constructor() {
    this.interval = null;
    this.timeout = null;
  }

  // Helper function for async interval
  async setAsyncInterval(fn, intervalMs) {
    const wrapper = async () => {
      await fn();
      this.timeout = setTimeout(wrapper, intervalMs);
    };
    this.timeout = setTimeout(wrapper, intervalMs);
    return {
      clear: () => clearTimeout(this.timeout)
    };
  }

  start(intervalMs = 300000) { // Default: 5 minutes
    this.stop(); // Clear any existing interval
    
    this.interval = this.setAsyncInterval(async () => {
      try {
        console.log('Starting scheduled data generation...');
        await dataGenerator.generateAllData(); // Pass user ID if needed
        console.log('Scheduled data generation completed');
      } catch (err) {
        console.error('Scheduled data generation failed:', err);
      }
    }, intervalMs);
  }

  stop() {
    if (this.interval) {
      this.interval.clear();
      this.interval = null;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

module.exports = new DataGenerationTrigger();