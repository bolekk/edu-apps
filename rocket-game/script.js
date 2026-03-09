const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');

// UI Elements
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreVal = document.getElementById('final-score-val');
const startEasyBtn = document.getElementById('start-easy-btn');
const startHardBtn = document.getElementById('start-hard-btn');
const restartEasyBtn = document.getElementById('restart-easy-btn');
const restartHardBtn = document.getElementById('restart-hard-btn');

// Game State
let width, height;
let score = 0;
let lives = 5;
let isGameRunning = false;
let animationId;
let gameDifficulty = 'easy';

// Entities
let diamonds = [];
let asteroids = [];

const rocket = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    rotationSpeed: 0,
    isThrusting: false,
    radius: 15,
    thrustPower: 0.03,
    color: '#00ffff',
    invulnerableTimer: 0
};

// Controls
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    Space: false
};

// Setup Canvas Size
function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    bgCanvas.width = width;
    bgCanvas.height = height;
    drawBackground();
}

function drawBackground() {
    bgCtx.fillStyle = '#050510';
    bgCtx.fillRect(0, 0, width, height);
    for (let i = 0; i < 200; i++) {
        bgCtx.fillStyle = `rgba(255, 255, 255, ${Math.random()})`;
        bgCtx.beginPath();
        let r = Math.random() * 1.5;
        bgCtx.arc(Math.random() * width, Math.random() * height, r, 0, Math.PI * 2);
        bgCtx.fill();
    }
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.code) || keys.hasOwnProperty(e.key)) {
        let key = keys.hasOwnProperty(e.code) ? e.code : e.key;
        if (key === ' ') key = 'Space';
        keys[key] = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.code) || keys.hasOwnProperty(e.key)) {
        let key = keys.hasOwnProperty(e.code) ? e.code : e.key;
        if (key === ' ') key = 'Space';
        keys[key] = false;
    }
});

window.addEventListener('resize', resize);
resize();

// Helper Functions
function wrapAround(obj) {
    if (obj.x < -obj.radius) obj.x = width + obj.radius;
    if (obj.x > width + obj.radius) obj.x = -obj.radius;
    if (obj.y < -obj.radius) obj.y = height + obj.radius;
    if (obj.y > height + obj.radius) obj.y = -obj.radius;
}

function spawnDiamond() {
    diamonds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 12,
        angle: 0
    });
}

function spawnAsteroid() {
    let x, y;
    // Spawn somewhat away from center initially
    do {
        x = Math.random() * width;
        y = Math.random() * height;
    } while (Math.hypot(x - width / 2, y - height / 2) < 150);

    const numPoints = Math.floor(Math.random() * 5 + 7);
    const radius = Math.random() * 20 + 20;
    const offsets = [];
    for (let i = 0; i < numPoints; i++) {
        offsets.push(Math.random() * 0.4 + 0.8); // 0.8 to 1.2 variance
    }

    const speedMult = gameDifficulty === 'hard' ? 4.5 : 2;

    asteroids.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * speedMult,
        vy: (Math.random() - 0.5) * speedMult,
        radius: radius,
        rot: 0,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        offsets: offsets
    });
}

function initGame(selectedDifficulty) {
    if (typeof selectedDifficulty === 'string') {
        gameDifficulty = selectedDifficulty;
    }

    score = 0;
    lives = 5;
    scoreEl.innerText = score;
    livesEl.innerText = lives;

    rocket.x = width / 2;
    rocket.y = height / 2;
    rocket.vx = 0;
    rocket.vy = 0;
    rocket.angle = -Math.PI / 2;
    rocket.invulnerableTimer = 120; // Frames of invincibility at start

    diamonds = [];
    asteroids = [];

    for (let i = 0; i < 5; i++) spawnDiamond();

    const numAsteroids = gameDifficulty === 'hard' ? 12 : 5;
    for (let i = 0; i < numAsteroids; i++) spawnAsteroid();

    isGameRunning = true;
    startScreen.classList.remove('active');
    startScreen.style.display = 'none';
    gameOverScreen.classList.remove('active');
    gameOverScreen.style.display = 'none';

    update();
}

function endGame() {
    isGameRunning = false;
    cancelAnimationFrame(animationId);
    gameOverScreen.style.display = 'flex';
    // small timeout to allow display transition
    setTimeout(() => gameOverScreen.classList.add('active'), 10);
    finalScoreVal.innerText = score;
}

// Drawing Functions
function drawRocket() {
    if (rocket.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        // Flashing effect
        return;
    }

    ctx.save();
    ctx.translate(rocket.x, rocket.y);
    ctx.rotate(rocket.angle);

    // Thruster Flare
    if (rocket.isThrusting) {
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.moveTo(-rocket.radius, 0);
        ctx.lineTo(-rocket.radius - Math.random() * 20 - 10, -5);
        ctx.lineTo(-rocket.radius - Math.random() * 20 - 10, 5);
        ctx.fill();

        ctx.fillStyle = '#ff3300';
        ctx.beginPath();
        ctx.moveTo(-rocket.radius, 0);
        ctx.lineTo(-rocket.radius - Math.random() * 10 - 5, -2);
        ctx.lineTo(-rocket.radius - Math.random() * 10 - 5, 2);
        ctx.fill();
    }

    // Ship Body
    ctx.strokeStyle = rocket.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#0a0a1a';
    ctx.beginPath();
    ctx.moveTo(rocket.radius, 0); // Nose
    ctx.lineTo(-rocket.radius, rocket.radius * 0.7); // Bottom right
    ctx.lineTo(-rocket.radius * 0.5, 0); // Back indent
    ctx.lineTo(-rocket.radius, -rocket.radius * 0.7); // Bottom left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Core glow
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(-rocket.radius * 0.2, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawDiamonds() {
    const time = Date.now() / 300;
    diamonds.forEach(d => {
        d.angle += 0.02;
        ctx.save();
        ctx.translate(d.x, d.y + Math.sin(time + d.x) * 3); // Hover effect
        ctx.rotate(d.angle);

        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';

        ctx.beginPath();
        ctx.moveTo(0, -d.radius);
        ctx.lineTo(d.radius, 0);
        ctx.lineTo(0, d.radius);
        ctx.lineTo(-d.radius, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    });
}

function drawAsteroids() {
    ctx.strokeStyle = '#9ea7b8';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#1e2330';
    ctx.shadowBlur = 0; // reset shadow

    asteroids.forEach(a => {
        a.rot += a.rotSpeed;
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);

        ctx.beginPath();
        for (let i = 0; i < a.offsets.length; i++) {
            const angle = (Math.PI * 2 / a.offsets.length) * i;
            const radiusStr = a.radius * a.offsets[i];
            const pX = Math.cos(angle) * radiusStr;
            const pY = Math.sin(angle) * radiusStr;
            if (i === 0) ctx.moveTo(pX, pY);
            else ctx.lineTo(pX, pY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    });
}

// Main Game Loop
function update() {
    if (!isGameRunning) return;

    // Logic updates
    if (keys.ArrowLeft) rocket.angle -= 0.08;
    if (keys.ArrowRight) rocket.angle += 0.08;

    rocket.isThrusting = keys.ArrowUp || keys.Space;
    if (rocket.isThrusting) {
        rocket.vx += Math.cos(rocket.angle) * rocket.thrustPower;
        rocket.vy += Math.sin(rocket.angle) * rocket.thrustPower;
    }

    // Apply Velocity
    rocket.x += rocket.vx;
    rocket.y += rocket.vy;
    wrapAround(rocket);

    if (rocket.invulnerableTimer > 0) rocket.invulnerableTimer--;

    // Update Asteroids
    asteroids.forEach(a => {
        a.x += a.vx;
        a.y += a.vy;
        wrapAround(a);

        // Collision with player
        if (rocket.invulnerableTimer <= 0) {
            const dist = Math.hypot(rocket.x - a.x, rocket.y - a.y);
            if (dist < rocket.radius + a.radius * 0.8) {
                // Hit
                lives--;
                livesEl.innerText = lives;
                rocket.invulnerableTimer = 120; // 2 seconds at 60fps

                // Add a visual boom effect here maybe?

                if (lives <= 0) {
                    endGame();
                    return; // Stop processing further physics
                }
            }
        }
    });

    // Code continues safely only if game not ended this frame
    if (!isGameRunning) return;

    // Update Diamonds
    for (let i = diamonds.length - 1; i >= 0; i--) {
        const d = diamonds[i];
        const dist = Math.hypot(rocket.x - d.x, rocket.y - d.y);
        if (dist < rocket.radius + d.radius) {
            // Collected
            diamonds.splice(i, 1);
            score += 10;
            scoreEl.innerText = score;
            spawnDiamond();

            // Spawn an extra asteroid every 50 points to increase difficulty
            if (score % 50 === 0) {
                spawnAsteroid();
            }
        }
    }

    // Render
    ctx.clearRect(0, 0, width, height);

    drawAsteroids();
    drawDiamonds();
    drawRocket();

    animationId = requestAnimationFrame(update);
}

// Event Listeners
startEasyBtn.addEventListener('click', () => initGame('easy'));
startHardBtn.addEventListener('click', () => initGame('hard'));
restartEasyBtn.addEventListener('click', () => initGame('easy'));
restartHardBtn.addEventListener('click', () => initGame('hard'));
