// Game assets and bundles
const gameBundles = {
    cloud: {
        bird: 'bird1',
        background: 'bg1',
        pillar: 'pillar1',
        music: 'mus1'
    },
    night: {
        bird: 'bird2',
        background: 'bg2',
        pillar: 'pillar2',
        music: 'mus2'
    },
    rocky: {
        bird: 'bird3',
        background: 'bg3',
        pillar: 'pillar3',
        music: 'mus3'
    },
    cyber: {
        bird: 'bird4',
        background: 'bg4',
        pillar: 'pillar4',
        music: 'mus4'
    }
};

const gameAssets = {
    birds: [
        { id: 'bird1', src: 'Assets/cloudy bird.png', name: 'Classic Bird' },
        { id: 'bird2', src: 'Assets/night bird.png', name: 'Night Bird' },
        { id: 'bird3', src: 'Assets/rocky bird.png', name: 'Rocky Bird' },
        { id: 'bird4', src: 'Assets/cyber bird.png', name: 'Cyber Bird' },
    ],
    backgrounds: [
        { id: 'bg1', src: 'Assets/a day sky.png', name: 'Day Sky' },
        { id: 'bg2', src: 'Assets/a night sky.png', name: 'Night Sky' },
        { id: 'bg3', src: 'Assets/a rocky terrain.png', name: 'Rocky Terrain' },
        { id: 'bg4', src: 'Assets/cyber city.png', name: 'Cyber City' },
    ],
    pillars: [
        { id: 'pillar1', src: 'Assets/white pillar.png', name: 'White Pillar' },
        { id: 'pillar2', src: 'Assets/dark pillar.png', name: 'Dark Pillar' },
        { id: 'pillar3', src: 'Assets/rocky pillar.png', name: 'Stone Pillar' },
        { id: 'pillar4', src: 'Assets/cyber tower.png', name: 'Cyber Tower' },
    ],
    music: [
            { id: 'mus1', src: 'Music assets/Flying Through Clouds.MP3', name: 'Flying Through Clouds', img: 'Assets/a day sky.png' },
            { id: 'mus2', src: 'Music assets/Whispering Shadows.MP3', name: 'Whispering Shadows', img: 'Assets/a night sky.png' },
            { id: 'mus3', src: 'Music assets/Offroad Dreams.MP3', name: 'Offroad Dreams', img: 'Assets/a rocky terrain.png' },
            { id: 'mus4', src: 'Music assets/Flappy Wires.MP3', name: 'Flappy Wires', img: 'Assets/cyber city.png' }
        ],    
    powerups: [
        { id: 'swoosh', src: 'Assets/swoosh-powerup.png', name: 'Swoosh Power' },
        { id: 'immunity', src: 'Assets/immunity-powerup.png', name: 'Immunity Shield' }
    ]
};

// Game configuration
let gameConfig = {
    selectedBird: 'bird1',
    selectedBackground: 'bg1',
    selectedPillar: 'pillar1',
    selectedMusic: 'mus1',
    activePowerup: null,
    powerupDuration: 0,
};

// Game variables
let highScore = localStorage.getItem('highScore') || 0;
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let gameStarted = false;
let countdownStarted = false;
let gameOver = false;
let score = 0;
let countdown = 3;
let lastFrameTime = Date.now();  // Initialize with the current time
const targetDeltaTime = 1 / 60;  // Target 60 FPS as the baseline
let bird = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 40,
    height: 40,
    vy: 0,
    gravity: 0.45
};
let pipes = [];
let powerups = [];
let PIPE_SPEED = 3;
let pipesPassed = 0;
let nextPowerupSpawn = 5;

// Load assets
let loadedAssets = {};
let assetsToLoad = Object.values(gameAssets).reduce((acc, curr) => acc + curr.length, 0);
let assetsLoaded = 0;

function loadAssets() {
    let assetsToLoad = Object.values(gameAssets).reduce((count, assets) => count + assets.length, 0);
    let assetsLoaded = 0;

    function loadImage(asset, category) {
        const img = new Image();
        img.src = asset.src;
        console.log(`Loading image: ${asset.src}`);
        img.onload = () => {
            console.log(`Loaded image: ${asset.src}`);
            if (!loadedAssets[category]) loadedAssets[category] = {};
            loadedAssets[category][asset.id] = img;
            assetsLoaded++;
            if (assetsLoaded === assetsToLoad) initializeGame();
        };
        img.onerror = () => {
            console.error(`Failed to load image: ${asset.src}`);
            assetsLoaded++;
            if (assetsLoaded === assetsToLoad) initializeGame();
        };
    }
    function loadSound(asset) {
        const audio = new Audio(asset.src);
        console.log(`Loading audio: ${asset.src}`);
        audio.addEventListener('loadeddata', () => {
            console.log(`Loaded audio: ${asset.src}`);
            if (!loadedAssets.music) loadedAssets.music = {};
            loadedAssets.music[asset.id] = audio;
            assetsLoaded++;
            if (assetsLoaded === assetsToLoad) initializeGame();
        });
        audio.addEventListener('error', () => {
            console.error(`Failed to load audio: ${asset.src}`);
            assetsLoaded++;
            if (assetsLoaded === assetsToLoad) initializeGame();
        });
    }

    Object.entries(gameAssets).forEach(([category, assets]) => {
        assets.forEach(asset => {
            if (category === 'music') {
                loadSound(asset);
            } else {
                loadImage(asset, category);
            }
        });
    });
}


function setupUI() {
    setupCustomizationOptions();
    setupBundleOptions();
    updateHighScore();
    
    // Event listeners for buttons
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('customize-button').addEventListener('click', () => {
        document.getElementById('home-screen').classList.remove('active');
        document.getElementById('customize-screen').classList.add('active');
    });
    document.getElementById('back-to-home').addEventListener('click', () => {
        document.getElementById('customize-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
    });
    document.getElementById('musicToggleButton').addEventListener('click', toggleMusic);
    document.getElementById('homeButton').addEventListener('click', goHome);
    
    var pipeSpeedSelect = document.getElementById("pipeSpeed");
    
    pipeSpeedSelect.addEventListener("change", function() {
        PIPE_SPEED = parseInt(pipeSpeedSelect.value); // Update PIPE_SPEED
        console.log("Pipe speed updated to:", PIPE_SPEED);
        refreshPipeSpeed(); // Update pipes with new speed
    });
}

// Ensure the game uses the updated PIPE_SPEED
function updatePipeSpeed(speed) {
    PIPE_SPEED = speed;
    console.log("Pipe speed updated to:", PIPE_SPEED);
}

// Dummy function to demonstrate speed usage
function refreshPipeSpeed() {
    // Example of updating pipes with the current speed
    // Your pipe logic here
    console.log("Refreshing pipes with speed:", PIPE_SPEED);
}

function setupModal() {
    var infoButton = document.getElementById("info-button");
    var infoModal = document.getElementById("info-modal");
    var closeButton = document.querySelector(".close-button");

    infoButton.addEventListener("click", function() {
        infoModal.style.display = "block";
    });

    closeButton.addEventListener("click", function() {
        infoModal.style.display = "none";
    });

    window.addEventListener("click", function(event) {
        if (event.target == infoModal) {
            infoModal.style.display = "none";
        }
    });
}
document.addEventListener("DOMContentLoaded", function() {
    setupModal();
});

function setupCustomizationOptions() {
    function createOption(item, type) {
        const div = document.createElement('div');
        div.className = `${type}-option`;
        div.setAttribute('data-id', item.id);
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.name;
            div.appendChild(img);

        div.addEventListener('click', () => {
            document.querySelectorAll(`.${type}-option`).forEach(opt => opt.classList.remove('selected'));
            div.classList.add('selected');
            gameConfig[`selected${type.charAt(0).toUpperCase() + type.slice(1)}`] = item.id;
        });

        return div;
    }
    // Setup all options
    Object.entries(gameAssets).forEach(([category, assets]) => {
        const container = document.getElementById(`${category.slice(0, -1)}-options`);
        if (container) {
            assets.forEach(asset => {
                const option = createOption(asset, category.slice(0, -1));
                container.appendChild(option);
            });
        }
    });
}
function displayMusicOptions() {
    const musicAssets = gameAssets.music;
    musicAssets.forEach(item => {
        console.log('Creating music option for:', item); // Debug log
        const container = document.getElementById('music-options');
        if (container) {
            const div = document.createElement('div');
            div.className = 'music-option';
            div.setAttribute('data-id', item.id);
            const placeholderImg = document.createElement('img');
            placeholderImg.src = item.img; 
            placeholderImg.className = 'music-placeholder';
            div.appendChild(placeholderImg);

            // Add click event listener to select music
            div.addEventListener('click', () => {
                document.querySelectorAll('.music-option').forEach(opt => opt.classList.remove('selected'));
                div.classList.add('selected');
                const currentMusic = loadedAssets.music[gameConfig.selectedMusic];
                if (currentMusic) {
                    currentMusic.pause();
                    currentMusic.currentTime = 0;
                }
                gameConfig.selectedMusic = item.id;
                const newMusic = loadedAssets.music[item.id];
                if (!document.getElementById('musicToggleButton').innerHTML.includes('On')) {
                    if (newMusic) {
                        newMusic.play();
                    }
                }
            });

            console.log('Appending music option for:', item.name); // Debug log
            container.appendChild(div);
        }
    });
}

displayMusicOptions();
function setupBundleOptions() {
    const bundleContainer = document.getElementById('bundle-options');
    
    Object.entries(gameBundles).forEach(([bundleId, bundle]) => {
        const bundleOption = document.querySelector(`.bundle-option[data-bundle="${bundleId}"]`);
        if (bundleOption) {
            bundleOption.addEventListener('click', () => {
                // Remove selection from all bundles
                document.querySelectorAll('.bundle-option').forEach(opt => opt.classList.remove('selected'));
                // Select this bundle
                bundleOption.classList.add('selected');
                // Apply bundle settings
                applyBundle(bundle);
            });
        }
    });
}

function applyBundle(bundle) {
    // Stop current music if playing
    const currentMusic = loadedAssets.music[gameConfig.selectedMusic];
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
    }

    // Apply bundle settings
    gameConfig.selectedBird = bundle.bird;
    gameConfig.selectedBackground = bundle.background;
    gameConfig.selectedPillar = bundle.pillar;
    gameConfig.selectedMusic = bundle.music;

    // Play new music only if music is currently on
    if (!document.getElementById('musicToggleButton').innerHTML.includes('On')) {
        const newMusic = loadedAssets.music[bundle.music];
        if (newMusic) {
            newMusic.play();
        }
    }

    // Update UI to reflect bundle selection
    Object.entries(bundle).forEach(([type, id]) => {
        document.querySelectorAll(`.${type}-option`).forEach(opt => {
            opt.classList.toggle('selected', opt.getAttribute('data-id') === id);
        });
    });
}

// Game functions
let gameSpeed = 1;
let startTime;

function startGame() {
    gameStarted = true;
    countdownStarted = true;
    gameOver = false;
    countdown = 3;
    score = 0;
    pipes = [];
    powerups = [];
    pipesPassed = 0;
    bird.y = canvas.height / 2;
    bird.vy = 0;
    gameSpeed = 0.5; // Initial slower speed
    startTime = Date.now(); // Track start time
    document.getElementById('home-screen').classList.remove('active');
    canvas.style.display = 'block';
    let countdownInterval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
            countdownStarted = false;
            clearInterval(countdownInterval);
        }
    }, 1000);
}

function spawnPowerup() {
    if (pipesPassed >= nextPowerupSpawn) {
        const powerupType = Math.random() < 0.5 ? 'swoosh' : 'immunity';
        const lastPipe = pipes[pipes.length - 1];
        
        if (lastPipe) {
            powerups.push({
                type: powerupType,
                x: lastPipe.x + 40,
                y: lastPipe.y + 75, // Middle of the gap
                width: 30,
                height: 30
            });
        }
        if (powerupType === 'swoosh') {
            nextPowerupSpawn = pipesPassed + Math.floor(Math.random() * 15) + 15; 
        } else {
            nextPowerupSpawn = pipesPassed + Math.floor(Math.random() * 6) + 10; 
        }
    }
}

function update(deltaTime) {
    if (!gameStarted || countdownStarted || gameOver) return;

    // Adjust bird movement with normalized deltaTime
    bird.y += bird.vy * deltaTime;
    bird.vy += bird.gravity * deltaTime;

    if (bird.y + bird.height / 2 > canvas.height || bird.y - bird.height / 2 < 0) {
        endGame();
        return;
    }

    // Update pipes
    pipes.forEach(pipe => {
        pipe.x -= PIPE_SPEED * deltaTime;

        if (!pipe.passed && bird.x > pipe.x + 40) {
            score++;
            pipesPassed++;
            pipe.passed = true;
            spawnPowerup();
        }

        if (gameConfig.activePowerup !== 'immunity' && checkCollision(bird, pipe)) {
            endGame();
            return;
        }

        if (pipe.x < -80) {
            pipes.splice(pipes.indexOf(pipe), 1);
        }
    });

    // Update powerups
    // Update powerups
for (let i = powerups.length - 1; i >= 0; i--) {
    powerups[i].x -= PIPE_SPEED * deltaTime;  // Move powerup based on deltaTime

    // Check for collision with the bird
    if (checkPowerupCollision(bird, powerups[i])) {
        activatePowerup(powerups[i].type);  // Activate powerup if collected
        powerups.splice(i, 1);  // Remove the collected powerup
        continue;
    }

    // Remove powerup if it moves off screen
    if (powerups[i].x < -powerups[i].width) {
        powerups.splice(i, 1);
    }
}

    // Spawn new pipes
    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 250) {
        pipes.push({
            x: canvas.width,
            y: Math.random() * (canvas.height - 300) + 50,
            passed: false
        });
    }

    // Handle active powerup
    if (gameConfig.activePowerup) {
        gameConfig.powerupDuration--;
        if (gameConfig.powerupDuration <= 0) {
            gameConfig.activePowerup = null;
        }
    }
}

function checkCollision(bird, pipe) {
    return (bird.x + bird.width / 2 > pipe.x &&
            bird.x - bird.width / 2 < pipe.x + 80 &&
            (bird.y - bird.height / 2 < pipe.y || bird.y + bird.height / 2 > pipe.y + 150));
}

function checkPowerupCollision(bird, powerup) {
    return (bird.x + bird.width / 2 > powerup.x &&
            bird.x - bird.width / 2 < powerup.x + powerup.width &&
            bird.y + bird.height / 2 > powerup.y &&
            bird.y - bird.height / 2 < powerup.y + powerup.height);
}

function activatePowerup(type) {
    gameConfig.activePowerup = type;
    gameConfig.powerupDuration = type === 'immunity' ? 300 : 50; // 5 seconds for immunity
    
    if (type === 'swoosh') {
        score += 5; // swoosh adds 5 points
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    
    if (gameOver) {
        drawGameOver();
        return;
    }
    
    if (countdownStarted) {
        drawCountdown();
        return;
    }
    
    drawPipes();
    drawPowerups();
    drawBird();
    drawScore();
}

function drawBackground() {
    const bgImg = loadedAssets.backgrounds[gameConfig.selectedBackground];
    if (bgImg) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    }
}

function drawBird() {
    const birdImg = loadedAssets.birds[gameConfig.selectedBird];
    if (birdImg) {
        ctx.save();
        ctx.translate(bird.x, bird.y);
        ctx.rotate(Math.min(Math.max(bird.vy * 0.05, -0.5), 0.5));
        ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
        ctx.restore();
        
        if (gameConfig.activePowerup) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = gameConfig.activePowerup === 'immunity' ? '#0000ff' : '#ff0000';
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.width / 2 + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
}

function drawPipes() {
    const pillarImg = loadedAssets.pillars[gameConfig.selectedPillar];
    if (!pillarImg) return;
    
    pipes.forEach(pipe => {
        // Draw top pipe
        ctx.save();
        ctx.translate(pipe.x + 40, pipe.y);
        ctx.rotate(Math.PI);
        ctx.drawImage(pillarImg, -40, 0, 80, pipe.y);
        ctx.restore();
        
        // Draw bottom pipe
        ctx.drawImage(pillarImg, pipe.x, pipe.y + 150, 80, canvas.height - (pipe.y + 150));
    });
}

function drawPowerups() {
    powerups.forEach(powerup => {
        const powerupImg = loadedAssets.powerups[powerup.type];
        if (powerupImg) {
            ctx.drawImage(powerupImg, powerup.x, powerup.y, powerup.width, powerup.height);
        }
    });
}

function drawScore() {
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeText(score.toString(), canvas.width / 2, 20);
    ctx.fillText(score.toString(), canvas.width / 2, 20);
}

function drawCountdown() {
    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(countdown.toString(), canvas.width / 2, canvas.height / 2);
    ctx.fillText(countdown.toString(), canvas.width / 2, canvas.height / 2);
}

function drawGameOver() {
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.strokeText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.font = 'bold 36px Arial';
    ctx.strokeText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    
    ctx.font = '24px Arial';
    ctx.strokeText('Click to play again', canvas.width / 2, canvas.height / 2 + 60);
    ctx.fillText('Click to play again', canvas.width / 2, canvas.height / 2 + 60);
}

function endGame() {
    gameOver = true;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        updateHighScore();
    }
}

function updateHighScore() {
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        highScoreElement.textContent = `High Score: ${highScore}`;
    }
}

function goHome() {
    canvas.style.display = 'none';
    document.getElementById('customize-screen').classList.remove('active'); // Hide the customize screen
    document.getElementById('home-screen').classList.add('active');
    gameStarted = false;
    gameOver = false;
}

function toggleMusic() {
    const musicButton = document.getElementById('musicToggleButton');
    const currentMusic = loadedAssets.music[gameConfig.selectedMusic];
    
    if (musicButton.innerHTML.includes('On')) {
        if (currentMusic) {
            currentMusic.play();
        }
        musicButton.innerHTML = '<span class="button-icon">🔇</span> Music Off';
    } else {
        if (currentMusic) {
            currentMusic.pause();
            currentMusic.currentTime = 0;
        }
        musicButton.innerHTML = '<span class="button-icon">🎵</span> Music On';
    }
}

// Game loop
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    // Normalize deltaTime to keep movement consistent
    const normalizedDeltaTime = deltaTime / targetDeltaTime;

    update(normalizedDeltaTime);
    draw();
    requestAnimationFrame(gameLoop);
}

// Initialize game
function initializeGame() {
    setupUI();
    canvas.addEventListener('click', () => {
        if (gameOver) {
            startGame();
        } else if (gameStarted && !countdownStarted) {
                bird.vy = -6.5;
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if ((e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') &&
            gameStarted && !countdownStarted && !gameOver) {
            bird.vy = -6.5;
            e.preventDefault();
        }
    });
    
    document.addEventListener('click', (e) => {
        if (gameStarted && !countdownStarted && !gameOver) {
            bird.vy = -6.5; 
            e.preventDefault();
        }
    });
    
    document.addEventListener('touchstart', (e) => {
        if (gameStarted && !countdownStarted && !gameOver) {
            bird.vy = -6.5;  
            e.preventDefault();
        }
    }, { passive: false });
     
    requestAnimationFrame(gameLoop);
}

// Start loading assets when the page loads
window.addEventListener('load', loadAssets);