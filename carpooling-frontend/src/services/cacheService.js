class CacheService {
  constructor() {
    this.sessionCache = new Map();
    this.persistentCache = this.initializePersistentCache();
  }

  initializePersistentCache() {
    try {
      const cached = localStorage.getItem('app_cache');
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to initialize persistent cache:', error);
      return {};
    }
  }

  // Session cache (temporary, cleared on page refresh)
  setSession(key, data, ttlMinutes = 10) {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    this.sessionCache.set(key, { data, expiry });
  }

  getSession(key) {
    const item = this.sessionCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.sessionCache.delete(key);
      return null;
    }

    return item.data;
  }

  // Persistent cache (survives page refresh)
  setPersistent(key, data, ttlHours = 24) {
    const expiry = Date.now() + (ttlHours * 60 * 60 * 1000);
    this.persistentCache[key] = { data, expiry, timestamp: Date.now() };
    this.savePersistentCache();
  }

  getPersistent(key) {
    const item = this.persistentCache[key];
    if (!item) return null;

    if (Date.now() > item.expiry) {
      delete this.persistentCache[key];
      this.savePersistentCache();
      return null;
    }

    return item.data;
  }

  savePersistentCache() {
    try {
      localStorage.setItem('app_cache', JSON.stringify(this.persistentCache));
    } catch (error) {
      console.error('Failed to save persistent cache:', error);
    }
  }

  // User profile caching
  cacheUserProfile(userProfile) {
    this.setPersistent('user_profile', userProfile, 24); // 24 hours
    this.setSession('user_profile_session', userProfile, 60); // 1 hour in session
  }

  getUserProfile() {
    return this.getSession('user_profile_session') || this.getPersistent('user_profile');
  }

  // Trip data caching
  cacheTrips(trips, cacheKey = 'trips') {
    this.setSession(cacheKey, trips, 5); // 5 minutes for trip data
  }

  getTrips(cacheKey = 'trips') {
    return this.getSession(cacheKey);
  }

  // Settings caching
  cacheSettings(settings) {
    this.setPersistent('user_settings', settings, 168); // 1 week
  }

  getSettings() {
    return this.getPersistent('user_settings');
  }

  // Clear specific cache types
  clearUserData() {
    this.sessionCache.delete('user_profile_session');
    delete this.persistentCache.user_profile;
    delete this.persistentCache.user_settings;
    this.savePersistentCache();
  }

  clearTripData() {
    for (const key of this.sessionCache.keys()) {
      if (key.includes('trips')) {
        this.sessionCache.delete(key);
      }
    }
  }

  // Clear all caches
  clearAll() {
    this.sessionCache.clear();
    this.persistentCache = {};
    localStorage.removeItem('app_cache');
  }

  // Cache statistics
  getStats() {
    const sessionSize = this.sessionCache.size;
    const persistentSize = Object.keys(this.persistentCache).length;
    
    return {
      sessionCacheSize: sessionSize,
      persistentCacheSize: persistentSize,
      totalSize: sessionSize + persistentSize,
      sessionKeys: Array.from(this.sessionCache.keys()),
      persistentKeys: Object.keys(this.persistentCache)
    };
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    // Clean session cache
    for (const [key, item] of this.sessionCache.entries()) {
      if (now > item.expiry) {
        this.sessionCache.delete(key);
        cleaned++;
      }
    }

    // Clean persistent cache
    for (const [key, item] of Object.entries(this.persistentCache)) {
      if (now > item.expiry) {
        delete this.persistentCache[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.savePersistentCache();
      console.log(`Cache cleanup: ${cleaned} expired entries removed`);
    }

    return cleaned;
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Cleanup on page load
cacheService.cleanup();

// Periodic cleanup every 10 minutes
setInterval(() => {
  cacheService.cleanup();
}, 10 * 60 * 1000);

// Clear cache on beforeunload for privacy
window.addEventListener('beforeunload', () => {
  cacheService.clearTripData(); // Clear sensitive trip data
});

export default cacheService;
