import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Form, Modal, Badge } from 'react-bootstrap';
import axios from '../services/axiosConfig';
import './MyTrips.css';

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    start_point: '',
    destination: '',
    date: '',
    time: '',
    seats_available: ''
  });

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/trips/my-trips', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrips(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to fetch your trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData({
      start_point: trip.start_point,
      destination: trip.destination,
      date: trip.date,
      time: trip.time,
      seats_available: trip.seats_available
    });
    setShowEditModal(true);
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip? All ride requests will be cancelled.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Trip deleted successfully');
      fetchTrips(); // Refresh the list
    } catch (error) {
      console.error('Error deleting trip:', error);
      setError(error.response?.data?.message || 'Failed to delete trip');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      const token = localStorage.getItem('token');
      
      // Format time to HH:MM (remove seconds if present)
      const formatTime = (timeStr) => {
        // If time includes seconds, remove them
        if (timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':');
          return `${hours}:${minutes}`;
        }
        return timeStr;
      };
      
      // Prepare the data with formatted time
      const updatedFormData = {
        ...formData,
        seats_available: parseInt(formData.seats_available, 10),
        time: formatTime(formData.time)
      };
      
      console.log('Sending update with data:', updatedFormData);
      
      await axios.put(`/api/trips/${editingTrip.id}`, updatedFormData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setSuccess('Trip updated successfully');
      setShowEditModal(false);
      fetchTrips(); // Refresh the list
    } catch (error) {
      console.error('Error updating trip:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg ||
                          'Failed to update trip';
      setError(errorMessage);
      console.log('Full error response:', error.response?.data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Ensure seats_available is not negative
    if (name === 'seats_available' && value < 0) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isPastTrip = (trip) => {
    try {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
      const tripDateTime = new Date(`${trip.date}T${trip.time}`);
      return tripDateTime < twoHoursAgo;
    } catch (error) {
      console.error('Error checking if trip is past:', error);
      return false;
    }
  };

  const renderTrips = () => {
    if (loading) return <div className="loading-container">Loading...</div>;
    if (error) return <Alert variant="danger" className="modern-alert">{error}</Alert>;
    if (!trips.length) return <Alert variant="info" className="modern-alert">No trips found</Alert>;

    return trips.map(trip => {
      const isPast = isPastTrip(trip);
      const pendingRequests = trip.RideRequests?.filter(r => r.status === 'pending').length || 0;
      
      return (
        <Card key={trip.id} className="trip-card modern-card">
          <div className="trip-header">
            <div className="d-flex justify-content-between align-items-start">
              <h5 className="trip-title">{trip.start_point} → {trip.destination}</h5>
              {trip.isOwner ? (
                <Badge className="trip-badge owner-badge">Your Trip</Badge>
              ) : (
                <Badge className="trip-badge participant-badge">Participating</Badge>
              )}
            </div>
          </div>
          <div className="trip-content">
            <div className="trip-info-grid">
              <div className="trip-info-item">
                <span className="trip-info-label">Date:</span>
                <span className="trip-info-value">{trip.date}</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">Time:</span>
                <span className="trip-info-value">{trip.time}</span>
              </div>
              <div className="trip-info-item">
                <span className="trip-info-label">Available Seats:</span>
                <span className="trip-info-value">{trip.seats_available}</span>
              </div>
              {trip.isOwner && (
                <div className="trip-info-item">
                  <span className="trip-info-label">Pending Requests:</span>
                  <span className="trip-info-value queue-count">{pendingRequests}</span>
                </div>
              )}
            </div>
            
            {!isPast && trip.isOwner && (
              <div className="trip-actions">
                <Button 
                  className="action-button edit-button"
                  onClick={() => handleEdit(trip)}
                >
                  Edit
                </Button>
                <Button 
                  className="action-button delete-button"
                  onClick={() => handleDelete(trip.id)}
                >
                  Delete
                </Button>
              </div>
            )}
            {isPast && (
              <div className="trip-status">
                <Badge className="trip-badge past-badge">Past Trip</Badge>
              </div>
            )}
          </div>
        </Card>
      );
    });
  };

  if (loading) return <Container className="mt-4"><div className="loading-container">Loading...</div></Container>;

  return (
    <Container className="mt-4 my-trips-container">
      <div className="page-header">
        <h2 className="page-title">My Trips</h2>
        <p className="page-subtitle">
          Shows both trips you've posted and trips you're participating in
        </p>
      </div>
      
      {error && <Alert variant="danger" className="modern-alert">{error}</Alert>}
      {success && <Alert variant="success" className="modern-alert">{success}</Alert>}

      <div className="trips-grid">
        {trips.length === 0 ? (
          <Alert variant="info" className="modern-alert">You haven't posted or joined any trips yet</Alert>
        ) : (
          renderTrips()
        )}
      </div>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} className="edit-modal">
        <Modal.Header closeButton className="modal-header-modern">
          <Modal.Title>Edit Trip</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-modern">
          <Form onSubmit={handleUpdate} className="edit-form">
            <div className="form-floating">
              <Form.Label>Start Point</Form.Label>
              <Form.Control
                type="text"
                name="start_point"
                value={formData.start_point}
                onChange={handleInputChange}
                className="modern-input"
                required
              />
            </div>

            <div className="form-floating">
              <Form.Label>Destination</Form.Label>
              <Form.Control
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                className="modern-input"
                required
              />
            </div>

            <div className="form-floating">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="modern-input"
                required
              />
            </div>

            <div className="form-floating">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="modern-input"
                required
              />
              <Form.Text className="text-muted">
                24-hour format (HH:MM)
              </Form.Text>
            </div>

            <div className="form-floating">
              <Form.Label>Available Seats</Form.Label>
              <Form.Control
                type="number"
                name="seats_available"
                value={formData.seats_available}
                onChange={handleInputChange}
                className="modern-input"
                min="0"
                required
              />
            </div>

            <Button variant="primary" type="submit" className="submit-button">
              Update Trip
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MyTrips;