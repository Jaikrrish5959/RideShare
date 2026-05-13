import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, Car, Settings, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Context for auth state
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Trips from './pages/Trips';
import Login from './pages/Login';

// Axios global setup
axios.defaults.baseURL = 'http://localhost:5000/api';

const Sidebar = ({ onLogout }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <Car size={28} color="#10b981" />
        <span>ShareRides</span>
      </div>
      
      <div style={{ flex: 1 }}>
        <a href="/" className="nav-link">
          <LayoutDashboard size={20} /> Dashboard
        </a>
        <a href="/users" className="nav-link">
          <UsersIcon size={20} /> Users
        </a>
        <a href="/trips" className="nav-link">
          <Car size={20} /> Trips
        </a>
      </div>

      <button className="btn btn-danger" onClick={onLogout} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <LogOut size={18} /> Logout
      </button>
    </div>
  );
};

const AdminLayout = () => {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container">
      <Sidebar onLogout={handleLogout} />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  // Set auth token for axios on load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="trips" element={<Trips />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
