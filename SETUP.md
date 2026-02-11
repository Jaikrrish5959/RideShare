# ShareRides - Local Development Setup Guide

This guide will help you set up and run the carpooling application locally.

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm (comes with Node.js)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Carpooling-Website
```

### 2. Install Dependencies

Install backend dependencies:
```bash
cd carpooling-backend
npm install
```

Install frontend dependencies:
```bash
cd ../carpooling-frontend
npm install
cd ..
```

### 3. Configure PostgreSQL Database

Start PostgreSQL service:
```bash
# On Ubuntu/Debian
sudo service postgresql start

# On macOS with Homebrew
brew services start postgresql
```

Create the database:
```bash
# Connect as postgres user
sudo -u postgres psql

# In PostgreSQL shell, create database
CREATE DATABASE carpooling_db;

# Set password for postgres user (if needed)
ALTER USER postgres WITH PASSWORD 'postgres';

# Exit PostgreSQL shell
\q
```

### 4. Configure Environment Variables

Generate a secure JWT secret:
```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Or using /dev/urandom
head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64
```

Create `.env` file in the `carpooling-backend` directory:
```bash
cd carpooling-backend
# Replace <YOUR_SECURE_JWT_SECRET> with the generated secret from above
cat > .env << EOF
PORT=5000
DB_NAME=carpooling_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
JWT_SECRET=<YOUR_SECURE_JWT_SECRET>
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF
```

**Important:** Never commit the `.env` file to version control. It's already in `.gitignore`.

Create `.env` file in the `carpooling-frontend` directory:
```bash
cd ../carpooling-frontend
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000
EOF
cd ..
```

### 5. Start the Application

#### Option A: Using separate terminals

Terminal 1 - Start Backend:
```bash
cd carpooling-backend
npm start
```

Terminal 2 - Start Frontend:
```bash
cd carpooling-frontend
npm start
```

#### Option B: Using the startup script

Make the script executable and run:
```bash
chmod +x start-local.sh
./start-local.sh
```

## Access the Application

Once both servers are running:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Email Configuration (Optional)

For email functionality, you'll need to configure a Gmail account:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
3. Update `.env` in carpooling-backend:
   ```
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_16_character_app_password
   ```

**Note:** The application will work without email configuration, but email features (verification, notifications) will not function.

## Common Issues and Solutions

### Database Connection Failed
- **Issue:** `password authentication failed for user "postgres"`
- **Solution:** Make sure the password in `.env` matches your PostgreSQL password:
  ```bash
  sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
  ```

### Port Already in Use
- **Issue:** `Port 5000 or 3000 already in use`
- **Solution:** Kill the process using the port:
  ```bash
  # Find and kill process on port 5000
  lsof -ti:5000 | xargs kill -9
  # Find and kill process on port 3000
  lsof -ti:3000 | xargs kill -9
  ```

### PostgreSQL Not Running
- **Issue:** `Connection refused` to database
- **Solution:** Start PostgreSQL service:
  ```bash
  sudo service postgresql start  # Ubuntu/Debian
  brew services start postgresql  # macOS
  ```

### Frontend Build Errors
- **Issue:** Build fails with dependency errors
- **Solution:** Clear cache and reinstall:
  ```bash
  cd carpooling-frontend
  rm -rf node_modules package-lock.json
  npm install
  ```

## Development Workflow

### Backend Development
```bash
cd carpooling-backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd carpooling-frontend
npm start  # Automatically reloads on changes
```

### Building for Production

Build frontend:
```bash
cd carpooling-frontend
npm run build
```

This creates an optimized production build in the `build` directory.

## Testing the Application

### 1. Register a User
- Navigate to http://localhost:3000
- Click "Sign Up"
- Enter email and password
- Check console logs for verification token (since email may not work locally)

### 2. Verify Email (Development Workaround)
If email is not configured:
- Check backend logs for verification token
- Manually verify user in database:
  ```bash
  sudo -u postgres psql carpooling_db
  UPDATE "Users" SET "isVerified" = true WHERE email = 'your_email@example.com';
  ```

### 3. Post a Trip
- Login with verified account
- Go to "Post Trip"
- Fill in trip details
- Submit

### 4. Search for Trips
- Go to "Search Trips"
- Filter by location, date, etc.
- Request to join a trip

## Database Management

View database tables:
```bash
sudo -u postgres psql carpooling_db
\dt  # List all tables
```

View user data:
```sql
SELECT * FROM "Users";
```

View trips:
```sql
SELECT * FROM "Trips";
```

Reset database (CAUTION: Deletes all data):
```bash
sudo -u postgres psql -c "DROP DATABASE carpooling_db;"
sudo -u postgres psql -c "CREATE DATABASE carpooling_db;"
# Restart backend to recreate tables
```

## Stopping the Application

### If using separate terminals
Press `Ctrl + C` in each terminal window

### If using background processes
```bash
# Find and stop backend
pkill -f "node server.js"

# Find and stop frontend
pkill -f "react-scripts start"
```

## Additional Resources

- [API Documentation](./API_DOCUMENTATION.md)
- [Main README](./README.md)

## Support

If you encounter any issues not covered here:
1. Check the troubleshooting section
2. Review backend logs in console or `carpooling-backend/logs/`
3. Check browser console for frontend errors
4. Open an issue on GitHub with detailed error information
