// server.js
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a Supabase (PostgreSQL)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// =========================
// 🔐 Autenticación: JWT
// =========================

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Falta el token.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token inválido' });
  }
}

// =========================
// 🧑‍🤝‍🧑 Rutas: Usuarios
// =========================

// Registro
app.post('/api/registro', async (req, res) => {
  const { nombre, email, password, telefono, direccion } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, telefono, direccion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email`,
      [nombre, email, hashedPassword, telefono, direccion]
    );

    res.json({ mensaje: 'Usuario registrado correctamente', usuario: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    console.error(error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }

  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Perfil del usuario
app.get('/api/perfil', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, direccion, creado_en FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

// =========================
// 🐾 Rutas: Mascotas
// =========================

// Agregar mascota
app.post('/api/mascotas', authMiddleware, async (req, res) => {
  const { nombre, tipo, raza, color_principal, edad_aproximada, descripcion, foto_url, estado, ubicacion_ultima } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO mascotas 
       (usuario_id, nombre, tipo, raza, color_principal, edad_aproximada, descripcion, foto_url, estado, ubicacion_ultima)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, nombre, tipo, color_principal, edad_aproximada, descripcion, foto_url, estado, ubicacion_ultima, raza]
    );

    res.json({ mensaje: 'Mascota publicada correctamente', mascota: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al guardar la mascota' });
  }
});

// Listar mascotas (con filtros)
app.get('/api/mascotas', async (req, res) => {
  let { tipo, estado, raza, color_principal, ubicacion_ultima } = req.query;
  let query = `SELECT * FROM mascotas WHERE 1=1`;
  const params = [];
  let paramIndex = 1;

  if (tipo) {
    query += ` AND tipo = $${paramIndex}`;
    params.push(tipo);
    paramIndex++;
  }
  if (estado) {
    query += ` AND estado = $${paramIndex}`;
    params.push(estado);
    paramIndex++;
  }
  if (raza) {
    query += ` AND raza ILIKE $${paramIndex}`;
    params.push(`%${raza}%`);
    paramIndex++;
  }
  if (color_principal) {
    query += ` AND color_principal ILIKE $${paramIndex}`;
    params.push(`%${color_principal}%`);
    paramIndex++;
  }
  if (ubicacion_ultima) {
    query += ` AND ubicacion_ultima ILIKE $${paramIndex}`;
    params.push(`%${ubicacion_ultima}%`);
    paramIndex++;
  }

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mascotas' });
  }
});

// Mascotas del usuario
app.get('/api/mascotas/usuario', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM mascotas WHERE usuario_id = $1 ORDER BY creado_en DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus mascotas' });
  }
});

// =========================
// 🚀 Iniciar servidor
// =========================
app.get('/api/prueba', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ mensaje: "Conexión exitosa", fecha: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});