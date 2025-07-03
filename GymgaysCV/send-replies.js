const fs = require('fs');

const BOT_TOKEN = '7015889086:AAG1R8efw5Bt0Z1CZg0DiX_ohi5N7f1E6xI';
const CHAT_ID = '-1001825402015'; // Качки Чернівці

async function sendMessage(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: 'HTML'
        })
    });
    
    const result = await response.json();
    console.log(`Статус: ${response.status}`);
    console.log(`Відповідь:`, result);
    console.log('---');
    return result;
}

async function sendReplies() {
    console.log('🤖 Відправляю реплії...\n');
    
    // Ответ Диме про токсичность и русский язык
    await sendMessage(
        `🇺🇦 Діма, скажи мені - токсичний це коли я кажу правду про те, що ти не качаєшся? А що до мови - я розмовляю українською, на відміну від тебе, який мабуть плутає алфавіти 😏\n\nДо речі, коли востаннє бачив тебе в залі? 🤔`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза 2 секунди
    
    // Ответ Андрею с Morning Star про "Пізда)))"
    await sendMessage(
        `🌟 Андрій, "Пізда)))" - це саме те, що буде з твоїм Morning Star стилем, якщо далі будеш тільки шокуватися замість того, щоб качатися! 😱\n\nХочеш, щоб одяг сидів як треба? Іди в зал! 💪`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза 2 секунди
    
    // Прожарка Юрию Высоцкису про gym фото
    await sendMessage(
        `📸 Юрій Висоцкіс, хочеш gym фото? Скоро відправлю тобі фотки зі спортзалу! Але це будуть не ті фото, які ти очікуєш... 😈\n\nЦе будуть фото ПУСТИХ тренажерів, тому що таких як ти там немає! Спочатку сам прийди в зал, а потом проси фотки 📷💀`
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000)); // Пауза 2 секунды
    
    // Ответ Диме, который называет фраерами
    await sendMessage(
        `🎭 Діма-газувальник, називаєш нас фраєрами? Єдиний фраєр тут - це той, хто газує про спорт замість того, щоб займатися! 🤡\n\nТи як той чувак, що розповідає всім про футбол, але сам м'яч тримав тільки в FIFA 😂\n\nІди качайся, фраєр! 💪🔥`
    );
    
    console.log('\n✅ Всі реплії відправлені!');
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
    sendReplies().catch(console.error);
}

module.exports = { sendReplies }; 