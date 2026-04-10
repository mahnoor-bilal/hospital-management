const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/patients', require('./backend/routes/patients'));
app.use('/api/doctors', require('./backend/routes/doctors'));
app.use('/api/appointments', require('./backend/routes/appointments'));
app.use('/api/wards', require('./backend/routes/wards'));
app.use('/api/billing', require('./backend/routes/billing'));
app.use('/api/dashboard', require('./backend/routes/dashboard'));

// Serve frontend for any non-API route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🏥 Hospital Management System running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
