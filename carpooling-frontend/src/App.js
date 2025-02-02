// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';  // Add this with other imports
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import SearchTrips from './components/SearchTrips';
import PostTrip from './components/PostTrip';
import Home from './components/Home';
import ProtectedRoute from './components/ProtectedRoute';
import EmailVerification from './components/EmailVerification';
import authService from './services/authService';
import Settings from './components/Settings';
import RideRequests from './components/RideRequests';
import MyTrips from './components/MyTrips';
import axios from './services/axiosConfig';
import LoginSignup from './components/LoginSignup';
import './App.css';

// Create a new component that uses navigation hooks
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchIncomingRequestsCount = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping count fetch');
        return;
      }
      
      console.log('Fetching incoming requests count...');
      const response = await axios.get('/api/trips/requests/pending-count');
      
      console.log('Received count:', response.data.count);
      setIncomingRequestsCount(response.data.count);
    } catch (error) {
      console.error('Error fetching incoming requests count:', error);
      if (error.response) {
        console.log('Error response:', error.response.data);
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);
      }
    }
  }, []);

  // Increase polling interval to reduce requests
  const POLLING_INTERVAL = 60000; // Change from 30000 to 60000

  // Add request debouncing
  const debouncedFetch = useCallback(
    debounce(async () => {
      await fetchIncomingRequestsCount();
    }, 1000),
    []
  );

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        await fetchIncomingRequestsCount();

        if (!parsedUser.phoneNumber && location.pathname !== '/settings') {
          navigate('/settings');
        }
      }
    };

    initializeApp();
  }, [navigate, location.pathname, fetchIncomingRequestsCount]);

  useEffect(() => {
    const handleStorage = () => {
      // Detect localStorage changes from other tabs
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
  
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    let interval;
    
    const startPolling = async () => {
      if (isAuthenticated) {
        console.log('Starting polling for request count');
        await fetchIncomingRequestsCount();
        interval = setInterval(fetchIncomingRequestsCount, POLLING_INTERVAL);
      }
    };

    startPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated, fetchIncomingRequestsCount]);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    
    if (!userData.phoneNumber) {
      navigate('/settings');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setIncomingRequestsCount(0);
  };

  const handleUserUpdate = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navigation 
        isAuthenticated={isAuthenticated} 
        onLogout={handleLogout} 
        user={user}
        incomingRequestsCount={incomingRequestsCount}
      />
      <div className="flex-grow-1 main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Home />
              ) : (
                <LoginSignup onLogin={handleLogin} />
              )
            } 
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <SearchTrips user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-trip"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <PostTrip user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Settings user={user} onUserUpdate={handleUserUpdate} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verify-email"
            element={<EmailVerification />}
          />
          <Route
            path="/ride-requests"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <RideRequests user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-trips"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <MyTrips />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

// Main App component that provides the Router context
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
