// Новогодний падающий снег — мобильная оптимизация + плавный спавн
// Подключение: <script src="https://your-cdn.com/snow.js" data-count="120" data-wind="40" data-speed="0.7"></script>

(function () {
    console.log('Запуск мобильно-оптимизированного снега...');

    if (localStorage.getItem('snowDisabled') === 'true') return;

    const script = document.currentScript || document.getElementsByTagName('script')[document.getElementsByTagName('script').length - 1];
    const baseConfig = {
        baseCount: parseInt(script.dataset.count) || 120,     // базовое количество для десктопа
        wind: parseInt(script.dataset.wind) || 40,
        speed: parseFloat(script.dataset.speed) || 0.7,       // уменьшена скорость по умолчанию
        color: script.dataset.color || '#ffffff',
        enabled: script.dataset.enabled !== 'false'
    };
    if (!baseConfig.enabled) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.cssText = `
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 999999;
    `;
    document.body.appendChild(canvas);

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    // Адаптация под размер экрана
    const isMobile = w < 768;
    const config = {
        count: isMobile ? Math.floor(baseConfig.baseCount / 2.5) : baseConfig.baseCount, // меньше на мобильных
        wind: isMobile ? baseConfig.wind * 0.7 : baseConfig.wind,
        speed: baseConfig.speed,
        spawnBatch: isMobile ? 4 : 8,        // сколько появляется за раз
        spawnDelay: isMobile ? 400 : 300     // задержка между порциями (мс)
    };

    let snowflakes = [];

    class SnowFlake {
        constructor() {
            this.reset();
            this.velY = Math.random() * 1.5 + 0.6 * config.speed; // медленнее
            this.velX = Math.random() * 0.4 - 0.2;
            this.angle = Math.random() * Math.PI * 2;
            this.amplitude = Math.random() * config.wind + 15;
            this.opacity = Math.random() * 0.4 + 0.6;
        }

        reset() {
            this.x = Math.random() * w;
            this.y = -20 - Math.random() * 150;
            this.r = Math.random() * 2.5 + 1.5; // мелкие изящные снежинки
            this.scale = 1;
        }

        update() {
            this.angle += 0.012;
            this.x += Math.sin(this.angle) * this.amplitude * 0.03 + this.velX;
            this.y += this.velY;

            if (this.x < -50) this.x = w + 50;
            if (this.x > w + 50) this.x = -50;

            // Таяние внизу
            if (this.y > h - 180) {
                const progress = (this.y - (h - 180)) / 180;
                this.opacity *= (1 - progress);
                this.scale = 1 - progress * 0.6;
            }

            if (this.y > h + 50) {
                this.reset();
            }
        }

           draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;

            // Основная снежинка с белым свечением
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * this.scale, 0, Math.PI * 2);
            ctx.fill();

            // Тонкая тень снизу для объёма (очень лёгкая)
            ctx.shadowColor = 'rgba(0,0,0,0.2)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * this.scale, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    // Плавный спавн порциями
    let spawned = 0;
    function spawnBatch() {
        if (spawned >= config.count) return;

        const batchSize = Math.min(config.spawnBatch, config.count - spawned);
        for (let i = 0; i < batchSize; i++) {
            snowflakes.push(new SnowFlake());
            spawned++;
        }

        if (spawned < config.count) {
            setTimeout(spawnBatch, config.spawnDelay);
        }
    }

    function animate() {
        ctx.clearRect(0, 0, w, h);

        snowflakes.forEach(flake => {
            flake.update();
            flake.draw();
        });

        // Очень редко добавляем новые (для бесконечности)
        if (Math.random() < 0.008 && snowflakes.length < config.count + 10) {
            snowflakes.push(new SnowFlake());
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        // При ресайзе пересчитываем конфиг и перезапускаем спавн
        const newIsMobile = w < 768;
        config.count = newIsMobile ? Math.floor(baseConfig.baseCount / 2.5) : baseConfig.baseCount;
        config.wind = newIsMobile ? baseConfig.wind * 0.7 : baseConfig.wind;
        snowflakes = [];
        spawned = 0;
        spawnBatch();
    });

    // Запуск
    spawnBatch();
    animate();

    console.log(`Снег запущен. ${isMobile ? 'Мобильный' : 'Десктоп'} режим: ${config.count} снежинок`);

    window.disableSnow = () => {
        localStorage.setItem('snowDisabled', 'true');
        canvas.remove();
    };

    window.enableSnow = () => {
        localStorage.removeItem('snowDisabled');
        location.reload();
    };
})();
