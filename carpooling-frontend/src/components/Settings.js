import React, { useState, useEffect } from 'react';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from '../services/axiosConfig';

const Settings = ({ user, onUserUpdate }) => {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load current settings from props instead of localStorage
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]); // Depend on user prop instead of localStorage

  useEffect(() => {
    // Show message if user was redirected here due to missing phone number
    if (!user?.phoneNumber) {
      setError('Please set your phone number to continue using the app');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      console.log('Sending settings update:', { username, phoneNumber });
      
      const response = await axios.put('/api/user/settings', 
        { username, phoneNumber },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Settings update response:', response.data);

      // Update the global user state through the parent component
      if (typeof onUserUpdate === 'function') {
        onUserUpdate(response.data);
      }

      setSuccess('Settings updated successfully!');
    } catch (error) {
      console.error('Settings update error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/user/change-password', 
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPasswordSuccess('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <Container className="mt-4">
      <h2>Settings</h2>
      {!user?.phoneNumber && (
        <Alert variant="warning">
          Welcome! Please set your phone number to start using our service.
          This is required for safety and communication purposes.
        </Alert>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
          />
          <Form.Text className="text-muted">
            This name will be displayed to other users
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3" controlId="phoneNumber">
          <Form.Label>Phone Number</Form.Label>
          <Form.Control
            type="tel"
            placeholder="Enter 10-digit phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            pattern="[0-9]{10}"
          />
          <Form.Text className="text-muted">
            Enter a 10-digit phone number
          </Form.Text>
        </Form.Group>

        <Button 
          variant="primary" 
          type="submit"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </Form>

      <hr className="my-4" />
      
      <h3>Change Password</h3>
      {passwordError && <Alert variant="danger">{passwordError}</Alert>}
      {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}
      
      <Form onSubmit={handlePasswordChange}>
        <Form.Group className="mb-3">
          <Form.Label>Current Password</Form.Label>
          <Form.Control
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({
              ...prev,
              currentPassword: e.target.value
            }))}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({
              ...prev,
              newPassword: e.target.value
            }))}
            required
          />
          <Form.Text className="text-muted">
            Password must be at least 6 characters long
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Confirm New Password</Form.Label>
          <Form.Control
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({
              ...prev,
              confirmPassword: e.target.value
            }))}
            required
          />
        </Form.Group>

        <Button variant="primary" type="submit">
          Change Password
        </Button>
      </Form>
    </Container>
  );
};

export default Settings; 