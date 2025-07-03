#!/bin/bash

echo "🚀 Деплой Gym Gays CV веб-чату на Vercel..."
echo ""

# Перевіряємо чи встановлено Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI не встановлено!"
    echo "Встановіть його за допомогою: npm install -g vercel"
    exit 1
fi

echo "📋 Перевірка файлів..."

# Перевіряємо основні файли
required_files=("index.html" "styles.css" "script.js" "api/telegram.js" "api/chat.js" "vercel.json")

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Файл $file не знайдено!"
        exit 1
    else
        echo "✅ $file"
    fi
done

echo ""
echo "📦 Перевірка package.json..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json не знайдено!"
    exit 1
fi

echo "✅ Всі файли готові для деплою"
echo ""

# Питаємо користувача про змінні оточення
echo "🔐 Перевірте змінні оточення в Vercel Dashboard:"
echo "   BOT_TOKEN - токен Telegram бота"
echo "   GOOGLE_SHEETS_ID - ID Google Таблиці"
echo "   GOOGLE_SERVICE_ACCOUNT_EMAIL - email сервісного акаунта"
echo "   GOOGLE_PRIVATE_KEY - приватний ключ сервісного акаунта"
echo ""

read -p "Змінні оточення налаштовані? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Спочатку налаштуйте змінні оточення в Vercel Dashboard"
    echo "Відвідайте: https://vercel.com/dashboard"
    exit 1
fi

echo "🚀 Запускаємо деплой..."
echo ""

# Запускаємо деплой
if vercel --prod; then
    echo ""
    echo "🎉 Деплой успішний!"
    echo ""
    echo "📱 Ваш веб-чат готовий до використання!"
    echo ""
    echo "🔗 Не забудьте оновити Telegram webhook:"
    echo "   curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook\" \\"
    echo "     -H \"Content-Type: application/json\" \\"
    echo "     -d '{\"url\": \"https://your-vercel-app.vercel.app/webhook\"}'"
    echo ""
    echo "💡 Корисні посилання:"
    echo "   📊 Vercel Dashboard: https://vercel.com/dashboard"
    echo "   🤖 Telegram Bot API: https://core.telegram.org/bots/api"
    echo "   📚 Документація: ./WEB-CHAT-README.md"
else
    echo ""
    echo "❌ Деплой не вдався!"
    echo "Перевірте логи вище для детальної інформації"
    exit 1
fi 