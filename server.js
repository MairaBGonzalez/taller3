// server.js
const express = require('express');
const mariadb = require('mariadb');
require('dotenv').config();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Para soportar imágenes grandes en Base64

// Conexión a MariaDB (usando los datos del profe)
const pool = mariadb.createPool({
  host: process.env.DB_HOST,     // Ej: 192.168.1.50
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,     // Tu usuario asignado
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Ej: encuentrame_db
  connectionLimit: 5
});

// =========================
// 🔐 Autenticación JWT
// =========================

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Falta el token.' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Token inválido o expirado.' });
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

    const conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO usuarios (nombre, email, password, telefono, direccion) 
       VALUES (?, ?, ?, ?, ?)`,
      [nombre, email, hashedPassword, telefono, direccion]
    );
    conn.release();

    res.json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    if (error.sqlMessage && error.sqlMessage.includes('Duplicate entry')) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    console.error('Error en registro:', error);
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
    const conn = await pool.getConnection();
    const [usuario] = await conn.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    conn.release();

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
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Perfil del usuario
app.get('/api/perfil', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [usuario] = await conn.query(
      'SELECT id, nombre, email, telefono, direccion FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    conn.release();

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(usuario);
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
    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO mascotas 
       (usuario_id, nombre, tipo, raza, color_principal, edad_aproximada, descripcion, foto_url, estado, ubicacion_ultima)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, nombre, tipo, raza, color_principal, edad_aproximada, descripcion, foto_url, estado, ubicacion_ultima]
    );
    conn.release();

    res.json({ mensaje: 'Mascota publicada correctamente' });
  } catch (error) {
    console.error('Error al guardar mascota:', error);
    res.status(500).json({ error: 'Error al guardar la mascota' });
  }
});

// Listar todas las mascotas
app.get('/api/mascotas', async (req, res) => {
  let { tipo, estado, raza, color_principal, ubicacion_ultima } = req.query;
  let query = 'SELECT * FROM mascotas WHERE 1=1';
  let params = [];
  let paramIndex = 1;

  if (tipo) {
    query += ` AND tipo = ?`;
    params.push(tipo);
  }
  if (estado) {
    query += ` AND estado = ?`;
    params.push(estado);
  }
  if (raza) {
    query += ` AND raza LIKE ?`;
    params.push(`%${raza}%`);
  }
  if (color_principal) {
    query += ` AND color_principal LIKE ?`;
    params.push(`%${color_principal}%`);
  }
  if (ubicacion_ultima) {
    query += ` AND ubicacion_ultima LIKE ?`;
    params.push(`%${ubicacion_ultima}%`);
  }

  try {
    const conn = await pool.getConnection();
    const mascotas = await conn.query(query, params);
    conn.release();
    res.json(mascotas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mascotas' });
  }
});

// Mascotas del usuario logueado
app.get('/api/mascotas/usuario', authMiddleware, async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const mascotas = await conn.query(
      'SELECT * FROM mascotas WHERE usuario_id = ? ORDER BY creado_en DESC',
      [req.user.id]
    );
    conn.release();
    res.json(mascotas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus mascotas' });
  }
});

// =========================
// 🚀 Iniciar servidor
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// AGREGAR al inicio de server.js (o antes de usar Express y demás)
require('dotenv').config(); // Carga las variables de .env
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa el cliente de Gemini
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = "gemini-2.5-flash"; // Modelo ideal para chat rápido

// **(Resto de tus imports: express, pool, etc.)**
// const express = require('express');
// ...



//  función chatbot
async function getGeminiResponse(prompt) {
    // Instrucciones que guían el comportamiento del chatbot
    const systemInstruction = `Eres un asistente amable y servicial para una aplicación de búsqueda y registro de mascotas perdidas.
    Tu función es:
    1. Ayudar a los usuarios a encontrar sus mascotas perdidas (aunque no tienes acceso directo a la base de datos, puedes darles consejos sobre cómo usar la app o qué información registrar).
    2. Responder preguntas sobre el uso de la aplicación (cómo registrar una mascota, cómo contactar a otros usuarios, etc.).
    3. Mantener un tono empático y positivo. Si te preguntan algo fuera de tema, recuérdales tu función.
    `;

    try {
        const result = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        return result.text;
    } catch (error) {
        console.error("Error al llamar a la API de Gemini:", error);
        return "Lo siento, tuve un problema para conectarme con mi cerebro de IA. Por favor, inténtalo de nuevo más tarde.";
    }
}


// js/chatfront.js (Conceptual)
async function enviarMensaje(mensajeUsuario) {
    const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mensaje: mensajeUsuario }),
    });

    const data = await response.json();
    // Muestra data.respuesta en la caja del chat
    console.log(data.respuesta);
}