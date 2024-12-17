// src/components/Navigation.js
import React from 'react';
import { Navbar, Nav, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ isAuthenticated, onLogout, user, incomingRequestsCount }) => {
  if (!isAuthenticated) {
    return null;
  }

  console.log('Current incomingRequestsCount:', incomingRequestsCount);

  return (
    <Navbar className="modern-navbar" expand="lg" fixed="top">
      <Navbar.Brand as={Link} to="/">Carpooling Website</Navbar.Brand>
      <Navbar.Toggle aria-controls="navbar-nav" />
      <Navbar.Collapse id="navbar-nav">
        <Nav className="me-auto">
          {isAuthenticated && (
            <>
              <Nav.Link as={Link} to="/search">Search Trips</Nav.Link>
              <Nav.Link as={Link} to="/post-trip">Post Trip</Nav.Link>
              <Nav.Item className="position-relative">
                <Nav.Link as={Link} to="/ride-requests">
                  Ride Requests
                  {incomingRequestsCount > 0 && (
                    <span 
                      className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
                      style={{ 
                        width: '10px',
                        height: '10px',
                        marginTop: '2px',
                        zIndex: 1000
                      }}
                    >
                      <span className="visually-hidden">New alerts</span>
                    </span>
                  )}
                </Nav.Link>
              </Nav.Item>
              <Nav.Link as={Link} to="/my-trips">My Trips</Nav.Link>
            </>
          )}
        </Nav>
        <Nav className="align-items-center">
          {user && (
            <>
              <Nav.Link as={Link} to="/settings" className="me-3">Settings</Nav.Link>
              <div className="d-flex align-items-center me-3">
                <div className="text-secondary d-flex flex-column align-items-end">
                  <span className="fw-bold" style={{ fontSize: '0.9rem' }}>
                    {user.username || 'No username set'}
                  </span>
                  <span style={{ fontSize: '0.8rem' }}>
                    {user.phoneNumber ? 
                      user.phoneNumber.replace(/(\d{5})(\d{5})/, '$1 $2') : 
                      'No phone set'
                    }
                  </span>
                </div>
                <div className="border-start ms-3 ps-3">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={onLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </>
          )}
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
};

export default Navigation;
