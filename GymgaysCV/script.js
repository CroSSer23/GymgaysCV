// Глобальні змінні
let socket = null;
let isConnected = false;
let currentUser = null;
let messages = [];
let chatId = '-1001825402015'; // ID групи "Качки Чернівці"

// DOM елементи
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const connectionStatus = document.getElementById('connectionStatus');
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const cancelSettings = document.getElementById('cancelSettings');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');

// Ініціалізація
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Ініціалізація веб-чату...');
    
    // Завантажуємо налаштування користувача
    loadUserSettings();
    
    // Ініціалізуємо підключення
    initializeConnection();
    
    // Налаштовуємо обробники подій
    setupEventListeners();
    
    // Завантажуємо початкові повідомлення
    loadMessages();
    
    // Показуємо статус підключення
    showConnectionStatus('Підключення...', 'connecting');
});

// Завантаження налаштувань користувача
function loadUserSettings() {
    const savedSettings = localStorage.getItem('gymChatSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        currentUser = {
            name: settings.userName || 'Анонім',
            telegramId: settings.telegramId || null,
            soundNotifications: settings.soundNotifications || true,
            desktopNotifications: settings.desktopNotifications || true
        };
        
        // Заповнюємо форму налаштувань
        if (document.getElementById('userName')) {
            document.getElementById('userName').value = currentUser.name;
            document.getElementById('telegramId').value = currentUser.telegramId || '';
            document.getElementById('soundNotifications').checked = currentUser.soundNotifications;
            document.getElementById('desktopNotifications').checked = currentUser.desktopNotifications;
        }
    } else {
        currentUser = {
            name: 'Анонім',
            telegramId: null,
            soundNotifications: true,
            desktopNotifications: true
        };
    }
    
    console.log('👤 Користувач:', currentUser);
}

// Збереження налаштувань
function saveUserSettings() {
    const settings = {
        userName: currentUser.name,
        telegramId: currentUser.telegramId,
        soundNotifications: currentUser.soundNotifications,
        desktopNotifications: currentUser.desktopNotifications
    };
    
    localStorage.setItem('gymChatSettings', JSON.stringify(settings));
    console.log('💾 Налаштування збережено');
}

// Ініціалізація підключення
async function initializeConnection() {
    try {
        // Перевіряємо API підключення
        await testApiConnection();
        
        showConnectionStatus('Підключено', 'connected');
        isConnected = true;
        
    } catch (error) {
        console.error('❌ Помилка підключення:', error);
        showConnectionStatus('Помилка підключення', 'disconnected');
        isConnected = false;
        
        // Повторюємо спробу через 5 секунд
        setTimeout(initializeConnection, 5000);
    }
}

// Тестування API підключення
async function testApiConnection() {
    try {
        const response = await fetch('/api/status');
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API доступний:', data);
        } else {
            throw new Error('API недоступний');
        }
    } catch (error) {
        console.log('⚠️ API недоступний, працюємо в демо режимі');
        throw error;
    }
}

// Налаштування обробників подій
function setupEventListeners() {
    // Відправка повідомлення
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Модальне вікно налаштувань
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettings);
    }
    if (closeSettings) {
        closeSettings.addEventListener('click', closeSettingsModal);
    }
    if (cancelSettings) {
        cancelSettings.addEventListener('click', closeSettingsModal);
    }
    if (saveSettings) {
        saveSettings.addEventListener('click', saveSettingsAndClose);
    }
    
    // Закриття модального вікна по кліку поза ним
    if (settingsModal) {
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
    
    // Мобільне меню
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
        
        // Закриття сайдбару на мобільних при кліку поза ним
        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
    
    // Сповіщення про дозволи
    if ('Notification' in window && currentUser.desktopNotifications) {
        Notification.requestPermission();
    }
}

// Відправка повідомлення
async function sendMessage() {
    const text = messageInput ? messageInput.value.trim() : '';
    if (!text) return;
    
    const message = {
        id: Date.now().toString(),
        text: text,
        sender: currentUser.name,
        timestamp: Date.now(),
        type: 'outgoing'
    };
    
    try {
        // Додаємо повідомлення в UI
        addMessageToUI(message);
        
        // Очищуємо поле вводу
        if (messageInput) {
            messageInput.value = '';
        }
        
        // Відправляємо повідомлення через API (якщо доступний)
        if (isConnected) {
            await sendMessageToAPI(text);
            updateMessageStatus(message.id, 'sent');
        }
        
    } catch (error) {
        console.error('❌ Помилка відправки повідомлення:', error);
        updateMessageStatus(message.id, 'error');
        showNotification('Помилка відправки повідомлення', 'error');
    }
}

// Відправка повідомлення через API
async function sendMessageToAPI(text) {
    const response = await fetch('/api/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            chatId: chatId,
            sender: currentUser.name,
            telegramId: currentUser.telegramId
        })
    });
    
    if (!response.ok) {
        throw new Error('Помилка відправки повідомлення');
    }
    
    return await response.json();
}

// Завантаження повідомлень
async function loadMessages() {
    try {
        if (isConnected) {
            const response = await fetch(`/api/messages?chatId=${chatId}&limit=50`);
            if (response.ok) {
                const data = await response.json();
                messages = data.messages || [];
                renderMessages();
                return;
            }
        }
        
        // Показуємо демо повідомлення якщо API недоступний
        showDemoMessages();
        
    } catch (error) {
        console.error('❌ Помилка завантаження повідомлень:', error);
        showDemoMessages();
    }
}

// Показ демо повідомлень
function showDemoMessages() {
    const demoMessages = [
        {
            id: '1',
            text: 'Привіт всім! Хто сьогодні йде в зал? 🏋️‍♂️',
            sender: 'Андрій',
            timestamp: Date.now() - 3600000,
            type: 'incoming'
        },
        {
            id: '2',
            text: 'Я вже тут! Чекаю на вас 💪',
            sender: currentUser.name,
            timestamp: Date.now() - 3480000,
            type: 'outgoing'
        },
        {
            id: '3',
            text: 'Хлопці, хто знає графік роботи залу на вихідних?',
            sender: 'Максим',
            timestamp: Date.now() - 1800000,
            type: 'incoming'
        }
    ];
    
    messages = demoMessages;
    renderMessages();
}

// Рендеринг повідомлень
function renderMessages() {
    if (!messagesContainer) return;
    
    const messagesList = messagesContainer.querySelector('.messages-list') || createMessagesList();
    messagesList.innerHTML = '';
    
    messages.forEach(message => {
        addMessageToUI(message, false);
    });
    
    scrollToBottom();
}

// Створення контейнера для повідомлень
function createMessagesList() {
    if (!messagesContainer) return null;
    
    const messagesList = document.createElement('div');
    messagesList.className = 'messages-list';
    
    // Видаляємо демо повідомлення
    const demoMessages = messagesContainer.querySelectorAll('.message');
    demoMessages.forEach(msg => msg.remove());
    
    messagesContainer.appendChild(messagesList);
    return messagesList;
}

// Додавання повідомлення в UI
function addMessageToUI(message, animate = true) {
    if (!messagesContainer) return;
    
    const messagesList = messagesContainer.querySelector('.messages-list') || createMessagesList();
    if (!messagesList) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    messageElement.setAttribute('data-id', message.id);
    
    if (animate) {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
    }
    
    const time = new Date(message.timestamp).toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    if (message.type === 'incoming') {
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <span class="sender-name">${escapeHtml(message.sender)}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${escapeHtml(message.text)}</div>
            </div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="message-content">
                <div class="message-header">
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${escapeHtml(message.text)}</div>
                <div class="message-status">
                    <i class="fas fa-clock" data-status="sending"></i>
                </div>
            </div>
        `;
    }
    
    messagesList.appendChild(messageElement);
    
    if (animate) {
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease-out';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);
    }
    
    scrollToBottom();
    
    // Звукове сповіщення для вхідних повідомлень
    if (message.type === 'incoming' && currentUser.soundNotifications) {
        playNotificationSound();
    }
    
    // Десктопне сповіщення
    if (message.type === 'incoming' && currentUser.desktopNotifications) {
        showDesktopNotification(message);
    }
}

// Оновлення статусу повідомлення
function updateMessageStatus(messageId, status) {
    const messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (!messageElement) return;
    
    const statusIcon = messageElement.querySelector('.message-status i');
    if (!statusIcon) return;
    
    switch (status) {
        case 'sent':
            statusIcon.className = 'fas fa-check';
            statusIcon.setAttribute('data-status', 'sent');
            break;
        case 'delivered':
            statusIcon.className = 'fas fa-check-double';
            statusIcon.setAttribute('data-status', 'delivered');
            break;
        case 'read':
            statusIcon.className = 'fas fa-check-double read';
            statusIcon.setAttribute('data-status', 'read');
            break;
        case 'error':
            statusIcon.className = 'fas fa-exclamation-triangle';
            statusIcon.setAttribute('data-status', 'error');
            statusIcon.style.color = '#ef4444';
            break;
    }
}

// Прокрутка до низу
function scrollToBottom(smooth = true) {
    if (!messagesContainer) return;
    
    setTimeout(() => {
        messagesContainer.scrollTo({
            top: messagesContainer.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }, 10);
}

// Показ статусу підключення
function showConnectionStatus(text, status) {
    if (!connectionStatus) return;
    
    connectionStatus.textContent = text;
    connectionStatus.className = `connection-status show ${status}`;
    
    setTimeout(() => {
        connectionStatus.classList.remove('show');
    }, 3000);
}

// Показ сповіщення
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Звукове сповіщення
function playNotificationSound() {
    try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmsiFjiZtvHSeSwE');
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (error) {
        console.log('Не вдалося відтворити звук сповіщення');
    }
}

// Десктопне сповіщення
function showDesktopNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${message.sender}`, {
            body: message.text.substring(0, 100),
            icon: '/favicon.ico',
            tag: 'gym-chat'
        });
    }
}

// Відкриття налаштувань
function openSettings() {
    if (settingsModal) {
        settingsModal.style.display = 'block';
        const userNameInput = document.getElementById('userName');
        if (userNameInput) {
            userNameInput.focus();
        }
    }
}

// Закриття налаштувань
function closeSettingsModal() {
    if (settingsModal) {
        settingsModal.style.display = 'none';
    }
}

// Збереження налаштувань та закриття
function saveSettingsAndClose() {
    const userNameInput = document.getElementById('userName');
    const telegramIdInput = document.getElementById('telegramId');
    const soundCheckbox = document.getElementById('soundNotifications');
    const desktopCheckbox = document.getElementById('desktopNotifications');
    
    if (userNameInput) {
        currentUser.name = userNameInput.value.trim() || 'Анонім';
    }
    if (telegramIdInput) {
        currentUser.telegramId = telegramIdInput.value.trim() || null;
    }
    if (soundCheckbox) {
        currentUser.soundNotifications = soundCheckbox.checked;
    }
    if (desktopCheckbox) {
        currentUser.desktopNotifications = desktopCheckbox.checked;
    }
    
    saveUserSettings();
    closeSettingsModal();
    
    showNotification('Налаштування збережено', 'success');
}

// Escape HTML для безпеки
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Автоматичне оновлення повідомлень
setInterval(() => {
    if (isConnected) {
        loadMessages();
    }
}, 30000); // Кожні 30 секунд 