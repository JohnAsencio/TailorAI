/**
 * Utility functions for caching resume data in localStorage
 */

const CACHE_PREFIX = 'resume_cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached resume data
 * @param {string} resumeId - Resume ID
 * @returns {object|null} Cached resume data or null if not found/expired
 */
export function getCachedResume(resumeId) {
  try {
    const cacheKey = `${CACHE_PREFIX}${resumeId}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading resume cache:', error);
    return null;
  }
}

/**
 * Cache resume data
 * @param {string} resumeId - Resume ID
 * @param {object} resumeData - Resume data to cache
 */
export function cacheResume(resumeId, resumeData) {
  try {
    const cacheKey = `${CACHE_PREFIX}${resumeId}`;
    const cacheData = {
      data: resumeData,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching resume:', error);
    // If storage is full, try to clear old entries
    if (error.name === 'QuotaExceededError') {
      clearExpiredResumes();
      try {
        const cacheKey = `${CACHE_PREFIX}${resumeId}`;
        const cacheData = {
          data: resumeData,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('Error caching resume after cleanup:', retryError);
      }
    }
  }
}

/**
 * Clear expired resume caches
 */
function clearExpiredResumes() {
  try {
    const now = Date.now();
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > CACHE_EXPIRY_MS) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Invalid cache entry, remove it
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing expired resumes:', error);
  }
}

/**
 * Clear a specific resume cache
 * @param {string} resumeId - Resume ID
 */
export function clearCachedResume(resumeId) {
  try {
    const cacheKey = `${CACHE_PREFIX}${resumeId}`;
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error('Error clearing resume cache:', error);
  }
}

/**
 * Clear all resume caches
 */
export function clearAllResumeCaches() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing all resume caches:', error);
  }
}




