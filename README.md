# College Carpooling Application

A modern web application that helps college students coordinate carpooling, making transportation more efficient, economical, and environmentally friendly.

## Features

- User authentication with email verification
- Profile management with phone number verification
- Post and manage trips
- Search available rides
- Real-time ride request system
- Email notifications
- Mobile-responsive design
- User dashboard
- Trip management system
- Ride request handling

## Tech Stack

### Frontend
- React.js
- React Bootstrap for UI components
- React Router DOM for navigation
- Axios for API calls
- React Select for enhanced select inputs
- React Spring for animations

### Backend
- Node.js
- Express.js
- MySQL with Sequelize ORM
- JWT Authentication
- Nodemailer for email notifications
- Express Rate Limiting
- Express Validator

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MySQL database
- SMTP server access for email notifications

## Installation

1. Clone the repository: 
    bash
    git clone [repository-url]
    cd college-carpooling

2. Install frontend dependencies:
    bash
    cd carpooling-frontend
    npm install

3. Install backend dependencies:
    bash
    cd carpooling-backend
    npm install


## Running the Application

1. Start the backend server:
    bash
    cd carpooling-backend
    npm start

2. Start the frontend server:
    bash
    cd carpooling-frontend
    npm start


## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register a new user
- POST `/api/auth/login` - User login
- POST `/api/auth/verify-email` - Verify email address

### Trips
- GET `/api/trips` - Get all available trips
- POST `/api/trips` - Create a new trip
- PUT `/api/trips/:id` - Update a trip
- DELETE `/api/trips/:id` - Delete a trip

### Ride Requests
- POST `/api/trips/:id/request` - Request a ride
- PUT `/api/trips/requests/:id` - Update request status
- GET `/api/trips/requests/pending-count` - Get pending requests count

### User
- PUT `/api/user/profile` - Update user profile
- PUT `/api/user/change-password` - Change password

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React Bootstrap for UI components
- Sequelize ORM for database management
- JWT for authentication