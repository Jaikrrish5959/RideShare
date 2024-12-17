import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Container, Alert, Button } from 'react-bootstrap';
import authService from '../services/authService';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent duplicate verification attempts
      if (verificationAttempted.current) {
        return;
      }
      verificationAttempted.current = true;

      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setError('No verification token found');
        return;
      }

      try {
        console.log('Attempting to verify with token:', token);
        const response = await authService.verifyEmail(token);
        console.log('Verification response:', response);
        setStatus('success');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setError(error.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleNavigate = () => {
    navigate('/login');
  };

  return (
    <Container className="mt-5">
      {status === 'verifying' && (
        <Alert variant="info">
          Verifying your email address...
        </Alert>
      )}

      {status === 'success' && (
        <Alert variant="success">
          Your email has been verified successfully!
          <div className="mt-3">
            <Button variant="primary" onClick={handleNavigate}>
              Proceed to Login
            </Button>
          </div>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="danger">
          {error === 'Invalid or expired verification token' ? (
            <>
              This verification link has already been used or has expired.
              <div className="mt-3">
                <Button variant="primary" onClick={handleNavigate}>
                  Go to Login
                </Button>
              </div>
            </>
          ) : (
            error
          )}
        </Alert>
      )}
    </Container>
  );
};

export default EmailVerification; 