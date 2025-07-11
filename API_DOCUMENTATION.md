# ShareRides API Documentation

## Overview

The ShareRides API provides endpoints for managing user authentication, trips, and ride requests in a carpooling application. This RESTful API uses JSON for data exchange and JWT tokens for authentication.

**Base URL:** `http://localhost:5000/api` (Development)  
**Production URL:** `https://carpooling-website-1.onrender.com/api`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration
- JWT tokens expire after 24 hours
- Refresh tokens are not currently implemented
- Users must log in again after token expiration

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP address
- **Response:** 429 Too Many Requests when limit exceeded

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description",
  "error": "Detailed error (development only)",
  "details": "Additional context (when applicable)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /api/auth/signup

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email for verification."
}
```

**Validation Rules:**
- Email must be valid format
- Password minimum 6 characters
- Email must be unique

### POST /api/auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "John Doe",
    "phoneNumber": "1234567890"
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Email not verified

### GET /api/auth/verify-email

Verify user email address using token from email.

**Query Parameters:**
- `token` (required) - Verification token from email

**Success Response:**
```json
{
  "message": "Email verified successfully",
  "email": "user@example.com"
}
```

### POST /api/auth/resend-verification

Resend email verification.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "message": "Verification email sent successfully"
}
```

---

## User Management Endpoints

### PUT /api/user/settings
**Authentication Required**

Update user profile information.

**Request Body:**
```json
{
  "username": "John Doe",
  "phoneNumber": "1234567890"
}
```

**Success Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "John Doe",
  "phoneNumber": "1234567890"
}
```

**Validation Rules:**
- Username: 3-30 characters, letters and spaces only
- Phone number: exactly 10 digits
- Both fields are optional

### PUT /api/user/change-password
**Authentication Required**

Change user password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Success Response:**
```json
{
  "message": "Password updated successfully"
}
```

**Validation Rules:**
- Current password must be correct
- New password minimum 6 characters

---

## Trip Management Endpoints

### POST /api/trips
**Authentication Required**

Create a new trip.

**Request Body:**
```json
{
  "start_point": "New York",
  "destination": "Boston",
  "date": "2024-01-15",
  "time": "14:30",
  "seats_available": 3
}
```

**Success Response:**
```json
{
  "id": 1,
  "start_point": "New York",
  "destination": "Boston",
  "date": "2024-01-15",
  "time": "14:30",
  "seats_available": 3,
  "userId": 1,
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

**Validation Rules:**
- All fields are required
- Date format: YYYY-MM-DD
- Time format: HH:MM (24-hour)
- Seats available: non-negative integer
- User must have phone number set

### GET /api/trips
**Authentication Required**

Get all available trips with optional filtering.

**Query Parameters (optional):**
- `start_point` - Filter by starting location
- `destination` - Filter by destination
- `date` - Filter by date (YYYY-MM-DD)

**Success Response:**
```json
[
  {
    "id": 1,
    "start_point": "New York",
    "destination": "Boston",
    "date": "2024-01-15",
    "time": "14:30",
    "seats_available": 3,
    "userId": 1,
    "User": {
      "username": "John Doe",
      "email": "john@example.com"
    },
    "pendingRequestsCount": 2,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
]
```

**Features:**
- Only shows trips with available seats > 0
- Excludes trips older than 2 hours
- Includes pending requests count

### GET /api/trips/my-trips
**Authentication Required**

Get all trips for the authenticated user (both posted and participating).

**Success Response:**
```json
[
  {
    "id": 1,
    "start_point": "New York",
    "destination": "Boston",
    "date": "2024-01-15",
    "time": "14:30",
    "seats_available": 3,
    "userId": 1,
    "isOwner": true,
    "RideRequests": [
      {
        "id": 1,
        "status": "pending"
      }
    ]
  }
]
```

**Response Fields:**
- `isOwner`: true if user posted the trip, false if participating

### PUT /api/trips/:tripId
**Authentication Required**

Update an existing trip (only by trip owner).

**Request Body:**
```json
{
  "start_point": "New York",
  "destination": "Philadelphia",
  "date": "2024-01-16",
  "time": "15:00",
  "seats_available": 2
}
```

**Success Response:**
```json
{
  "message": "Trip updated successfully"
}
```

**Features:**
- Only trip owner can update
- Automatically notifies accepted riders about changes
- Same validation rules as POST /api/trips

### DELETE /api/trips/:tripId
**Authentication Required**

Delete a trip (only by trip owner).

**Success Response:**
```json
{
  "message": "Trip deleted successfully"
}
```

**Features:**
- Only trip owner can delete
- Automatically notifies all riders about cancellation
- Cascades deletion of all associated ride requests

---

## Ride Request Endpoints

### POST /api/trips/:tripId/request
**Authentication Required**

Request to join a trip.

**Request Body:**
```json
{
  "message": "I'd like to join this ride"
}
```

**Success Response:**
```json
{
  "id": 1,
  "tripId": 1,
  "requesterId": 2,
  "message": "I'd like to join this ride",
  "status": "pending",
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

**Features:**
- User must have phone number set
- Cannot request own trip
- Cannot request same trip twice
- Automatically notifies trip owner

### GET /api/trips/requests
**Authentication Required**

Get all ride requests (incoming and outgoing).

**Success Response:**
```json
{
  "incoming": [
    {
      "id": 1,
      "status": "pending",
      "message": "I'd like to join this ride",
      "Trip": {
        "start_point": "New York",
        "destination": "Boston",
        "date": "2024-01-15",
        "time": "14:30",
        "seats_available": 3,
        "userId": 1,
        "User": {
          "username": "John Doe",
          "email": "john@example.com",
          "phoneNumber": "1234567890"
        }
      },
      "requester": {
        "id": 2,
        "email": "jane@example.com",
        "username": "Jane Smith",
        "phoneNumber": "0987654321"
      }
    }
  ],
  "outgoing": [
    {
      "id": 2,
      "status": "accepted",
      "message": "Looking forward to the trip",
      "Trip": {
        "start_point": "Boston",
        "destination": "New York",
        "date": "2024-01-20",
        "time": "09:00",
        "seats_available": 2,
        "userId": 3,
        "User": {
          "username": "Bob Johnson",
          "email": "bob@example.com",
          "phoneNumber": "1122334455"
        }
      }
    }
  ]
}
```

**Features:**
- `incoming`: Requests for trips you posted
- `outgoing`: Requests you made for others' trips
- Excludes requests for trips older than 2 hours
- Phone numbers visible only for accepted requests

### GET /api/trips/requests/pending-count
**Authentication Required**

Get count of pending incoming ride requests.

**Success Response:**
```json
{
  "count": 3
}
```

**Features:**
- Used for notification badges
- Only counts pending requests for current trips
- Excludes expired trips

### PUT /api/trips/requests/:requestId
**Authentication Required**

Accept or reject a ride request (only by trip owner).

**Request Body:**
```json
{
  "status": "accepted"
}
```

**Valid Status Values:**
- `accepted`
- `rejected`

**Success Response:**
```json
{
  "message": "Request updated successfully",
  "request": {
    "id": 1,
    "status": "accepted",
    "tripId": 1,
    "requesterId": 2
  }
}
```

**Features:**
- Only trip owner can update requests
- Automatically decreases available seats when accepting
- Auto-rejects other pending requests when no seats left
- Sends email notifications to requester
- Uses database transactions for consistency

---

## Data Models

### User Model
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "John Doe",
  "phoneNumber": "1234567890",
  "isVerified": true,
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

### Trip Model
```json
{
  "id": 1,
  "start_point": "New York",
  "destination": "Boston",
  "date": "2024-01-15",
  "time": "14:30",
  "seats_available": 3,
  "userId": 1,
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

### RideRequest Model
```json
{
  "id": 1,
  "tripId": 1,
  "requesterId": 2,
  "status": "pending",
  "message": "I'd like to join this ride",
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-10T10:00:00.000Z"
}
```

---

## Email Notifications

The API automatically sends email notifications for:

1. **User Registration** - Email verification link
2. **New Ride Request** - Notifies trip owner
3. **Request Status Change** - Notifies requester (accepted/rejected)
4. **Trip Updates** - Notifies accepted riders about changes
5. **Trip Cancellation** - Notifies all riders when trip is deleted

### Email Configuration
- SMTP server: Gmail (smtp.gmail.com)
- Port: 587 (TLS)
- Rate limiting: 10 emails per minute
- Email queue system for reliability

---

## Database Schema

### Relationships
- User has many Trips (one-to-many)
- Trip has many RideRequests (one-to-many)
- User has many RideRequests as requester (one-to-many)
- RideRequest belongs to Trip and User (many-to-one)

### Indexes
- Primary keys on all tables
- Unique constraint on User.email
- Foreign key constraints with proper cascading

---

## Environment Variables

Required environment variables:

```env
# Database
DB_HOST=localhost
DB_NAME=carpooling_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your_jwt_secret_key

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# URLs
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## Testing

### Manual Testing
Use tools like Postman or curl to test endpoints:

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create trip (replace TOKEN with actual JWT)
curl -X POST http://localhost:5000/api/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"start_point":"New York","destination":"Boston","date":"2024-01-15","time":"14:30","seats_available":3}'
```

### Error Testing
Common test scenarios:
- Invalid authentication tokens
- Missing required fields
- Invalid data formats
- Permission violations
- Database constraint violations

---

## Security Considerations

1. **Authentication**: JWT tokens with expiration
2. **Authorization**: Role-based access control
3. **Input Validation**: Server-side validation for all inputs
4. **Rate Limiting**: Prevents abuse and DOS attacks
5. **SQL Injection Prevention**: Using parameterized queries via Sequelize ORM
6. **CORS Configuration**: Restricted to allowed origins
7. **Password Security**: Bcrypt hashing with salt
8. **Email Security**: App passwords for Gmail SMTP

---

## API Versioning

Currently using version 1.0.0. Future versions will:
- Maintain backward compatibility when possible
- Use URL versioning: `/api/v2/`
- Provide migration guides for breaking changes

---

## Support

For API support:
1. Check this documentation first
2. Review error messages and HTTP status codes
3. Check server logs for detailed error information
4. Verify authentication tokens are valid and not expired

---

## Changelog

### Version 1.0.0
- Initial API release
- User authentication and management
- Trip creation and management
- Ride request system
- Email notification system
- Rate limiting and security features
