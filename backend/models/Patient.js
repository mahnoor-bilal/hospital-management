const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  bloodGroup: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  emergencyContact: { name: String, phone: String, relation: String },
  medicalHistory: [{ condition: String, since: String, notes: String }],
  allergies: [String],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = 'PAT' + String(count + 1).padStart(5, '0');
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
