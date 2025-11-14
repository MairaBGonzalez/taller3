const express = require('express');
const app = express();

console.log('1. Iniciando aplicación...');

app.use(express.json());
app.use(express.static('public'));

console.log('2. Middleware cargado...');

app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

console.log('3. Rutas definidas...');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor de prueba corriendo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Error:', err);
});

console.log('4. Servidor escuchando...');

process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Promesa rechazada:', reason);
});
