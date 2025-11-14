const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Métodos/propiedades de genAI:', Object.keys(genAI));
    console.log('Propiedades del prototipo de genAI:', Object.getOwnPropertyNames(Object.getPrototypeOf(genAI)));
    // Mostrar cualquier método disponible en prototipo
    const protoMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(genAI)).filter(p => typeof genAI[p] === 'function');
    console.log('Métodos del prototipo:', protoMethods);
  } catch (err) {
    console.error('Error listando modelos:', err);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
}

listModels();
