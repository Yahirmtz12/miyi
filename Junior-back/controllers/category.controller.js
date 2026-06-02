const Category = require('../models/Category');
const Extra = require('../models/Extra');

// --- CREAR CATEGORÍA ---
exports.createCategory = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ msg: 'El nombre de la categoría es requerido' });
    }

    // Verificar si ya existe
    const existe = await Category.findOne({ nombre: nombre.trim() });
    if (existe) {
      return res.status(400).json({ msg: 'Ya existe una categoría con ese nombre' });
    }

    const category = new Category({ nombre: nombre.trim() });
    await category.save();

    res.status(201).json({ msg: 'Categoría creada', category });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ msg: 'Error al crear categoría' });
  }
};

// --- LISTAR CATEGORÍAS ACTIVAS ---
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ activo: true }).sort({ nombre: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener categorías' });
  }
};

// --- ACTUALIZAR CATEGORÍA ---
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    const category = await Category.findByIdAndUpdate(
      id,
      { nombre: nombre.trim() },
      { new: true }
    );

    if (!category) return res.status(404).json({ msg: 'Categoría no encontrada' });

    res.json({ msg: 'Categoría actualizada', category });
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar categoría' });
  }
};

// --- ELIMINAR CATEGORÍA (soft delete) ---
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!category) return res.status(404).json({ msg: 'Categoría no encontrada' });

    // También desactivar los extras de esta categoría
    await Extra.updateMany({ categoryId: id }, { activo: false });

    res.json({ msg: 'Categoría eliminada', category });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar categoría' });
  }
};
