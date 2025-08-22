/**
 * Safe storage helper that handles cases where localStorage is blocked
 * by tracking prevention or other browser security features
 */

// In-memory fallback storage
let memoryStorage: { [key: string]: string } = {};

/**
 * Check if localStorage is available and accessible
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    
    const test = '__localStorage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Safe localStorage wrapper with fallback to memory storage
 */
export const safeStorage = {
  setItem: (key: string, value: string): void => {
    try {
      if (isLocalStorageAvailable()) {
        window.localStorage.setItem(key, value);
      } else {
        // Fallback to memory storage
        memoryStorage[key] = value;
        console.warn('localStorage not available, using memory storage fallback');
      }
    } catch (error) {
      console.error('Failed to save to storage:', error);
      // Fallback to memory storage
      memoryStorage[key] = value;
    }
  },

  getItem: (key: string): string | null => {
    try {
      if (isLocalStorageAvailable()) {
        return window.localStorage.getItem(key);
      } else {
        // Fallback to memory storage
        return memoryStorage[key] || null;
      }
    } catch (error) {
      console.error('Failed to read from storage:', error);
      // Fallback to memory storage
      return memoryStorage[key] || null;
    }
  },

  removeItem: (key: string): void => {
    try {
      if (isLocalStorageAvailable()) {
        window.localStorage.removeItem(key);
      } else {
        // Fallback to memory storage
        delete memoryStorage[key];
      }
    } catch (error) {
      console.error('Failed to remove from storage:', error);
      // Fallback to memory storage
      delete memoryStorage[key];
    }
  },

  clear: (): void => {
    try {
      if (isLocalStorageAvailable()) {
        window.localStorage.clear();
      } else {
        // Fallback to memory storage
        memoryStorage = {};
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      // Fallback to memory storage
      memoryStorage = {};
    }
  }
};

/**
 * Helper to store and retrieve JSON data safely
 */
export const safeJsonStorage = {
  setItem: <T>(key: string, value: T): void => {
    try {
      const serialized = JSON.stringify(value);
      safeStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to serialize and store data:', error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const item = safeStorage.getItem(key);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to parse stored data:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    safeStorage.removeItem(key);
  }
};
