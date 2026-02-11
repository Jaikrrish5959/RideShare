# ShareRides - Carpooling Website

A full-stack carpooling web application that allows users to post trips, search for rides, and manage ride requests. Built with React.js frontend and Node.js/Express backend.

## Features

### 🚗 Core Functionality
- **User Authentication**: Secure registration and login with email verification
- **Trip Management**: Post, edit, and delete trips with detailed information
- **Ride Requests**: Request to join trips and manage incoming/outgoing requests
- **Real-time Notifications**: Email notifications for ride requests and trip updates
- **Search & Filter**: Find trips by location, date, and availability

### 🎨 User Experience
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Mobile-friendly interface using Bootstrap
- **Real-time Updates**: Live notification badges and automatic data refresh
- **User Profile Management**: Update personal information and change passwords

### 🔒 Security & Reliability
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Server-side validation and sanitization
- **Rate Limiting**: API protection against abuse
- **Email Verification**: Secure account verification process
- **Database Transactions**: Consistent data operations

## Tech Stack

### Frontend
- **React.js** - User interface framework
- **React Router** - Client-side routing
- **Bootstrap** - CSS framework for responsive design
- **Axios** - HTTP client for API requests with response caching
- **React Context** - State management for themes and user data
- **localStorage/sessionStorage** - Client-side data caching and persistence

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **PostgreSQL** - Database management system
- **Sequelize ORM** - Database object-relational mapping
- **JWT** - JSON Web Token for authentication
- **Bcrypt** - Password hashing
- **Nodemailer** - Email service integration
- **In-Memory Cache** - High-performance request and data caching

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart
- **dotenv** - Environment variable management
- **Winston** - Comprehensive logging with caching metrics

### Performance & Caching
- **Multi-layer Caching** - Frontend request caching, backend memory cache, and persistent storage
- **Cache Invalidation** - Smart cache clearing on data mutations
- **Performance Monitoring** - Request timing and cache hit rate tracking
- **Memory Management** - Automatic cache cleanup and memory optimization

## Quick Start

> 📖 **For detailed local development setup instructions, see [SETUP.md](./SETUP.md)**
> 
> 🛠️ **For a list of issues fixed and solutions, see [FIXES.md](./FIXES.md)**

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- Gmail account for email service

### Installation

1. **Clone the repository**
    ```bash
    git clone <repository-url>
    cd carpooling-website-testing-server
    ```

2. **Install dependencies**
    ```bash
    # Install backend dependencies
    npm install

    # Install frontend dependencies
    cd carpooling-frontend
    npm install
    cd ..
    ```

3. **Set up environment variables**

Create `.env` file in the backend root:
    ```env
    # Database Configuration
    DB_HOST=localhost
    DB_NAME=carpooling_db
    DB_USER=your_username
    DB_PASSWORD=your_password

    # JWT Secret
    JWT_SECRET=your_jwt_secret_key

    # Email Configuration
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_app_password

    # Frontend URL
    FRONTEND_URL=http://localhost:3000

    # Environment
    NODE_ENV=development
    ```

Create `.env` file in the frontend directory:
    ```env
    REACT_APP_API_URL=http://localhost:5000
    ```

4. **Set up the database**
    ```bash
    # Create PostgreSQL database
    createdb carpooling_db

    # Run the application (will auto-create tables)
    npm start
    ```

5. **Start the application**

    **Option A: Using the startup script (Recommended)**
    ```bash
    # From the root directory
    ./start-local.sh
    ```
    
    **Option B: Manual startup**
    ```bash
    # Start backend server (from root directory)
    cd carpooling-backend
    npm start

    # Start frontend server (in new terminal)
    cd carpooling-frontend
    npm start
    ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Documentation

Comprehensive API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Quick API Overview
- **Authentication**: `/api/auth/*` - Register, login, verify email
- **User Management**: `/api/user/*` - Profile settings, password changes
- **Trip Management**: `/api/trips/*` - CRUD operations for trips
- **Ride Requests**: `/api/trips/requests/*` - Manage ride requests

## Project Structure

```
carpooling-website-testing-server/
├── carpooling-backend/
│   ├── config/
│   │   └── db.config.js          # Database configuration
│   ├── middleware/
│   │   ├── auth.js               # Authentication middleware
│   │   └── tripValidation.js     # Trip validation rules
│   ├── models/
│   │   ├── user.model.js         # User database model
│   │   ├── trip.model.js         # Trip database model
│   │   └── rideRequest.model.js  # Ride request model
│   ├── routes/
│   │   ├── auth.routes.js        # Authentication routes
│   │   ├── user.routes.js        # User management routes
│   │   └── trip.routes.js        # Trip and ride request routes
│   ├── services/
│   │   └── email.service.js      # Email notification service
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server startup file
├── carpooling-frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── contexts/            # React context providers
│   │   ├── services/            # API service files
│   │   ├── App.js               # Main app component
│   │   └── index.js             # React entry point
│   └── package.json
├── API_DOCUMENTATION.md          # Detailed API documentation
└── README.md                     # This file
```

## Usage Guide

### Getting Started
1. **Register**: Create an account with email verification
2. **Set Profile**: Add your name and phone number in settings
3. **Post Trip**: Create a trip with start point, destination, date, and time
4. **Search Trips**: Find available trips using filters
5. **Request Rides**: Join trips by sending requests to drivers
6. **Manage Requests**: Accept or reject incoming ride requests

### Key Features

#### Trip Management
- Post trips with detailed information
- Edit trip details (notifies participants)
- Delete trips (notifies all participants)
- View trip history

#### Ride Requests
- Request to join specific trips
- Real-time notification badges
- Accept/reject incoming requests
- Automatic seat management

#### User Settings
- Update profile information
- Change password securely
- Phone number requirement for safety

## Environment Setup

### Development
```bash
# Backend
cd carpooling-backend
npm run dev

# Frontend
cd carpooling-frontend
npm start
```

### Production
```bash
# Build frontend
cd carpooling-frontend
npm run build

# Start backend
cd carpooling-backend
npm start
```

## Database Schema

### Users Table
- id, email, username, phoneNumber
- password (hashed), isVerified
- verificationToken, verificationTokenExpires

### Trips Table
- id, start_point, destination, date, time
- seats_available, userId (foreign key)

### RideRequests Table
- id, tripId (foreign key), requesterId (foreign key)
- status (pending/accepted/rejected), message

## Security Features

- **Password Security**: Bcrypt hashing with salt
- **JWT Authentication**: Secure token-based sessions
- **Input Validation**: Server-side validation and sanitization
- **Rate Limiting**: API protection (100 requests per 15 minutes)
- **Email Verification**: Prevents unauthorized account creation
- **CORS Protection**: Restricted cross-origin requests

## Deployment

### Backend (Node.js)
1. Set production environment variables
2. Configure PostgreSQL database
3. Set up email service (Gmail App Password)
4. Deploy to your preferred platform (Heroku, Railway, etc.)

### Frontend (React)
1. Update API URL in environment variables
2. Build the application: `npm run build`
3. Deploy to static hosting (Netlify, Vercel, etc.)

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_NAME=your_production_db_name
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_strong_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=https://your-frontend-domain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines
- Follow existing code style and conventions
- Add proper error handling and validation
- Include comments for complex logic
- Test thoroughly before submitting

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify PostgreSQL is running
- Check database credentials in .env file
- Ensure database exists

**Email Service Issues**
- Use Gmail App Password (not regular password)
- Enable 2-factor authentication on Gmail
- Check email service configuration

**Frontend API Issues**
- Verify backend server is running
- Check API URL in frontend .env file
- Verify CORS configuration

**Authentication Issues**
- Check JWT secret consistency
- Verify token expiration (24 hours)
- Clear browser localStorage if needed

### Logs and Debugging
- Backend logs: Check console output
- Frontend logs: Check browser developer tools
- Database logs: Check PostgreSQL logs
- Email logs: Check email service configuration

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
1. Check the API documentation
2. Review the troubleshooting section
3. Check existing issues in the repository
4. Create a new issue with detailed information

## Roadmap

### Upcoming Features
- Real-time chat between drivers and passengers
- Trip rating and review system
- Payment integration
- Mobile app development
- Advanced search filters (price, car type, etc.)
- Social features (friend connections)

### Performance Improvements
- Caching for frequently accessed data
- Database query optimization
- Image upload for user profiles
- Push notifications for mobile