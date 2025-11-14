const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const candidates = [
  'models/text-bison-001',
  'models/chat-bison-001',
  'models/gemini-1.5',
  'models/gemini-1.5-pro',
  'models/gemini-1.0'
];

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  for (const name of candidates) {
    console.log('\nProbando modelo:', name);
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent('Prueba corta');
      console.log('Respuesta para', name, ':', res);
    } catch (err) {
      console.error('Error para', name, ':', err?.message || err);
      if (err && err.stack) console.error(err.stack);
    }
  }
}

test();
