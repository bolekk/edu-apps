const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('hold-canvas');
const holdCtx = holdCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 30px blocks

// Colors corresponding to standard Tetris colors
const COLORS = [
    null,
    '#00f3ff', // I - Cyan
    '#0051ff', // J - Blue
    '#ffaa00', // L - Orange
    '#ffee00', // O - Yellow
    '#00ff9d', // S - Green
    '#aa00ff', // T - Purple
    '#ff3333', // Z - Red
    '#ffffff'  // 8 - Flash Color
];

const SHAPES = [
    [],
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ], // I
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ], // J
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ], // L
    [
        [4, 4],
        [4, 4]
    ], // O
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ], // S
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ], // T
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]  // Z
];

let grid = createGrid(COLS, ROWS);
let player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    lines: 0,
    level: 1,
    typeId: 0 // To track which shape it is (1-7)
};

let nextPiece = null; // Object { matrix, typeId }
let holdPiece = null; // Object { matrix, typeId }
let canHold = true;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let isPaused = false;
let isGameOver = false;
let isAnimating = false; // New flag for line clear animation
let requestId = null;

function createGrid(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function drawMatrix(matrix, offset, context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Main block color
                context.fillStyle = COLORS[value];
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

                // Bevel effect
                context.fillStyle = 'rgba(255, 255, 255, 0.5)';
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, BLOCK_SIZE, 4);
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE, 4, BLOCK_SIZE);

                context.fillStyle = 'rgba(0, 0, 0, 0.3)';
                context.fillRect((x + offset.x) * BLOCK_SIZE + BLOCK_SIZE - 4, (y + offset.y) * BLOCK_SIZE, 4, BLOCK_SIZE);
                context.fillRect((x + offset.x) * BLOCK_SIZE, (y + offset.y) * BLOCK_SIZE + BLOCK_SIZE - 4, BLOCK_SIZE, 4);

                // Inner glow
                context.shadowColor = COLORS[value];
                context.shadowBlur = 10;
            }
        });
    });
    context.shadowBlur = 0;
}

function drawGhost(matrix, playerPos, context) {
    let ghostPos = { x: playerPos.x, y: playerPos.y };
    while (!collide(grid, { matrix: matrix, pos: ghostPos })) {
        ghostPos.y++;
    }
    ghostPos.y--;

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                context.lineWidth = 2;
                context.strokeRect((x + ghostPos.x) * BLOCK_SIZE, (y + ghostPos.y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}


function draw() {
    ctx.fillStyle = '#0b0c10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(canvas.width, i * BLOCK_SIZE);
        ctx.stroke();
    }

    drawMatrix(grid, { x: 0, y: 0 }, ctx);

    // Only draw player piece if not animating
    if (player.matrix && !isAnimating) {
        drawGhost(player.matrix, player.pos, ctx);
        drawMatrix(player.matrix, player.pos, ctx);
    }
}

function drawNext() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (nextPiece) {
        const xOffset = (nextCanvas.width / BLOCK_SIZE - nextPiece.matrix[0].length) / 2;
        const yOffset = (nextCanvas.height / BLOCK_SIZE - nextPiece.matrix.length) / 2;
        drawMatrix(nextPiece.matrix, { x: xOffset, y: yOffset }, nextCtx);
    }
}

function drawHold() {
    holdCtx.clearRect(0, 0, holdCanvas.width, holdCanvas.height);
    if (holdPiece) {
        const xOffset = (holdCanvas.width / BLOCK_SIZE - holdPiece.matrix[0].length) / 2;
        const yOffset = (holdCanvas.height / BLOCK_SIZE - holdPiece.matrix.length) / 2;
        if (!canHold) {
            holdCtx.globalAlpha = 0.5;
        }
        drawMatrix(holdPiece.matrix, { x: xOffset, y: yOffset }, holdCtx);
        holdCtx.globalAlpha = 1.0;
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    // Transpose
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    // Reverse rows
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function getPiece() {
    const id = (Math.random() * 7 | 0) + 1;
    return {
        matrix: SHAPES[id].map(row => [...row]),
        typeId: id
    };
}

function playerReset() {
    if (!nextPiece) {
        nextPiece = getPiece();
    }

    player.matrix = nextPiece.matrix;
    player.typeId = nextPiece.typeId;
    nextPiece = getPiece();

    player.pos.y = 0;
    player.pos.x = (grid[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(grid, player)) {
        isGameOver = true;
        updateUI();
    }

    canHold = true;
    drawNext();
    drawHold();
}

function scanLines() {
    let rowsToClear = [];
    outer: for (let y = grid.length - 1; y >= 0; --y) {
        for (let x = 0; x < grid[y].length; ++x) {
            if (grid[y][x] === 0) {
                continue outer;
            }
        }
        rowsToClear.push(y);
    }
    return rowsToClear; // Returns indices of full rows
}

function animateAndClearLines(rows) {
    isAnimating = true;

    // Save original lines to restore during flash
    const originalRows = rows.map(y => [...grid[y]]);

    const flash = (isWhite) => {
        rows.forEach((y, i) => {
            if (isWhite) {
                grid[y].fill(8); // White
            } else {
                grid[y] = [...originalRows[i]]; // Restore original color
            }
        });
        draw(); // Force redraw
    };

    // Flash sequence: White -> Original -> White -> Original -> White -> Clear
    flash(true);

    setTimeout(() => {
        flash(false);
    }, 150);

    setTimeout(() => {
        flash(true);
    }, 300);

    setTimeout(() => {
        flash(false);
    }, 450);

    setTimeout(() => {
        flash(true);
    }, 600);

    // Final clear after 750ms
    setTimeout(() => {
        // Remove rows
        let rowCount = rows.length;

        let newGrid = grid.filter((row, idx) => !rows.includes(idx));

        while (newGrid.length < ROWS) {
            newGrid.unshift(new Array(COLS).fill(0));
        }

        grid = newGrid;

        // Scoring
        const lineScores = [0, 40, 100, 300, 1200];
        player.score += lineScores[rowCount] * player.level;
        player.lines += rowCount;
        player.level = Math.floor(player.lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (player.level - 1) * 100);

        isAnimating = false;
        playerReset();

        updateUI();

    }, 750);
}

function playerDrop() {
    if (isAnimating) return; // Block drop during animation

    player.pos.y++;
    if (collide(grid, player)) {
        player.pos.y--;
        merge(grid, player);

        const fullRows = scanLines();
        if (fullRows.length > 0) {
            animateAndClearLines(fullRows);
            // playerReset is called after animation
        } else {
            playerReset();
        }
    }
    dropCounter = 0;
}

function playerMove(dir) {
    player.pos.x += dir;
    if (collide(grid, player)) {
        player.pos.x -= dir;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    // Basic Wall Kick
    while (collide(grid, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerHold() {
    if (!canHold || isGameOver || isPaused || isAnimating) return;

    if (!holdPiece) {
        holdPiece = {
            matrix: SHAPES[player.typeId].map(row => [...row]),
            typeId: player.typeId
        };
        playerReset();
    } else {
        const currentType = player.typeId;
        const heldType = holdPiece.typeId;

        player.typeId = heldType;
        player.matrix = SHAPES[heldType].map(row => [...row]);

        holdPiece = {
            matrix: SHAPES[currentType].map(row => [...row]),
            typeId: currentType
        };

        player.pos.y = 0;
        player.pos.x = (grid[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);
    }

    canHold = false;
    drawHold();
    drawNext();
}

function update(time = 0) {
    if (isPaused || isGameOver) {
        return;
    }

    // Always request next frame
    requestId = requestAnimationFrame(update);

    // If animating, we might want to skip logic or just let the draw happen
    if (isAnimating) {
        draw();
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    updateUI();
}

function updateUI() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('level').innerText = player.level;
    document.getElementById('lines').innerText = player.lines;

    const overlay = document.getElementById('game-overlay');
    if (isGameOver) {
        document.getElementById('overlay-title').innerText = "GAME OVER";
        document.getElementById('overlay-message').innerText = `Final Score: ${player.score}`;
        document.getElementById('start-btn').innerText = "Play Again";
        overlay.style.display = 'flex';
    } else if (isPaused) {
        document.getElementById('overlay-title').innerText = "PAUSED";
        document.getElementById('overlay-message').innerText = "Press ESC to Resume";
        document.getElementById('start-btn').innerText = "Resume";
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

function startGame() {
    if (requestId) cancelAnimationFrame(requestId);

    grid = createGrid(COLS, ROWS);
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    nextPiece = null;
    holdPiece = null;
    isAnimating = false;
    playerReset();

    isGameOver = false;
    isPaused = false;

    updateUI();
    lastTime = performance.now();
    update();
}

document.addEventListener('keydown', event => {
    if (event.keyCode === 27) { // ESC
        if (isGameOver) return;

        if (!requestId && !isPaused && !isGameOver) {
            return;
        }

        isPaused = !isPaused;
        updateUI();
        if (!isPaused) {
            lastTime = performance.now();
            update();
        } else {
            if (requestId) cancelAnimationFrame(requestId);
        }
        return;
    }

    if (isPaused || isGameOver || isAnimating) return; // Block input during animation

    switch (event.keyCode) {
        case 37: // Left
            playerMove(-1);
            break;
        case 39: // Right
            playerMove(1);
            break;
        case 40: // Down (Soft Drop)
            playerDrop();
            break;
        case 81: // Q
        case 38: // Up
            playerRotate(1);
            break;
        case 32: // Space
            while (!collide(grid, player)) {
                player.pos.y++;
            }
            player.pos.y--;
            merge(grid, player);

            const fullRows = scanLines();
            if (fullRows.length > 0) {
                animateAndClearLines(fullRows);
            } else {
                playerReset();
            }

            dropCounter = 0;
            break;
        case 67: // C
            playerHold();
            break;
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    const btnText = document.getElementById('start-btn').innerText;
    if (btnText === 'Resume') {
        isPaused = false;
        updateUI();
        lastTime = performance.now();
        update();
    } else {
        startGame();
    }
});

// Initial Render
draw();
