const Salon = require('../models/Salon');
const SalonSlot = require('../models/SalonSlot');

// ========================
// SALONES (CRUD)
// ========================

// GET /api/salones — Obtener todos los salones
exports.getSalones = async (req, res) => {
  try {
    const salones = await Salon.find({ activo: true }).sort({ createdAt: 1 });
    res.json(salones);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener salones', error: error.message });
  }
};

// POST /api/salones — Crear nuevo salón (admin)
exports.createSalon = async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;
    const salon = new Salon({ nombre, descripcion, color });
    await salon.save();
    res.status(201).json(salon);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear salón', error: error.message });
  }
};

// PUT /api/salones/:id — Editar salón (admin)
exports.updateSalon = async (req, res) => {
  try {
    const { nombre, descripcion, color } = req.body;
    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, color },
      { new: true }
    );
    if (!salon) return res.status(404).json({ msg: 'Salón no encontrado' });
    res.json(salon);
  } catch (error) {
    res.status(500).json({ msg: 'Error al editar salón', error: error.message });
  }
};

// DELETE /api/salones/:id — Desactivar salón (admin)
exports.deleteSalon = async (req, res) => {
  try {
    const salon = await Salon.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!salon) return res.status(404).json({ msg: 'Salón no encontrado' });
    res.json({ msg: 'Salón desactivado' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al desactivar salón', error: error.message });
  }
};

// ========================
// SLOTS DE DISPONIBILIDAD
// ========================

// GET /api/salones/slots?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
exports.getSlots = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    
    if (!desde || !hasta) {
      return res.status(400).json({ msg: 'Se requieren los parámetros "desde" y "hasta"' });
    }

    const fechaDesde = new Date(desde);
    fechaDesde.setHours(0, 0, 0, 0);
    const fechaHasta = new Date(hasta);
    fechaHasta.setHours(23, 59, 59, 999);

    const slots = await SalonSlot.find({
      fecha: { $gte: fechaDesde, $lte: fechaHasta }
    })
    .populate('salon', 'nombre color')
    .populate('reservadoPor', 'nombre telefono')
    .sort({ fecha: 1, horaInicio: 1 });

    res.json(slots);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener slots', error: error.message });
  }
};

// POST /api/salones/slots — Crear bloque de disponibilidad (admin)
exports.createSlot = async (req, res) => {
  try {
    const { salon, fecha, horaInicio, horaFin, notas, repetirSemanalmente, repetirHasta } = req.body;

    const startDate = new Date(fecha);
    const endDate = (repetirSemanalmente && repetirHasta) ? new Date(repetirHasta) : new Date(fecha);
    
    // Validar que la fecha final no sea menor a la inicial
    if (endDate < startDate) {
      return res.status(400).json({ msg: 'La fecha de "Repetir hasta" no puede ser anterior a la fecha inicial' });
    }

    // Generar todas las fechas
    const fechasACrear = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      fechasACrear.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    }

    // 1. Verificar conflictos para TODAS las fechas
    const conflictos = [];
    for (const d of fechasACrear) {
      const conflicto = await SalonSlot.findOne({
        salon,
        fecha: d,
        $or: [
          { horaInicio: { $lt: horaFin }, horaFin: { $gt: horaInicio } }
        ]
      });
      if (conflicto) {
        conflictos.push(d.toLocaleDateString('es-MX'));
      }
    }

    if (conflictos.length > 0) {
      return res.status(400).json({ 
        msg: `Hay conflictos de horario en las siguientes fechas: ${conflictos.join(', ')}. No se creó ningún horario.` 
      });
    }

    // 2. Crear todos los slots ya que no hay conflictos
    const slotsToInsert = fechasACrear.map(d => ({
      salon,
      fecha: d,
      horaInicio,
      horaFin,
      notas,
      estado: 'confirmado',
    }));

    await SalonSlot.insertMany(slotsToInsert);
    
    // Devolvemos el primer slot para que el frontend lo tome como éxito (el frontend recarga la semana de todos modos)
    res.status(201).json({ msg: `${fechasACrear.length} horarios creados exitosamente.` });
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear slot', error: error.message });
  }
};

// PUT /api/salones/slots/:id — Editar slot (admin)
exports.updateSlot = async (req, res) => {
  try {
    const { horaInicio, horaFin, notas } = req.body;
    const slot = await SalonSlot.findByIdAndUpdate(
      req.params.id,
      { horaInicio, horaFin, notas },
      { new: true }
    ).populate('salon', 'nombre color');

    if (!slot) return res.status(404).json({ msg: 'Slot no encontrado' });
    res.json(slot);
  } catch (error) {
    res.status(500).json({ msg: 'Error al editar slot', error: error.message });
  }
};

// DELETE /api/salones/slots/:id — Eliminar slot (admin)
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await SalonSlot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ msg: 'Slot no encontrado' });
    res.json({ msg: 'Slot eliminado' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar slot', error: error.message });
  }
};

// POST /api/salones/slots/:id/reservar — Cliente reserva un slot (público)
exports.reserveSlot = async (req, res) => {
  try {
    const { nombre, telefono } = req.body;
    const slot = await SalonSlot.findById(req.params.id);

    if (!slot) return res.status(404).json({ msg: 'Slot no encontrado' });
    if (slot.estado !== 'disponible') {
      return res.status(400).json({ msg: 'Este horario ya no está disponible' });
    }

    slot.estado = 'reservado';
    slot.nombreReserva = nombre || '';
    slot.telefonoReserva = telefono || '';
    
    // Si el usuario está autenticado, asociar
    if (req.user) {
      slot.reservadoPor = req.user.id;
    }

    await slot.save();
    const populated = await slot.populate('salon', 'nombre color');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ msg: 'Error al reservar slot', error: error.message });
  }
};

// PUT /api/salones/slots/:id/confirmar — Admin confirma reservación
exports.confirmSlot = async (req, res) => {
  try {
    const slot = await SalonSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ msg: 'Slot no encontrado' });

    slot.estado = 'confirmado';
    await slot.save();
    
    const populated = await slot.populate([
      { path: 'salon', select: 'nombre color' },
      { path: 'reservadoPor', select: 'nombre telefono' }
    ]);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ msg: 'Error al confirmar', error: error.message });
  }
};

// PUT /api/salones/slots/:id/rechazar — Admin rechaza (elimina el registro para liberar espacio)
exports.rejectSlot = async (req, res) => {
  try {
    const slot = await SalonSlot.findByIdAndDelete(req.params.id);
    if (!slot) return res.status(404).json({ msg: 'Slot no encontrado' });

    res.json({ msg: 'Reservación rechazada y espacio liberado', _id: req.params.id });
  } catch (error) {
    res.status(500).json({ msg: 'Error al rechazar', error: error.message });
  }
};

// POST /api/salones/reservar-publico — Cliente solicita múltiples horarios
exports.publicReserveSlots = async (req, res) => {
  try {
    const { slots, nombre, telefono } = req.body; // slots = [{salonId, fecha, horaInicio, horaFin}]
    
    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ msg: 'No se enviaron horarios para reservar' });
    }

    // Insertar todos con estado reservado
    const slotsToInsert = slots.map(s => ({
      salon: s.salonId,
      fecha: new Date(s.fecha),
      horaInicio: s.horaInicio,
      horaFin: s.horaFin,
      estado: 'reservado',
      nombreReserva: nombre || '',
      telefonoReserva: telefono || ''
    }));

    await SalonSlot.insertMany(slotsToInsert);
    res.status(201).json({ msg: 'Reservaciones creadas exitosamente' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al reservar', error: error.message });
  }
};

