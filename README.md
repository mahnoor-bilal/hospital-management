# MediCore — Hospital Management System

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Frontend**: HTML, CSS, Vanilla JS
- **Auth**: JWT

## Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure MongoDB is running locally on port 27017.

3. Create a `.env` file in the root directory with:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hospital_management
   JWT_SECRET=your_secret_key
   JWT_EXPIRE=7d
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

5. Open browser to `http://localhost:5000`