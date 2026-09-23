const router = require('express').Router();
const service = require('../services/customer.service');
const customerAuth = require('../middleware/customer.middleware');

router.post('/register', async (req, res) => {
  try {
    const result = await service.register(req.body);
    res.send(result);
  } catch (err) {
    res.status(400).send({ msg: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await service.login(req.body);
    res.send(result);
  } catch (err) {
    const status = err.statusCode || 401;
    res.status(status).send({ msg: err.message || 'Login failed', accountBlocked: Boolean(err.accountBlocked) });
  }
});

router.get('/me', customerAuth, async (req, res) => {
  try { await service.getMe(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to load profile' }); }
});
router.patch('/me', customerAuth, async (req, res) => {
  try { await service.updateMe(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to update profile' }); }
});
router.patch('/me/password', customerAuth, async (req, res) => {
  try { await service.changePassword(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to change password' }); }
});
router.get('/payment-methods', customerAuth, async (req, res) => {
  try { await service.getPaymentMethods(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to load payment methods' }); }
});
router.post('/payment-methods', customerAuth, async (req, res) => {
  try { await service.addPaymentMethod(req, res); } catch (err) { res.status(400).json({ msg: err.message || 'Failed to save payment method' }); }
});
router.patch('/payment-methods/:id', customerAuth, async (req, res) => {
  try { await service.updatePaymentMethod(req, res); } catch (err) { res.status(400).json({ msg: err.message || 'Failed to update payment method' }); }
});
router.delete('/payment-methods/:id', customerAuth, async (req, res) => {
  try { await service.deletePaymentMethod(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to delete payment method' }); }
});
router.get('/wallet', customerAuth, async (req, res) => {
  try { await service.getWallet(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to load wallet' }); }
});
router.post('/wallet/top-up', customerAuth, async (req, res) => {
  try { await service.topUpWallet(req, res); } catch (err) { res.status(400).json({ msg: err.message || 'Failed to top up wallet' }); }
});

// Shopping Profile & Preferences
router.get('/shopping-profile', customerAuth, async (req, res) => {
  try { await service.getShoppingProfile(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to load shopping profile' }); }
});
router.put('/shopping-profile', customerAuth, async (req, res) => {
  try { await service.updateShoppingProfile(req, res); } catch (err) { res.status(400).json({ msg: err.message || 'Failed to update shopping profile' }); }
});

// Darwin Shopping Memory
router.get('/darwin-memory', customerAuth, async (req, res) => {
  try { await service.getDarwinMemory(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to load Darwin memory' }); }
});
router.post('/darwin-memory/toggle', customerAuth, async (req, res) => {
  try { await service.toggleDarwinMemory(req, res); } catch (err) { res.status(400).json({ msg: err.message || 'Failed to toggle Darwin memory' }); }
});
router.delete('/darwin-memory/:key', customerAuth, async (req, res) => {
  try { await service.deleteDarwinMemory(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to delete memory' }); }
});
router.delete('/darwin-memory', customerAuth, async (req, res) => {
  try { await service.clearDarwinMemory(req, res); } catch (err) { res.status(500).json({ msg: err.message || 'Failed to clear Darwin memory' }); }
});


const StoreSettings = require('../models/store-settings.model');
router.get('/store-settings', async (req, res) => {
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) settings = await StoreSettings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ msg: err.message || 'Failed to load store settings' });
  }
});

module.exports = router;
