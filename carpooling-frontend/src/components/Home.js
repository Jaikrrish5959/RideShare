// src/components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="welcome-text">
        <h2>Welcome to ShareRides!</h2>
        <p>What would you like to do today?</p>
        <div className="cta-buttons">
          <Link to="/search" className="btn btn-primary">Search for Trips</Link>
          <Link to="/post-trip" className="btn btn-secondary">Post a Trip</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
