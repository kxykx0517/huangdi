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
let gameRunning = true;
let enemies = [];
let enemyBullets = [];
let coins = [];
let lastTime = 0;

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

function createEnemy(type, x, y) {
    const enemy = {
        x: x,
        y: y,
        width: 32,
        height: 32,
        type: type,
        health: type === 'melee' ? 30 : 20,
        maxHealth: type === 'melee' ? 30 : 20,
        attack: type === 'melee' ? 10 : 5,
        speed: type === 'melee' ? 100 : 0,
        lastShot: 0,
        shootCooldown: 1500,
        isKnockedBack: false,
        knockbackTime: 0,
        knockbackDuration: 200,
        vx: 0,
        vy: 0
    };
    return enemy;
}

function createCoin(x, y, value) {
    return {
        x: x,
        y: y,
        value: value,
        radius: 6,
        speed: 150,
        collected: false
    };
}

function spawnInitialEnemies() {
    enemies.push(createEnemy('melee', 100, 100));
    enemies.push(createEnemy('melee', 700, 100));
    enemies.push(createEnemy('ranged', 400, 50));
}

function spawnEnemies() {
    while (enemies.length < 4) {
        const type = Math.random() > 0.5 ? 'melee' : 'ranged';
        let x, y;
        const side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0:
                x = Math.random() * canvas.width;
                y = -32;
                break;
            case 1:
                x = Math.random() * canvas.width;
                y = canvas.height + 32;
                break;
            case 2:
                x = -32;
                y = Math.random() * canvas.height;
                break;
            case 3:
                x = canvas.width + 32;
                y = Math.random() * canvas.height;
                break;
        }
        enemies.push(createEnemy(type, x, y));
    }
}

function updateUI() {
    document.getElementById('health-value').textContent = Math.max(0, player.health);
    document.getElementById('weapon-name').textContent = player.weapon;
    document.getElementById('money-value').textContent = player.money;
}

function drawGameInfo() {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`敌人数量：${enemies.length}`, 10, 10);
    ctx.fillText(`金钱：${player.money}`, 10, 30);
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

function updateEnemies(deltaTime) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    enemies.forEach((enemy, index) => {
        if (enemy.isKnockedBack) {
            enemy.knockbackTime -= deltaTime;
            if (enemy.knockbackTime <= 0) {
                enemy.isKnockedBack = false;
                enemy.vx = 0;
                enemy.vy = 0;
            } else {
                enemy.x += enemy.vx * (deltaTime / 1000);
                enemy.y += enemy.vy * (deltaTime / 1000);
                return;
            }
        }

        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (enemy.type === 'melee' && distance > 0) {
            enemy.x += (dx / distance) * (enemy.speed * (deltaTime / 1000));
            enemy.y += (dy / distance) * (enemy.speed * (deltaTime / 1000));
        }

        if (enemy.type === 'ranged') {
            const currentTime = Date.now();
            if (currentTime - enemy.lastShot > enemy.shootCooldown) {
                const angle = Math.atan2(dy, dx);
                enemyBullets.push({
                    x: enemyCenterX,
                    y: enemyCenterY,
                    radius: 4,
                    vx: Math.cos(angle) * 200,
                    vy: Math.sin(angle) * 200,
                    damage: enemy.attack
                });
                enemy.lastShot = currentTime;
            }
        }

        if (enemy.type === 'melee' && checkCollision(player, enemy)) {
            player.health -= enemy.attack;
            const knockbackDist = 50;
            enemy.x -= (dx / distance) * knockbackDist;
            enemy.y -= (dy / distance) * knockbackDist;
        }
    });

    if (player.health <= 0) {
        gameRunning = false;
    }
}

function updateEnemyBullets(deltaTime) {
    enemyBullets = enemyBullets.filter(bullet => {
        bullet.x += bullet.vx * (deltaTime / 1000);
        bullet.y += bullet.vy * (deltaTime / 1000);

        const dist = Math.sqrt(
            Math.pow(bullet.x - (player.x + player.width / 2), 2) +
            Math.pow(bullet.y - (player.y + player.height / 2), 2)
        );
        if (dist < bullet.radius + player.width / 2) {
            player.health -= bullet.damage;
            if (player.health <= 0) {
                gameRunning = false;
            }
            return false;
        }

        return bullet.x > -10 && bullet.x < canvas.width + 10 &&
               bullet.y > -10 && bullet.y < canvas.height + 10;
    });
}

function updateCoins(deltaTime) {
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;

    coins = coins.filter(coin => {
        const dx = playerCenterX - coin.x;
        const dy = playerCenterY - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            coin.x += (dx / distance) * (coin.speed * (deltaTime / 1000));
            coin.y += (dy / distance) * (coin.speed * (deltaTime / 1000));
        }

        if (distance < 20) {
            player.money += coin.value;
            return false;
        }

        return true;
    });
}

function checkCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function checkAttackHit() {
    if (!player.isAttacking || player.attackDuration !== player.attackMaxDuration - 1) return;

    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    const attackRadius = 60;
    const attackStartAngle = player.attackAngle - Math.PI / 3;
    const attackEndAngle = player.attackAngle + Math.PI / 3;

    enemies = enemies.filter(enemy => {
        const enemyCenterX = enemy.x + enemy.width / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        const dx = enemyCenterX - centerX;
        const dy = enemyCenterY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        let normalizedAngle = angle;
        while (normalizedAngle < attackStartAngle - Math.PI) normalizedAngle += 2 * Math.PI;
        while (normalizedAngle > attackStartAngle + Math.PI) normalizedAngle -= 2 * Math.PI;

        if (distance <= attackRadius && normalizedAngle >= attackStartAngle && normalizedAngle <= attackEndAngle) {
            enemy.health -= player.attack;

            const knockbackAngle = player.attackAngle + Math.PI;
            enemy.isKnockedBack = true;
            enemy.knockbackTime = enemy.knockbackDuration;
            enemy.vx = Math.cos(knockbackAngle) * 150;
            enemy.vy = Math.sin(knockbackAngle) * 150;

            if (enemy.health <= 0) {
                coins.push(createCoin(enemyCenterX, enemyCenterY, enemy.type === 'melee' ? 15 : 10));
                return false;
            }
        }
        return true;
    });
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

function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.type === 'melee') {
            ctx.fillStyle = '#e74c3c';
        } else {
            ctx.fillStyle = '#e67e22';
        }
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        ctx.strokeStyle = enemy.type === 'melee' ? '#c0392b' : '#d35400';
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(enemy.x, enemy.y - 8, (enemy.health / enemy.maxHealth) * enemy.width, 4);
    });
}

function drawEnemyBullets() {
    ctx.fillStyle = '#f1c40f';
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawCoins() {
    coins.forEach(coin => {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
}

function drawBackground() {
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2);
}

function gameLoop(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    drawBackground();

    if (gameRunning) {
        updatePlayer();
        checkAttackHit();
        updateEnemies(deltaTime);
        updateEnemyBullets(deltaTime);
        updateCoins(deltaTime);

        if (enemies.length < 3) {
            spawnEnemies();
        }
    }

    drawAttack();
    drawPlayer();
    drawEnemies();
    drawEnemyBullets();
    drawCoins();
    drawGameInfo();

    if (!gameRunning) {
        drawGameOver();
    }

    updateUI();
    requestAnimationFrame(gameLoop);
}

spawnInitialEnemies();
requestAnimationFrame(gameLoop);
