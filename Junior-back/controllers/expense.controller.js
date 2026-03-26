const Expense = require('../models/Expense'); // Asegura que la ruta a tu modelo sea correcta

// Obtener todos los gastos
exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ fecha: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener gastos", error });
  }
};

// Crear un nuevo gasto
exports.createExpense = async (req, res) => {
  try {
    const { descripcion, monto, categoria, usuario } = req.body;

    // Validación manual rápida para ver qué llega
    if (!descripcion || !monto || !usuario) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const newExpense = new Expense({ descripcion, monto, categoria, usuario });
    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error al guardar", error: error.message });
  }
};