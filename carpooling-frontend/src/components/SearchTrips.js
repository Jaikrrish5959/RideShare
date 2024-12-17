import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Alert, Form } from 'react-bootstrap';
import axios from '../services/axiosConfig';
import './SearchTrips.css';
import LoadingSpinner from './LoadingSpinner';

const SearchTrips = () => {
  const [requestLoading, setRequestLoading] = useState({});
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const fetchTrips = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Please log in to view trips');
          return;
        }
        
        const response = await axios.get('/api/trips', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (mounted) {
          const currentTrips = filterCurrentTrips(response.data);
          setTrips(currentTrips);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error fetching trips:', error);
          setError(error.response?.data?.message || 'Failed to fetch trips');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchTrips();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRequestRide = async (tripId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.phoneNumber) {
        alert('Please set your phone number in settings before requesting rides');
        return;
      }

      setRequestLoading(prev => ({ ...prev, [tripId]: true }));
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please log in to request a ride');
        return;
      }

      await axios.post(`/api/trips/${tripId}/request`, 
        { message: "I'd like to join this ride" },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      alert('Ride request sent successfully!');
    } catch (error) {
      console.error('Error requesting ride:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.message || 'Failed to request ride');
      } else if (error.response?.status === 401) {
        alert('Please log in to request a ride');
      } else {
        alert('An error occurred. Please try again later.');
      }
    } finally {
      setRequestLoading(prev => ({ ...prev, [tripId]: false }));
    }
  };

  const filterCurrentTrips = (trips) => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - (2 * 60 * 60 * 1000));
    
    return trips.filter(trip => {
      try {
        const tripDateTime = new Date(`${trip.date}T${trip.time}`);
        return !isNaN(tripDateTime.getTime()) && tripDateTime > twoHoursAgo;
      } catch (error) {
        console.error('Error filtering trip:', error, trip);
        return false;
      }
    });
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Please log in to search trips');
        return;
      }

      const params = {};
      if (startPoint) params.start_point = startPoint;
      if (destination) params.destination = destination;
      if (date) params.date = date;

      const response = await axios.get('/api/trips', {
        params,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const currentTrips = filterCurrentTrips(response.data);
      setTrips(currentTrips);
    } catch (error) {
      console.error('Error searching trips:', error);
      setError(error.response?.data?.message || 'Failed to search trips');
    } finally {
      setLoading(false);
    }
  };

  const renderTripCard = (trip) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnTrip = trip.userId === user.id;
    const hasPhoneNumber = !!user.phoneNumber;

    return (
      <Card key={trip.id} className="mb-3 trip-card">
        <div className="trip-header">
          <h5>{trip.start_point} → {trip.destination}</h5>
        </div>
        <div className="trip-content">
          <Card.Text>
            Date: {trip.date}<br />
            Time: {trip.time}<br />
            Posted by: {isOwnTrip ? 'You' : (trip.User?.username || 'Unknown')}<br />
            Available Seats: {trip.seats_available}
          </Card.Text>
          <Button
            variant="primary"
            onClick={() => handleRequestRide(trip.id)}
            disabled={
              requestLoading[trip.id] || 
              trip.seats_available < 1 || 
              isOwnTrip || 
              !hasPhoneNumber
            }
          >
            {requestLoading[trip.id] ? 'Requesting...' : 
             isOwnTrip ? 'Your Trip' :
             !hasPhoneNumber ? 'Set Phone Number First' :
             trip.seats_available < 1 ? 'No Seats Available' : 
             'Request Ride'}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <Container className="mt-4">
      <h2>Available Trips</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form className="search-form">
        <Form.Group className="search-input">
          <Form.Label>Start Point</Form.Label>
          <Form.Control
            className="modern-input"
            type="text"
            placeholder="Enter start point"
            value={startPoint}
            onChange={(e) => setStartPoint(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="search-input">
          <Form.Label>Destination</Form.Label>
          <Form.Control
            className="modern-input"
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="search-input">
          <Form.Label>Date</Form.Label>
          <Form.Control
            className="modern-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Form.Group>

        <Button className="search-button" onClick={handleSearch}>
          Search
        </Button>
      </Form>

      {loading ? (
        <LoadingSpinner />
      ) : trips.length > 0 ? (
        trips.map(trip => renderTripCard(trip))
      ) : (
        <Alert variant="info">No trips found matching your criteria</Alert>
      )}
    </Container>
  );
};

export default SearchTrips;
