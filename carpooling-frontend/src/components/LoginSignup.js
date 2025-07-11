import React, { useState } from 'react';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Home.css';

const LoginSignup = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (!email || !password) {
        setError('Please fill in all fields');
        return;
      }

      if (isLogin) {
        const response = await authService.login(email, password);
        console.log('Login response:', response);
        if (response.user) {
          await onLogin({
            id: response.user.id,
            email: response.user.email,
            username: response.user.username,
            phoneNumber: response.user.phoneNumber
          });
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          navigate('/');
        } else {
          setError('Invalid response from server');
        }
      } else {
        await authService.signup(email, password);
        setMessage('Please check your email to verify your account.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  const handleResendVerification = async () => {
    try {
      await authService.resendVerification(email);
      setMessage('Verification email sent successfully (Check spam if not in inbox)');
    } catch (err) {
      setError(err.message || 'Failed to resend verification email');
    }
  };

  return (
    <div className="home-container">
      <div className="content-wrapper">
        <div className="welcome-text">
          <h2>Welcome to ShareRides</h2>
          <p>Find or post carpool trips easily with our service</p>
        </div>
        <div className="login-form">
          <Card style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <Card.Body>
              <h3 className="text-center mb-4">{isLogin ? 'Login' : 'Sign Up'}</h3>
              {error && <Alert variant="danger">{error}</Alert>}
              {message && <Alert variant="success">{message}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100">
                  {isLogin ? 'Login' : 'Sign Up'}
                </Button>
              </Form>
              <div className="text-center mt-3">
                <Button
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
                </Button>
                {error?.includes('verify') && (
                  <Button
                    variant="link"
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup; 