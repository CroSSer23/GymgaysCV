const TelegramBot = require('node-telegram-bot-api');

// Імпорт конфігурації з основного telegram.js
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID || '-1001825402015'; // Качки Чернівці

// Ініціалізація бота
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

// Зберігання повідомлень в пам'яті (для демо, краще використовувати базу даних)
let messages = [];
let messageId = 1;

// Логування ініціалізації
console.log('💬 Chat API initialized');
console.log('🔑 Token available:', !!BOT_TOKEN);

// API ендпоінт для отримання статусу
async function getStatus(req, res) {
    try {
        const botInfo = await bot.getMe();
        res.json({
            status: 'online',
            bot: botInfo,
            timestamp: new Date().toISOString(),
            messagesCount: messages.length
        });
    } catch (error) {
        console.error('❌ Error getting bot status:', error);
        res.status(500).json({
            status: 'error',
            message: 'Bot not available',
            timestamp: new Date().toISOString()
        });
    }
}

// API ендпоінт для відправки повідомлення
async function sendMessage(req, res) {
    try {
        const { text, chatId = CHAT_ID, sender = 'Web User', telegramId } = req.body;
        
        if (!text || !text.trim()) {
            return res.status(400).json({
                error: 'Message text is required'
            });
        }
        
        console.log('📤 Sending message to Telegram:', {
            text: text.substring(0, 50) + '...',
            chatId,
            sender
        });
        
        // Формуємо повідомлення для Telegram
        let telegramMessage = text;
        
        // Додаємо підпис відправника якщо це не Telegram користувач
        if (!telegramId && sender !== 'Web User') {
            telegramMessage = `💻 ${sender}: ${text}`;
        }
        
        // Відправляємо повідомлення в Telegram
        const sentMessage = await bot.sendMessage(chatId, telegramMessage, {
            parse_mode: 'HTML',
            disable_web_page_preview: true
        });
        
        // Зберігаємо повідомлення
        const message = {
            id: messageId++,
            text: text,
            sender: sender,
            timestamp: Date.now(),
            telegramMessageId: sentMessage.message_id,
            chatId: chatId,
            telegramId: telegramId || null,
            source: 'web'
        };
        
        messages.push(message);
        
        // Зберігаємо тільки останні 1000 повідомлень
        if (messages.length > 1000) {
            messages = messages.slice(-1000);
        }
        
        console.log('✅ Message sent successfully:', message.id);
        
        res.json({
            success: true,
            message: message,
            telegramMessageId: sentMessage.message_id
        });
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({
            error: 'Failed to send message',
            details: error.message
        });
    }
}

// API ендпоінт для отримання повідомлень
async function getMessages(req, res) {
    try {
        const { chatId = CHAT_ID, limit = 50, offset = 0 } = req.query;
        
        // Фільтруємо повідомлення по чату
        const chatMessages = messages.filter(msg => msg.chatId === chatId);
        
        // Сортуємо по часу (найновіші в кінці)
        chatMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        // Застосовуємо пагінацію
        const startIndex = Math.max(0, chatMessages.length - parseInt(limit) - parseInt(offset));
        const endIndex = chatMessages.length - parseInt(offset);
        const paginatedMessages = chatMessages.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            messages: paginatedMessages.map(msg => ({
                id: msg.id,
                text: msg.text,
                sender: msg.sender,
                timestamp: msg.timestamp,
                source: msg.source,
                type: msg.source === 'web' ? 'outgoing' : 'incoming'
            })),
            total: chatMessages.length,
            hasMore: startIndex > 0
        });
        
    } catch (error) {
        console.error('❌ Error getting messages:', error);
        res.status(500).json({
            error: 'Failed to get messages',
            details: error.message
        });
    }
}

// API ендпоінт для отримання інформації про чат
async function getChatInfo(req, res) {
    try {
        const { chatId = CHAT_ID } = req.params;
        
        const chatInfo = await bot.getChat(chatId);
        const membersCount = await bot.getChatMembersCount(chatId);
        
        res.json({
            success: true,
            chat: {
                id: chatInfo.id,
                title: chatInfo.title,
                type: chatInfo.type,
                description: chatInfo.description,
                membersCount: membersCount
            }
        });
        
    } catch (error) {
        console.error('❌ Error getting chat info:', error);
        res.status(500).json({
            error: 'Failed to get chat info',
            details: error.message
        });
    }
}

// Функція для обробки вхідних повідомлень з Telegram
function handleTelegramMessage(msg) {
    try {
        // Пропускаємо повідомлення від бота
        if (msg.from.is_bot) return;
        
        // Зберігаємо повідомлення з Telegram
        const message = {
            id: messageId++,
            text: msg.text || '[Медіа файл]',
            sender: msg.from.first_name || msg.from.username || 'Невідомий',
            timestamp: msg.date * 1000, // Конвертуємо Unix timestamp в мілісекунди
            telegramMessageId: msg.message_id,
            chatId: msg.chat.id.toString(),
            telegramId: msg.from.id,
            source: 'telegram'
        };
        
        messages.push(message);
        
        // Зберігаємо тільки останні 1000 повідомлень
        if (messages.length > 1000) {
            messages = messages.slice(-1000);
        }
        
        console.log('📥 New Telegram message received:', {
            id: message.id,
            sender: message.sender,
            text: message.text.substring(0, 50) + '...'
        });
        
    } catch (error) {
        console.error('❌ Error handling Telegram message:', error);
    }
}

// API ендпоінт для видалення повідомлення
async function deleteMessage(req, res) {
    try {
        const { messageId, chatId = CHAT_ID } = req.body;
        
        if (!messageId) {
            return res.status(400).json({
                error: 'Message ID is required'
            });
        }
        
        // Знаходимо повідомлення
        const messageIndex = messages.findIndex(msg => 
            msg.id === parseInt(messageId) && msg.chatId === chatId
        );
        
        if (messageIndex === -1) {
            return res.status(404).json({
                error: 'Message not found'
            });
        }
        
        const message = messages[messageIndex];
        
        // Видаляємо з Telegram якщо є telegram message ID
        if (message.telegramMessageId) {
            try {
                await bot.deleteMessage(chatId, message.telegramMessageId);
            } catch (error) {
                console.error('❌ Failed to delete from Telegram:', error);
                // Продовжуємо видалення з локального сховища навіть якщо не вдалося видалити з Telegram
            }
        }
        
        // Видаляємо з локального сховища
        messages.splice(messageIndex, 1);
        
        res.json({
            success: true,
            message: 'Message deleted'
        });
        
    } catch (error) {
        console.error('❌ Error deleting message:', error);
        res.status(500).json({
            error: 'Failed to delete message',
            details: error.message
        });
    }
}

// API ендпоінт для редагування повідомлення
async function editMessage(req, res) {
    try {
        const { messageId, newText, chatId = CHAT_ID } = req.body;
        
        if (!messageId || !newText) {
            return res.status(400).json({
                error: 'Message ID and new text are required'
            });
        }
        
        // Знаходимо повідомлення
        const messageIndex = messages.findIndex(msg => 
            msg.id === parseInt(messageId) && msg.chatId === chatId
        );
        
        if (messageIndex === -1) {
            return res.status(404).json({
                error: 'Message not found'
            });
        }
        
        const message = messages[messageIndex];
        
        // Редагуємо в Telegram якщо є telegram message ID
        if (message.telegramMessageId) {
            try {
                await bot.editMessageText(newText, {
                    chat_id: chatId,
                    message_id: message.telegramMessageId
                });
            } catch (error) {
                console.error('❌ Failed to edit in Telegram:', error);
                return res.status(500).json({
                    error: 'Failed to edit message in Telegram',
                    details: error.message
                });
            }
        }
        
        // Оновлюємо в локальному сховищі
        messages[messageIndex].text = newText;
        messages[messageIndex].edited = true;
        messages[messageIndex].editedAt = Date.now();
        
        res.json({
            success: true,
            message: messages[messageIndex]
        });
        
    } catch (error) {
        console.error('❌ Error editing message:', error);
        res.status(500).json({
            error: 'Failed to edit message',
            details: error.message
        });
    }
}

// Головний обробник для Vercel
module.exports = async (req, res) => {
    // Встановлюємо CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Обробляємо OPTIONS запити для CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    const { method } = req;
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    
    try {
        // Маршрутизація API
        if (pathname === '/api/status' && method === 'GET') {
            await getStatus(req, res);
        } else if (pathname === '/api/send-message' && method === 'POST') {
            await sendMessage(req, res);
        } else if (pathname === '/api/messages' && method === 'GET') {
            await getMessages(req, res);
        } else if (pathname.startsWith('/api/chat-info') && method === 'GET') {
            await getChatInfo(req, res);
        } else if (pathname === '/api/delete-message' && method === 'DELETE') {
            await deleteMessage(req, res);
        } else if (pathname === '/api/edit-message' && method === 'PUT') {
            await editMessage(req, res);
        } else {
            res.status(404).json({
                error: 'API endpoint not found',
                available_endpoints: [
                    'GET /api/status',
                    'POST /api/send-message',
                    'GET /api/messages',
                    'GET /api/chat-info',
                    'DELETE /api/delete-message',
                    'PUT /api/edit-message'
                ]
            });
        }
    } catch (error) {
        console.error('❌ API Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Експорт функцій для використання в основному Telegram API
module.exports.handleTelegramMessage = handleTelegramMessage;
module.exports.messages = messages; 