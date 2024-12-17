import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Form, Modal, Badge } from 'react-bootstrap';
import axios from '../services/axiosConfig';

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
    if (loading) return <div>Loading...</div>;
    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!trips.length) return <Alert variant="info">No trips found</Alert>;

    return trips.map(trip => {
      const isPast = isPastTrip(trip);
      const pendingRequests = trip.RideRequests?.filter(r => r.status === 'pending').length || 0;
      
      return (
        <Card key={trip.id} className="mb-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-start">
              <Card.Title>{trip.start_point} → {trip.destination}</Card.Title>
              {trip.isOwner ? (
                <Badge bg="primary">Your Trip</Badge>
              ) : (
                <Badge bg="info">Participating</Badge>
              )}
            </div>
            <Card.Text>
              Date: {trip.date}<br />
              Time: {trip.time}<br />
              Available Seats: {trip.seats_available}<br />
              {trip.isOwner && `Pending Requests: ${pendingRequests}`}
            </Card.Text>
            {!isPast && trip.isOwner && ( // Only show action buttons for non-past trips that user owns
              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  onClick={() => handleEdit(trip)}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  onClick={() => handleDelete(trip.id)}
                >
                  Delete
                </Button>
              </div>
            )}
            {isPast && (
              <Badge bg="secondary">Past Trip</Badge>
            )}
          </Card.Body>
        </Card>
      );
    });
  };

  if (loading) return <Container className="mt-4"><div>Loading...</div></Container>;

  return (
    <Container className="mt-4">
      <h2>My Trips</h2>
      <p className="text-muted">
        Shows both trips you've posted and trips you're participating in
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {trips.length === 0 ? (
        <Alert variant="info">You haven't posted or joined any trips yet</Alert>
      ) : (
        renderTrips()
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Trip</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleUpdate}>
            <Form.Group className="mb-3">
              <Form.Label>Start Point</Form.Label>
              <Form.Control
                type="text"
                name="start_point"
                value={formData.start_point}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Destination</Form.Label>
              <Form.Control
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Time</Form.Label>
              <Form.Control
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
              <Form.Text className="text-muted">
                24-hour format (HH:MM)
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Available Seats</Form.Label>
              <Form.Control
                type="number"
                name="seats_available"
                value={formData.seats_available}
                onChange={handleInputChange}
                min="0"
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Update Trip
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default MyTrips; 