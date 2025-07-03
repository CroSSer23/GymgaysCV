// Простой endpoint для получения информации о последних сообщениях
// В реальном проекте здесь был бы доступ к базе данных или кэшу

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
    // Симуляція отримання останніх повідомлень
    // В реальному проекті тут був би запит до бази даних або API Telegram
    
    const mockMessages = [
      {
        id: Date.now(),
        user: 'Олександр',
        text: 'Привіт всім! Хто йде сьогодні в зал?',
        time: new Date().toLocaleTimeString('uk-UA', {hour: '2-digit', minute: '2-digit'}),
        type: 'incoming'
      }
    ];
    
    res.status(200).json({
      ok: true,
      messages: mockMessages,
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