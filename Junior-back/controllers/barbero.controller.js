const Barbero = require('../models/Barbero');
const Cita = require('../models/Cita');

// ========================
// BARBEROS (CRUD)
// ========================

// GET /api/barberos — Obtener todos los barberos activos
exports.getBarberos = async (req, res) => {
  try {
    const barberos = await Barbero.find({ activo: true }).sort({ createdAt: 1 });
    res.json(barberos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener barberos', error: error.message });
  }
};

// POST /api/barberos — Crear nuevo barbero (admin)
exports.createBarbero = async (req, res) => {
  try {
    const { nombre, descripcion, telefono, color, servicios, horarioSemanal } = req.body;
    const barbero = new Barbero({ nombre, descripcion, telefono, color, servicios, horarioSemanal });
    await barbero.save();
    res.status(201).json(barbero);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear barbero', error: error.message });
  }
};

// PUT /api/barberos/:id — Editar barbero (admin)
exports.updateBarbero = async (req, res) => {
  try {
    const { nombre, descripcion, telefono, color, servicios, horarioSemanal } = req.body;
    const barbero = await Barbero.findByIdAndUpdate(
      req.params.id,
      { nombre, descripcion, telefono, color, servicios, horarioSemanal },
      { new: true }
    );
    if (!barbero) return res.status(404).json({ msg: 'Barbero no encontrado' });
    res.json(barbero);
  } catch (error) {
    res.status(500).json({ msg: 'Error al editar barbero', error: error.message });
  }
};

// DELETE /api/barberos/:id — Desactivar barbero (admin)
exports.deleteBarbero = async (req, res) => {
  try {
    const barbero = await Barbero.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!barbero) return res.status(404).json({ msg: 'Barbero no encontrado' });
    res.json({ msg: 'Barbero desactivado' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al desactivar barbero', error: error.message });
  }
};

// ========================
// DISPONIBILIDAD
// ========================

// GET /api/barberos/:id/disponibilidad?fecha=YYYY-MM-DD
// Genera los slots disponibles para un barbero en una fecha específica
exports.getDisponibilidad = async (req, res) => {
  try {
    const { fecha } = req.query;
    if (!fecha) return res.status(400).json({ msg: 'Se requiere el parámetro "fecha"' });

    const barbero = await Barbero.findById(req.params.id);
    if (!barbero || !barbero.activo) {
      return res.status(404).json({ msg: 'Barbero no encontrado' });
    }

    // Determinar qué día de la semana es
    const fechaObj = new Date(fecha + 'T12:00:00');
    const diasMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaSemana = diasMap[fechaObj.getDay()];
    const horarioDia = barbero.horarioSemanal[diaSemana];

    // Si el barbero no trabaja ese día
    if (!horarioDia || !horarioDia.activo) {
      return res.json({ disponible: false, slots: [], mensaje: 'El barbero no trabaja este día' });
    }

    // Generar slots de 1 hora dentro del horario del barbero
    const horaInicio = parseInt(horarioDia.inicio.split(':')[0]);
    const horaFin = parseInt(horarioDia.fin.split(':')[0]);
    const todosLosSlots = [];

    for (let h = horaInicio; h < horaFin; h++) {
      todosLosSlots.push({
        horaInicio: `${h.toString().padStart(2, '0')}:00`,
        horaFin: `${(h + 1).toString().padStart(2, '0')}:00`,
      });
    }

    // Buscar citas ya agendadas para esa fecha (no rechazadas ni canceladas)
    const fechaDesde = new Date(fecha);
    fechaDesde.setHours(0, 0, 0, 0);
    const fechaHasta = new Date(fecha);
    fechaHasta.setHours(23, 59, 59, 999);

    const citasExistentes = await Cita.find({
      barbero: barbero._id,
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    // Filtrar slots ocupados
    const slotsDisponibles = todosLosSlots.filter(slot => {
      return !citasExistentes.some(cita => 
        cita.horaInicio === slot.horaInicio
      );
    });

    // Filtrar slots pasados si la fecha es hoy
    const ahora = new Date();
    const esHoy = fechaObj.toDateString() === ahora.toDateString();
    
    const slotsFinal = esHoy 
      ? slotsDisponibles.filter(slot => {
          const horaSlot = parseInt(slot.horaInicio.split(':')[0]);
          return horaSlot > ahora.getHours();
        })
      : slotsDisponibles;

    res.json({
      disponible: true,
      barbero: { nombre: barbero.nombre, color: barbero.color },
      horario: { inicio: horarioDia.inicio, fin: horarioDia.fin },
      slots: slotsFinal,
      totalSlots: todosLosSlots.length,
      ocupados: citasExistentes.length,
    });

  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener disponibilidad', error: error.message });
  }
};

// GET /api/barberos/:id/disponibilidad-semana?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
// Devuelve la disponibilidad de toda una semana
exports.getDisponibilidadSemana = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) return res.status(400).json({ msg: 'Se requieren "desde" y "hasta"' });

    const barbero = await Barbero.findById(req.params.id);
    if (!barbero || !barbero.activo) {
      return res.status(404).json({ msg: 'Barbero no encontrado' });
    }

    const diasMap = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    
    // Buscar todas las citas de la semana
    const fechaDesde = new Date(desde);
    fechaDesde.setHours(0, 0, 0, 0);
    const fechaHasta = new Date(hasta);
    fechaHasta.setHours(23, 59, 59, 999);

    const citasSemana = await Cita.find({
      barbero: barbero._id,
      fecha: { $gte: fechaDesde, $lte: fechaHasta },
      estado: { $in: ['pendiente', 'confirmada'] }
    });

    // Generar disponibilidad por cada día
    const resultado = {};
    const currentDate = new Date(fechaDesde);
    
    while (currentDate <= fechaHasta) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const diaSemana = diasMap[currentDate.getDay()];
      const horarioDia = barbero.horarioSemanal[diaSemana];

      if (!horarioDia || !horarioDia.activo) {
        resultado[dateStr] = { disponible: false, slots: [] };
      } else {
        const horaInicio = parseInt(horarioDia.inicio.split(':')[0]);
        const horaFin = parseInt(horarioDia.fin.split(':')[0]);
        const todosLosSlots = [];

        for (let h = horaInicio; h < horaFin; h++) {
          todosLosSlots.push({
            horaInicio: `${h.toString().padStart(2, '0')}:00`,
            horaFin: `${(h + 1).toString().padStart(2, '0')}:00`,
          });
        }

        const citasDelDia = citasSemana.filter(c => {
          const citaDate = c.fecha.toISOString().split('T')[0];
          return citaDate === dateStr;
        });

        const slotsDisponibles = todosLosSlots.filter(slot => {
          return !citasDelDia.some(cita => cita.horaInicio === slot.horaInicio);
        });

        // Filtrar pasados si es hoy
        const ahora = new Date();
        const esHoy = currentDate.toDateString() === ahora.toDateString();
        
        resultado[dateStr] = {
          disponible: true,
          slots: esHoy 
            ? slotsDisponibles.filter(s => parseInt(s.horaInicio) > ahora.getHours())
            : slotsDisponibles,
          totalSlots: todosLosSlots.length,
          ocupados: citasDelDia.length,
        };
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ barbero: { nombre: barbero.nombre, color: barbero.color }, semana: resultado });
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener disponibilidad semanal', error: error.message });
  }
};
