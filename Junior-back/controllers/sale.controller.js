const Sale = require('../models/Sale');
const Product = require('../models/Product');

// CREAR VENTA
exports.createSale = async (req, res) => {
  try {
    // 1. Recibimos el 'descuento' (si no viene, por defecto es 0)
    const { productos, efectivoRecibido, descuento = 0 } = req.body;

    let subtotal = 0;

    // Validar stock y calcular el subtotal (precio normal)
    for (let item of productos) {
      const product = await Product.findById(item.productoId);

      if (!product || product.stock < item.cantidad) {
        return res.status(400).json({
          msg: `Stock insuficiente para ${item.nombre}`
        });
      }

      subtotal += item.precio * item.cantidad;
    }

    // 2. APLICAMOS EL DESCUENTO SOLO PARA LA VALIDACIÓN
    const totalConDescuento = subtotal - ((subtotal * descuento) / 100);

    // 3. Validamos el efectivo contra el total real a pagar
    if (efectivoRecibido < totalConDescuento) {
      return res.status(400).json({ msg: 'Efectivo insuficiente' });
    }

    // Descontar stock
    for (let item of productos) {
      await Product.findByIdAndUpdate(
        item.productoId,
        { $inc: { stock: -item.cantidad } }
      );
    }

    // Calculamos el cambio real
    const cambio = efectivoRecibido - totalConDescuento;

    // 4. Guardamos la venta (NO agregamos el campo descuento para no alterar tu esquema)
    const sale = new Sale({
      productos,
      total: totalConDescuento, // Se guarda el total ya con la rebaja
      efectivoRecibido,
      cambio,
      usuario: req.user.id
    });

    await sale.save();

    res.json({
      msg: 'Venta registrada correctamente',
      sale
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al registrar venta' });
  }
};
// OBTENER VENTAS
// controllers/sale.controller.js
exports.getSales = async (req, res) => {
  try {
    // .populate('usuario', 'nombre') trae el nombre del modelo User usando el ID
    const sales = await Sale.find()
      .populate('usuario', 'nombre') 
      .sort({ fecha: -1 }); 
    res.json(sales);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener historial' });
  }
};
// ELIMINAR VENTA
exports.deleteSale = async (req, res) => {
  try {
    const saleId = req.params.id;

    // 1. Buscar la venta primero para saber qué productos tenía
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    // 2. Restaurar el stock de los productos vendidos
    // Recorremos los productos de la venta y sumamos la cantidad de vuelta al stock
    for (let item of sale.productos) {
      // Asegúrate de que item.productoId es el nombre correcto del campo según tu modelo
      await Product.findByIdAndUpdate(
        item.productoId,
        { $inc: { stock: item.cantidad } } 
      );
    }

    // 3. Eliminar la venta de la base de datos
    await Sale.findByIdAndDelete(saleId);

    res.json({ msg: 'Venta eliminada y stock restaurado correctamente' });

  } catch (error) {
    console.error("Error al eliminar venta:", error);
    res.status(500).json({ msg: 'Error en el servidor al intentar eliminar la venta' });
  }
};
exports.getReport = async (req, res) => {
  try {
    const totalVentas = await Sale.countDocuments();
    
    const ingresos = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);

    res.json({
      totalVentas,
      ingresos: ingresos[0]?.total || 0
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al generar reporte' });
  }
};
