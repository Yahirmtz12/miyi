const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



exports.login = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    const user = await User.findOne({ usuario });
    if (!user) {
      return res.status(400).json({ msg: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user._id, rol: user.rol },
      'SECRETO_POLLARIA',
      { expiresIn: '10h' }
    );

    // --- AQUÍ ESTÁ EL CAMBIO ---
    res.json({
      token,
      user: {
        id: user._id, // Útil para búsquedas rápidas
        nombre: user.nombre,
        usuario: user.usuario,
        rol: user.rol,
        // Agregamos estos 3 campos vitales:
        membershipId: user.membershipId, 
        puntos: user.puntos || 0,
        visitas: user.visitas || []
      }
    });

  } catch (error) {
    console.error("Error en Login:", error);
    res.status(500).json({ msg: 'Error en el servidor' });
  }
};