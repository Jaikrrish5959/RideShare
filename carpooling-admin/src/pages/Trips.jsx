import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Navigation, Map, Eye, Trash2 } from 'lucide-react';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await axios.get('/admin/trips');
        setTrips(response.data);
      } catch (error) {
        console.error('Failed to fetch trips:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrips();
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--c-text-500)' }}>Loading Trips...</div>;
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'scheduled':
        return <span className="badge badge-success">Scheduled</span>;
      case 'active':
        return <span className="badge badge-warning">Active</span>;
      case 'completed':
        return <span className="badge" style={{ background: 'var(--c-surface-3)', color: 'var(--c-text-900)' }}>Completed</span>;
      case 'cancelled':
        return <span className="badge" style={{ background: 'var(--c-danger-bg)', color: 'var(--c-danger)' }}>Cancelled</span>;
      default:
        return <span className="badge" style={{ background: 'var(--c-surface-3)' }}>{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Trip Monitoring</h1>
        <p>Monitor all rides across the platform</p>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Date & Time</th>
                <th>Seats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map(trip => (
                <tr key={trip.id}>
                  <td>#{trip.id.toString().substring(0, 8)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{trip.driver?.username || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--c-text-500)' }}>{trip.driver?.email}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} color="var(--c-emerald)" /> {trip.source}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <Navigation size={14} color="var(--c-text-400)" /> {trip.destination}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{new Date(trip.departureTime).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--c-text-500)' }}>{new Date(trip.departureTime).toLocaleTimeString()}</div>
                  </td>
                  <td>{trip.availableSeats} / {trip.totalSeats}</td>
                  <td>{getStatusBadge(trip.status)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn" style={{ height: '32px', width: '32px', padding: 0, background: 'var(--c-surface-2)', color: 'var(--c-text-500)' }}>
                        <Map size={16} />
                      </button>
                      <button className="btn" style={{ height: '32px', width: '32px', padding: 0, background: 'var(--c-surface-2)', color: 'var(--c-text-500)' }}>
                        <Eye size={16} />
                      </button>
                      <button className="btn" style={{ height: '32px', width: '32px', padding: 0, background: 'var(--c-danger-bg)', color: 'var(--c-danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {trips.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--c-text-500)' }}>No trips found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
