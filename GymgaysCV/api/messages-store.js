// Глобальне сховище повідомлень для веб-інтерфейсу
let messagesStore = [];
const MAX_MESSAGES = 100;

// Функція для додавання повідомлення в сховище
function addMessage(message) {
  const messageObj = {
    id: Date.now() + Math.random(), // Унікальний ID
    user: message.user,
    text: message.text,
    time: message.time || new Date().toLocaleTimeString('uk-UA', {hour: '2-digit', minute: '2-digit'}),
    type: message.type || 'incoming',
    timestamp: Date.now()
  };
  
  messagesStore.unshift(messageObj);
  
  // Обмежуємо кількість повідомлень
  if (messagesStore.length > MAX_MESSAGES) {
    messagesStore = messagesStore.slice(0, MAX_MESSAGES);
  }
  
  console.log(`📨 Додано в сховище: ${messageObj.user} - "${messageObj.text}"`);
  return messageObj;
}

// Функція для отримання останніх повідомлень
function getRecentMessages(limit = 20) {
  return messagesStore.slice(0, limit);
}

// Функція для очищення старих повідомлень
function cleanOldMessages() {
  const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 година тому
  messagesStore = messagesStore.filter(msg => msg.timestamp > oneHourAgo);
}

// Очищення кожні 30 хвилин
setInterval(cleanOldMessages, 30 * 60 * 1000);

module.exports = {
  addMessage,
  getRecentMessages,
  cleanOldMessages
}; 