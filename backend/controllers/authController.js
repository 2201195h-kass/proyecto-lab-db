import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

export const register = async (req, res) => {
  const { nombre_usuario, correo, password, rol = 'cliente' } = req.body;

  try {
    // Verificar si el correo ya existe
    const userExists = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE correo = $1',
      [correo]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO usuarios (nombre_usuario, correo, password, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id_usuario, nombre_usuario, correo, rol`,
      [nombre_usuario, correo, hashedPassword, rol]
    );

    const user = result.rows[0];

    // Si es cliente, crear registro en tabla clientes
    if (rol === 'cliente') {
      await pool.query(
        `INSERT INTO clientes (id_usuario, nombre_cliente, correo)
         VALUES ($1, $2, $3)`,
        [user.id_usuario, nombre_usuario, correo]
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, correo: user.correo, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    // Buscar usuario
    const result = await pool.query(
      'SELECT id_usuario, nombre_usuario, correo, password, rol, activo FROM usuarios WHERE correo = $1',
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, correo: user.correo, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        correo: user.correo,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id_usuario, u.nombre_usuario, u.correo, u.rol, u.fecha_creacion,
              c.id_cliente, c.direccion, c.telefono
       FROM usuarios u
       LEFT JOIN clientes c ON u.id_usuario = c.id_usuario
       WHERE u.id_usuario = $1`,
      [req.user.id_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

