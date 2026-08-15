const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 1. Obtener todos los usuarios
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener los usuarios' });
  }
};

// 2. Actualizar contraseña
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 4 caracteres" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar password:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};

// 3. Registrar un nuevo usuario
exports.register = async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  try {
    let user = await User.findOne({ usuario });
    if (user) {
      return res.status(400).json({ msg: 'Este nombre de usuario ya está registrado' });
    }

    const userData = {
      nombre,
      usuario,
      password,
      rol: rol || 'cliente'
    };

    user = new User(userData);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.status(201).json({ 
      msg: 'Usuario creado exitosamente', 
      user: { nombre, usuario, rol: user.rol } 
    });
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ msg: 'Error al registrar el usuario' });
  }
};

// 4. Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
};

// 5. Actualizar rol de un usuario
exports.updateUserRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  const rolesPermitidos = ['admin', 'cliente'];
  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({ msg: 'Rol no válido. Debe ser admin o cliente.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id, 
      { rol }, 
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

    res.json({ 
      msg: `Permisos actualizados: ${user.usuario} ahora es ${user.rol}`,
      user 
    });
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar el rango del usuario' });
  }
};

// 6. Eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ msg: "No puedes eliminar tu propia cuenta" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({ msg: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error al eliminar el usuario" });
  }
};

// 7. Actualizar teléfono
exports.updatePhone = async (req, res) => {
  try {
    const { telefono } = req.body;

    if (!telefono || telefono.length < 10) {
      return res.status(400).json({ msg: "El número telefónico debe tener al menos 10 dígitos" });
    }

    const telefonoLimpio = telefono.replace(/\D/g, '');

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { telefono: telefonoLimpio },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    res.json({ msg: "Teléfono actualizado correctamente", telefono: user.telefono });
  } catch (error) {
    console.error("Error al actualizar teléfono:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};