// Тимчасове рішення: використовуємо глобальну змінну в рамках виконання функції
global.tempMessages = global.tempMessages || [];

// Функція для отримання останніх повідомлень
function getRecentMessages(limit = 20) {
  return global.tempMessages.slice(0, limit);
}

// Функція для додавання повідомлення (буде викликатися з telegram.js)
function addTempMessage(message) {
  const messageObj = {
    id: Date.now() + Math.random(),
    user: message.user,
    text: message.text,
    time: new Date().toLocaleTimeString('uk-UA', {hour: '2-digit', minute: '2-digit'}),
    type: message.type || 'incoming',
    timestamp: Date.now()
  };
  
  global.tempMessages.unshift(messageObj);
  
  // Обмежуємо до 20 повідомлень
  if (global.tempMessages.length > 20) {
    global.tempMessages = global.tempMessages.slice(0, 20);
  }
  
  console.log(`📨 Додано в temp: ${messageObj.user} - "${messageObj.text}"`);
  return messageObj;
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
    // Отримуємо повідомлення з глобальної змінної
    const messages = getRecentMessages(20);
    
    console.log(`📤 Відправляємо ${messages.length} повідомлень до веб-інтерфейсу`);
    
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

// Експортуємо функцію для тестування
module.exports.addTempMessage = addTempMessage; 