const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const waveDisplay = document.getElementById('wave'); // Referencia al marcador de oleada
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;

const player = {
    x: 100,
    y: 100,
    size: 20,
    speed: 3,
    color: 'red',
    direction: 'up',
    lives: 3
};

const walls = [
    { x: 300, y: 100, width: 200, height: 20 },
    { x: 100, y: 300, width: 20, height: 200 },
    { x: 500, y: 300, width: 200, height: 20 }
];

const enemies = [];
let wave = 1;
const maxWaves = 5;

const heartImage = new Image();
heartImage.src = "/src/img/corazon.png";

let heartLoaded = false;
heartImage.onload = () => {
    heartLoaded = true;
};

const playerImage = new Image();
playerImage.src = "/src/img/personaje.png"; // Ruta donde guardaste la imagen

let playerLoaded = false;
playerImage.onload = () => {
    playerLoaded = true; // Marca que la imagen está lista
};

function drawLives() {
    const heartSize = 30;
    if (!heartLoaded) return;

    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(heartImage, canvas.width - (i * (heartSize + 10)) - 50, 10, heartSize, heartSize);
    }
}

function startWave() {
    enemies.length = 0;
    for (let i = 0; i < wave * 3; i++) {
        enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 20,
            speed: 1,
            color: 'green',
            alive: true,
            health: 2,
            cooldown: 0,
            cooldownMax: 100
        });
    }
    waveDisplay.innerText = `Oleada: ${wave}`;
}

function checkWaveEnd() {
    if (enemies.every(enemy => !enemy.alive)) {
        if (wave < maxWaves) {
            wave++;
            startWave();
        } else {
            alert('¡Has vencido todas las oleadas!');
        }
    }
}

startWave();

const bullets = [];
const enemyBullets = [];
const bulletSpeed = 5;
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        if (keys['w']) direction = 'up';
        if (keys['s']) direction = 'down';
        if (keys['a']) direction = 'left';
        if (keys['d']) direction = 'right';

        bullets.push({
            x: player.x + player.size / 2 - 5,
            y: player.y + player.size / 2 - 5,
            size: 10,
            speed: bulletSpeed,
            color: 'yellow',
            direction: direction
        });
    }
});

window.addEventListener('keyup', (e) => keys[e.key] = false);

function movePlayer() {
    if (keys['Control']) return;

    const oldX = player.x;
    const oldY = player.y;
    if (keys['w']) player.y -= player.speed;
    if (keys['s']) player.y += player.speed;
    if (keys['a']) player.x -= player.speed;
    if (keys['d']) player.x += player.speed;

    walls.forEach(wall => {
        if (player.x < wall.x + wall.width &&
            player.x + player.size > wall.x &&
            player.y < wall.y + wall.height &&
            player.y + player.size > wall.y) {
            player.x = oldX;
            player.y = oldY;
        }
    });
}

function moveEnemies() {
    enemies.forEach(enemy => {
        if (!enemy.alive) return;

        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        if (enemy.cooldown <= 0) {
            const angle = Math.atan2(dy, dx);
            enemyBullets.push({
                x: enemy.x + enemy.size / 2 - 5,
                y: enemy.y + enemy.size / 2 - 5,
                size: 10,
                speed: bulletSpeed,
                color: 'blue',
                angle: angle
            });
            enemy.cooldown = enemy.cooldownMax;
        } else {
            enemy.cooldown--;
        }
    });
}

function moveBullets() {
    bullets.forEach((bullet, index) => {
        if (bullet.direction === 'up') bullet.y -= bullet.speed;
        if (bullet.direction === 'down') bullet.y += bullet.speed;
        if (bullet.direction === 'left') bullet.x -= bullet.speed;
        if (bullet.direction === 'right') bullet.x += bullet.speed;

        if (bullet.y < 0 || bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            bullets.splice(index, 1);
        }

        walls.forEach(wall => {
            if (bullet.x < wall.x + wall.width &&
                bullet.x + bullet.size > wall.x &&
                bullet.y < wall.y + wall.height &&
                bullet.y + bullet.size > wall.y) {
                bullets.splice(index, 1);
            }
        });

        enemies.forEach(enemy => {
            if (enemy.alive && bullet.x < enemy.x + enemy.size &&
                bullet.x + bullet.size > enemy.x &&
                bullet.y < enemy.y + enemy.size &&
                bullet.y + bullet.size > enemy.y) {
                enemy.health--;
                bullets.splice(index, 1);
                if (enemy.health <= 0) {
                    enemy.alive = false;
                    score += 10;
                    scoreDisplay.innerText = `Puntaje: ${score}`;
                }
            }
        });
    });
}

function moveEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.x += Math.cos(bullet.angle) * bullet.speed;
        bullet.y += Math.sin(bullet.angle) * bullet.speed;

        if (bullet.y < 0 || bullet.y > canvas.height || bullet.x < 0 || bullet.x > canvas.width) {
            enemyBullets.splice(index, 1);
        }

        walls.forEach(wall => {
            if (bullet.x < wall.x + wall.width &&
                bullet.x + bullet.size > wall.x &&
                bullet.y < wall.y + wall.height &&
                bullet.y + bullet.size > wall.y) {
                enemyBullets.splice(index, 1);
            }
        });

        if (bullet.x < player.x + player.size &&
            bullet.x + bullet.size > player.x &&
            bullet.y < player.y + player.size &&
            bullet.y + bullet.size > player.y) {
            player.lives--;
            enemyBullets.splice(index, 1);
            if (player.lives <= 0) {
                alert('¡Game Over! Has perdido todas tus vidas.');
                document.location.reload();
            }
        }
    });
}

function drawPlayer() {
    if (playerLoaded) {
        ctx.drawImage(playerImage, player.x, player.y, player.size, player.size);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }
}

function drawWalls() {
    ctx.fillStyle = 'gray';
    walls.forEach(wall => ctx.fillRect(wall.x, wall.y, wall.width, wall.height));
}


const enemyImage = new Image();
enemyImage.src = "/src/img/enemigo.png"; // Ruta donde guardaste la imagen

let enemyLoaded = false;
enemyImage.onload = () => {
    enemyLoaded = true; // Marca que la imagen está lista
};

const enemySyze = 40;

// Modificar la función para dibujar la imagen en lugar del cuadrado verde
function drawEnemies() {
    enemies.forEach(enemy => {
        if (enemy.alive) {
            if (enemyLoaded) {
                ctx.drawImage(enemyImage, enemy.x, enemy.y, enemySyze, enemySyze);
            } else {
                // Si la imagen aún no cargó, dibujar un cuadrado verde temporalmente
                ctx.fillStyle = enemy.color;
                ctx.fillRect(enemy.x, enemy.y, enemySyze, enemySyze);
            }
        }
    });
}

function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
}

function drawEnemyBullets() {
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    movePlayer();
    moveEnemies();
    moveBullets();
    moveEnemyBullets();
    checkWaveEnd();
    drawWalls();
    drawPlayer();
    drawBullets();
    drawEnemyBullets();
    drawEnemies();
    drawLives();
    requestAnimationFrame(gameLoop);
}

gameLoop();