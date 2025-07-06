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
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update CSS custom properties
    const root = document.documentElement;
    const body = document.body;
    
    // Force a reflow to ensure changes are applied immediately
    const forceReflow = () => {
      body.offsetHeight;
      root.offsetHeight;
    };
    
    if (isDarkMode) {
      root.setAttribute('data-theme', 'dark');
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
      // Force update of CSS variables
      body.style.setProperty('--bg-primary', '#1a202c');
      body.style.setProperty('--text-primary', '#f7fafc');
    } else {
      root.setAttribute('data-theme', 'light');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
      // Force update of CSS variables
      body.style.setProperty('--bg-primary', '#ffffff');
      body.style.setProperty('--text-primary', '#2d3748');
    }
    
    // Force reflow on mobile devices
    if (window.innerWidth <= 768) {
      forceReflow();
      // Additional mobile-specific updates
      setTimeout(() => {
        forceReflow();
      }, 100);
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
