const express = require('express');
const router = express.Router();
const Billing = require('../models/Billing');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const bills = await Billing.find(query).populate('patient', 'name patientId').sort({ createdAt: -1 });
    res.json({ success: true, data: bills });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const bill = await Billing.findById(req.params.id).populate('patient').populate('appointment');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const bill = await Billing.create(req.body);
    const populated = await bill.populate('patient', 'name patientId');
    res.status(201).json({ success: true, data: populated });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const bill = await Billing.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('patient');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
