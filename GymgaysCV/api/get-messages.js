// Підключаємо сховище повідомлень
let messagesStore;
try {
  messagesStore = require('./messages-store');
} catch (e) {
  // Якщо модуль не доступний, повертаємо пусті дані
  messagesStore = {
    getRecentMessages: () => []
  };
}

// Vercel функция
module.exports = async (req, res) => {
  // Встановлюємо CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обробка OPTIONS запиту (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Отримуємо реальні повідомлення з сховища
    const messages = messagesStore.getRecentMessages(20);
    
    res.status(200).json({
      ok: true,
      messages: messages,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ Error in get-messages API:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Помилка при отриманні повідомлень' 
    });
  }
}; 