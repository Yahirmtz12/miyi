const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

// FUNCIÓN AUXILIAR: Extraer el ID para borrar de Cloudinary
const getPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  const parts = url.split('/');
  const folderAndFile = parts.slice(parts.indexOf('upload') + 2).join('/');
  return folderAndFile.split('.')[0];
};

// --- CREAR PRODUCTO ---
exports.createProduct = async (req, res) => {
  // Este mensaje DEBE aparecer en los logs de Render
  console.log("===> INTENTO DE CREACIÓN DETECTADO EN RENDER <===");
  
  try {
    const { nombre, precio, categoria, stock, imagen } = req.body;

    // Si no hay imagen, o no es base64, guardamos normal
    if (!imagen || !imagen.startsWith('data:image')) {
      console.log("⚠️ No se detectó imagen Base64. Guardando sin Cloudinary.");
      const product = new Product(req.body);
      await product.save();
      return res.json({ msg: 'Producto creado (sin imagen nueva)', product });
    }

    console.log("📸 Subiendo a Cloudinary...");
    
    // Subida asíncrona con el método que revisaste
    const result = await cloudinary.uploader.upload(imagen, {
      folder: "pollos_junior",
      resource_type: "auto"
    });

    console.log("✅ Imagen en Cloudinary:", result.secure_url);

    const product = new Product({
      nombre,
      precio,
      categoria,
      stock,
      imagen: result.secure_url // <--- AQUÍ SE SOBREESCRIBE EL BASE64
    });

    await product.save();
    res.status(201).json({ msg: 'Producto con Cloudinary creado', product });

  } catch (error) {
    // Si Cloudinary falla, lanzamos el error para verlo en Logs
    console.error("🔥 ERROR EN EL PROCESO:", error.message);
    res.status(500).json({ msg: 'Error fatal', error: error.message });
  }
};

// --- LISTAR PRODUCTOS ---
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate('categoryId', 'nombre')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener productos' });
  }
};

// --- ACTUALIZAR PRODUCTO (Aquí estaba el error) ---
exports.updateProduct = async (req, res) => {
  console.log("===> INICIANDO ACTUALIZACIÓN DE PRODUCTO <===");
  try {
    const { id } = req.params;
    const productExistente = await Product.findById(id);

    if (!productExistente) return res.status(404).json({ msg: 'No encontrado' });

    let updateData = { ...req.body };

    // Si la imagen que viene es NUEVA (es Base64)
    if (req.body.imagen && req.body.imagen.startsWith('data:image')) {
      console.log("📸 Detectada NUEVA imagen en Update. Procesando...");
      
      // 1. Borrar la vieja de Cloudinary para no gastar espacio
      const oldPublicId = getPublicId(productExistente.imagen);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId);
        console.log("🗑️ Imagen anterior borrada de Cloudinary");
      }

      // 2. Subir la nueva
      const result = await cloudinary.uploader.upload(req.body.imagen, {
        folder: "pollos_junior"
      });
      updateData.imagen = result.secure_url;
      console.log("✅ Nueva imagen subida (Update):", updateData.imagen);
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ msg: 'Producto actualizado con éxito', product });

  } catch (error) {
    console.error("❌ ERROR EN UPDATE:", error.message);
    res.status(500).json({ msg: 'Error al actualizar' });
  }
};

// --- ELIMINAR PRODUCTO ---
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: 'No encontrado' });

    // Borrar de Cloudinary
    const publicId = getPublicId(product.imagen);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log("🗑️ Imagen borrada de Cloudinary al eliminar producto");
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Producto e imagen eliminados' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar' });
  }
};