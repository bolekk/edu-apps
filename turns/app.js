// ─── Canvas & UI Setup ────────────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const leftCountEl = document.getElementById('left-count');
const rightCountEl = document.getElementById('right-count');
const pointsCountEl = document.getElementById('points-count');
const pointsRow = document.getElementById('points-row');
const answerButtons = document.getElementById('answer-buttons');
const leftBtn = document.getElementById('left-btn');
const rightBtn = document.getElementById('right-btn');
const newPathBtn = document.getElementById('new-path-btn');
const arrowToggle = document.getElementById('arrow-toggle');
const hintEl = document.getElementById('hint-text');

// ─── Resize ───────────────────────────────────────────────────────────────────
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', () => { resize(); generatePath(); });
resize();

// ─── State ────────────────────────────────────────────────────────────────────
const SPEED = 150; // px/sec
const CHAR_SIZE = 14;
const GEM_SIZE = 12;
const WAYPOINT_RADIUS = 6;

let waypoints = [];      // [{x, y}]
let bounties = [];       // [{x, y, collected, wrong, answered}] one per segment between waypoints
let character = { x: 0, y: 0, angle: 0 };
let segmentIdx = 0;      // index into waypoints: moving from waypoints[segmentIdx] to waypoints[segmentIdx+1]
let passedMidpoint = false;
// state: 'walking' | 'at_turn' | 'at_bounty' | 'feedback_turn' | 'feedback_bounty' | 'finished'
let state = 'walking';
let feedbackTimer = 0;
let feedbackCorrect = false;
let feedbackBounty = false;
let leftTurns = 0;
let rightTurns = 0;
let points = 0;
let showArrow = false;
let difficulty = 'easy'; // 'easy' | 'hard'
let sparkles = [];
let feedbackGemPos = null;

// ─── Path Generation ──────────────────────────────────────────────────────────
function generatePath() {
    const W = canvas.width;
    const H = canvas.height;
    const panelRight = 280;
    const margin = 60;
    const minX = panelRight + 30;
    const maxX = W - margin;
    const minY = margin;
    const maxY = H - margin;
    const usableW = maxX - minX;
    const usableH = maxY - minY;

    // Scale segment length to screen size so path always spans the canvas
    const shortSide = Math.min(usableW, usableH);
    const SEG_MIN = shortSide * 0.18;
    const SEG_MAX = shortSide * 0.32;
    const TURN_MIN = 30 * Math.PI / 180;
    const TURN_MAX = 150 * Math.PI / 180;
    const numSegments = difficulty === 'easy'
        ? 4 + Math.floor(Math.random() * 2)   // easy: 4–5 turns
        : 10 + Math.floor(Math.random() * 4);  // hard: 10–13 turns

    // Grid to track coverage — prefer placing waypoints in less-visited cells
    const GCOLS = 4, GROWS = 3;
    const grid = new Array(GCOLS * GROWS).fill(0);
    function cellOf(x, y) {
        const c = Math.max(0, Math.min(GCOLS - 1, Math.floor((x - minX) / usableW * GCOLS)));
        const r = Math.max(0, Math.min(GROWS - 1, Math.floor((y - minY) / usableH * GROWS)));
        return r * GCOLS + c;
    }

    waypoints = [];

    // Start anywhere in the usable area
    const startX = minX + Math.random() * usableW;
    const startY = minY + Math.random() * usableH;
    waypoints.push({ x: startX, y: startY });
    grid[cellOf(startX, startY)]++;

    let dir = Math.random() * Math.PI * 2; // any initial direction

    for (let attempt = 0; attempt < numSegments; attempt++) {
        const prev = waypoints[waypoints.length - 1];

        // Generate 16 candidates with valid turns, pick the one landing in the least-visited cell
        const candidates = [];
        const triesPerSide = 8;
        for (let t = 0; t < triesPerSide * 2; t++) {
            const sign = t < triesPerSide ? 1 : -1;
            const turnAngle = sign * (TURN_MIN + Math.random() * (TURN_MAX - TURN_MIN));
            const newDir = dir + turnAngle;
            const segLen = SEG_MIN + Math.random() * (SEG_MAX - SEG_MIN);
            const nx = prev.x + Math.cos(newDir) * segLen;
            const ny = prev.y + Math.sin(newDir) * segLen;
            if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
                candidates.push({ nx, ny, newDir, cell: cellOf(nx, ny) });
            }
        }

        if (candidates.length > 0) {
            // Pick candidate in least-visited cell (tie-break randomly)
            candidates.sort((a, b) => grid[a.cell] - grid[b.cell]);
            const best = candidates[0];
            dir = best.newDir;
            waypoints.push({ x: best.nx, y: best.ny });
            grid[best.cell]++;
        } else {
            // Fallback: reflect off nearest wall
            const segLen = SEG_MIN + Math.random() * (SEG_MAX - SEG_MIN);
            let nx = prev.x + Math.cos(dir) * segLen;
            let ny = prev.y + Math.sin(dir) * segLen;
            if (nx < minX || nx > maxX) { dir = Math.PI - dir; nx = Math.max(minX, Math.min(maxX, nx)); }
            if (ny < minY || ny > maxY) { dir = -dir; ny = Math.max(minY, Math.min(maxY, ny)); }
            waypoints.push({ x: nx, y: ny });
            grid[cellOf(nx, ny)]++;
        }
    }

    // generate bounties: one per segment except the last
    bounties = [];
    for (let i = 0; i < waypoints.length - 2; i++) {
        const A = waypoints[i];
        const B = waypoints[i + 1];
        const mx = (A.x + B.x) / 2;
        const my = (A.y + B.y) / 2;
        // perpendicular direction
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const len = Math.hypot(dx, dy);
        const nx = -dy / len;
        const ny = dx / len;
        const side = Math.random() < 0.5 ? 1 : -1;
        const offset = 30 + Math.random() * 25;
        bounties.push({
            x: mx + nx * side * offset,
            y: my + ny * side * offset,
            collected: false,
            wrong: false,
            answered: false,
            segIdx: i
        });
    }

    // reset state
    character.x = waypoints[0].x;
    character.y = waypoints[0].y;
    segmentIdx = 0;
    passedMidpoint = false;
    state = 'walking';
    leftTurns = 0;
    rightTurns = 0;
    points = 0;
    sparkles = [];
    feedbackTimer = 0;
    feedbackGemPos = null;

    updateUI();
    updateAngle();
}

function updateAngle() {
    if (segmentIdx < waypoints.length - 1) {
        const next = waypoints[segmentIdx + 1];
        character.angle = Math.atan2(next.y - character.y, next.x - character.x);
    }
}

// ─── Turn Direction ───────────────────────────────────────────────────────────
// Returns 'left' or 'right' from character's egocentric perspective
// Using cross product in canvas coords (y-down)
function turnDirection(A, B, C) {
    const cross = (B.x - A.x) * (C.y - B.y) - (B.y - A.y) * (C.x - B.x);
    return cross > 0 ? 'right' : 'left';
}

// Returns 'left' or 'right' of bounty from character traveling A→B
function bountyDirection(A, B, gemPos) {
    const cross = (B.x - A.x) * (gemPos.y - A.y) - (B.y - A.y) * (gemPos.x - A.x);
    return cross > 0 ? 'right' : 'left';
}

// ─── UI ───────────────────────────────────────────────────────────────────────
function updateUI() {
    leftCountEl.textContent = leftTurns;
    rightCountEl.textContent = rightTurns;
    pointsCountEl.textContent = points;
    // always show points row
}

function showButtons() {
    answerButtons.classList.remove('hidden');
    leftBtn.disabled = false;
    rightBtn.disabled = false;
}

function hideButtons() {
    answerButtons.classList.add('hidden');
}

function setHint(text) {
    hintEl.textContent = text;
}

// ─── Answer Handling ──────────────────────────────────────────────────────────
function handleAnswer(answer) {
    if (state === 'at_turn') {
        const A = waypoints[segmentIdx - 1];
        const B = waypoints[segmentIdx];
        const C = waypoints[segmentIdx + 1];
        const correct = turnDirection(A, B, C);
        leftBtn.disabled = true;
        rightBtn.disabled = true;

        if (answer === correct) {
            feedbackCorrect = true;
            feedbackBounty = false;
            state = 'feedback_turn';
            feedbackTimer = 0.6;
            if (correct === 'left') leftTurns++;
            else rightTurns++;
            updateUI();
        } else {
            feedbackCorrect = false;
            feedbackBounty = false;
            state = 'feedback_turn';
            feedbackTimer = 0.7;
            // wiggle canvas character — trigger on panel instead
            canvas.classList.add('wiggle');
            setTimeout(() => canvas.classList.remove('wiggle'), 400);
        }
    } else if (state === 'at_bounty') {
        const bounty = bounties.find(b => b.segIdx === segmentIdx && !b.answered);
        if (!bounty) return;

        const A = waypoints[segmentIdx];
        const B = waypoints[segmentIdx + 1];
        const correct = bountyDirection(A, B, bounty);

        bounty.answered = true;
        leftBtn.disabled = true;
        rightBtn.disabled = true;
        feedbackGemPos = { x: bounty.x, y: bounty.y };

        if (answer === correct) {
            feedbackCorrect = true;
            bounty.collected = true;
            points += 10;
            spawnSparkles(bounty.x, bounty.y);
            spawnSparkles(bounty.x, bounty.y); // double sparkles for gem collect
        } else {
            feedbackCorrect = false;
            bounty.wrong = true;
        }

        feedbackBounty = true;
        state = 'feedback_bounty';
        feedbackTimer = 1.1;
        updateUI();
    }
}

leftBtn.addEventListener('click', () => handleAnswer('left'));
rightBtn.addEventListener('click', () => handleAnswer('right'));

newPathBtn.addEventListener('click', generatePath);

document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.diff;
        generatePath();
    });
});

arrowToggle.addEventListener('change', () => {
    showArrow = arrowToggle.checked;
});

// ─── Sparkles ─────────────────────────────────────────────────────────────────
function spawnSparkles(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
        const speed = 60 + Math.random() * 80;
        sparkles.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: ['#fbbf24', '#f59e0b', '#fcd34d', '#22d3ee'][Math.floor(Math.random() * 4)]
        });
    }
}

function updateSparkles(dt) {
    for (const s of sparkles) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 120 * dt; // gravity
        s.life -= dt * 1.8;
    }
    sparkles = sparkles.filter(s => s.life > 0);
}

// ─── Update ───────────────────────────────────────────────────────────────────
function update(dt) {
    if (dt > 0.1) dt = 0.1; // clamp on tab-switch

    updateSparkles(dt);

    if (state === 'walking') {
        const target = waypoints[segmentIdx + 1];
        const dx = target.x - character.x;
        const dy = target.y - character.y;
        const dist = Math.hypot(dx, dy);
        const step = SPEED * dt;

        // check bounty midpoint
        const A = waypoints[segmentIdx];
        const B = waypoints[segmentIdx + 1];
        const totalLen = Math.hypot(B.x - A.x, B.y - A.y);
        const traveled = Math.hypot(character.x - A.x, character.y - A.y);
        const progress = totalLen > 0 ? traveled / totalLen : 1;

        const bounty = bounties.find(b => b.segIdx === segmentIdx && !b.answered);
        if (bounty && !passedMidpoint && progress >= 0.5) {
            passedMidpoint = true;
            character.x = A.x + (B.x - A.x) * 0.5;
            character.y = A.y + (B.y - A.y) * 0.5;
            state = 'at_bounty';
            setHint('Is the gem on your LEFT or RIGHT?');
            showButtons();
            return;
        }

        if (step >= dist) {
            // arrived at next waypoint
            character.x = target.x;
            character.y = target.y;

            const isFinish = segmentIdx + 1 === waypoints.length - 1;
            if (isFinish) {
                state = 'finished';
                hideButtons();
                setHint('You reached the finish! Great job!');
                return;
            }

            segmentIdx++;
            passedMidpoint = false;
            // Don't update angle yet — wait until user answers the turn

            // Check if this waypoint has a next segment (is a turn)
            if (segmentIdx < waypoints.length - 1) {
                state = 'at_turn';
                setHint('Which way does the path turn?');
                showButtons();
            }
        } else {
            character.x += (dx / dist) * step;
            character.y += (dy / dist) * step;
            character.angle = Math.atan2(dy, dx);
        }
    } else if (state === 'feedback_turn') {
        feedbackTimer -= dt;
        if (feedbackTimer <= 0) {
            if (feedbackCorrect) {
                // advance — now face the new direction
                updateAngle();
                hideButtons();
                state = 'walking';
                passedMidpoint = false;
                setHint('Keep going!');
            } else {
                // retry: re-enable buttons
                leftBtn.disabled = false;
                rightBtn.disabled = false;
                state = 'at_turn';
                setHint('Try again! Which way does the path turn?');
            }
        }
    } else if (state === 'feedback_bounty') {
        feedbackTimer -= dt;
        if (feedbackTimer <= 0) {
            hideButtons();
            state = 'walking';
            setHint('Keep going!');
        }
    }
}

// ─── Draw ─────────────────────────────────────────────────────────────────────
function draw() {
    const W = canvas.width;
    const H = canvas.height;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    if (waypoints.length < 2) return;

    drawPath();
    drawStartMarker();
    drawFinishLine();
    drawWaypointDots();
    drawBounties();
    drawCharacter();
    drawSparkles();
    drawFeedbackOverlay();
    drawQuestionBanner();
    if (state === 'finished') drawFinishedScreen();
}

function drawPath() {
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(waypoints[0].x, waypoints[0].y);
    for (let i = 1; i < waypoints.length; i++) {
        ctx.lineTo(waypoints[i].x, waypoints[i].y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawStartMarker() {
    const sp = waypoints[0];
    ctx.save();
    // outer glow ring
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(74,222,128,0.35)';
    ctx.lineWidth = 6;
    ctx.stroke();
    // inner ring
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.textAlign = 'center';
    ctx.fillText('START', sp.x, sp.y - 24);
    ctx.restore();
}

function drawFinishLine() {
    const fp = waypoints[waypoints.length - 1];
    ctx.save();
    // outer glow ring
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(34,211,238,0.35)';
    ctx.lineWidth = 6;
    ctx.stroke();
    // inner ring
    ctx.beginPath();
    ctx.arc(fp.x, fp.y, 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#22d3ee';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', fp.x, fp.y - 24);
    ctx.restore();
}

function drawWaypointDots() {
    // draw dots at turn waypoints (not start/finish)
    for (let i = 1; i < waypoints.length - 1; i++) {
        const wp = waypoints[i];
        const reached = segmentIdx > i || (segmentIdx === i && state !== 'at_turn');
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, WAYPOINT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = reached ? 'rgba(34,211,238,0.5)' : 'rgba(148,163,184,0.3)';
        ctx.fill();
        ctx.strokeStyle = reached ? '#22d3ee' : 'rgba(148,163,184,0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function drawBounties() {
    const activeBounty = (state === 'at_bounty' || state === 'feedback_bounty')
        ? bounties.find(b => b.segIdx === segmentIdx && !b.collected && !b.wrong)
        : null;

    for (const b of bounties) {
        if (b.collected || b.wrong) continue;
        if (b.segIdx < segmentIdx) continue;
        if (b.segIdx === segmentIdx && passedMidpoint && b.answered) continue;

        const isActive = b === activeBounty;
        drawGem(b.x, b.y, b.answered ? 0.3 : 1.0, isActive);
    }
}

function drawGem(x, y, alpha, active) {
    ctx.save();
    ctx.globalAlpha = alpha;

    // larger pulsing highlight ring for the active gem
    if (active) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);
        const ringR = GEM_SIZE * 2.8 + pulse * 6;
        const ringGrd = ctx.createRadialGradient(x, y, GEM_SIZE, x, y, ringR);
        ringGrd.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        ringGrd.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = ringGrd;
        ctx.beginPath();
        ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, GEM_SIZE * 1.9 + pulse * 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // glow
    const glowR = active ? GEM_SIZE * 2.4 : GEM_SIZE * 1.8;
    const grd = ctx.createRadialGradient(x, y, 2, x, y, glowR);
    grd.addColorStop(0, 'rgba(251, 191, 36, 0.7)');
    grd.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fill();

    // diamond shape — slightly larger when active
    const s = active ? GEM_SIZE * 1.35 : GEM_SIZE;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.65, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.65, y);
    ctx.closePath();
    ctx.fillStyle = active ? '#fde68a' : '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = active ? '#ffffff' : '#fcd34d';
    ctx.lineWidth = active ? 2.5 : 1.5;
    ctx.stroke();

    ctx.restore();
}

function drawCharacter() {
    const x = character.x;
    const y = character.y;
    const angle = character.angle;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // helper arrow
    if (showArrow) {
        const arrowLen = 36;
        ctx.beginPath();
        ctx.moveTo(CHAR_SIZE, 0);
        ctx.lineTo(CHAR_SIZE + arrowLen, 0);
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        // arrowhead
        ctx.beginPath();
        ctx.moveTo(CHAR_SIZE + arrowLen, 0);
        ctx.lineTo(CHAR_SIZE + arrowLen - 8, -5);
        ctx.lineTo(CHAR_SIZE + arrowLen - 8, 5);
        ctx.closePath();
        ctx.fillStyle = '#f97316';
        ctx.fill();
    }

    // circle character — rotationally symmetric, gives no directional hint
    ctx.beginPath();
    ctx.arc(0, 0, CHAR_SIZE, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // center dot
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

    ctx.restore();
}

function drawSparkles() {
    for (const s of sparkles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawQuestionBanner() {
    const questionStates = { at_turn: true, feedback_turn: true, at_bounty: true, feedback_bounty: true };
    if (!questionStates[state]) return;

    const text = (state === 'at_bounty' || state === 'feedback_bounty')
        ? 'Which side is the gem on?'
        : 'Which direction are we about to turn?';

    const W = canvas.width;
    const panelRight = 310;
    const centerX = panelRight + (W - panelRight) / 2;
    const y = 36;
    const padding = { x: 24, y: 10 };

    ctx.save();
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textW = ctx.measureText(text).width;
    const bx = centerX - textW / 2 - padding.x;
    const by = y - padding.y - 2;
    const bw = textW + padding.x * 2;
    const bh = 20 + padding.y * 2;
    const r = bh / 2;

    // pill background
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, r);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(text, centerX, y);
    ctx.restore();
}

function drawFeedbackOverlay() {
    if (state !== 'feedback_turn' && state !== 'feedback_bounty') return;

    const alpha = Math.min(1, feedbackTimer * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (feedbackBounty && feedbackGemPos) {
        // Large flash circle at gem position
        const gx = feedbackGemPos.x;
        const gy = feedbackGemPos.y;
        const flashR = 60;
        const color = feedbackCorrect ? '#4ade80' : '#f87171';
        const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, flashR);
        grd.addColorStop(0, feedbackCorrect ? 'rgba(74,222,128,0.55)' : 'rgba(248,113,113,0.55)');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(gx, gy, flashR, 0, Math.PI * 2);
        ctx.fill();

        // Big label above gem
        ctx.font = 'bold 44px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.fillText(feedbackCorrect ? '+10' : 'MISS!', gx, gy - 56);
        ctx.shadowBlur = 0;

        // Icon below label
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText(feedbackCorrect ? '✓' : '✗', gx, gy - 18);
    } else {
        // Turn feedback — near character
        const x = character.x;
        const y = character.y;
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = feedbackCorrect ? '#4ade80' : '#f87171';
        ctx.fillText(feedbackCorrect ? '✓' : '✗', x, y - 36);
    }

    ctx.restore();
}

function drawFinishedScreen() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.fillStyle = '#22d3ee';
    ctx.fillText('You made it!', W / 2, H / 2 - 40);

    ctx.font = '22px Inter, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Left turns: ${leftTurns}   Right turns: ${rightTurns}   Points: ${points}`, W / 2, H / 2 + 20);

    ctx.font = '16px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Press "New Path" to play again', W / 2, H / 2 + 66);
    ctx.restore();
}

// ─── Animation Loop ───────────────────────────────────────────────────────────
let lastTime = 0;
function loop(timestamp) {
    const dt = lastTime === 0 ? 0 : (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
generatePath();
setHint('Walk the path and answer at each turn!');
requestAnimationFrame(loop);
