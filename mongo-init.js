// MongoDB initialization script
// Runs once when the container is first created

db = db.getSiblingDB('hospital_management');

db.createCollection('users');
db.createCollection('patients');
db.createCollection('doctors');
db.createCollection('wards');

print('Hospital Management database initialized successfully');
