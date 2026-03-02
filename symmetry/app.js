/**
 * Symmetry Explorer
 * Draw shapes, place a mirror line, and animate reflections.
 */

// --- Constants ---
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const CONFIG = {
    mirrorLineColor: '#f8fafc',
    mirrorLineWidth: 2,
    mirrorGlowColor: '#8b5cf6',
    endpointRadius: 8,
    endpointHitRadius: 18,
    shapeLineWidth: 2.5,
    animDuration: 700,
    polygonCloseRadius: 18,
    gridAlpha: 0.06,
    gridStep: 40
};

// --- DOM Elements ---
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const reflectBtn = document.getElementById('reflect-btn');
const clearBtn = document.getElementById('clear-btn');
const hintText = document.getElementById('hint-text');
const closePolygonBtn = document.getElementById('close-polygon-btn');
const toolBtns = document.querySelectorAll('.tool-btn');
const mirrorHBtn = document.getElementById('mirror-h-btn');
const mirrorVBtn = document.getElementById('mirror-v-btn');
const mirrorDBtn = document.getElementById('mirror-d-btn');
const preserveBothCb = document.getElementById('preserve-both-cb');

// --- Camera ---
const camera = { x: 0, y: 0, scale: 1 };
let isPanning = false;
let panStart = null;   // { sx, sy, cx, cy } screen start + camera start
let spaceDown = false;
let pinchState = null; // { dist, midX, midY, cx, cy, cs }

function screenToWorld(sx, sy) {
    return { x: (sx - camera.x) / camera.scale, y: (sy - camera.y) / camera.scale };
}

function worldToScreen(wx, wy) {
    return { x: wx * camera.scale + camera.x, y: wy * camera.scale + camera.y };
}

// --- State ---
let dirty = true;

const state = {
    tool: 'circle',
    colorIndex: 0,
    shapes: [],
    drawing: null,
    cursorPos: null,
    preserveBoth: false,
    move: {
        dragging: false,
        shapeIndex: -1,
        hoveredIndex: -1,
        dragStartMouse: null,
        shapeSnapshot: null
    },
    mirror: {
        x1: 0, y1: 0,
        x2: 0, y2: 0,
        draggingEndpoint: null,
        draggingLine: false,
        dragStartMouse: null,
        dragStartLine: null
    },
    anim: {
        running: false,
        startTime: null,
        duration: CONFIG.animDuration,
        fromShapes: [],
        toShapes: [],
        mirrorGlow: 0
    }
};

// --- Math Helpers ---

function reflectPoint(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    const t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    return {
        x: 2 * (x1 + t * dx) - px,
        y: 2 * (y1 + t * dy) - py
    };
}

function reflectShape(shape) {
    const { x1, y1, x2, y2 } = state.mirror;
    if (shape.type === 'circle') {
        const c = reflectPoint(shape.cx, shape.cy, x1, y1, x2, y2);
        return { ...shape, cx: c.x, cy: c.y };
    }
    if (shape.type === 'rect') {
        // Reflect all 4 corners and return as polygon (handles diagonal mirror correctly)
        const corners = [
            { x: shape.x, y: shape.y },
            { x: shape.x + shape.w, y: shape.y },
            { x: shape.x + shape.w, y: shape.y + shape.h },
            { x: shape.x, y: shape.y + shape.h }
        ];
        const pts = corners.map(p => reflectPoint(p.x, p.y, x1, y1, x2, y2));
        return { type: 'polygon', pts, color: shape.color };
    }
    // triangle and polygon: reflect each point
    const pts = shape.pts.map(p => reflectPoint(p.x, p.y, x1, y1, x2, y2));
    return { ...shape, pts };
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerpPoint(p1, p2, t) {
    return { x: lerp(p1.x, p2.x, t), y: lerp(p1.y, p2.y, t) };
}

function lerpShape(from, to, t) {
    if (from.type === 'circle' && to.type === 'circle') {
        return {
            type: 'circle',
            cx: lerp(from.cx, to.cx, t),
            cy: lerp(from.cy, to.cy, t),
            r: lerp(from.r, to.r, t) * (1 - 0.15 * Math.sin(t * Math.PI)),
            color: from.color
        };
    }
    // For rect reflected to polygon, treat from as polygon too
    const fromPts = from.pts || rectToPts(from);
    const toPts = to.pts || rectToPts(to);
    const pts = fromPts.map((p, i) => lerpPoint(p, toPts[i], t));
    return { type: 'polygon', pts, color: from.color };
}

function rectToPts(shape) {
    return [
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.w, y: shape.y },
        { x: shape.x + shape.w, y: shape.y + shape.h },
        { x: shape.x, y: shape.y + shape.h }
    ];
}

function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// --- Coordinate Helper ---

function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

// --- Mirror Hit Testing ---

function hitTestMirrorEndpoint(wx, wy) {
    const { x1, y1, x2, y2 } = state.mirror;
    const r = CONFIG.endpointHitRadius / camera.scale;
    if (Math.hypot(wx - x1, wy - y1) <= r) return 'p1';
    if (Math.hypot(wx - x2, wy - y2) <= r) return 'p2';
    return null;
}

function hitTestMirrorLine(wx, wy) {
    const { x1, y1, x2, y2 } = state.mirror;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1) return false;
    const t = Math.max(0, Math.min(1, ((wx - x1) * dx + (wy - y1) * dy) / lenSq));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.hypot(wx - closestX, wy - closestY) <= 10 / camera.scale;
}

// --- Shape Hit Testing ---

function pointInPolygon(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y;
        const xj = pts[j].x, yj = pts[j].y;
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    return inside;
}

function hitTestShape(wx, wy) {
    for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];
        if (s.type === 'circle') {
            if (Math.hypot(wx - s.cx, wy - s.cy) <= s.r) return i;
        } else {
            if (pointInPolygon(wx, wy, s.pts || rectToPts(s))) return i;
        }
    }
    return -1;
}

function moveShape(shape, snapshot, dx, dy) {
    if (shape.type === 'circle') {
        shape.cx = snapshot.cx + dx;
        shape.cy = snapshot.cy + dy;
    } else if (shape.type === 'rect') {
        shape.x = snapshot.x + dx;
        shape.y = snapshot.y + dy;
    } else {
        shape.pts = snapshot.pts.map(p => ({ x: p.x + dx, y: p.y + dy }));
    }
}

// --- Mirror Presets ---

function viewCenter() {
    return screenToWorld(canvas.width / 2, canvas.height / 2);
}

function setMirrorHorizontal() {
    const c = viewCenter();
    const span = canvas.width * 0.3 / camera.scale;
    state.mirror.x1 = c.x - span;
    state.mirror.y1 = c.y;
    state.mirror.x2 = c.x + span;
    state.mirror.y2 = c.y;
    dirty = true;
}

function setMirrorVertical() {
    const c = viewCenter();
    const span = canvas.height * 0.3 / camera.scale;
    state.mirror.x1 = c.x;
    state.mirror.y1 = c.y - span;
    state.mirror.x2 = c.x;
    state.mirror.y2 = c.y + span;
    dirty = true;
}

function setMirrorDiagonal() {
    const c = viewCenter();
    const span = Math.min(canvas.width, canvas.height) * 0.3 / camera.scale;
    state.mirror.x1 = c.x - span;
    state.mirror.y1 = c.y - span;
    state.mirror.x2 = c.x + span;
    state.mirror.y2 = c.y + span;
    dirty = true;
}

// --- Color Cycling ---

function nextColor() {
    const color = COLORS[state.colorIndex % COLORS.length];
    state.colorIndex++;
    return color;
}

// --- UI Helpers ---

function updateHint(text) {
    hintText.innerHTML = text;
}

function updateActiveToolBtn(tool) {
    toolBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
}

// --- Animation ---

function startReflection() {
    if (!state.shapes.length) {
        updateHint('Draw some shapes first!');
        return;
    }
    const { x1, y1, x2, y2 } = state.mirror;
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx * dx + dy * dy < 1) {
        updateHint('Mirror line is too short — drag the endpoints apart.');
        return;
    }

    state.drawing = null;
    closePolygonBtn.hidden = true;

    const anim = state.anim;
    anim.fromShapes = deepClone(state.shapes);
    anim.toShapes = state.shapes.map(reflectShape);
    anim.running = true;
    anim.startTime = performance.now();
    anim.mirrorGlow = 0;
    reflectBtn.classList.add('animating');
    dirty = true;
}

function tickAnimation() {
    const anim = state.anim;
    const now = performance.now();
    const raw = Math.min((now - anim.startTime) / anim.duration, 1);
    anim.mirrorGlow = Math.sin(raw * Math.PI);

    if (state.preserveBoth) {
        // Originals stay in place; reflected copies fade in at their final position
        drawShapes(anim.fromShapes);
        ctx.globalAlpha = Math.sin(raw * Math.PI / 2); // smooth 0 → 1
        drawShapes(anim.toShapes);
        ctx.globalAlpha = 1;
    } else {
        const t = easeOutBack(raw);
        const interpShapes = anim.fromShapes.map((s, i) => lerpShape(s, anim.toShapes[i], t));

        // Draw originals fading out
        const fadeAlpha = Math.max(0, 1 - raw * 1.5);
        if (fadeAlpha > 0) {
            ctx.globalAlpha = fadeAlpha;
            drawShapes(anim.fromShapes);
            ctx.globalAlpha = 1;
        }

        // Draw interpolated shapes
        drawShapes(interpShapes);
    }

    if (raw >= 1) {
        state.shapes = state.preserveBoth
            ? [...anim.fromShapes, ...anim.toShapes]
            : anim.toShapes;
        anim.running = false;
        anim.mirrorGlow = 0;
        reflectBtn.classList.remove('animating');
        updateHint('Reflected! Click Reflect! again or draw more shapes.');
    }
}

// --- Clear ---

function clearAll() {
    state.shapes = [];
    state.drawing = null;
    state.cursorPos = null;
    state.anim.running = false;
    state.anim.mirrorGlow = 0;
    reflectBtn.classList.remove('animating');
    closePolygonBtn.hidden = true;
    updateHint('Draw a shape to get started.');
    dirty = true;
}

// --- Drawing Tools ---

function commitShape(shape) {
    state.shapes.push(shape);
    state.drawing = null;
    dirty = true;
    updateHint('Shape added! Draw another or click Reflect!');
}

function tryClosePolygon() {
    const d = state.drawing;
    if (!d || d.type !== 'polygon' || d.pts.length < 3) return;
    commitShape({ type: 'polygon', pts: d.pts.slice(), color: d.color });
    closePolygonBtn.hidden = true;
    updateHint('Polygon closed! Draw another or click Reflect!');
}

// --- Rendering ---

function drawGrid() {
    const step = CONFIG.gridStep;
    const tl = screenToWorld(0, 0);
    const br = screenToWorld(canvas.width, canvas.height);
    const x0 = Math.floor(tl.x / step) * step;
    const y0 = Math.floor(tl.y / step) * step;

    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${CONFIG.gridAlpha})`;
    ctx.lineWidth = 1 / camera.scale;
    ctx.beginPath();
    for (let x = x0; x <= br.x; x += step) {
        ctx.moveTo(x, tl.y);
        ctx.lineTo(x, br.y);
    }
    for (let y = y0; y <= br.y; y += step) {
        ctx.moveTo(tl.x, y);
        ctx.lineTo(br.x, y);
    }
    ctx.stroke();
    ctx.restore();
}

// Returns the t-range where P(t) = (x1,y1) + t*(dx,dy) is inside the viewport.
// t=0 → p1, t=1 → p2. Extensions are where tMin<0 or tMax>1.
function mirrorLineClip(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const tl = screenToWorld(0, 0);
    const br = screenToWorld(canvas.width, canvas.height);
    let tMin = -1e9, tMax = 1e9;

    if (Math.abs(dx) > 1e-9) {
        const ta = (tl.x - x1) / dx, tb = (br.x - x1) / dx;
        tMin = Math.max(tMin, Math.min(ta, tb));
        tMax = Math.min(tMax, Math.max(ta, tb));
    } else if (x1 < tl.x || x1 > br.x) return null;

    if (Math.abs(dy) > 1e-9) {
        const ta = (tl.y - y1) / dy, tb = (br.y - y1) / dy;
        tMin = Math.max(tMin, Math.min(ta, tb));
        tMax = Math.min(tMax, Math.max(ta, tb));
    } else if (y1 < tl.y || y1 > br.y) return null;

    return tMin < tMax ? { tMin, tMax } : null;
}

function drawMirrorLine() {
    const { x1, y1, x2, y2 } = state.mirror;
    const glow = state.anim.mirrorGlow;
    const dx = x2 - x1, dy = y2 - y1;
    const mainLen = Math.hypot(dx, dy);
    const PERIOD = 16; // dash (10) + gap (6)

    ctx.save();

    // Glow pass when animating
    if (glow > 0) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(139,92,246,${glow * 0.6})`;
        ctx.lineWidth = 14 * glow;
        ctx.shadowColor = CONFIG.mirrorGlowColor;
        ctx.shadowBlur = 40 * glow;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    // Faint extensions to viewport edges
    const clip = mirrorLineClip(x1, y1, x2, y2);
    if (clip) {
        ctx.strokeStyle = 'rgba(248,250,252,0.18)';
        ctx.lineWidth = CONFIG.mirrorLineWidth;
        ctx.setLineDash([10, 6]);

        if (clip.tMin < 0) {
            // Before p1: offset so dashes arrive at p1 in phase with the main segment (phase 0)
            const extLen = -clip.tMin * mainLen;
            ctx.lineDashOffset = extLen % PERIOD;
            ctx.beginPath();
            ctx.moveTo(x1 + clip.tMin * dx, y1 + clip.tMin * dy);
            ctx.lineTo(x1, y1);
            ctx.stroke();
        }

        if (clip.tMax > 1) {
            // After p2: continue from wherever the main segment's dashes end
            ctx.lineDashOffset = (PERIOD - mainLen % PERIOD) % PERIOD;
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x1 + clip.tMax * dx, y1 + clip.tMax * dy);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    // Main dashed line
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = CONFIG.mirrorLineColor;
    ctx.lineWidth = CONFIG.mirrorLineWidth;
    ctx.setLineDash([10, 6]);
    ctx.lineDashOffset = 0;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
}

function drawMirrorEndpoints() {
    const { x1, y1, x2, y2 } = state.mirror;
    const r = CONFIG.endpointRadius;

    for (const [ex, ey] of [[x1, y1], [x2, y2]]) {
        ctx.beginPath();
        ctx.arc(ex, ey, r, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = CONFIG.mirrorLineColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(ex, ey, 3, 0, Math.PI * 2);
        ctx.fillStyle = CONFIG.mirrorLineColor;
        ctx.fill();
    }
}

function drawShapeOutline(shape) {
    ctx.beginPath();
    if (shape.type === 'circle') {
        ctx.arc(shape.cx, shape.cy, shape.r, 0, Math.PI * 2);
    } else {
        const pts = shape.pts || rectToPts(shape);
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
    }
}

function drawSingleShape(shape, alpha) {
    ctx.save();
    ctx.globalAlpha = (ctx.globalAlpha || 1) * (alpha !== undefined ? alpha : 1);
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = CONFIG.shapeLineWidth;
    ctx.fillStyle = shape.color + '33'; // 20% opacity fill

    drawShapeOutline(shape);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawShapes(shapes) {
    shapes.forEach(s => drawSingleShape(s));
}

function drawInProgressShape() {
    const d = state.drawing;
    if (!d) return;

    ctx.save();
    ctx.strokeStyle = d.color;
    ctx.lineWidth = CONFIG.shapeLineWidth;
    ctx.fillStyle = d.color + '22';
    ctx.setLineDash([5, 4]);

    if (d.type === 'circle') {
        const r = Math.hypot(d.x2 - d.x1, d.y2 - d.y1);
        ctx.beginPath();
        ctx.arc(d.x1, d.y1, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    } else if (d.type === 'rect') {
        const x = Math.min(d.x1, d.x2);
        const y = Math.min(d.y1, d.y2);
        const w = Math.abs(d.x2 - d.x1);
        const h = Math.abs(d.y2 - d.y1);
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
    } else if (d.type === 'triangle') {
        const pts = d.pts;
        const cur = state.cursorPos;
        ctx.beginPath();
        if (pts.length === 1 && cur) {
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(cur.x, cur.y);
        } else if (pts.length === 2 && cur) {
            ctx.moveTo(pts[0].x, pts[0].y);
            ctx.lineTo(pts[1].x, pts[1].y);
            ctx.lineTo(cur.x, cur.y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.stroke();
        // Draw placed points
        pts.forEach(p => {
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = d.color;
            ctx.fill();
        });
    } else if (d.type === 'polygon') {
        const pts = d.pts;
        const cur = state.cursorPos;
        if (pts.length > 0) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
            if (cur) ctx.lineTo(cur.x, cur.y);
            ctx.stroke();

            // Draw placed points
            pts.forEach((p, i) => {
                ctx.setLineDash([]);
                ctx.beginPath();
                ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2);
                ctx.fillStyle = i === 0 ? '#ffffff' : d.color;
                ctx.fill();
                ctx.strokeStyle = d.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });

            // Highlight close-ring on first point when near enough
            if (cur && pts.length >= 3) {
                const closeR = CONFIG.polygonCloseRadius / camera.scale;
                if (Math.hypot(cur.x - pts[0].x, cur.y - pts[0].y) <= closeR) {
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(pts[0].x, pts[0].y, closeR, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1.5 / camera.scale;
                    ctx.stroke();
                }
            }
        }
    }

    ctx.restore();
}

function drawMoveSelection() {
    if (state.tool !== 'move') return;
    const idx = state.move.dragging ? state.move.shapeIndex : state.move.hoveredIndex;
    if (idx < 0 || idx >= state.shapes.length) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = (CONFIG.shapeLineWidth + 2) / camera.scale;
    ctx.setLineDash([6 / camera.scale, 3 / camera.scale]);
    drawShapeOutline(state.shapes[idx]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
}

// --- Main Draw ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.setTransform(camera.scale, 0, 0, camera.scale, camera.x, camera.y);

    drawGrid();
    drawMirrorLine();

    if (state.anim.running) {
        tickAnimation();
    } else {
        drawShapes(state.shapes);
        drawMoveSelection();
        drawInProgressShape();
    }

    drawMirrorEndpoints();

    ctx.restore();
}

// --- Render Loop ---

function loop() {
    if (dirty || state.anim.running) {
        draw();
        dirty = false;
    }
    requestAnimationFrame(loop);
}

// --- Event Handling ---

function defaultCursor() {
    if (spaceDown) return 'grab';
    if (state.tool === 'move') return 'default';
    return 'crosshair';
}

function handlePointerDown(e) {
    // Middle mouse, right-click (two-finger tap on Mac), or Space+left → pan
    if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceDown)) {
        isPanning = true;
        panStart = { sx: e.clientX, sy: e.clientY, cx: camera.x, cy: camera.y };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
    }

    if (e.button !== undefined && e.button !== 0) return;

    const screen = getPointerPos(e);
    const { x, y } = screenToWorld(screen.x, screen.y);

    // Priority 1: Mirror endpoint drag
    const ep = hitTestMirrorEndpoint(x, y);
    if (ep) {
        state.mirror.draggingEndpoint = ep;
        canvas.style.cursor = 'grab';
        e.preventDefault();
        return;
    }

    // Priority 2: Mirror line body drag
    if (hitTestMirrorLine(x, y)) {
        state.mirror.draggingLine = true;
        state.mirror.dragStartMouse = { x, y };
        state.mirror.dragStartLine = {
            x1: state.mirror.x1, y1: state.mirror.y1,
            x2: state.mirror.x2, y2: state.mirror.y2
        };
        canvas.style.cursor = 'move';
        e.preventDefault();
        return;
    }

    // Priority 3: Move tool
    if (state.tool === 'move') {
        if (!state.anim.running) {
            const idx = hitTestShape(x, y);
            if (idx !== -1) {
                state.move.dragging = true;
                state.move.shapeIndex = idx;
                state.move.hoveredIndex = idx;
                state.move.dragStartMouse = { x, y };
                state.move.shapeSnapshot = deepClone(state.shapes[idx]);
                canvas.style.cursor = 'grabbing';
                e.preventDefault();
            }
        }
        return;
    }

    // Priority 4: Drawing tool
    if (state.anim.running) return;

    const color = state.drawing ? state.drawing.color : nextColor();

    if (state.tool === 'circle') {
        state.drawing = { type: 'circle', x1: x, y1: y, x2: x, y2: y, color };
    } else if (state.tool === 'rect') {
        state.drawing = { type: 'rect', x1: x, y1: y, x2: x, y2: y, color };
    } else if (state.tool === 'triangle') {
        if (!state.drawing) {
            state.drawing = { type: 'triangle', pts: [{ x, y }], color };
            updateHint('Click 2 more points to complete the triangle.');
        } else {
            state.drawing.pts.push({ x, y });
            if (state.drawing.pts.length === 3) {
                const { pts, color: c } = state.drawing;
                commitShape({ type: 'triangle', pts, color: c });
            } else {
                updateHint('Click 1 more point to complete the triangle.');
            }
        }
    } else if (state.tool === 'polygon') {
        if (!state.drawing) {
            state.drawing = { type: 'polygon', pts: [{ x, y }], color };
            closePolygonBtn.hidden = false;
            updateHint('Click to add points. Double-click or click the first point to close.');
        } else {
            const pts = state.drawing.pts;
            const closeR = CONFIG.polygonCloseRadius / camera.scale;
            if (pts.length >= 3 && Math.hypot(x - pts[0].x, y - pts[0].y) <= closeR) {
                commitShape({ type: 'polygon', pts: pts.slice(), color: state.drawing.color });
                closePolygonBtn.hidden = true;
            } else {
                pts.push({ x, y });
                updateHint(`${pts.length} points — double-click or click first point to close.`);
            }
        }
    }
    dirty = true;
}

function handlePointerMove(e) {
    const screen = getPointerPos(e);
    const { x, y } = screenToWorld(screen.x, screen.y);
    state.cursorPos = { x, y };

    // Pan
    if (isPanning) {
        camera.x = panStart.cx + (e.clientX - panStart.sx);
        camera.y = panStart.cy + (e.clientY - panStart.sy);
        dirty = true;
        e.preventDefault();
        return;
    }

    if (state.mirror.draggingEndpoint) {
        if (state.mirror.draggingEndpoint === 'p1') {
            state.mirror.x1 = x;
            state.mirror.y1 = y;
        } else {
            state.mirror.x2 = x;
            state.mirror.y2 = y;
        }
        dirty = true;
        e.preventDefault();
        return;
    }

    if (state.mirror.draggingLine) {
        const dm = state.mirror.dragStartMouse;
        const dl = state.mirror.dragStartLine;
        const dx = x - dm.x;
        const dy = y - dm.y;
        state.mirror.x1 = dl.x1 + dx;
        state.mirror.y1 = dl.y1 + dy;
        state.mirror.x2 = dl.x2 + dx;
        state.mirror.y2 = dl.y2 + dy;
        dirty = true;
        e.preventDefault();
        return;
    }

    if (state.move.dragging) {
        const { dragStartMouse, shapeSnapshot, shapeIndex } = state.move;
        moveShape(state.shapes[shapeIndex], shapeSnapshot, x - dragStartMouse.x, y - dragStartMouse.y);
        dirty = true;
        e.preventDefault();
        return;
    }

    // Update cursor style based on hover
    if (spaceDown) {
        canvas.style.cursor = 'grab';
    } else if (state.tool === 'move') {
        const idx = hitTestShape(x, y);
        state.move.hoveredIndex = idx;
        canvas.style.cursor = idx !== -1 ? 'grab' : 'default';
        dirty = true;
    } else {
        const ep = hitTestMirrorEndpoint(x, y);
        if (ep) {
            canvas.style.cursor = 'grab';
        } else if (hitTestMirrorLine(x, y)) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    }

    // Update in-progress shape preview
    if (state.drawing && (state.tool === 'circle' || state.tool === 'rect')) {
        state.drawing.x2 = x;
        state.drawing.y2 = y;
    }

    dirty = true;
}

function handlePointerUp(e) {
    if (isPanning) {
        isPanning = false;
        panStart = null;
        canvas.style.cursor = defaultCursor();
        dirty = true;
        return;
    }

    if (state.mirror.draggingEndpoint || state.mirror.draggingLine) {
        state.mirror.draggingEndpoint = null;
        state.mirror.draggingLine = false;
        state.mirror.dragStartMouse = null;
        state.mirror.dragStartLine = null;
        canvas.style.cursor = defaultCursor();
        dirty = true;
        return;
    }

    if (state.move.dragging) {
        state.move.dragging = false;
        state.move.dragStartMouse = null;
        state.move.shapeSnapshot = null;
        canvas.style.cursor = defaultCursor();
        dirty = true;
        return;
    }

    if (state.anim.running) return;

    if (state.tool === 'circle' && state.drawing) {
        const r = Math.hypot(state.drawing.x2 - state.drawing.x1, state.drawing.y2 - state.drawing.y1);
        if (r > 3) {
            commitShape({ type: 'circle', cx: state.drawing.x1, cy: state.drawing.y1, r, color: state.drawing.color });
        } else {
            state.drawing = null;
            dirty = true;
        }
    } else if (state.tool === 'rect' && state.drawing) {
        const w = Math.abs(state.drawing.x2 - state.drawing.x1);
        const h = Math.abs(state.drawing.y2 - state.drawing.y1);
        if (w > 3 && h > 3) {
            commitShape({
                type: 'rect',
                x: Math.min(state.drawing.x1, state.drawing.x2),
                y: Math.min(state.drawing.y1, state.drawing.y2),
                w, h,
                color: state.drawing.color
            });
        } else {
            state.drawing = null;
            dirty = true;
        }
    }
}

function handlePointerLeave() {
    state.cursorPos = null;
    isPanning = false;
    panStart = null;
    if (state.mirror.draggingEndpoint || state.mirror.draggingLine) {
        state.mirror.draggingEndpoint = null;
        state.mirror.draggingLine = false;
        state.mirror.dragStartMouse = null;
        state.mirror.dragStartLine = null;
    }
    if (state.move.dragging) {
        state.move.dragging = false;
        state.move.dragStartMouse = null;
        state.move.shapeSnapshot = null;
    }
    state.move.hoveredIndex = -1;
    dirty = true;
}

function handleDblClick(e) {
    if (spaceDown) return; // ignore double-click when panning
    if (state.tool === 'polygon' && state.drawing && state.drawing.pts.length >= 3) {
        commitShape({ type: 'polygon', pts: state.drawing.pts.slice(), color: state.drawing.color });
        closePolygonBtn.hidden = true;
    }
}

// --- Zoom ---

function applyZoom(sx, sy, factor) {
    const newScale = Math.max(0.05, Math.min(20, camera.scale * factor));
    camera.x = sx - (sx - camera.x) * (newScale / camera.scale);
    camera.y = sy - (sy - camera.y) * (newScale / camera.scale);
    camera.scale = newScale;
    dirty = true;
}

function handleWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    applyZoom(sx, sy, factor);
}

// --- Touch Handlers ---

function handleTouchStart(e) {
    if (e.touches.length === 2) {
        const rect = canvas.getBoundingClientRect();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top;
        pinchState = { dist, midX, midY, cx: camera.x, cy: camera.y, cs: camera.scale };
        e.preventDefault();
        return;
    }
    handlePointerDown(e);
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchState) {
        const rect = canvas.getBoundingClientRect();
        const t0 = e.touches[0], t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top;

        const scaleChange = dist / pinchState.dist;
        const newScale = Math.max(0.05, Math.min(20, pinchState.cs * scaleChange));
        const worldMidX = (pinchState.midX - pinchState.cx) / pinchState.cs;
        const worldMidY = (pinchState.midY - pinchState.cy) / pinchState.cs;
        camera.scale = newScale;
        camera.x = midX - worldMidX * newScale;
        camera.y = midY - worldMidY * newScale;
        dirty = true;
        e.preventDefault();
        return;
    }
    handlePointerMove(e);
}

function handleTouchEnd(e) {
    if (e.touches.length < 2) pinchState = null;
    handlePointerUp(e);
}

// --- Resize ---

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Re-center mirror to vertical line through center
    setMirrorVertical();
    dirty = true;
}

// --- Init ---

function init() {
    window.addEventListener('resize', resize);
    resize();

    // Canvas pointer events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerLeave);
    canvas.addEventListener('dblclick', handleDblClick);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault()); // suppress right-click menu

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    // Keyboard — Space to pan
    window.addEventListener('keydown', e => {
        if (e.code === 'Space' && !e.repeat && document.activeElement === document.body) {
            spaceDown = true;
            canvas.style.cursor = 'grab';
            e.preventDefault();
        }
    });
    window.addEventListener('keyup', e => {
        if (e.code === 'Space') {
            spaceDown = false;
            if (!isPanning) canvas.style.cursor = defaultCursor();
        }
    });

    // Tool buttons
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.tool = btn.dataset.tool;
            state.drawing = null;
            state.move.hoveredIndex = -1;
            state.move.dragging = false;
            closePolygonBtn.hidden = true;
            updateActiveToolBtn(state.tool);
            canvas.style.cursor = defaultCursor();
            const hints = {
                circle: 'Click and drag to draw a circle.',
                rect: 'Click and drag to draw a rectangle.',
                triangle: 'Click 3 points to draw a triangle.',
                polygon: 'Click to add points. Double-click or click the first point to close.',
                move: 'Click a shape to select and drag it.'
            };
            updateHint(hints[state.tool]);
            dirty = true;
        });
    });

    // Mirror presets
    mirrorHBtn.addEventListener('click', () => { setMirrorHorizontal(); updateHint('Mirror set to horizontal.'); });
    mirrorVBtn.addEventListener('click', () => { setMirrorVertical(); updateHint('Mirror set to vertical.'); });
    mirrorDBtn.addEventListener('click', () => { setMirrorDiagonal(); updateHint('Mirror set to diagonal.'); });

    // Action buttons
    reflectBtn.addEventListener('click', startReflection);
    clearBtn.addEventListener('click', clearAll);
    closePolygonBtn.addEventListener('click', tryClosePolygon);
    preserveBothCb.addEventListener('change', () => {
        state.preserveBoth = preserveBothCb.checked;
    });

    updateHint('Click and drag to draw a circle.');
    requestAnimationFrame(loop);
}

init();
