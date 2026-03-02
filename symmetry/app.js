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

// --- State ---
let dirty = true;

const state = {
    tool: 'circle',
    colorIndex: 0,
    shapes: [],
    drawing: null,
    cursorPos: null,
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

function hitTestMirrorEndpoint(x, y) {
    const { x1, y1, x2, y2 } = state.mirror;
    if (Math.hypot(x - x1, y - y1) <= CONFIG.endpointHitRadius) return 'p1';
    if (Math.hypot(x - x2, y - y2) <= CONFIG.endpointHitRadius) return 'p2';
    return null;
}

function hitTestMirrorLine(x, y) {
    const { x1, y1, x2, y2 } = state.mirror;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1) return false;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lenSq));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.hypot(x - closestX, y - closestY) <= 10;
}

// --- Mirror Presets ---

function setMirrorHorizontal() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    state.mirror.x1 = cx - canvas.width * 0.3;
    state.mirror.y1 = cy;
    state.mirror.x2 = cx + canvas.width * 0.3;
    state.mirror.y2 = cy;
    dirty = true;
}

function setMirrorVertical() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    state.mirror.x1 = cx;
    state.mirror.y1 = cy - canvas.height * 0.3;
    state.mirror.x2 = cx;
    state.mirror.y2 = cy + canvas.height * 0.3;
    dirty = true;
}

function setMirrorDiagonal() {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const span = Math.min(canvas.width, canvas.height) * 0.3;
    state.mirror.x1 = cx - span;
    state.mirror.y1 = cy - span;
    state.mirror.x2 = cx + span;
    state.mirror.y2 = cy + span;
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
    const t = easeOutBack(raw);
    anim.mirrorGlow = Math.sin(raw * Math.PI);

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

    if (raw >= 1) {
        state.shapes = anim.toShapes;
        anim.running = false;
        anim.mirrorGlow = 0;
        reflectBtn.classList.remove('animating');
        updateHint('Reflected! Click Reflect! again or draw more shapes.');
    }

    return interpShapes;
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
    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${CONFIG.gridAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = CONFIG.gridStep;
    for (let x = 0; x < canvas.width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    ctx.restore();
}

function drawMirrorLine() {
    const { x1, y1, x2, y2 } = state.mirror;
    const glow = state.anim.mirrorGlow;

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
                if (Math.hypot(cur.x - pts[0].x, cur.y - pts[0].y) <= CONFIG.polygonCloseRadius) {
                    ctx.setLineDash([]);
                    ctx.beginPath();
                    ctx.arc(pts[0].x, pts[0].y, CONFIG.polygonCloseRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }
            }
        }
    }

    ctx.restore();
}

// --- Main Draw ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawMirrorLine();

    if (state.anim.running) {
        tickAnimation();
    } else {
        drawShapes(state.shapes);
        drawInProgressShape();
    }

    drawMirrorEndpoints();
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

function handlePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const { x, y } = getPointerPos(e);

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

    // Priority 3: Drawing tool
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
            // Check if clicking near first point to close
            if (pts.length >= 3 && Math.hypot(x - pts[0].x, y - pts[0].y) <= CONFIG.polygonCloseRadius) {
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
    const { x, y } = getPointerPos(e);
    state.cursorPos = { x, y };

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

    // Update cursor style based on hover
    const ep = hitTestMirrorEndpoint(x, y);
    if (ep) {
        canvas.style.cursor = 'grab';
    } else if (hitTestMirrorLine(x, y)) {
        canvas.style.cursor = 'move';
    } else {
        canvas.style.cursor = 'crosshair';
    }

    // Update in-progress shape preview
    if (state.drawing && (state.tool === 'circle' || state.tool === 'rect')) {
        state.drawing.x2 = x;
        state.drawing.y2 = y;
    }

    dirty = true;
}

function handlePointerUp(e) {
    const { x, y } = getPointerPos(e);

    if (state.mirror.draggingEndpoint || state.mirror.draggingLine) {
        state.mirror.draggingEndpoint = null;
        state.mirror.draggingLine = false;
        state.mirror.dragStartMouse = null;
        state.mirror.dragStartLine = null;
        canvas.style.cursor = 'crosshair';
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
    if (state.mirror.draggingEndpoint || state.mirror.draggingLine) {
        state.mirror.draggingEndpoint = null;
        state.mirror.draggingLine = false;
        state.mirror.dragStartMouse = null;
        state.mirror.dragStartLine = null;
    }
    dirty = true;
}

function handleDblClick(e) {
    if (state.tool === 'polygon' && state.drawing && state.drawing.pts.length >= 3) {
        commitShape({ type: 'polygon', pts: state.drawing.pts.slice(), color: state.drawing.color });
        closePolygonBtn.hidden = true;
    }
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

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp);

    // Tool buttons
    toolBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            state.tool = btn.dataset.tool;
            state.drawing = null;
            closePolygonBtn.hidden = true;
            updateActiveToolBtn(state.tool);
            const hints = {
                circle: 'Click and drag to draw a circle.',
                rect: 'Click and drag to draw a rectangle.',
                triangle: 'Click 3 points to draw a triangle.',
                polygon: 'Click to add points. Double-click or click the first point to close.'
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

    updateHint('Click and drag to draw a circle.');
    requestAnimationFrame(loop);
}

init();
