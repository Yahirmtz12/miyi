const Table = require('../models/Table');

// --- OBTENER TODAS LAS MESAS ---
exports.getTables = async (req, res) => {
  try {
    const tables = await Table.find().sort({ numero: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener mesas' });
  }
};

// --- CREAR UNA NUEVA MESA ---
exports.createTable = async (req, res) => {
  try {
    const { numero } = req.body;
    
    // Verificar si ya existe
    const existe = await Table.findOne({ numero });
    if (existe) return res.status(400).json({ msg: 'La mesa ya existe' });

    const newTable = new Table({ numero });
    await newTable.save();
    
    res.status(201).json(newTable);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear mesa' });
  }
};

// --- ELIMINAR MESA ---
exports.deleteTable = async (req, res) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Mesa eliminada' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar mesa' });
  }
};

// --- CAMBIAR ESTADO MANUALMENTE (Ej: de Sucia a Libre) ---
exports.updateTableStatus = async (req, res) => {
  try {
    const { estado } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id, 
      { estado }, 
      { new: true }
    );
    res.json(table);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar mesa' });
  }
};