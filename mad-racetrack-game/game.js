// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speed');

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameRunning = true;
let gameOver = false;
let roadOffset = 0;
let roadSpeed = 5;

// Obstacles array
let obstacles = [];
let obstacleSpawnTimer = 60; // Start with a delay
let obstacleSpawnInterval = 120; // Spawn every 2 seconds at 60fps

// Car properties
const car = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 40,
    height: 60,
    speed: 0,
    maxSpeed: 96, // Reduced by 20% from 120
    acceleration: 0.5,
    deceleration: 0.3,
    lateralSpeed: 5,
    color: '#808080' // Gray color
};

// Road properties
const road = {
    width: 520, // Increased by 30% from 400
    laneWidth: 130, // Increased proportionally
    centerX: canvas.width / 2
};

// Track curve properties
let trackCurve = 0;
let curveDirection = 1;
let curveSpeed = 0.01;

// Obstacle types
const obstacleTypes = {
    rock: {
        width: 30,
        height: 25,
        color: '#696969',
        shape: 'rock'
    },
    cone: {
        width: 25,
        height: 35,
        color: '#FF6600',
        shape: 'cone'
    }
};

// Input handling
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Draw road with perspective
function drawRoad() {
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#98D8E8');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
    
    // Ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    
    // Draw road segments with perspective
    const segments = 20;
    for (let i = segments; i >= 0; i--) {
        const y = canvas.height / 2 + (canvas.height / 2) * (i / segments);
        const perspective = i / segments;
        const segmentWidth = road.width * (0.3 + 0.7 * perspective);
        const centerX = road.centerX + Math.sin(trackCurve + i * 0.1) * 100 * perspective;
        
        // Road surface
        ctx.fillStyle = '#333333';
        ctx.fillRect(centerX - segmentWidth / 2, y, segmentWidth, 5);
        
        // Road stripes
        if (Math.floor((roadOffset + i * 10) / 40) % 2 === 0) {
            // White edge lines
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(centerX - segmentWidth / 2, y, 10, 3);
            ctx.fillRect(centerX + segmentWidth / 2 - 10, y, 10, 3);
            
            // Center dashed line
            ctx.fillRect(centerX - 5, y, 10, 3);
        }
        
        // Red and white curbs
        const curbWidth = 20;
        ctx.fillStyle = Math.floor((roadOffset + i * 10) / 20) % 2 === 0 ? '#FF0000' : '#FFFFFF';
        ctx.fillRect(centerX - segmentWidth / 2 - curbWidth, y, curbWidth, 5);
        ctx.fillRect(centerX + segmentWidth / 2, y, curbWidth, 5);
    }
}

// Draw car
function drawCar() {
    ctx.save();
    ctx.translate(car.x, car.y);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(-car.width / 2 - 5, car.height / 2 - 5, car.width + 10, 10);
    
    // Car body
    ctx.fillStyle = car.color;
    ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
    
    // Car roof
    ctx.fillStyle = '#606060';
    ctx.fillRect(-car.width / 2 + 5, -car.height / 2 + 15, car.width - 10, car.height - 30);
    
    // Windshield
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(-car.width / 2 + 8, -car.height / 2 + 10, car.width - 16, 15);
    
    // Rear window
    ctx.fillRect(-car.width / 2 + 8, car.height / 2 - 20, car.width - 16, 10);
    
    // Wheels
    ctx.fillStyle = '#000000';
    ctx.fillRect(-car.width / 2 - 3, -car.height / 2 + 5, 6, 15);
    ctx.fillRect(car.width / 2 - 3, -car.height / 2 + 5, 6, 15);
    ctx.fillRect(-car.width / 2 - 3, car.height / 2 - 20, 6, 15);
    ctx.fillRect(car.width / 2 - 3, car.height / 2 - 20, 6, 15);
    
    // Headlights
    ctx.fillStyle = '#FFFF99';
    ctx.fillRect(-car.width / 2 + 5, -car.height / 2, 8, 5);
    ctx.fillRect(car.width / 2 - 13, -car.height / 2, 8, 5);
    
    // Tail lights
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(-car.width / 2 + 5, car.height / 2 - 5, 8, 5);
    ctx.fillRect(car.width / 2 - 13, car.height / 2 - 5, 8, 5);
    
    ctx.restore();
}

// Draw obstacles
function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.save();
        ctx.translate(obstacle.x, obstacle.y);
        
        if (obstacle.type.shape === 'rock') {
            // Draw rock
            ctx.fillStyle = obstacle.type.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, obstacle.type.width / 2, obstacle.type.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some texture
            ctx.fillStyle = '#4A4A4A';
            ctx.beginPath();
            ctx.ellipse(-5, -3, 8, 6, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(4, 2, 6, 5, -0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (obstacle.type.shape === 'cone') {
            // Draw traffic cone
            ctx.fillStyle = obstacle.type.color;
            ctx.beginPath();
            ctx.moveTo(-obstacle.type.width / 2, obstacle.type.height / 2);
            ctx.lineTo(0, -obstacle.type.height / 2);
            ctx.lineTo(obstacle.type.width / 2, obstacle.type.height / 2);
            ctx.closePath();
            ctx.fill();
            
            // White stripes
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-obstacle.type.width / 3, -5, obstacle.type.width * 2 / 3, 4);
            ctx.fillRect(-obstacle.type.width / 4, 5, obstacle.type.width / 2, 4);
            
            // Base
            ctx.fillStyle = '#333333';
            ctx.fillRect(-obstacle.type.width / 2 - 5, obstacle.type.height / 2 - 3, obstacle.type.width + 10, 6);
        }
        
        ctx.restore();
    });
}

// Spawn obstacles
function spawnObstacle() {
    const types = Object.keys(obstacleTypes);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const type = obstacleTypes[randomType];
    
    // Random lane position - adjusted for wider road (130px lanes)
    const lanes = [-130, 0, 130];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    
    obstacles.push({
        x: road.centerX + lane,
        y: canvas.height / 2 - 50, // Spawn further up the road
        type: type,
        speed: 2
    });
}

// Check collision
function checkCollision() {
    const carLeft = car.x - car.width / 2;
    const carRight = car.x + car.width / 2;
    const carTop = car.y - car.height / 2;
    const carBottom = car.y + car.height / 2;
    
    for (let obstacle of obstacles) {
        const obstacleLeft = obstacle.x - obstacle.type.width / 2;
        const obstacleRight = obstacle.x + obstacle.type.width / 2;
        const obstacleTop = obstacle.y - obstacle.type.height / 2;
        const obstacleBottom = obstacle.y + obstacle.type.height / 2;
        
        if (carLeft < obstacleRight &&
            carRight > obstacleLeft &&
            carTop < obstacleBottom &&
            carBottom > obstacleTop) {
            return true;
        }
    }
    return false;
}

// Draw game over screen
function drawGameOver() {
    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game over text
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Arial';
    ctx.fillText('You crashed!', canvas.width / 2, canvas.height / 2 + 20);
    
    ctx.font = '20px Arial';
    ctx.fillText('Press F5 to restart', canvas.width / 2, canvas.height / 2 + 60);
}

// Update game logic
function update() {
    if (gameOver) return;
    
    // Update track curve
    trackCurve += curveDirection * curveSpeed;
    if (Math.abs(trackCurve) > 1) {
        curveDirection *= -1;
    }
    
    // Handle input - WASD controls
    if (keys['a'] || keys['A']) {
        car.x -= car.lateralSpeed;
    }
    if (keys['d'] || keys['D']) {
        car.x += car.lateralSpeed;
    }
    
    // Speed control with W and S - only change speed when keys are pressed
    if (keys['w'] || keys['W']) {
        if (car.speed < car.maxSpeed) {
            car.speed += car.acceleration;
        }
    } else if (keys['s'] || keys['S']) {
        if (car.speed > 0) {
            car.speed -= car.deceleration * 2; // Brake harder than acceleration
            if (car.speed < 0) car.speed = 0;
        }
    }
    // No automatic deceleration - car maintains speed when no key is pressed
    
    // Keep car on road - adjusted for wider road
    const roadLeft = road.centerX - road.width / 2 + 65;
    const roadRight = road.centerX + road.width / 2 - 65;
    car.x = Math.max(roadLeft, Math.min(roadRight, car.x));
    
    // Removed auto-acceleration - now controlled by W key
    
    // Update road offset for movement effect only when car is moving
    if (car.speed > 0) {
        roadOffset += roadSpeed + car.speed / 20;
    }
    
    // Spawn obstacles
    obstacleSpawnTimer++;
    if (obstacleSpawnTimer >= obstacleSpawnInterval) {
        spawnObstacle();
        obstacleSpawnTimer = 0;
        // Gradually increase difficulty
        if (obstacleSpawnInterval > 60) {
            obstacleSpawnInterval -= 0.5;
        }
    }
    
    // Update obstacles - only move when car is moving
    obstacles = obstacles.filter(obstacle => {
        if (car.speed > 0) {
            obstacle.y += obstacle.speed + car.speed / 15;
        }
        return obstacle.y < canvas.height + 50;
    });
    
    // Check collision
    if (checkCollision()) {
        gameOver = true;
        gameRunning = false;
        car.speed = 0;
    }
    
    // Update speed display
    speedDisplay.textContent = Math.floor(car.speed);
}

// Main game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update game state
    update();
    
    // Draw everything
    drawRoad();
    drawObstacles();
    drawCar();
    
    // Draw game over screen if needed
    if (gameOver) {
        drawGameOver();
    }
    
    // Continue loop
    if (gameRunning || gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Start the game
gameLoop();
