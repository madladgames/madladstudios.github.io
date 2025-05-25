// Game setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const speedDisplay = document.getElementById('speed');

// Canvas dimensions
canvas.width = 800;
canvas.height = 600;

// Game variables
let gameRunning = true;
let roadOffset = 0;
let roadSpeed = 5;

// Car properties
const car = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 40,
    height: 60,
    speed: 0,
    maxSpeed: 120,
    acceleration: 0.5,
    deceleration: 0.3,
    lateralSpeed: 5,
    color: '#808080' // Gray color
};

// Road properties
const road = {
    width: 400,
    laneWidth: 100,
    centerX: canvas.width / 2
};

// Track curve properties
let trackCurve = 0;
let curveDirection = 1;
let curveSpeed = 0.01;

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

// Update game logic
function update() {
    // Update track curve
    trackCurve += curveDirection * curveSpeed;
    if (Math.abs(trackCurve) > 1) {
        curveDirection *= -1;
    }
    
    // Handle input
    if (keys['ArrowLeft']) {
        car.x -= car.lateralSpeed;
    }
    if (keys['ArrowRight']) {
        car.x += car.lateralSpeed;
    }
    
    // Keep car on road
    const roadLeft = road.centerX - road.width / 2 + 50;
    const roadRight = road.centerX + road.width / 2 - 50;
    car.x = Math.max(roadLeft, Math.min(roadRight, car.x));
    
    // Auto-accelerate for arcade feel
    if (car.speed < car.maxSpeed) {
        car.speed += car.acceleration;
    }
    
    // Update road offset for movement effect
    roadOffset += roadSpeed + car.speed / 20;
    
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
    drawCar();
    
    // Continue loop
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Start the game
gameLoop();
