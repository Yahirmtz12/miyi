const Cita = require('../models/Cita');
const Barbero = require('../models/Barbero');

// ========================
// CITAS (APPOINTMENTS)
// ========================

// POST /api/citas — Cliente solicita una cita (público)
exports.solicitarCita = async (req, res) => {
  try {
    const { barberoId, fecha, horaInicio, horaFin, servicio, extras, precioTotal, nombreCliente, telefonoCliente, notas } = req.body;

    // Validar que el barbero existe
    const barbero = await Barbero.findById(barberoId);
    if (!barbero || !barbero.activo) {
      return res.status(404).json({ msg: 'Barbero no encontrado' });
    }

    // Validar que no haya conflicto de horario
    const fechaDesde = new Date(fecha);
    fechaDesde.setHours(0, 0, 0, 0);
    const fechaHasta = new Date(fecha);
    fechaHasta.setHours(23, 59, 59, 999);

    const conflicto = await Cita.findOne({
      barbero: barberoId,
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
      horaInicio: horaInicio,
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    if (conflicto) {
      return res.status(400).json({ msg: 'Este horario ya no está disponible. Alguien lo acaba de tomar.' });
    }

    // Crear la cita
    const cita = new Cita({
      barbero: barberoId,
      fecha: new Date(fecha),
      horaInicio,
      horaFin,
      servicio,
      extras: extras || [],
      precioTotal: precioTotal || 0,
      estado: 'pendiente',
      nombreCliente: nombreCliente || '',
      telefonoCliente: telefonoCliente || '',
      notas: notas || '',
      reservadoPor: req.user ? req.user.id : null,
    });

    await cita.save();

    // Poblar para devolver datos completos
    const citaPopulada = await cita.populate('barbero', 'nombre telefono color');

    // 🔔 Emitir notificación en tiempo real al admin
    const io = req.app.get('socketio');
    if (io) {
      io.emit('nueva-cita', {
        _id: cita._id,
        nombreCliente: cita.nombreCliente,
        telefonoCliente: cita.telefonoCliente,
        servicio: cita.servicio,
        extras: cita.extras,
        precioTotal: cita.precioTotal,
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin,
        barbero: citaPopulada.barbero,
      });
    }

    res.status(201).json({ msg: 'Cita solicitada exitosamente. Espera la confirmación del barbero.', cita: citaPopulada });
  } catch (error) {
    res.status(500).json({ msg: 'Error al solicitar cita', error: error.message });
  }
};

// GET /api/citas — Todas las citas (admin)
exports.getCitas = async (req, res) => {
  try {
    const { desde, hasta, estado } = req.query;
    const filter = {};

    if (desde && hasta) {
      const fechaDesde = new Date(desde);
      fechaDesde.setHours(0, 0, 0, 0);
      const fechaHasta = new Date(hasta);
      fechaHasta.setHours(23, 59, 59, 999);
      filter.fecha = { $gte: fechaDesde, $lte: fechaHasta };
    }

    if (estado) {
      filter.estado = estado;
    }

    const citas = await Cita.find(filter)
      .populate('barbero', 'nombre color telefono')
      .populate('reservadoPor', 'nombre telefono')
      .sort({ fecha: 1, horaInicio: 1 });

    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener citas', error: error.message });
  }
};

// GET /api/citas/pendientes — Citas pendientes (admin)
exports.getCitasPendientes = async (req, res) => {
  try {
    const citas = await Cita.find({ estado: 'pendiente' })
      .populate('barbero', 'nombre color telefono')
      .populate('reservadoPor', 'nombre telefono')
      .sort({ createdAt: -1 });

    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener citas pendientes', error: error.message });
  }
};

// GET /api/citas/mis-citas — Citas del cliente autenticado
exports.getMisCitas = async (req, res) => {
  try {
    const citas = await Cita.find({ reservadoPor: req.user.id })
      .populate('barbero', 'nombre color')
      .sort({ fecha: -1 });

    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener tus citas', error: error.message });
  }
};

// PUT /api/citas/:id/aceptar — Admin confirma la cita
exports.aceptarCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ msg: 'Cita no encontrada' });

    if (cita.estado !== 'pendiente') {
      return res.status(400).json({ msg: 'Esta cita ya fue procesada' });
    }

    cita.estado = 'confirmada';
    await cita.save();

    const citaPopulada = await cita.populate([
      { path: 'barbero', select: 'nombre color telefono' },
      { path: 'reservadoPor', select: 'nombre telefono' }
    ]);

    // 🔔 Notificar al cliente
    const io = req.app.get('socketio');
    if (io) {
      io.emit('cita-actualizada', {
        _id: cita._id,
        estado: 'confirmada',
        nombreCliente: cita.nombreCliente,
        fecha: cita.fecha,
        horaInicio: cita.horaInicio,
      });
    }

    res.json({ msg: 'Cita confirmada', cita: citaPopulada });
  } catch (error) {
    res.status(500).json({ msg: 'Error al confirmar cita', error: error.message });
  }
};

// PUT /api/citas/:id/rechazar — Admin rechaza la cita
exports.rechazarCita = async (req, res) => {
  try {
    const { motivo } = req.body;
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ msg: 'Cita no encontrada' });

    if (cita.estado !== 'pendiente') {
      return res.status(400).json({ msg: 'Esta cita ya fue procesada' });
    }

    cita.estado = 'rechazada';
    cita.motivoRechazo = motivo || '';
    await cita.save();

    // 🔔 Notificar al cliente
    const io = req.app.get('socketio');
    if (io) {
      io.emit('cita-actualizada', {
        _id: cita._id,
        estado: 'rechazada',
        nombreCliente: cita.nombreCliente,
        motivoRechazo: cita.motivoRechazo,
      });
    }

    res.json({ msg: 'Cita rechazada', _id: cita._id });
  } catch (error) {
    res.status(500).json({ msg: 'Error al rechazar cita', error: error.message });
  }
};

// PUT /api/citas/:id/completar — Admin marca cita como completada
exports.completarCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ msg: 'Cita no encontrada' });

    cita.estado = 'completada';
    await cita.save();

    res.json({ msg: 'Cita completada', _id: cita._id });
  } catch (error) {
    res.status(500).json({ msg: 'Error al completar cita', error: error.message });
  }
};

// DELETE /api/citas/:id — Cancelar cita
exports.cancelarCita = async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ msg: 'Cita no encontrada' });

    cita.estado = 'cancelada';
    await cita.save();

    res.json({ msg: 'Cita cancelada', _id: cita._id });
  } catch (error) {
    res.status(500).json({ msg: 'Error al cancelar cita', error: error.message });
  }
};
