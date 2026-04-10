const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  billId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [{
    description: String,
    quantity: Number,
    unitPrice: Number,
    total: Number
  }],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Partial', 'Paid', 'Cancelled'], default: 'Pending' },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'Insurance', 'Online'], default: 'Cash' },
  notes: { type: String }
}, { timestamps: true });

billingSchema.pre('save', async function(next) {
  if (!this.billId) {
    const count = await mongoose.model('Billing').countDocuments();
    this.billId = 'BILL' + String(count + 1).padStart(5, '0');
  }
  next();
});

module.exports = mongoose.model('Billing', billingSchema);
