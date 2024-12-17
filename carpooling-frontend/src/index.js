import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';


// Get the root element where the app will be rendered
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app component inside the root element
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

