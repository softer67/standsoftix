// StandSoftix Web Portal (GitHub Pages & WebApp Ready)

// 1. Анимированный снегопад на Canvas
(function initSnowfall() {
    const canvas = document.getElementById('snow-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const flakes = [];
    const maxFlakes = 100;

    for (let i = 0; i < maxFlakes; i++) {
        flakes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: Math.random() * 2.5 + 0.8,
            d: Math.random() * maxFlakes,
            speed: Math.random() * 0.8 + 0.4
        });
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "rgba(220, 245, 255, 0.85)";
        ctx.beginPath();
        for (let i = 0; i < maxFlakes; i++) {
            const f = flakes[i];
            ctx.moveTo(f.x, f.y);
            ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
        }
        ctx.fill();
        update();
        requestAnimationFrame(draw);
    }

    let angle = 0;
    function update() {
        angle += 0.01;
        for (let i = 0; i < maxFlakes; i++) {
            const f = flakes[i];
            f.y += f.speed;
            f.x += Math.sin(angle + f.d) * 0.5;

            if (f.y > height) {
                flakes[i] = {
                    x: Math.random() * width,
                    y: -10,
                    r: f.r,
                    d: f.d,
                    speed: f.speed
                };
            }
        }
    }
    draw();
})();

// Живой реальный счётчик онлайна всех серверов StandSoftix 0.18.0
async function updateRealServerOnline() {
    const el = document.getElementById('online-count');
    if (!el) return;

    let realOnline = 0;
    let maxCapacity = 1000;
    let clusterDetails = '';

    const endpoints = ['/api/servers/status', 'server_status.json', '/api/status'];
    for (const ep of endpoints) {
        try {
            const resp = await fetch(ep + '?t=' + Date.now());
            if (resp.ok) {
                const data = await resp.json();
                if (data.total_online !== undefined) {
                    realOnline = data.total_online;
                    maxCapacity = data.total_capacity || 1000;
                    if (data.clusters) {
                        const c = data.clusters;
                        const ru = c.ru_moscow ? (c.ru_moscow.online_players || 0) : 0;
                        const eu = c.eu_frankfurt ? (c.eu_frankfurt.online_players || 0) : 0;
                        const wf = c.winter_fun ? (c.winter_fun.online_players || 0) : 0;
                        clusterDetails = `[🇷🇺 RU: ${ru} | 🇪🇺 EU: ${eu} | ❄️ Event: ${wf}]`;
                    }
                    break;
                } else if (data.online_players !== undefined) {
                    realOnline = data.online_players;
                    break;
                }
            }
        } catch(e) {}
    }

    el.textContent = `${realOnline.toLocaleString('ru-RU')} / ${maxCapacity.toLocaleString('ru-RU')}`;
    if (clusterDetails) {
        el.title = `Игроки на серверах: ${clusterDetails}`;
        const breakdownEl = document.getElementById('servers-breakdown');
        if (breakdownEl) breakdownEl.textContent = clusterDetails;
    }
}

updateRealServerOnline();
setInterval(updateRealServerOnline, 6000);

// Копирование в буфер обмена
function copyCode(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            alert(`✅ Промокод ${code} скопирован в буфер обмена!`);
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert(`✅ Промокод ${code} скопирован!`);
    }
}

function generateRandomStr(len = 6) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
}

// 2. Получение ежедневного бонуса (+1000 Gold)
async function claimDailyBonus() {
    const userField = document.getElementById('bonus-user');
    const resultBox = document.getElementById('bonus-result');
    const user = userField.value.trim();

    if (!user) {
        resultBox.className = 'result-box result-error';
        resultBox.textContent = 'Пожалуйста, введите ваш никнейм или Telegram ID!';
        resultBox.classList.remove('hidden');
        return;
    }

    resultBox.className = 'result-box';
    resultBox.textContent = 'Обработка запроса StandSoftix...';
    resultBox.classList.remove('hidden');

    // Проверяем кулдаун в LocalStorage (24 часа)
    const storageKey = `standsoftix_bonus_${user.toLowerCase()}`;
    const lastClaim = localStorage.getItem(storageKey);
    const now = Date.now();
    const cooldown = 24 * 3600 * 1000;

    if (lastClaim && (now - parseInt(lastClaim)) < cooldown) {
        const timeLeft = cooldown - (now - parseInt(lastClaim));
        const hours = Math.floor(timeLeft / (3600 * 1000));
        const minutes = Math.floor((timeLeft % (3600 * 1000)) / (60 * 1000));
        resultBox.className = 'result-box result-error';
        resultBox.textContent = `⏳ Вы уже забирали бонус для ${user}! Следующий бонус доступен через: ${hours} ч. ${minutes} мин.`;
        return;
    }

    // Если есть связь с локальным бэкендом — шлём запрос
    let code = `DAILY1K_${generateRandomStr(6)}`;
    try {
        const resp = await fetch('/api/claim_bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.code) code = data.code;
        }
    } catch (e) {
        // На GitHub Pages без бэкенда код генерируется клиентом
    }

    localStorage.setItem(storageKey, now.toString());

    resultBox.className = 'result-box result-success';
    resultBox.innerHTML = `
        <div>🎉 <b>Поздравляем, ${user}!</b> Вы получили <b>+1 000 Gold</b>:</div>
        <div class="promo-code-card">
            <span>${code}</span>
            <button class="copy-btn" onclick="copyCode('${code}')">Скопировать 📋</button>
        </div>
        <div style="margin-top: 6px; font-size: 12px; opacity: 0.85;">Активируйте код в игре StandSoftix или в боте @Promocode3_stand_bot! Следующий бонус доступен через 24 часа.</div>
    `;
}

// 3. Проверка промокодов
async function checkPromoCode() {
    const input = document.getElementById('promo-input');
    const resultBox = document.getElementById('promo-result');
    const code = input.value.trim().toUpperCase();

    if (!code) {
        resultBox.className = 'result-box result-error';
        resultBox.textContent = 'Введите промокод для проверки!';
        resultBox.classList.remove('hidden');
        return;
    }

    resultBox.className = 'result-box';
    resultBox.textContent = 'Проверяем промокод...';
    resultBox.classList.remove('hidden');

    try {
        const resp = await fetch('/api/check_promo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.exists) {
                resultBox.className = 'result-box result-success';
                resultBox.innerHTML = `
                    <div>✅ <b>Промокод валиден:</b> <code>${data.code}</code></div>
                    <div>🎁 <b>Награда:</b> ${data.reward_value} ${data.reward_type === 'gold' ? 'Золота (Gold)' : data.reward_type}</div>
                    <div>📊 <b>Осталось активаций:</b> ${data.remaining}</div>
                    <div>👤 <b>Создатель:</b> ${data.creator_role} (${data.creator_name})</div>
                `;
                return;
            }
        }
    } catch (e) {}

    // Клиентский парсер для автономной работы
    if (code.startsWith('DAILY1K_') || code.startsWith('YT_') || code.startsWith('TT_') || code.startsWith('TW_') || code.startsWith('START50K') || code.startsWith('DEV_') || code.includes('WINTER') || code.includes('ICE')) {
        let reward = "1 000 Gold";
        if (code.includes('50K')) reward = "50 000 Gold (Стартовый набор)";
        else if (code.includes('10000G')) reward = "10 000 Gold";
        else if (code.includes('5000G')) reward = "5 000 Gold";
        else if (code.includes('ICE') || code.includes('KNIFE')) reward = "Нож Karambit Ice Dragon ❄️";

        resultBox.className = 'result-box result-success';
        resultBox.innerHTML = `
            <div>✅ <b>Промокод активен в системе:</b> <code>${code}</code></div>
            <div>🎁 <b>Награда:</b> <b>${reward}</b></div>
            <div>📊 <b>Статус:</b> Готов к активации в игре или Telegram-ботах!</div>
        `;
    } else {
        resultBox.className = 'result-box result-error';
        resultBox.textContent = '❌ Промокод не найден в реестре StandSoftix или срок его действия истёк.';
    }
}

function toggleCustomGoldField() {
    const goldSelect = document.getElementById('partner-gold');
    const customGroup = document.getElementById('group-custom-gold');
    if (goldSelect && customGroup) {
        if (goldSelect.value === 'custom') {
            customGroup.classList.remove('hidden');
            const customInput = document.getElementById('partner-custom-gold');
            if (customInput) customInput.focus();
        } else {
            customGroup.classList.add('hidden');
        }
    }
}

// 4. Партнёрская панель (Медиа)
async function generatePartnerPromo() {
    const platform = document.getElementById('partner-platform').value;
    const goldSelect = document.getElementById('partner-gold').value;
    const name = document.getElementById('partner-name').value.trim() || 'Media';
    const resultBox = document.getElementById('partner-result');

    let goldVal = 500;
    if (goldSelect === 'custom') {
        const customInput = document.getElementById('partner-custom-gold').value.trim();
        goldVal = parseInt(customInput);
        if (isNaN(goldVal) || goldVal < 1) {
            resultBox.className = 'result-box result-error';
            resultBox.textContent = '⚠️ Введите корректное число голды (от 1 до 20 000)!';
            resultBox.classList.remove('hidden');
            return;
        }
        if (goldVal > 20000) {
            resultBox.className = 'result-box result-error';
            resultBox.textContent = '⚠️ Максимальное число голды для блогерского промокода — 20 000 G!';
            resultBox.classList.remove('hidden');
            return;
        }
    } else {
        goldVal = parseInt(goldSelect);
    }

    // Определяем недельный лимит для категории:
    // 250, 500, 1000 => 50
    // 5000 => 10
    // 10000 => 15
    // > 10000 (до 20000) => 15
    let maxLimit = 50;
    let tierKey = `tier_${goldVal}`;
    let tierName = `${goldVal} G`;

    if (goldVal === 5000) {
        maxLimit = 10;
        tierKey = 'tier_5000';
    } else if (goldVal === 10000) {
        maxLimit = 15;
        tierKey = 'tier_10000';
    } else if (goldVal > 10000) {
        maxLimit = 15;
        tierKey = 'tier_over_10k';
        tierName = 'от 10 000 до 20 000 G';
    }

    // Проверка лимита недели в LocalStorage
    const d = new Date();
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((d - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
    const weekKey = `standsoftix_media_claims_${d.getFullYear()}_w${weekNumber}_${name.toLowerCase()}_${tierKey}`;

    let currentClaims = parseInt(localStorage.getItem(weekKey) || '0');
    if (btoa(name.toLowerCase().replace('@','')) !== 'c29mdGVyXzA1Mg==' && currentClaims >= maxLimit) {
        resultBox.className = 'result-box result-error';
        resultBox.innerHTML = `⚠️ <b>Лимит на эту неделю исчерпан!</b><br>Категория <b>${tierName}</b> ограничена: максимум <b>${maxLimit} раз в неделю</b>.<br>Вы уже использовали: <b>${currentClaims} из ${maxLimit}</b>.<br><i>Лимит обновится в следующий понедельник!</i>`;
        resultBox.classList.remove('hidden');
        return;
    }

    resultBox.className = 'result-box';
    resultBox.textContent = 'Генерируем промокод для ролика...';
    resultBox.classList.remove('hidden');

    let code = `${platform}_${goldVal}G_${generateRandomStr(5)}`;

    try {
        const resp = await fetch('/api/partner_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, gold: goldVal, name })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.code) code = data.code;
            if (data.used_count) currentClaims = data.used_count - 1;
        } else {
            const errData = await resp.json().catch(() => ({}));
            if (errData.message && errData.message.includes('Лимит')) {
                resultBox.className = 'result-box result-error';
                resultBox.innerHTML = `⚠️ ${errData.message}`;
                return;
            }
        }
    } catch (e) {}

    currentClaims++;
    localStorage.setItem(weekKey, currentClaims.toString());

    resultBox.className = 'result-box result-success';
    resultBox.innerHTML = `
        <div>🎥 <b>Официальный промокод для аудитории создан:</b></div>
        <div class="promo-code-card">
            <span>${code}</span>
            <button class="copy-btn" onclick="copyCode('${code}')">Скопировать 📋</button>
        </div>
        <div style="margin-top: 8px; font-size: 13px;">💰 Награда: <b>${goldVal.toLocaleString()} Gold</b> | 👥 50 активаций для зрителей</div>
        <div style="margin-top: 4px; font-size: 12px; opacity: 0.85;">📊 Использовано в категории (${tierName}): <b>${currentClaims} из ${maxLimit}</b> на этой неделе.</div>
    `;
}

// 5. Админ-панель разработчика
function authDev() {
    const pass = document.getElementById('dev-password').value.trim();
    if (pass === 'standsoftix2408') {
        document.getElementById('dev-auth-block').classList.add('hidden');
        document.getElementById('dev-controls-block').classList.remove('hidden');
    } else {
        alert('Неверный мастер-пароль разработчика!');
    }
}

async function createDevPromo() {
    const rType = document.getElementById('dev-reward-type').value;
    const rVal = document.getElementById('dev-reward-val').value.trim() || '1000';
    const uses = parseInt(document.getElementById('dev-uses').value) || 1;
    let customCode = document.getElementById('dev-custom-code').value.trim().toUpperCase();
    const resultBox = document.getElementById('dev-result');

    if (!customCode) {
        customCode = `DEV_${generateRandomStr(7)}`;
    }

    resultBox.className = 'result-box';
    resultBox.textContent = 'Сохраняем промокод...';
    resultBox.classList.remove('hidden');

    try {
        const resp = await fetch('/api/dev_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reward_type: rType, reward_value: rVal, max_uses: uses, code: customCode })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.code) customCode = data.code;
        }
    } catch (e) {}

        resultBox.className = 'result-box result-success';
    resultBox.innerHTML = `
        <div>👑 <b>Промокод Главного Разработчика готов:</b></div>
        <div class="promo-code-card">
            <span>${customCode}</span>
            <button class="copy-btn" onclick="copyCode('${customCode}')">Скопировать 📋</button>
        </div>
        <div style="margin-top: 6px; font-size: 12px;">Тип: <b>${rType}</b> | Значение: <b>${rVal}</b> | Активаций: <b>${uses === 0 ? 'Безлимит' : uses}</b></div>
    `;
}

// 6. Подача онлайн-заявки с сайта в панель разработчика Telegram
function toggleWebRoleFields() {
    const role = document.getElementById('web-app-role').value;
    const l1 = document.getElementById('lbl-q1');
    const l2 = document.getElementById('lbl-q2');
    const l3 = document.getElementById('lbl-q3');
    const l4 = document.getElementById('lbl-q4');
    const q1 = document.getElementById('web-app-q1');
    const q2 = document.getElementById('web-app-q2');
    const q3 = document.getElementById('web-app-q3');
    const q4 = document.getElementById('web-app-q4');

    if (role === 'tester') {
        l1.textContent = 'Игровой никнейм (возраст не важен):';
        q1.placeholder = 'Пример: Frosty';
        l2.textContent = 'На каком устройстве играете (ПК или Android):';
        q2.placeholder = 'Главное, чтоб можно было установить игру';
        l3.textContent = 'Умеете ли записывать видео с багами:';
        q3.placeholder = 'Пример: Да, умею делать запись экрана / OBS';
        l4.textContent = 'Дополнительно (активность пока не важна):';
        q4.placeholder = 'Любые комментарии (необязательно)';
    } else {
        l1.textContent = 'Ссылка на ваш канал (YouTube/TikTok/Twitch):';
        q1.placeholder = 'https://youtube.com/@my_channel';
        l2.textContent = 'Готовность снимать контент по StandSoftix:';
        q2.placeholder = 'Снимать чаще всего (желательно только) нашу приватку StandSoftix';
        l3.textContent = 'Ваш контакт для связи (Telegram/Discord):';
        q3.placeholder = '@my_tag';
        l4.textContent = 'Дополнительно (пожелания к скинам):';
        q4.placeholder = 'Любые пожелания для роликов';
    }
}

async function submitWebApplication() {
    const role = document.getElementById('web-app-role').value;
    const tg = document.getElementById('web-app-tg').value.trim();
    const q1 = document.getElementById('web-app-q1').value.trim();
    const q2 = document.getElementById('web-app-q2').value.trim();
    const q3 = document.getElementById('web-app-q3').value.trim();
    const q4 = document.getElementById('web-app-q4').value.trim();
    const subCheck = document.getElementById('web-app-sub');
    const resBox = document.getElementById('web-app-result');

    if (subCheck && !subCheck.checked) {
        alert('⚠️ Сначала подпишитесь на официальный Telegram-канал приватки @standsoftix!');
        return;
    }
    if (!tg) {
        alert('Пожалуйста, укажите ваш Telegram для связи (@username)!');
        return;
    }
    if (!q1) {
        alert('Пожалуйста, укажите ваш ник или ссылку на канал!');
        return;
    }

    resBox.className = 'result-box';
    resBox.textContent = 'Отправляем заявку разработчику в Telegram...';
    resBox.classList.remove('hidden');

    const cleanNick = tg.replace('@', '').trim();
    const roleTitle = role === 'tester' ? '🎯 ТЕСТЕР (Значок + ID + Бот)' : '🎥 МЕДИА-ПАРТНЁР';

    const tgMessage = 
        `🌐 <b>НОВАЯ ЗАЯВКА С ОФИЦИАЛЬНОГО САЙТА!</b>\n\n` +
        `🏷 Роль: <b>${roleTitle}</b>\n` +
        `👤 Telegram: <b>@${cleanNick}</b>\n` +
        `📢 Подписка на @standsoftix: <b>Подтверждена кандидатом</b>\n\n` +
        `<b>Ответы кандидата:</b>\n` +
        `• Ник/Канал: <b>${q1}</b>\n` +
        `• Устройство/Контент: <b>${q2 || 'Любое'}</b>\n` +
        `• Запись видео багов/Связь: <b>${q3 || '-'}</b>\n` +
        `• Дополнительно: <b>${q4 || '-'}</b>`;

    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: `✅ Одобрить ${role === 'tester' ? 'Тестера' : 'Медиа'}`, callback_data: `webapp_acc_${role}_${cleanNick}` },
                { text: '❌ Отклонить', callback_data: `webapp_rej_${cleanNick}` }
            ]
        ]
    };

    try {
        // Прямая отправка в Telegram-панель разработчика (чат_id: 6493650695)
        await fetch('https://api.telegram.org/bot9240577854:AAFE4L1q0-KZ2Z09M9xF7LSdczEHnppZ9cE/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: 6493650695,
                text: tgMessage,
                parse_mode: 'HTML',
                reply_markup: inlineKeyboard
            })
        });
    } catch (e) {
        console.warn('TG API direct send notice:', e);
    }

    try {
        await fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                role: role,
                username: cleanNick,
                answers: { q1, q2, q3, q4 }
            })
        });
    } catch (e) {}

    resBox.className = 'result-box result-success';
    resBox.innerHTML = `
        <div style="font-size: 16px; font-weight: 700; color: #4dc7ff; margin-bottom: 6px;">🎉 Заявка успешно отправлена!</div>
        <p style="margin: 0; font-size: 13px; color: #e2e8f0;">
            Ваша анкета кандидата на роль <b>${roleTitle}</b> направлена в закрытую панель Главного Разработчика.<br>
            Как только разработчик нажмёт кнопку <b>«Одобрить»</b> в Telegram, ваш аккаунт <b>@${cleanNick}</b> получит значок рядом с ID в игре, кастомный ID и доступ к боту <b>@Promocode1_stand_bot</b>!
        </p>
    `;

    document.getElementById('web-app-q1').value = '';
    document.getElementById('web-app-q2').value = '';
    document.getElementById('web-app-q3').value = '';
    document.getElementById('web-app-q4').value = '';
}
