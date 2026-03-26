const User = require('../models/User');

exports.registrarVisita = async (req, res) => {
  const { membershipId } = req.body;
  
  // Obtenemos la fecha de hoy en formato local YYYY-MM-DD
  const hoy = new Date().toLocaleDateString('en-CA'); 

  try {
    const cliente = await User.findOne({ membershipId, rol: 'cliente' });

    if (!cliente) {
      return res.status(404).json({ message: "El código no pertenece a un cliente válido." });
    }

    // REGLA DE ORO: Validar si ya registró visita hoy
    if (cliente.visitas.includes(hoy)) {
      return res.status(400).json({ 
        message: "Este cliente ya registró su visita el día de hoy.",
        datos: {
          nombre: cliente.nombre,
          puntos: cliente.puntos,
          totalVisitas: cliente.visitas.length
        }
      });
    }

    // Si es su primera visita del día:
    cliente.visitas.push(hoy);
    cliente.puntos += 10; // Ejemplo: 10 puntos por visita
    await cliente.save();

    res.json({ 
      message: "¡Visita registrada con éxito!", 
      datos: {
        nombre: cliente.nombre,
        puntosActuales: cliente.puntos,
        totalVisitas: cliente.visitas.length
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Error al procesar la membresía", error });
  }
};
// Obtener información de un cliente por su membershipId
exports.obtenerClientePorId = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await User.findOne({ membershipId: id, rol: 'cliente' });
    
    if (!cliente) {
      return res.status(404).json({ message: "No existe un cliente con ese código." });
    }
    
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};