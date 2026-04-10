const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  wardNumber: { type: String, required: true, unique: true },
  wardType: { type: String, enum: ['General', 'ICU', 'Pediatric', 'Maternity', 'Surgical', 'Emergency'], required: true },
  totalBeds: { type: Number, required: true },
  occupiedBeds: { type: Number, default: 0 },
  patients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }],
  assignedNurse: { type: String },
  floorNumber: { type: Number },
  perDayCharge: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Ward', wardSchema);
