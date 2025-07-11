import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference with caching
    const savedTheme = localStorage.getItem('theme');
    const themeTimestamp = localStorage.getItem('theme_timestamp');
    
    // Use cached theme if it's less than 24 hours old
    if (savedTheme && themeTimestamp) {
      const age = Date.now() - parseInt(themeTimestamp);
      if (age < 24 * 60 * 60 * 1000) { // 24 hours
        return savedTheme === 'dark';
      }
    }
    
    // Check system preference
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Cache the system preference
    localStorage.setItem('theme', systemPrefersDark ? 'dark' : 'light');
    localStorage.setItem('theme_timestamp', Date.now().toString());
    
    return systemPrefersDark;
  });

  useEffect(() => {
    // Save theme preference to localStorage with timestamp
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme_timestamp', Date.now().toString());
    
    // Update CSS custom properties
    const root = document.documentElement;
    const body = document.body;
    
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      // Force update of CSS variables
      body.style.setProperty('--bg-primary', '#1a202c');
      body.style.setProperty('--text-primary', '#f7fafc');
      body.style.setProperty('--button-text', '#ffffff');
      body.style.setProperty('--link-color', '#4299e1');
      body.style.setProperty('--link-hover-color', '#63b3ed');
      body.style.setProperty('--accent-primary', '#4299e1');
    } else {
      root.setAttribute('data-theme', 'light');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
      // Force update of CSS variables
      body.style.setProperty('--bg-primary', '#ffffff');
      body.style.setProperty('--text-primary', '#2d3748');
      body.style.setProperty('--button-text', '#ffffff');
      body.style.setProperty('--link-color', '#2b6cb0');
      body.style.setProperty('--link-hover-color', '#2c5282');
      body.style.setProperty('--accent-primary', '#2b6cb0');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
