// src/components/Navigation.js
import React, { useState } from 'react';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Navigation.css';

const Navigation = ({ isAuthenticated, onLogout, user, incomingRequestsCount }) => {
  const [expanded, setExpanded] = useState(false);

  const closeMenu = () => setExpanded(false);

  if (!isAuthenticated) {
    return null;
  }

  console.log('Current incomingRequestsCount:', incomingRequestsCount);

  return (
    <Navbar 
      className="modern-navbar" 
      expand="lg" 
      fixed="top"
      expanded={expanded}
      onToggle={setExpanded}
    >
      <Container fluid>
        <Navbar.Brand as={Link} to="/" onClick={closeMenu}>Carpooling</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-nav" />
        <Navbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/search" onClick={closeMenu}>Search Trips</Nav.Link>
            <Nav.Link as={Link} to="/post-trip" onClick={closeMenu}>Post Trip</Nav.Link>
            <Nav.Link as={Link} to="/ride-requests" onClick={closeMenu} className="position-relative">
              Ride Requests
              {incomingRequestsCount > 0 && (
                <span className="notification-badge">{incomingRequestsCount}</span>
              )}
            </Nav.Link>
            <Nav.Link as={Link} to="/my-trips" onClick={closeMenu}>My Trips</Nav.Link>
          </Nav>
          
          <div className="user-info-mobile d-lg-none">
            <Nav.Link as={Link} to="/settings" onClick={closeMenu}>Settings</Nav.Link>
            <div className="px-3 py-2">
              <small className="text-muted d-block">{user?.username || 'No username set'}</small>
              <small className="text-muted d-block">{user?.phoneNumber || 'No phone set'}</small>
            </div>
            <Button variant="outline-danger" size="sm" onClick={onLogout} className="w-100">
              Logout
            </Button>
          </div>
          
          <div className="d-none d-lg-flex align-items-center">
            <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
            <div className="ms-3 me-3">
              <div className="text-end">
                <small className="d-block">{user?.username || 'No username set'}</small>
                <small className="text-muted">{user?.phoneNumber || 'No phone set'}</small>
              </div>
            </div>
            <Button variant="outline-danger" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;
