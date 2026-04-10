require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./backend/config/db');
const User = require('./backend/models/User');
const Patient = require('./backend/models/Patient');
const Doctor = require('./backend/models/Doctor');
const Ward = require('./backend/models/Ward');

async function seed() {
  await connectDB();

  await User.deleteMany({});
  await Patient.deleteMany({});
  await Doctor.deleteMany({});
  await Ward.deleteMany({});

  await User.create({ name: 'Admin User', email: 'admin@hospital.com', password: 'admin123', role: 'admin', phone: '0300-0000001' });
  await User.create({ name: 'Dr. Sarah Khan', email: 'doctor@hospital.com', password: 'doctor123', role: 'doctor', phone: '0300-0000002' });
  console.log('Users created');

  const doctors = await Doctor.insertMany([
    { name: 'Dr. Sarah Khan', specialization: 'Cardiology', email: 's.khan@hospital.com', phone: '0300-1111111', qualification: 'MBBS, MD', experience: 12, consultationFee: 2000 },
    { name: 'Dr. Ahmed Raza', specialization: 'Orthopedics', email: 'a.raza@hospital.com', phone: '0300-2222222', qualification: 'MBBS, MS', experience: 8, consultationFee: 1800 },
    { name: 'Dr. Ayesha Malik', specialization: 'Pediatrics', email: 'a.malik@hospital.com', phone: '0300-3333333', qualification: 'MBBS, DCH', experience: 6, consultationFee: 1500 },
    { name: 'Dr. Usman Ali', specialization: 'Neurology', email: 'u.ali@hospital.com', phone: '0300-4444444', qualification: 'MBBS, DM', experience: 15, consultationFee: 3000 },
  ]);
  console.log('Doctors created');

  await Patient.insertMany([
    { name: 'Muhammad Bilal', age: 34, gender: 'Male', phone: '0311-1234567', email: 'bilal@email.com', bloodGroup: 'B+', address: 'Rawalpindi, Punjab' },
    { name: 'Fatima Noor', age: 27, gender: 'Female', phone: '0311-2345678', bloodGroup: 'A+', allergies: ['Penicillin'] },
    { name: 'Ali Hassan', age: 45, gender: 'Male', phone: '0311-3456789', bloodGroup: 'O+', address: 'Islamabad' },
    { name: 'Zara Ahmed', age: 31, gender: 'Female', phone: '0311-4567890', bloodGroup: 'AB-' },
    { name: 'Tariq Mehmood', age: 58, gender: 'Male', phone: '0311-5678901', bloodGroup: 'A-', address: 'Lahore' },
  ]);
  console.log('Patients created');

  await Ward.insertMany([
    { wardNumber: 'W-101', wardType: 'General', totalBeds: 20, occupiedBeds: 14, floorNumber: 1, assignedNurse: 'Nurse Amna', perDayCharge: 2000 },
    { wardNumber: 'W-201', wardType: 'ICU', totalBeds: 10, occupiedBeds: 8, floorNumber: 2, assignedNurse: 'Nurse Hina', perDayCharge: 8000 },
    { wardNumber: 'W-301', wardType: 'Pediatric', totalBeds: 15, occupiedBeds: 6, floorNumber: 3, assignedNurse: 'Nurse Sara', perDayCharge: 3000 },
    { wardNumber: 'W-401', wardType: 'Maternity', totalBeds: 12, occupiedBeds: 9, floorNumber: 4, assignedNurse: 'Nurse Zainab', perDayCharge: 4000 },
  ]);
  console.log('Wards created');

  console.log('\nSeed complete! Login: admin@hospital.com / admin123');
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
