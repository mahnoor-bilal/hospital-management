const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, date, doctor } = req.query;
    const query = {};
    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: new Date(d.setHours(0,0,0,0)), $lt: new Date(d.setHours(23,59,59,999)) };
    }
    const appointments = await Appointment.find(query)
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });
    res.json({ success: true, data: appointments });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id).populate('patient').populate('doctor');
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appt });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const appt = await Appointment.create(req.body);
    const populated = await appt.populate(['patient','doctor']);
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('patient').populate('doctor');
    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    res.json({ success: true, data: appt });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
