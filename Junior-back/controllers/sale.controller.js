const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Extra = require('../models/Extra');

// CREAR VENTA
exports.createSale = async (req, res) => {
  try {
    // 1. Recibimos el 'descuento' (si no viene, por defecto es 0)
    const { productos, efectivoRecibido, descuento = 0 } = req.body;

    let subtotal = 0;
    const productosValidados = [];

    // Validar stock, extras y calcular el subtotal DESDE LA BD (nunca confiar en el front)
    for (let item of productos) {
      const product = await Product.findById(item.productoId);

      if (!product || product.stock < item.cantidad) {
        return res.status(400).json({
          msg: `Stock insuficiente para ${item.nombre}`
        });
      }

      // Precio base del producto (desde la BD, no del front)
      let precioBaseReal = product.precio;
      let extrasValidados = [];
      let sumaExtras = 0;

      // Validar extras si existen
      if (item.extras && item.extras.length > 0) {
        for (let extraItem of item.extras) {
          const extraDB = await Extra.findById(extraItem.extraId);
          if (!extraDB || !extraDB.activo) {
            return res.status(400).json({
              msg: `Extra no válido: ${extraItem.nombre || 'desconocido'}`
            });
          }
          // Usamos el precio de la BD, no el que mandó el front
          extrasValidados.push({
            extraId: extraDB._id,
            nombre: extraDB.nombre,
            precio: extraDB.precio
          });
          sumaExtras += extraDB.precio;
        }
      }

      // Subtotal de este item: (precioBase + sumaExtras) * cantidad
      const subtotalItem = (precioBaseReal + sumaExtras) * item.cantidad;
      subtotal += subtotalItem;

      productosValidados.push({
        productoId: item.productoId,
        nombre: product.nombre,
        cantidad: item.cantidad,
        precio: precioBaseReal,
        extras: extrasValidados,
        subtotal: subtotalItem
      });
    }

    // 2. APLICAMOS EL DESCUENTO
    const totalConDescuento = subtotal - ((subtotal * descuento) / 100);

    // 3. Validamos el efectivo contra el total real a pagar
    if (efectivoRecibido < totalConDescuento) {
      return res.status(400).json({ msg: 'Efectivo insuficiente' });
    }

    // Descontar stock
    for (let item of productosValidados) {
      await Product.findByIdAndUpdate(
        item.productoId,
        { $inc: { stock: -item.cantidad } }
      );
    }

    // Calculamos el cambio real
    const cambio = efectivoRecibido - totalConDescuento;

    // 4. Guardamos la venta con los extras validados
    const sale = new Sale({
      productos: productosValidados,
      total: parseFloat(totalConDescuento.toFixed(2)),
      efectivoRecibido,
      cambio: parseFloat(cambio.toFixed(2)),
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
