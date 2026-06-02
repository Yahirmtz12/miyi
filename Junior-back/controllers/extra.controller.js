const Extra = require('../models/Extra');

// --- CREAR EXTRA ---
exports.createExtra = async (req, res) => {
  try {
    const { categoryId, nombre, precio } = req.body;

    if (!categoryId || !nombre || precio === undefined) {
      return res.status(400).json({ msg: 'categoryId, nombre y precio son requeridos' });
    }

    const extra = new Extra({
      categoryId,
      nombre: nombre.trim(),
      precio: Number(precio)
    });

    await extra.save();
    res.status(201).json({ msg: 'Extra creado', extra });
  } catch (error) {
    console.error('Error al crear extra:', error);
    res.status(500).json({ msg: 'Error al crear extra' });
  }
};

// --- OBTENER EXTRAS POR CATEGORÍA ---
// Endpoint: GET /api/products/:categoryId/extras
exports.getExtrasByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const extras = await Extra.find({
      categoryId,
      activo: true
    }).sort({ nombre: 1 });

    res.json(extras);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener extras' });
  }
};

// --- LISTAR TODOS LOS EXTRAS (para admin) ---
exports.getAllExtras = async (req, res) => {
  try {
    const extras = await Extra.find({ activo: true })
      .populate('categoryId', 'nombre')
      .sort({ categoryId: 1, nombre: 1 });

    res.json(extras);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener extras' });
  }
};

// --- ACTUALIZAR EXTRA ---
exports.updateExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, categoryId } = req.body;

    const updateData = {};
    if (nombre) updateData.nombre = nombre.trim();
    if (precio !== undefined) updateData.precio = Number(precio);
    if (categoryId) updateData.categoryId = categoryId;

    const extra = await Extra.findByIdAndUpdate(id, updateData, { new: true });

    if (!extra) return res.status(404).json({ msg: 'Extra no encontrado' });

    res.json({ msg: 'Extra actualizado', extra });
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar extra' });
  }
};

// --- ELIMINAR EXTRA (soft delete) ---
exports.deleteExtra = async (req, res) => {
  try {
    const { id } = req.params;

    const extra = await Extra.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!extra) return res.status(404).json({ msg: 'Extra no encontrado' });

    res.json({ msg: 'Extra eliminado', extra });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar extra' });
  }
};
