const fs = require('fs');
const path = require('path');

/**
 * State Manager - Tracks installation progress and state
 */
class StateManager {
  constructor() {
    this.stateFile = path.join(process.cwd(), '.jetpack-state.json');
  }

  /**
   * Save state to file
   * @param {object} state - State object to save
   */
  save(state) {
    try {
      const stateData = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.stateFile, stateData, 'utf8');
    } catch (error) {
      console.error('Failed to save state:', error.message);
    }
  }

  /**
   * Load state from file
   * @param {string} filePath - Optional custom state file path
   * @returns {object|null} State object or null if not found
   */
  load(filePath = null) {
    const file = filePath || this.stateFile;
    
    try {
      if (!fs.existsSync(file)) {
        return null;
      }
      
      const stateData = fs.readFileSync(file, 'utf8');
      return JSON.parse(stateData);
    } catch (error) {
      console.error('Failed to load state:', error.message);
      return null;
    }
  }

  /**
   * Clear state file
   */
  clear() {
    try {
      if (fs.existsSync(this.stateFile)) {
        fs.unlinkSync(this.stateFile);
      }
    } catch (error) {
      console.error('Failed to clear state:', error.message);
    }
  }

  /**
   * Check if state exists
   * @returns {boolean}
   */
  exists() {
    return fs.existsSync(this.stateFile);
  }

  /**
   * Get state file path
   * @returns {string}
   */
  getStateFilePath() {
    return this.stateFile;
  }
}

module.exports = new StateManager();
