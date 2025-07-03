// Глобальный массив для хранения недавних сообщений
let recentMessages = [];
const MAX_MESSAGES = 50;

// Функция для добавления сообщения в поток
function addMessageToStream(message) {
  recentMessages.unshift(message);
  
  // Ограничиваем количество сообщений
  if (recentMessages.length > MAX_MESSAGES) {
    recentMessages = recentMessages.slice(0, MAX_MESSAGES);
  }
  
  console.log(`📨 Добавлено сообщение в поток: ${message.user} - "${message.text}"`);
}

// Экспортируем функцию для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addMessageToStream };
}

// Vercel функция для Server-Sent Events
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

  // Налаштовуємо SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Відправляємо останні повідомлення
  if (recentMessages.length > 0) {
    const data = JSON.stringify({
      type: 'recent_messages',
      messages: recentMessages.slice(0, 10) // Останні 10 повідомлень
    });
    
    res.write(`data: ${data}\n\n`);
  }

  // Відправляємо heartbeat кожні 30 секунд
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
  }, 30000);

  // Обробка закриття з'єднання
  req.on('close', () => {
    clearInterval(heartbeat);
    console.log('📡 SSE connection closed');
  });

  req.on('aborted', () => {
    clearInterval(heartbeat);
    console.log('📡 SSE connection aborted');
  });

  // Відправляємо початкове повідомлення
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    message: 'З\'єднання встановлено',
    timestamp: Date.now()
  })}\n\n`);
};

// Експортуємо функцію для додавання повідомлень
module.exports.addMessageToStream = addMessageToStream; 