import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Car, MapPin, ShieldAlert } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    activeTrips: 0,
    pendingVerifications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/admin/stats');
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--c-text-500)' }}>Loading Mission Control Data...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Real-time metrics for ShareRides platform</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Users</span>
            <Users className="stat-card-icon" size={24} />
          </div>
          <div className="stat-card-value">{stats.totalUsers}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Total Trips</span>
            <MapPin className="stat-card-icon" size={24} />
          </div>
          <div className="stat-card-value">{stats.totalTrips}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Active Trips</span>
            <Car className="stat-card-icon" size={24} />
          </div>
          <div className="stat-card-value">{stats.activeTrips}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-title">Pending Verifications</span>
            <ShieldAlert className="stat-card-icon" size={24} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }} />
          </div>
          <div className="stat-card-value">{stats.pendingVerifications}</div>
        </div>
      </div>

      <div className="card">
        <h3>System Health</h3>
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--c-success)' }}></div>
            <span style={{ color: 'var(--c-text-500)' }}>API Server Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--c-success)' }}></div>
            <span style={{ color: 'var(--c-text-500)' }}>Database Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
