const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  qualification: { type: String },
  experience: { type: Number },
  consultationFee: { type: Number, default: 0 },
  availability: [{
    day: { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
    startTime: String,
    endTime: String
  }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

doctorSchema.pre('save', async function(next) {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = 'DOC' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
