/**
 * Script de migración: Crear categorías iniciales y asignar categoryId a productos existentes
 * 
 * Ejecutar una sola vez:
 *   node scripts/migrate-categories.js
 * 
 * Lo que hace:
 *   1. Crea las categorías: Café, Té, Infusión, General
 *   2. Asigna categoryId = "General" a todos los productos de tipo "Venta" que no tengan categoryId
 *   3. Establece el campo "tipo" basándose en el campo "categoria" existente
 */
require('dotenv').config();
const mongoose = require('mongoose');

// Conectar a la BD
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rhythm';

async function migrate() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    const Category = require('../models/Category');
    const Product = require('../models/Product');

    // 1. Crear categorías iniciales
    const categoriasIniciales = ['Café', 'Té', 'Infusión', 'General'];
    
    for (const nombre of categoriasIniciales) {
      const existe = await Category.findOne({ nombre });
      if (!existe) {
        await Category.create({ nombre, activo: true });
        console.log(`  ✅ Categoría "${nombre}" creada`);
      } else {
        console.log(`  ⏭️  Categoría "${nombre}" ya existe`);
      }
    }

    // 2. Obtener la categoría "General" para asignar a productos sin categoría
    const generalCat = await Category.findOne({ nombre: 'General' });

    // 3. Actualizar productos existentes
    const productsSinCategory = await Product.find({ categoryId: null });
    console.log(`\n📦 Productos sin categoryId: ${productsSinCategory.length}`);

    for (const product of productsSinCategory) {
      const updateData = {
        categoryId: generalCat._id
      };

      // Si tiene 'categoria' pero no 'tipo', mapeamos
      if (product.categoria && !product.tipo) {
        updateData.tipo = product.categoria === 'Ingrediente' ? 'Ingrediente' : 'Venta';
      } else if (!product.tipo) {
        updateData.tipo = 'Venta';
      }

      await Product.findByIdAndUpdate(product._id, updateData);
      console.log(`  ✅ "${product.nombre}" → categoryId: General, tipo: ${updateData.tipo || product.tipo}`);
    }

    console.log('\n🎉 Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrate();
