const { sendReplies } = require('../send-replies');

// Vercel функція
module.exports = async (req, res) => {
  // Встановлюємо CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обробка OPTIONS запиту (preflight)
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    console.log('🌐 Запит на відправку реплік через веб-інтерфейс');
    
    // Відправляємо заготовлені репліки
    await sendReplies();
    
    console.log('🤖 БОТ (ВЕБ РЕПЛІКИ): Всі репліки відправлені успішно');
    
    res.status(200).json({ 
      ok: true, 
      message: 'Всі репліки відправлені успішно!' 
    });

  } catch (error) {
    console.error('❌ Error sending replies via web:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Помилка при відправці реплік: ' + error.message 
    });
  }
}; 