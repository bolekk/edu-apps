const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const totalValueEl = document.getElementById('total-value');
const specialMsgEl = document.getElementById('special-msg');
const addBtn = document.getElementById('add-btn');
const removeBtn = document.getElementById('remove-btn');
const hintEl = document.getElementById('hint-text');

// ── Config ────────────────────────────────────────────────────────────────────
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
const MIN_ANGLE = 5;       // degrees
const MAX_TOTAL = 355;     // degrees (just under full rotation)
const MAX_SECTORS = 7;
const HIT_RADIUS = 16;     // px — tolerance for clicking a ray
const DEFAULT_NEW_ANGLE = 30; // degrees added per "Add Angle"

// ── State ─────────────────────────────────────────────────────────────────────
// rays[0] = 0° always (fixed right-horizontal reference)
// rays[1..n] are movable; each separates two adjacent sectors
const state = {
    rays: [0, 60],
    dragging: { active: false, rayIndex: -1 },
    hoveredRayIndex: -1,
};
let dirty = true;

// ── Canvas sizing ─────────────────────────────────────────────────────────────
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    dirty = true;
}
window.addEventListener('resize', resize);
resize();

// ── Geometry helpers ──────────────────────────────────────────────────────────
function cx() { return canvas.width / 2; }
function cy() { return canvas.height * 0.5; }
function rayLen() { return Math.min(canvas.width, canvas.height) * 0.38; }
function arcR() { return rayLen() * 0.45; }

// Convert our degrees (0=right, CCW positive) to canvas coords
function degToCanvas(deg) {
    return -deg * Math.PI / 180;
}

// Endpoint of a ray at `deg` degrees
function rayPoint(deg, r) {
    const a = deg * Math.PI / 180;
    return { x: cx() + r * Math.cos(a), y: cy() - r * Math.sin(a) };
}

// Get angle in our degrees (0–360) from a canvas mouse position
function mouseAngle(mx, my) {
    const dx = mx - cx(), dy = my - cy();
    let deg = Math.atan2(-dy, dx) * 180 / Math.PI; // negate y so up = positive
    if (deg < 0) deg += 360;
    return deg;
}

// Hit-test a ray at `deg`. Returns true if (mx, my) is close to the ray line.
function hitTestRay(mx, my, deg) {
    const dx = mx - cx(), dy = my - cy();
    const a = deg * Math.PI / 180;
    const rdx = Math.cos(a), rdy = -Math.sin(a); // ray unit vector in screen space
    const t = dx * rdx + dy * rdy;               // projection along ray
    const rl = rayLen();
    if (t < 8 || t > rl + 22) return false;
    const perpX = dx - t * rdx, perpY = dy - t * rdy;
    return Math.hypot(perpX, perpY) < HIT_RADIUS;
}

// ── Drawing ───────────────────────────────────────────────────────────────────
function draw() {
    const w = canvas.width, h = canvas.height;
    const X = cx(), Y = cy();
    const rl = rayLen(), ar = arcR();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Baseline (horizontal line through center)
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, Y);
    ctx.lineTo(w, Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Sectors (arcs + fills)
    const rays = state.rays;
    for (let i = 0; i < rays.length - 1; i++) {
        const a1 = degToCanvas(rays[i]);
        const a2 = degToCanvas(rays[i + 1]);
        const color = COLORS[i % COLORS.length];
        const midDeg = (rays[i] + rays[i + 1]) / 2;

        // Filled wedge
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(X, Y);
        ctx.arc(X, Y, ar, a1, a2, true); // true = counterclockwise (CCW in canvas = our positive)
        ctx.closePath();
        ctx.fillStyle = color + '28';
        ctx.fill();
        ctx.restore();

        // Arc stroke
        ctx.save();
        ctx.beginPath();
        ctx.arc(X, Y, ar, a1, a2, true);
        ctx.strokeStyle = color + 'aa';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Degree label
        const labelDist = ar + 28;
        const lp = rayPoint(midDeg, labelDist);
        const sectorDeg = Math.round(rays[i + 1] - rays[i]);
        ctx.save();
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sectorDeg + '°', lp.x, lp.y);
        ctx.restore();
    }

    // Movable rays (index 1 and above)
    for (let i = 1; i < rays.length; i++) {
        const deg = rays[i];
        const isHovered = state.hoveredRayIndex === i;
        const isDragging = state.dragging.active && state.dragging.rayIndex === i;
        const color = COLORS[(i - 1) % COLORS.length];
        const tip = rayPoint(deg, rl);

        ctx.save();

        if (isHovered || isDragging) {
            // Glow
            ctx.shadowColor = color;
            ctx.shadowBlur = 16;
        }

        ctx.strokeStyle = isDragging ? '#fff' : color;
        ctx.lineWidth = isDragging ? 3 : 2.5;
        ctx.beginPath();
        ctx.moveTo(X, Y);
        ctx.lineTo(tip.x, tip.y);
        ctx.stroke();

        // Tip circle (drag handle)
        ctx.fillStyle = isDragging ? '#fff' : color;
        ctx.shadowBlur = isDragging ? 20 : (isHovered ? 12 : 0);
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, isDragging ? 9 : 7, 0, Math.PI * 2);
        ctx.fill();

        // Small arrow-like indicator on tip
        if (isHovered || isDragging) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    // Fixed ray at 0° (right, solid subtle line — part of baseline emphasis)
    // Only draw if total > 0 so we don't double up
    // (baseline dashes already cover it visually, so we add a small origin tick)

    // Right-side reference marker at 0°
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.lineWidth = 2;
    const refTip = rayPoint(0, rl);
    ctx.beginPath();
    ctx.moveTo(X, Y);
    ctx.lineTo(refTip.x, refTip.y);
    ctx.stroke();
    ctx.restore();

    // Center vertex
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.shadowColor = 'rgba(248,250,252,0.6)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(X, Y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 0° label — always below the right ray tip, outside any sector
    const tick = rayPoint(0, rl + 18);
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('0°', tick.x, tick.y);
    ctx.restore();
}

// ── UI updates ─────────────────────────────────────────────────────────────────
function updateUI() {
    const total = Math.round(state.rays[state.rays.length - 1]);
    totalValueEl.textContent = total;

    if (total === 45) {
        specialMsgEl.textContent = '= Half a right angle!';
    } else if (total === 60) {
        specialMsgEl.textContent = '= Equilateral triangle corner!';
    } else if (total === 90) {
        specialMsgEl.textContent = '= Right angle!';
    } else if (total === 120) {
        specialMsgEl.textContent = '= Interior angle of hexagon!';
    } else if (total === 180) {
        specialMsgEl.textContent = '= Straight line!';
    } else if (total === 270) {
        specialMsgEl.textContent = '= Three-quarter turn!';
    } else if (total > 180) {
        specialMsgEl.textContent = 'Reflex angle';
    } else {
        specialMsgEl.textContent = '';
    }

    const numSectors = state.rays.length - 1;
    addBtn.disabled = numSectors >= MAX_SECTORS || state.rays[state.rays.length - 1] >= MAX_TOTAL - MIN_ANGLE;
    removeBtn.disabled = numSectors <= 1;
}

function updateHint(text) {
    hintEl.textContent = text;
}

function updateCursor() {
    const hov = state.hoveredRayIndex;
    const drag = state.dragging.active;
    if (drag) {
        canvas.style.cursor = 'grabbing';
    } else if (hov >= 1) {
        canvas.style.cursor = 'grab';
    } else {
        canvas.style.cursor = 'default';
    }
}

// ── Render loop ───────────────────────────────────────────────────────────────
function loop() {
    if (dirty) {
        draw();
        updateUI();
        dirty = false;
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ── Add / Remove ──────────────────────────────────────────────────────────────
addBtn.addEventListener('click', () => {
    const last = state.rays[state.rays.length - 1];
    const newRay = Math.min(last + DEFAULT_NEW_ANGLE, MAX_TOTAL);
    if (newRay - last < MIN_ANGLE) return;
    state.rays.push(newRay);
    dirty = true;
    updateHint('New angle added. Drag any ray tip to resize it.');
});

removeBtn.addEventListener('click', () => {
    if (state.rays.length > 2) {
        state.rays.pop();
        state.hoveredRayIndex = -1;
        dirty = true;
        updateHint('Angle removed.');
    }
});

// ── Mouse events ──────────────────────────────────────────────────────────────
function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener('mousedown', (e) => {
    const { x, y } = getPos(e);
    // Find closest movable ray
    for (let i = 1; i < state.rays.length; i++) {
        if (hitTestRay(x, y, state.rays[i])) {
            state.dragging.active = true;
            state.dragging.rayIndex = i;
            state.hoveredRayIndex = i;
            dirty = true;
            updateHint('Dragging… release to set the angle.');
            updateCursor();
            return;
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getPos(e);

    if (state.dragging.active) {
        const i = state.dragging.rayIndex;
        let newDeg = mouseAngle(x, y);

        // Only the sector to the left of ray i changes size.
        // All rays from i onward shift by the same delta, keeping later sectors intact.
        const remainingSize = state.rays[state.rays.length - 1] - state.rays[i];
        const minBound = state.rays[i - 1] + MIN_ANGLE;
        const maxBound = MAX_TOTAL - remainingSize;

        newDeg = Math.round(Math.max(minBound, Math.min(maxBound, newDeg)));
        const delta = newDeg - state.rays[i];
        for (let j = i; j < state.rays.length; j++) {
            state.rays[j] += delta;
        }

        dirty = true;
        return;
    }

    // Hover detection
    let found = -1;
    for (let i = 1; i < state.rays.length; i++) {
        if (hitTestRay(x, y, state.rays[i])) {
            found = i;
            break;
        }
    }
    if (found !== state.hoveredRayIndex) {
        state.hoveredRayIndex = found;
        dirty = true;
        updateCursor();
        if (found >= 1) {
            updateHint('Drag to resize the adjacent angle sectors.');
        } else {
            updateHint('Drag the ray tip to change the angle.');
        }
    }
});

function stopDrag() {
    if (state.dragging.active) {
        state.dragging.active = false;
        state.dragging.rayIndex = -1;
        dirty = true;
        updateCursor();
        updateHint('Drag a ray tip to resize angles. Use the buttons to add more.');
    }
}

canvas.addEventListener('mouseup', stopDrag);
canvas.addEventListener('mouseleave', stopDrag);

// Touch support
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY }));
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    stopDrag();
}, { passive: false });
