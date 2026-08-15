const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const PushSubscription = require('../models/PushSubscription');
const vapidKeys = require('../config/vapid');

// Ruta para obtener la VAPID public key
router.get('/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// Ruta para guardar la suscripción
router.post('/subscribe', auth, async (req, res) => {
  try {
    const subscription = req.body;
    
    // Buscar si ya existe la misma suscripción para no duplicar
    const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    if (existing) {
      return res.status(200).json({ msg: 'Suscripción ya existe' });
    }

    const newSub = new PushSubscription({
      userId: req.user.id, // Viene del token JWT (middleware auth)
      endpoint: subscription.endpoint,
      keys: subscription.keys
    });

    await newSub.save();
    res.status(201).json({ msg: 'Suscripción guardada correctamente' });
  } catch (error) {
    console.error('Error al guardar suscripción push:', error);
    res.status(500).json({ msg: 'Error de servidor' });
  }
});

module.exports = router;
