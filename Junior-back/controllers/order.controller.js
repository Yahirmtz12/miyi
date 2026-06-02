const Order = require('../models/Order');
const Sale = require('../models/Sale');
const Table = require('../models/Table');
const Product = require('../models/Product');

// --- 1. CREAR O AÑADIR PRODUCTOS (Mesero) ---
exports.createOrder = async (req, res) => {
  try {
    const { cliente, productos, total, mesaId, tipoConsumo } = req.body;
    const io = req.app.get('socketio');

    if (mesaId) {
      let orderExistente = await Order.findOne({ mesaId, pagado: false });

      if (orderExistente) {
        // 1. Procesamos los productos que vienen del body
        // No importa si el ID ya existe en la base de datos, 
        // se insertan como items nuevos en el array para que cocina los vea.
        const nuevosProductosProcesados = productos.map(p => {
          const extrasSum = (p.extras || []).reduce((sum, e) => sum + (e.precio || 0), 0);
          return {
            productoId: p.productoId,
            nombre: p.nombre,
            cantidad: p.cantidad,
            precio: p.precio,
            notas: p.notas || "",
            entregado: false, // <--- Clave: Siempre false para lo nuevo
            extras: p.extras || [],
            subtotal: (p.precio + extrasSum) * p.cantidad
          };
        });

        // 2. Insertamos al array (esto creará entradas duplicadas de ID pero con estado entregado: false)
        orderExistente.productos.push(...nuevosProductosProcesados);

        // 3. Sumamos el total de los NUEVOS productos al total que ya tenía la orden
        orderExistente.total += Number(total);

        orderExistente.estado = 'PENDIENTE';

        await orderExistente.save();
        if (io) io.emit('pedido-actualizado', orderExistente);
        return res.status(200).json({ msg: 'Productos añadidos', order: orderExistente });
      }
    }

    // Si es una orden totalmente nueva...
    const newOrder = new Order({
      cliente: cliente || `Mesa ${mesaId}`,
      mesaId,
      productos: productos.map(p => {
        const extrasSum = (p.extras || []).reduce((sum, e) => sum + (e.precio || 0), 0);
        return {
          productoId: p.productoId,
          nombre: p.nombre,
          cantidad: p.cantidad,
          precio: p.precio,
          notas: p.notas || "",
          entregado: false,
          extras: p.extras || [],
          subtotal: (p.precio + extrasSum) * p.cantidad
        };
      }),
      total: Number(total),
      tipoConsumo: tipoConsumo === "COMER AQUI" ? "LOCAL" : "LLEVAR",
      estado: 'PENDIENTE'
    });

    await newOrder.save();
    if (mesaId) await Table.findByIdAndUpdate(mesaId, { estado: 'OCUPADA', ordenActual: newOrder._id });

    if (io) io.emit('nuevo-pedido', newOrder);
    res.status(201).json({ msg: 'Pedido enviado', order: newOrder });

  } catch (error) {
    console.error("ERROR EN CREATE_ORDER:", error);
    res.status(500).json({ msg: 'Error interno', error: error.message });
  }
};

// --- 2. OBTENER PARA COCINA ---
exports.getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      pagado: false,
      estado: { $in: ['PENDIENTE', 'PREPARANDO', 'LISTO'] }
    }).sort({ createdAt: 1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener pedidos' });
  }
};

// --- 3. CAMBIAR ESTADO (Botones Cocina) ---
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    const orderToUpdate = await Order.findById(id);
    if (!orderToUpdate) return res.status(404).json({ msg: 'No encontrada' });

    // ✅ CORRECCIÓN LOGICA:
    // Solo marcamos como entregado lo que el cocinero acaba de terminar
    if (nuevoEstado === 'LISTO' || nuevoEstado === 'ENTREGADO') {
      orderToUpdate.productos = orderToUpdate.productos.map(p => {
        const item = p.toObject();
        // Si el estado es LISTO, asumimos que lo que estaba pendiente ahora está hecho
        return { ...item, entregado: true };
      });
    }

    orderToUpdate.estado = nuevoEstado;
    await orderToUpdate.save();

    req.app.get('socketio').emit('pedido-actualizado', orderToUpdate);
    res.json({ msg: 'Estado actualizado', order: orderToUpdate });
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar estado' });
  }
};

// --- 4. ACTUALIZAR POR MESA (Edición / Split de productos) ---
exports.updateOrderByTable = async (req, res) => {
  try {
    const { id } = req.params; // mesaId
    const { productos, total } = req.body; // 'productos' son solo los nuevos enviados

    let order = await Order.findOne({ mesaId: id, pagado: false });
    if (!order) return res.status(404).json({ msg: "No hay orden activa" });

    // 1. Forzamos que todo lo que llega en este PUT sea entregado: false
    const nuevos = productos.map(p => ({
      ...p,
      notas: p.notas || "",
      entregado: false
    }));

    // 2. Simplemente los añadimos al array existente
    order.productos.push(...nuevos);

    // 3. Sumamos el valor de estos nuevos productos al total anterior
    order.total += Number(total);

    // 4. Regresamos el estado a PENDIENTE para que cocina vea los cambios
    order.estado = 'PENDIENTE';

    await order.save();
    req.app.get('socketio').emit('pedido-actualizado', order);
    res.json(order);
  } catch (error) {
    res.status(500).json({ msg: "Error al actualizar pedido" });
  }
};
// Actualizar UN solo producto de la orden

exports.updateProductInOrder = async (req, res) => {
  try {
    const { id, index } = req.params;
    
    // 1. Buscamos la orden
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ msg: "Orden no encontrada" });

    // 2. Verificamos que el producto exista en ese índice
    if (order.productos[index]) {
      order.productos[index].entregado = true;
      
      // 3. LOGICA EXTRA: Si después de marcar este, YA NO QUEDAN productos 
      // con entregado: false, pasamos la orden completa a 'LISTO' automáticamente.
      const faltanPorHacer = order.productos.some(p => p.entregado === false);
      if (!faltanPorHacer) {
        order.estado = 'LISTO';
      }

      // Guardamos cambios
      await order.save();

      // 4. Avisamos por Socket.io para que el monitor se actualice solo
      const io = req.app.get('socketio');
      if (io) io.emit('pedido-actualizado', order);

      return res.json(order);
    } else {
      return res.status(400).json({ msg: "El producto no existe en esta orden" });
    }
  } catch (error) {
    console.error("Error al marcar producto:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};
// --- 5. FINALIZAR (Cobro) ---
exports.finishOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { efectivoRecibido, cambio } = req.body;
    const order = await Order.findOne({ mesaId: id, pagado: false });
    if (!order) return res.status(404).json({ msg: "No hay orden" });

    for (let item of order.productos) {
      await Product.findByIdAndUpdate(item.productoId, { $inc: { stock: -item.cantidad } });
    }

    const newSale = new Sale({
      ordenId: order._id,
      mesaId: id,
      productos: order.productos,
      total: order.total,
      efectivoRecibido,
      cambio,
      fecha: new Date()
    });
    await newSale.save();

    await Order.findByIdAndDelete(order._id);

    req.app.get('socketio').emit('pedido-actualizado', order);
    await Table.findByIdAndUpdate(id, { estado: 'LIBRE', ordenActual: null });

    res.json({ msg: "Caja cerrada" });
  } catch (error) {
    res.status(500).json({ msg: "Error al finalizar" });
  }
};

// --- 6. OBTENER ORDEN POR MESA ---
exports.getOrderByTable = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ mesaId: id, pagado: false });
    if (!order) return res.status(404).json({ msg: "No hay orden activa" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ msg: "Error", error: error.message });
  }
};
// --- 7. ELIMINAR UN PRODUCTO DE UNA ORDEN ACTIVA (Mesero cancela ítem) ---
exports.removeProductFromOrder = async (req, res) => {
  try {
    const { mesaId, productoId } = req.params; // Necesitamos saber de qué mesa y qué producto

    // 1. Buscamos la orden activa de esa mesa
    let order = await Order.findOne({ mesaId: mesaId, pagado: false });
    
    if (!order) {
      return res.status(404).json({ msg: "No hay orden activa para esta mesa" });
    }

    // 2. Buscamos el producto específico en el array de la orden
    // Usamos toString() para asegurar que la comparación de IDs de Mongoose funcione
    const indexToRemove = order.productos.findIndex(
      p => p._id.toString() === productoId || p.productoId.toString() === productoId
    );

    if (indexToRemove === -1) {
      return res.status(404).json({ msg: "El producto no existe en esta orden" });
    }

    // 3. Obtenemos el producto antes de borrarlo para saber cuánto restar al total
    const productoAEliminar = order.productos[indexToRemove];
    const subtotalRestar = productoAEliminar.precio * productoAEliminar.cantidad;

    // 4. Eliminamos el producto del array usando splice
    order.productos.splice(indexToRemove, 1);

    // 5. Restamos el valor del producto eliminado al total de la orden
    order.total -= subtotalRestar;

    // Opcional: Si el total queda en 0 o menos, podrías decidir cancelar toda la orden,
    // pero por ahora solo nos aseguramos de que no sea negativo.
    if (order.total < 0) order.total = 0;

    // 6. Guardamos los cambios
    await order.save();

    // 7. Emitimos por Socket.io para que cocina y otros meseros vean que desapareció
    const io = req.app.get('socketio');
    if (io) io.emit('pedido-actualizado', order);

    res.json({ msg: "Producto eliminado correctamente", order });

  } catch (error) {
    console.error("Error al eliminar producto de la orden:", error);
    res.status(500).json({ msg: "Error interno del servidor", error: error.message });
  }
};

// --- FUNCIONES AUXILIARES ---
async function validarStock(productos) {
  for (let item of productos) {
    const pId = item.productoId || item._id;
    const prod = await Product.findById(pId);
    if (!prod) throw new Error(`Producto no existe`);
    if (prod.stock < item.cantidad) throw new Error(`No hay stock de ${prod.nombre}`);
  }
}