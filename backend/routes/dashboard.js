const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Ward = require('../models/Ward');
const Billing = require('../models/Billing');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate()+1);

    const [totalPatients, totalDoctors, todayAppointments, wards, pendingBills, recentAppointments] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Doctor.countDocuments({ isActive: true }),
      Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Ward.find(),
      Billing.countDocuments({ status: 'Pending' }),
      Appointment.find().populate('patient','name').populate('doctor','name').sort({ createdAt: -1 }).limit(5)
    ]);

    const totalBeds = wards.reduce((a, w) => a + w.totalBeds, 0);
    const occupiedBeds = wards.reduce((a, w) => a + w.occupiedBeds, 0);

    const revenue = await Billing.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        totalPatients, totalDoctors, todayAppointments, pendingBills,
        totalBeds, occupiedBeds, availableBeds: totalBeds - occupiedBeds,
        totalRevenue: revenue[0]?.total || 0,
        recentAppointments
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
