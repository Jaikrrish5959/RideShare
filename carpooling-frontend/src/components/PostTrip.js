// src/components/PostTrip.js
import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import './PostTrip.css'; // Import the PostTrip CSS styles
import axios from '../services/axiosConfig';
import { Link } from 'react-router-dom';


const PostTrip = ({ user }) => {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seatsAvailable, setSeatsAvailable] = useState(1);
  const [error, setError] = useState('');

  if (!user?.phoneNumber) {
    return (
      <div className="post-trip-container">
        <Alert variant="warning">
          Please set your phone number in the settings before posting a trip.
          <br />
          <Link to="/settings" className="btn btn-primary mt-2">
            Go to Settings
          </Link>
        </Alert>
      </div>
    );
  }

  const handleIncrease = () => {
    setSeatsAvailable(prev => prev + 1);
  };

  const handleDecrease = () => {
    setSeatsAvailable(prev => prev > 1 ? prev - 1 : 1);
  };

  const handleSeatsChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setSeatsAvailable(value < 1 ? 1 : value > 99 ? 99 : value);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      console.log('Posting trip with token:', token ? 'Present' : 'Missing');
      
      const tripData = {
        start_point: startPoint,
        destination,
        date,
        time,
        posted_by: user.email,
        posted_by_username: user.username,
        phoneNumber: user.phoneNumber,
        seats_available: parseInt(seatsAvailable),
        userId: user.id
      };

      console.log('Posting trip data:', tripData);
      
      const response = await axios.post('/api/trips', tripData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Trip posted successfully:', response.data);
      alert('Trip posted successfully!');
      
      // Clear form
      setStartPoint('');
      setDestination('');
      setDate('');
      setTime('');
      setSeatsAvailable(1);
      setError('');
    } catch (error) {
      console.error('Error posting trip:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
        fullError: error
      });
      setError(error.response?.data?.message || 'Error posting trip');
      alert(error.response?.data?.message || 'Error posting trip');
    }
  };

  return (
    <div className="post-trip-container">
      <h2>Post a New Trip</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handlePost}>
        <div className="input-group">
          <Form.Group className="form-floating mb-3">
            <Form.Control
              className="modern-input"
              type="text"
              placeholder="Start Point"
              value={startPoint}
              onChange={(e) => setStartPoint(e.target.value)}
              required
            />
            <Form.Label>Start Point</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3">
            <Form.Control
              className="modern-input"
              type="text"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
            <Form.Label>Destination</Form.Label>
          </Form.Group>
        </div>

        <div className="input-group">
          <Form.Group className="form-floating mb-3">
            <Form.Control
              className="modern-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              placeholder="Select Date"
            />
            <Form.Label>Trip Date</Form.Label>
          </Form.Group>

          <Form.Group className="form-floating mb-3">
            <Form.Control
              className="modern-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              placeholder="Select Time"
            />
            <Form.Label>Trip Time</Form.Label>
          </Form.Group>
        </div>

        <Form.Group className="seats-field">
          <span className="seats-label">Seats Available</span>
          <div className="seats-container">
            <button 
              type="button" 
              className="seats-button decrease" 
              onClick={handleDecrease}
            >
              -
            </button>
            <Form.Control
              className="seats-input modern-input"
              type="number"
              value={seatsAvailable}
              onChange={handleSeatsChange}
              min="1"
              max="99"
              required
            />
            <button 
              type="button" 
              className="seats-button increase" 
              onClick={handleIncrease}
            >
              +
            </button>
          </div>
        </Form.Group>

        <Button type="submit" className="submit-button">
          Post Trip
        </Button>
      </Form>
    </div>
  );
};

export default PostTrip;
