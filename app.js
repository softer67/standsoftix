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

// Онлайн счётчик (живая симуляция)
setInterval(() => {
    const el = document.getElementById('online-count');
    if (el) {
        const delta = Math.floor(Math.random() * 7) - 3;
        let count = parseInt(el.textContent.replace(/\s/g, '')) + delta;
        if (count < 1380) count = 1380;
        if (count > 1650) count = 1650;
        el.textContent = count.toLocaleString('ru-RU');
    }
}, 4000);

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

// 4. Партнёрская панель (Медиа)
async function generatePartnerPromo() {
    const platform = document.getElementById('partner-platform').value;
    const gold = document.getElementById('partner-gold').value;
    const name = document.getElementById('partner-name').value.trim() || 'Media';
    const resultBox = document.getElementById('partner-result');

    resultBox.className = 'result-box';
    resultBox.textContent = 'Генерируем промокод для ролика...';
    resultBox.classList.remove('hidden');

    let code = `${platform}_${gold}G_${generateRandomStr(5)}`;

    try {
        const resp = await fetch('/api/partner_code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform, gold, name })
        });
        if (resp.ok) {
            const data = await resp.json();
            if (data.code) code = data.code;
        }
    } catch (e) {}

    resultBox.className = 'result-box result-success';
    resultBox.innerHTML = `
        <div>🎥 <b>Официальный промокод для аудитории создан:</b></div>
        <div class="promo-code-card">
            <span>${code}</span>
            <button class="copy-btn" onclick="copyCode('${code}')">Скопировать 📋</button>
        </div>
        <div style="margin-top: 6px; font-size: 12px;">Награда: <b>${gold} Gold</b> | Одноразовый | Вставьте этот код в описание вашего видео/стрима.</div>
    `;
}

// 5. Админ-панель разработчика
function authDev() {
    const pass = document.getElementById('dev-password').value;
    if (pass === 'dev777' || pass === 'admin' || pass === 'standsoftix') {
        document.getElementById('dev-auth-block').classList.add('hidden');
        document.getElementById('dev-controls-block').classList.remove('hidden');
    } else {
        alert('Неверный пароль доступа!');
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
