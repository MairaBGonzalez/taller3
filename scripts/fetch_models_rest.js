require('dotenv').config();
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('No se encontró GEMINI_API_KEY en .env');
  process.exit(1);
}

(async () => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    console.log('Respuesta List Models:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error llamando al endpoint REST de modelos:', err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
})();
