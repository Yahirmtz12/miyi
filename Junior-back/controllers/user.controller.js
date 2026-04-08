const User = require('../models/User'); // Ajusta a tu modelo de Mongoose
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // <--- ¡ESTA ES LA LÍNEA CLAVE!
// 1. Obtener todos los usuarios (Excluyendo la contraseña por seguridad)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener los empleados de Mr. Pollo' });
  }
};
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // 1. Validaciones básicas
    if (!password || password.length < 4) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 4 caracteres" });
    }

    // 2. Buscar al usuario
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    // 3. ENCRIPTAR la nueva contraseña
    // Generamos un "salt" (semilla de seguridad)
    const salt = await bcrypt.genSalt(10);
    // Reemplazamos el password con la versión encriptada
    user.password = await bcrypt.hash(password, salt);

    // 4. Guardar en la base de datos
    await user.save();

    res.json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar password:", error);
    res.status(500).json({ msg: "Error interno del servidor" });
  }
};
// 2. Registrar un nuevo usuario (Desde el panel de Admin)
exports.register = async (req, res) => {
  const { nombre, usuario, password, rol } = req.body;

  try {
    // 1. Verificar si el usuario ya existe
    let user = await User.findOne({ usuario });
    if (user) {
      return res.status(400).json({ msg: 'Este nombre de usuario ya está registrado' });
    }

    // 2. Definimos el objeto base del usuario
    const userData = {
      nombre,
      usuario,
      password,
      rol: rol || 'cliente'
    };

    // 3. Lógica condicional: Solo agregar membershipId si es cliente
    if (rol === 'cliente') {
      userData.membershipId = "PJ-" + crypto.randomBytes(3).toString('hex').toUpperCase();
    }

    // 4. Creamos la instancia con el objeto que puede o no tener membershipId
    user = new User(userData);

    // 5. Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 6. Guardar en BD
    await user.save();

    res.status(201).json({ 
      msg: 'Usuario creado exitosamente', 
      user: { 
        nombre, 
        usuario, 
        rol: user.rol, 
        // Si no existe, devolverá undefined en lugar de null
        membershipId: user.membershipId 
      } 
    });
  } catch (error) {
    console.error("Error detallado:", error);
    res.status(500).json({ msg: 'Error al registrar el usuario' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    // req.user.id viene de tu middleware de autenticación (JWT)
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener perfil" });
  }
};
exports.addPoints = async (req, res) => {
  const { membershipId, montoCompra, tipoAccion } = req.body;

  try {
    const user = await User.findOne({ membershipId });
    if (!user) return res.status(404).json({ msg: "Cliente no encontrado" });

    const monto = parseFloat(montoCompra);
    if (!user.visitas) user.visitas = [];

    if (tipoAccion === "redeem") {
      // CANJE: Resta directa
      const puntosARestar = Math.abs(monto);
      if (user.puntos < puntosARestar) return res.status(400).json({ msg: "Puntos insuficientes" });
      user.puntos -= puntosARestar;
    } else {
      // AGREGAR: Suma el 2%
      user.puntos += (monto * 0.02);

      // LÓGICA DE VISITA ÚNICA POR DÍA
      const hoy = new Date().toLocaleDateString("sv-SE", { 
        timeZone: "America/Mexico_City" 
      }); 
      // "sv-SE" devuelve formato YYYY-MM-DD automáticamente, muy útil para bases de datos.
      
      // Verificamos si ya existe esa fecha en el historial
      const yaVisitoHoy = user.visitas.some(v => v.toString().includes(hoy));

      if (!yaVisitoHoy) {
        user.visitas.push(hoy); 
      }
    }

    await user.save();
    res.json({ msg: "Puntos actualizados", cliente: user.nombre, puntosActuales: user.puntos });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ msg: "Error al procesar la solicitud" });
  }
};
exports.updateUserRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  // Validar que el rol sea uno de los permitidos
  const rolesPermitidos = ['admin', 'cajero','cliente','mesero','cocinero','kiosko',];
  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({ msg: 'Rol no válido. Debe ser admin o cajero.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id, 
      { rol }, 
      { new: true } // Esto devuelve el usuario ya actualizado
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
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Evitar que el admin se borre a sí mismo
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
// Obtener información de un miembro por su ID de membresía (Para el escáner)
exports.getMemberById = async (req, res) => {
  const { membershipId } = req.params;

  try {
    // 1. Seleccionamos los campos necesarios para la academia
    // Quitamos 'puntos' (si ya no los usas) y agregamos clases y vencimiento
    const user = await User.findOne({ membershipId })
      .select('nombre clasesDisponibles fechaVencimiento rol');

    if (!user) {
      return res.status(404).json({ 
        msg: 'Código de membresía no válido o alumno no encontrado' 
      });
    }

    // 2. Lógica de validación instantánea
    const hoy = new Date();
    let estadoMembresia = "activa";
    let mensajeEstado = "Acceso permitido";

    // ¿Ya se pasó de la fecha?
    if (user.fechaVencimiento && user.fechaVencimiento < hoy) {
      estadoMembresia = "vencida";
      mensajeEstado = "El mes ha finalizado. Requiere renovación.";
    } 
    // ¿Tiene fecha vigente pero ya no tiene clases?
    else if (user.clasesDisponibles <= 0) {
      estadoMembresia = "sin_clases";
      mensajeEstado = "Sin clases disponibles. Favor de recargar.";
    }

    // 3. Respuesta enriquecida para el frontend
    res.status(200).json({
      nombre: user.nombre,
      clasesDisponibles: user.clasesDisponibles,
      disciplina: user.disciplina, // <--- Aquí pasamos la disciplina al escáner
      fechaVencimiento: user.fechaVencimiento,
      status: estadoMembresia, // Esto te servirá para poner colores (Rojo/Verde) en React
      mensaje: mensajeEstado
    });

  } catch (error) {
    console.error("Error al buscar miembro:", error);
    res.status(500).json({ msg: 'Error al consultar el servidor' });
  }
};
exports.renewMembership = async (req, res) => {
  try {
    // 1. Agregamos 'disciplina' a los datos que recibimos del body
    const { membershipId, cantidadClases, disciplina } = req.body;
    
    // Calculamos la fecha actual + 30 días
    const nuevaFechaVencimiento = new Date();
    nuevaFechaVencimiento.setDate(nuevaFechaVencimiento.getDate() + 30);

    // 2. Preparamos el objeto con los datos a actualizar
    const datosActualizar = { 
      clasesDisponibles: cantidadClases, 
      fechaVencimiento: nuevaFechaVencimiento,
      asistencias: [] // Reiniciamos las asistencias del mes
    };

    // 3. Validamos: Si mandaron una disciplina nueva, la agregamos a la actualización
    if (disciplina) {
      datosActualizar.disciplina = disciplina;
    }

    const alumnoActualizado = await User.findOneAndUpdate(
      { membershipId: membershipId },
      datosActualizar, // Usamos nuestro objeto dinámico
      { new: true } 
    );

    if (!alumnoActualizado) {
      return res.status(404).json({ msg: "Alumno no encontrado" });
    }

    res.json({ msg: "Membresía renovada con éxito", alumno: alumnoActualizado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.registerAttendance = async (req, res) => {
  try {
    const { membershipId, nombreClase } = req.body;
    const hoy = new Date();

    // 1. Buscamos al alumno
    const alumno = await User.findOne({ membershipId });

    if (!alumno) {
      return res.status(404).json({ msg: "Membresía no válida" });
    }

    // 2. Validar Fecha de Vencimiento
    if (alumno.fechaVencimiento < hoy) {
      return res.status(403).json({ msg: "Tu mes ha vencido. Por favor pasa a recepción." });
    }

    // 3. Validar Clases Disponibles
    if (alumno.clasesDisponibles <= 0) {
      return res.status(403).json({ msg: "Ya no tienes clases disponibles este mes." });
    }

    // 4. Si todo está bien, descontamos 1 clase y registramos la visita
    alumno.clasesDisponibles -= 1;
    alumno.asistencias.push({ fecha: hoy});
    
    await alumno.save();

    res.json({ 
      msg: "Acceso concedido", 
      clasesRestantes: alumno.clasesDisponibles 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};