const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = {
    x: 400 - 16,
    y: 300 - 16,
    width: 32,
    height: 32,
    speed: 5,
    health: 100,
    maxHealth: 100,
    attack: 5,
    weapon: '菜刀',
    money: 0,
    isAttacking: false,
    attackAngle: 0,
    attackDuration: 0,
    attackMaxDuration: 15
};

const keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

let mouseX = 0;
let mouseY = 0;

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (keys.hasOwnProperty(key)) {
        keys[key] = false;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        player.isAttacking = true;
        player.attackDuration = player.attackMaxDuration;
        const dx = mouseX - (player.x + player.width / 2);
        const dy = mouseY - (player.y + player.height / 2);
        player.attackAngle = Math.atan2(dy, dx);
    }
});

function updateUI() {
    document.getElementById('health-value').textContent = player.health;
    document.getElementById('weapon-name').textContent = player.weapon;
    document.getElementById('money-value').textContent = player.money;
}

function updatePlayer() {
    if (keys.w && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys.s && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (keys.a && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.d && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    if (player.isAttacking) {
        player.attackDuration--;
        if (player.attackDuration <= 0) {
            player.isAttacking = false;
        }
    }
}

function drawPlayer() {
    ctx.fillStyle = '#4a69bd';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.strokeStyle = '#6a89cc';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x, player.y, player.width, player.height);
}

function drawAttack() {
    if (player.isAttacking) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const attackRadius = 60;

        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#ffd93d';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, attackRadius, player.attackAngle - Math.PI / 3, player.attackAngle + Math.PI / 3);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffb347';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, attackRadius, player.attackAngle - Math.PI / 3, player.attackAngle + Math.PI / 3);
        ctx.stroke();
        ctx.restore();
    }
}

function drawBackground() {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    drawBackground();
    updatePlayer();
    drawAttack();
    drawPlayer();
    updateUI();
    requestAnimationFrame(gameLoop);
}

gameLoop();