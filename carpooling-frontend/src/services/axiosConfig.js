import axios from 'axios';

// Simple cache implementation for GET requests
class RequestCache {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
  }

  generateKey(config) {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }

  set(key, data, ttlMs = 60000) { // Default 1 minute TTL
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttlMs);
  }

  get(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Clear cache entries that match a pattern
  clearPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.delete(key);
      }
    }
  }
}

const requestCache = new RequestCache();

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 30000, // 30 second timeout
});

// Add request interceptor
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add cache headers for GET requests
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'max-age=300'; // 5 minutes
    }

    // Check cache for GET requests (except real-time data)
    if (config.method === 'get' && !config.skipCache) {
      const cacheKey = requestCache.generateKey(config);
      const cachedData = requestCache.get(cacheKey);
      
      if (cachedData && !config.url.includes('pending-count')) {
        console.log('Cache hit for:', config.url);
        // Return cached data as a resolved promise
        config.cachedResponse = cachedData;
      }
    }

    console.log('Axios request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url,
      cached: !!config.cachedResponse
    });

    return config;
  },
  (error) => {
    console.error('Axios request error:', error);
    if (error.response?.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      requestCache.clear();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Add response interceptor
instance.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = requestCache.generateKey(response.config);
      let ttl = 60000; // Default 1 minute

      // Different TTL for different endpoints
      if (response.config.url.includes('/trips') && !response.config.url.includes('my-trips')) {
        ttl = 120000; // 2 minutes for trip listings
      } else if (response.config.url.includes('my-trips')) {
        ttl = 300000; // 5 minutes for user's trips
      } else if (response.config.url.includes('pending-count')) {
        ttl = 30000; // 30 seconds for real-time data
      }

      requestCache.set(cacheKey, response, ttl);
    }

    // Clear relevant cache on data mutations
    if (['post', 'put', 'delete'].includes(response.config.method)) {
      if (response.config.url.includes('/trips')) {
        requestCache.clearPattern('get:/api/trips');
      }
      if (response.config.url.includes('/user')) {
        requestCache.clearPattern('get:/api/user');
      }
    }

    return response;
  },
  (error) => {
    console.error('Axios response error:', error);
    if (error.response?.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      requestCache.clear();
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Handle cached responses
const originalRequest = instance.request;
instance.request = function(config) {
  if (config.cachedResponse) {
    console.log('Returning cached response for:', config.url);
    return Promise.resolve(config.cachedResponse);
  }
  return originalRequest.call(this, config);
};

// Expose cache control methods
instance.cache = {
  clear: () => requestCache.clear(),
  clearPattern: (pattern) => requestCache.clearPattern(pattern),
  getStats: () => ({
    size: requestCache.cache.size,
    keys: Array.from(requestCache.cache.keys())
  })
};

export default instance;