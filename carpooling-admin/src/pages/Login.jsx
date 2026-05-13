import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Car } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.user.role !== 'admin') {
        setError('Access denied: Admin privileges required.');
        return;
      }

      localStorage.setItem('adminToken', response.data.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', marginBottom: '16px' }}>
            <Car size={40} color="#10b981" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Admin Mission Control</h1>
          <p style={{ color: 'var(--c-text-500)', marginTop: '8px' }}>Sign in to manage ShareRides</p>
        </div>

        {error && (
          <div style={{ padding: '12px', background: 'var(--c-danger-bg)', color: 'var(--c-danger)', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input 
              type="email" 
              className="form-control" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sharerides.com"
              required 
            />
          </div>
          <div className="form-group" style={{ marginBottom: '32px' }}>
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
