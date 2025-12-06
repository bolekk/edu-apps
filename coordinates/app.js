/**
 * Coordinate Plane Inequalities App
 */

// --- Configuration ---
const CONFIG = {
    gridColor: '#1e293b',
    axisColor: '#64748b',
    textColor: '#94a3b8',
    gridStep: 40, // pixels per unit
    minGridStep: 20,
    maxGridStep: 100,
    snapThreshold: 0.2 // units
};

// --- State ---
const state = {
    inequalities: [], // { id, type: 'axis'|'linear', axis?: 'x'|'y', a?: number, b?: number, operator: '>'|'<', value?: number, color: string }
    points: [], // { id, x: number, y: number, color: string }
    view: {
        scale: 40, // pixels per unit
        offsetX: 0,
        offsetY: 0,
        showGrid: true
    },
    dragging: null, // { id, type: 'inequality'|'point', ... }
    hovered: null
};

// --- DOM Elements ---
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const uiList = document.getElementById('inequalities-list');
const emptyState = document.getElementById('empty-state');
const addXBtn = document.getElementById('add-x-btn');
const addYBtn = document.getElementById('add-y-btn');
const addLinearBtn = document.getElementById('add-linear-btn');
const addPointBtn = document.getElementById('add-point-btn');
const showGridCheckbox = document.getElementById('show-grid-checkbox');

// --- Initialization ---
function init() {
    window.addEventListener('resize', resize);
    resize();

    // Initial render loop
    requestAnimationFrame(loop);

    // Event Listeners
    addXBtn.addEventListener('click', () => addInequality('x'));
    addYBtn.addEventListener('click', () => addInequality('y'));
    addLinearBtn.addEventListener('click', addLinearInequality);
    addPointBtn.addEventListener('click', addPoint);

    showGridCheckbox.addEventListener('change', (e) => {
        state.view.showGrid = e.target.checked;
    });

    // Canvas Interaction
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    state.view.offsetX = canvas.width / 2;
    state.view.offsetY = canvas.height / 2;
}

// --- Interaction Logic ---

function getPointerPos(e) {
    if (e.touches) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
}

function handleStart(e) {
    const { x, y } = getPointerPos(e);
    const gridX = toGridX(x);
    const gridY = toGridY(y);

    // Hit detection
    const threshold = 10; // pixels
    let closest = null;
    let minDist = Infinity;
    let type = null;

    // Check points first
    state.points.forEach(item => {
        const px = toScreenX(item.x);
        const py = toScreenY(item.y);
        const dist = Math.hypot(x - px, y - py);

        if (dist < threshold && dist < minDist) {
            minDist = dist;
            closest = item;
            type = 'point';
        }
    });

    // Check inequalities
    if (!closest) {
        state.inequalities.forEach(item => {
            let dist;
            if (item.type === 'linear') {
                // Distance to ax - y + b = 0
                // dist = |a*x0 - y0 + b| / sqrt(a^2 + 1)
                // Note: using grid coordinates for distance check is tricky because threshold is in pixels.
                // Better to check distance in screen pixels or convert threshold to grid units.
                // Let's use grid units for calculation but scale threshold.

                const num = Math.abs(item.a * gridX - gridY + item.b);
                const den = Math.sqrt(item.a * item.a + 1);
                const distGrid = num / den;
                dist = distGrid * state.view.scale; // Convert grid distance to pixels
            } else {
                if (item.axis === 'x') {
                    dist = Math.abs(x - toScreenX(item.value));
                } else {
                    dist = Math.abs(y - toScreenY(item.value));
                }
            }

            if (dist < threshold && dist < minDist) {
                minDist = dist;
                closest = item;
                type = 'inequality';
            }
        });
    }

    if (closest) {
        state.dragging = {
            id: closest.id,
            type: type,
            // Store initial values
            startA: closest.a,
            startB: closest.b,
            startValue: closest.value,
            axis: closest.axis,
            ineqType: closest.type
        };
        e.preventDefault();
    }
}

function handleMove(e) {
    const { x, y } = getPointerPos(e);
    const gridX = toGridX(x);
    const gridY = toGridY(y);

    if (state.dragging) {
        e.preventDefault();

        if (state.dragging.type === 'point') {
            const newX = Math.round(gridX);
            const newY = Math.round(gridY);

            const item = state.points.find(p => p.id === state.dragging.id);
            if (item && (item.x !== newX || item.y !== newY)) {
                item.x = newX;
                item.y = newY;
                renderUI();
            }
            canvas.style.cursor = 'move';
        } else {
            // Inequality dragging
            const item = state.inequalities.find(i => i.id === state.dragging.id);
            if (item) {
                if (item.type === 'linear') {
                    // Preserve slope 'a', update 'b'
                    // y = ax + b => b = y - ax
                    const newB = Math.round(gridY - item.a * gridX);
                    if (item.b !== newB) {
                        item.b = newB;
                        renderUI();
                    }
                    canvas.style.cursor = 'move';
                } else {
                    // Axis aligned
                    let newValue;
                    if (state.dragging.axis === 'x') {
                        newValue = Math.round(gridX);
                    } else {
                        newValue = Math.round(gridY);
                    }

                    if (item.value !== newValue) {
                        item.value = newValue;
                        renderUI();
                    }
                    canvas.style.cursor = state.dragging.axis === 'x' ? 'ew-resize' : 'ns-resize';
                }
            }
        }
        return;
    }

    // Hover logic
    let hovered = false;
    const threshold = 10;

    // Check points
    for (const item of state.points) {
        const px = toScreenX(item.x);
        const py = toScreenY(item.y);
        if (Math.hypot(x - px, y - py) < threshold) {
            hovered = true;
            canvas.style.cursor = 'move';
            break;
        }
    }

    if (!hovered) {
        for (const item of state.inequalities) {
            let dist;
            if (item.type === 'linear') {
                const num = Math.abs(item.a * gridX - gridY + item.b);
                const den = Math.sqrt(item.a * item.a + 1);
                dist = (num / den) * state.view.scale;
                if (dist < threshold) {
                    hovered = true;
                    canvas.style.cursor = 'move';
                    break;
                }
            } else {
                if (item.axis === 'x') {
                    dist = Math.abs(x - toScreenX(item.value));
                } else {
                    dist = Math.abs(y - toScreenY(item.value));
                }
                if (dist < threshold) {
                    hovered = true;
                    canvas.style.cursor = item.axis === 'x' ? 'ew-resize' : 'ns-resize';
                    break;
                }
            }
        }
    }

    if (!hovered) {
        canvas.style.cursor = 'crosshair';
    }
}

function handleEnd() {
    state.dragging = null;
    canvas.style.cursor = 'crosshair';
}

// --- Core Logic ---

function addInequality(axis) {
    const id = Date.now().toString();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const color = colors[state.inequalities.length % colors.length];

    const newItem = {
        id,
        type: 'axis',
        axis: axis,
        operator: '>',
        value: Math.floor(Math.random() * 6) - 3, // Random int between -3 and 3
        color
    };

    state.inequalities.push(newItem);
    renderUI();
}

function addLinearInequality() {
    const id = Date.now().toString();
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    const color = colors[state.inequalities.length % colors.length];

    const newItem = {
        id,
        type: 'linear',
        a: 1,
        b: 0,
        operator: '>',
        color
    };

    state.inequalities.push(newItem);
    renderUI();
}

function addPoint() {
    const id = Date.now().toString();
    const colors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#84cc16'];
    const color = colors[state.points.length % colors.length];

    const newItem = {
        id,
        x: Math.floor(Math.random() * 6) - 3,
        y: Math.floor(Math.random() * 6) - 3,
        color,
        showDistances: false
    };

    state.points.push(newItem);
    renderUI();
}

function removeInequality(id) {
    state.inequalities = state.inequalities.filter(item => item.id !== id);
    renderUI();
}

function removePoint(id) {
    state.points = state.points.filter(item => item.id !== id);
    renderUI();
}

function updateInequality(id, updates) {
    const item = state.inequalities.find(i => i.id === id);
    if (item) {
        Object.assign(item, updates);
        renderUI(); // Re-render UI to reflect changes (e.g. value update)
    }
}

function updatePoint(id, updates) {
    const item = state.points.find(i => i.id === id);
    if (item) {
        Object.assign(item, updates);
        renderUI();
    }
}

// --- Rendering ---

function loop() {
    draw();
    requestAnimationFrame(loop);
}

function draw() {
    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.view.showGrid) {
        drawGrid();
    }
    drawAxes();
    drawInequalities();
    drawPoints();
}

function drawGrid() {
    ctx.beginPath();
    ctx.strokeStyle = CONFIG.gridColor;
    ctx.lineWidth = 1;

    const { scale, offsetX, offsetY } = state.view;
    const width = canvas.width;
    const height = canvas.height;

    // Vertical lines
    const startX = (offsetX % scale);
    for (let x = startX; x < width; x += scale) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    // Horizontal lines
    const startY = (offsetY % scale);
    for (let y = startY; y < height; y += scale) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.stroke();
}

function drawAxes() {
    ctx.beginPath();
    ctx.strokeStyle = CONFIG.axisColor;
    ctx.lineWidth = 2;

    const { offsetX, offsetY } = state.view;

    // Y Axis
    ctx.moveTo(offsetX, 0);
    ctx.lineTo(offsetX, canvas.height);

    // X Axis
    ctx.moveTo(0, offsetY);
    ctx.lineTo(canvas.width, offsetY);

    ctx.stroke();

    // Labels (optional, can add later)
}

// --- Coordinate Conversion ---

function toScreenX(gridX) {
    return state.view.offsetX + gridX * state.view.scale;
}

function toScreenY(gridY) {
    return state.view.offsetY - gridY * state.view.scale;
}

function toGridX(screenX) {
    return (screenX - state.view.offsetX) / state.view.scale;
}

function toGridY(screenY) {
    return (state.view.offsetY - screenY) / state.view.scale;
}

// --- Drawing ---

function drawInequalities() {
    drawShadedRegion();

    state.inequalities.forEach(item => {
        drawLine(item);
        drawLabel(item);
    });
}

function drawLine(item) {
    ctx.beginPath();
    ctx.strokeStyle = item.color;
    ctx.lineWidth = 3;

    const { width, height } = canvas;

    if (item.type === 'linear') {
        // Draw Y = aX + b
        // Find intersection with screen bounds
        // Left edge (x=0 screen, x=minGrid)
        const minGridX = toGridX(0);
        const maxGridX = toGridX(width);

        const y1 = item.a * minGridX + item.b;
        const y2 = item.a * maxGridX + item.b;

        ctx.moveTo(toScreenX(minGridX), toScreenY(y1));
        ctx.lineTo(toScreenX(maxGridX), toScreenY(y2));
    } else {
        if (item.axis === 'x') {
            const x = toScreenX(item.value);
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);

            // Draw dashed line for strict inequality? (Optional, usually solid is fine or dashed for < > vs <= >=)
            // Requirement says < > so strictly dashed is mathematically correct, but solid is easier to see.
            // Let's stick to solid for now as it's easier to drag.
        } else {
            const y = toScreenY(item.value);
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
    }

    ctx.stroke();
}

function drawLabel(item) {
    ctx.fillStyle = item.color;
    ctx.font = 'bold 14px Inter, sans-serif';

    const padding = 10;
    let x, y, text;

    if (item.type === 'linear') {
        // Place label near center or left
        const gridX = toGridX(canvas.width / 2);
        const gridY = item.a * gridX + item.b;
        x = toScreenX(gridX) + 10;
        y = toScreenY(gridY) - 10;

        const op = item.operator;
        // Format: Y > aX + b
        const bStr = item.b >= 0 ? `+ ${item.b}` : `- ${Math.abs(item.b)}`;
        text = `Y ${op} ${item.a}X ${bStr}`;
    } else {
        if (item.axis === 'x') {
            x = toScreenX(item.value) + padding;
            y = padding + 20;
        } else {
            x = padding + 10;
            y = toScreenY(item.value) - padding;
        }
        text = `${item.axis.toUpperCase()} ${item.operator} ${item.value}`;
    }

    ctx.fillText(text, x, y);
}

function drawShadedRegion() {
    if (state.inequalities.length === 0) return;

    ctx.save();
    ctx.beginPath();

    // Start with the whole screen
    // Actually, clip() intersects the current clipping region with the current path.
    // The default clipping region is the canvas.
    // So we iterate through inequalities and clip for each.

    // Large bounds for "infinite" half-planes
    const L = 10000;

    state.inequalities.forEach(item => {
        ctx.beginPath();
        if (item.type === 'linear') {
            // Y > aX + b
            // Points: (-L, a(-L)+b), (L, a(L)+b)
            // If >, we want above. Add (L, L) and (-L, L) (assuming L is huge positive Y)
            // If <, we want below. Add (L, -L) and (-L, -L)

            const y1 = item.a * (-L) + item.b;
            const y2 = item.a * (L) + item.b;

            const p1 = { x: toScreenX(-L), y: toScreenY(y1) };
            const p2 = { x: toScreenX(L), y: toScreenY(y2) };

            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            if (item.operator === '>') {
                // Above
                ctx.lineTo(toScreenX(L), toScreenY(L)); // Top Right (Grid Y is up, Screen Y is down, so toScreenY(L) is small/negative)
                ctx.lineTo(toScreenX(-L), toScreenY(L)); // Top Left
            } else {
                // Below
                ctx.lineTo(toScreenX(L), toScreenY(-L)); // Bottom Right
                ctx.lineTo(toScreenX(-L), toScreenY(-L)); // Bottom Left
            }
            ctx.closePath();

        } else {
            // Axis aligned
            if (item.axis === 'x') {
                const x = toScreenX(item.value);
                ctx.moveTo(x, toScreenY(-L));
                ctx.lineTo(x, toScreenY(L));

                if (item.operator === '>') {
                    ctx.lineTo(toScreenX(L), toScreenY(L));
                    ctx.lineTo(toScreenX(L), toScreenY(-L));
                } else {
                    ctx.lineTo(toScreenX(-L), toScreenY(L));
                    ctx.lineTo(toScreenX(-L), toScreenY(-L));
                }
            } else {
                const y = toScreenY(item.value);
                ctx.moveTo(toScreenX(-L), y);
                ctx.lineTo(toScreenX(L), y);

                if (item.operator === '>') {
                    ctx.lineTo(toScreenX(L), toScreenY(L));
                    ctx.lineTo(toScreenX(-L), toScreenY(L));
                } else {
                    ctx.lineTo(toScreenX(L), toScreenY(-L));
                    ctx.lineTo(toScreenX(-L), toScreenY(-L));
                }
            }
            ctx.closePath();
        }
        ctx.clip();
    });

    // Fill the remaining clipped region
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.restore();
}

function drawPoints() {
    state.points.forEach(point => {
        const x = toScreenX(point.x);
        const y = toScreenY(point.y);

        // Draw Distances
        if (point.showDistances) {
            ctx.save();
            ctx.strokeStyle = point.color;
            ctx.fillStyle = point.color;
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.5;

            // Distance to X axis (Vertical line)
            // From (x, y) to (x, 0)
            const y0 = toScreenY(0);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y0);
            ctx.stroke();

            // Arrowhead at axis
            // Actually, user asked for "arrows from the point to both axes"
            // Let's draw arrow at the axis end
            drawArrowHead(x, y, x, y0);

            // Distance to Y axis (Horizontal line)
            // From (x, y) to (0, y)
            const x0 = toScreenX(0);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x0, y);
            ctx.stroke();

            drawArrowHead(x, y, x0, y);

            // Labels
            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = point.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Label for vertical distance (abs(y)) - place mid-way
            const midY = (y + y0) / 2;
            ctx.fillText(`${Math.abs(point.y)}`, x + 15, midY);

            // Label for horizontal distance (abs(x)) - place mid-way
            const midX = (x + x0) / 2;
            ctx.fillText(`${Math.abs(point.x)}`, midX, y - 15);

            ctx.restore();
        }

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`(${point.x}, ${point.y})`, x + 10, y - 10);
    });
}

function drawArrowHead(fromX, fromY, toX, toY) {
    const headLength = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

// --- UI Rendering ---

function renderUI() {
    uiList.innerHTML = '';

    if (state.inequalities.length === 0 && state.points.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    // Render Inequalities
    state.inequalities.forEach(item => {
        const el = document.createElement('div');
        el.className = 'inequality-item';

        if (item.type === 'linear') {
            el.innerHTML = `
                <div class="color-indicator" style="background-color: ${item.color}"></div>
                <div class="axis-label">Y</div>
                <div class="select-wrapper">
                    <select onchange="updateInequality('${item.id}', { operator: this.value })">
                        <option value=">" ${item.operator === '>' ? 'selected' : ''}>&gt;</option>
                        <option value="<" ${item.operator === '<' ? 'selected' : ''}>&lt;</option>
                    </select>
                </div>
                <div style="display: flex; gap: 4px; align-items: center;">
                    <input type="number" class="number-input" style="width: 40px;" value="${item.a}" onchange="updateInequality('${item.id}', { a: parseInt(this.value) })">
                    <span style="color: var(--text-secondary); font-size: 14px; font-weight: 600;">X +</span>
                    <input type="number" class="number-input" style="width: 40px;" value="${item.b}" onchange="updateInequality('${item.id}', { b: parseInt(this.value) })">
                </div>
                <button class="icon-btn danger" onclick="removeInequality('${item.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
        } else {
            el.innerHTML = `
                <div class="color-indicator" style="background-color: ${item.color}"></div>
                <div class="axis-label">${item.axis.toUpperCase()}</div>
                <div class="select-wrapper">
                    <select onchange="updateInequality('${item.id}', { operator: this.value })">
                        <option value=">" ${item.operator === '>' ? 'selected' : ''}>&gt;</option>
                        <option value="<" ${item.operator === '<' ? 'selected' : ''}>&lt;</option>
                    </select>
                </div>
                <input type="number" class="number-input" value="${item.value}" onchange="updateInequality('${item.id}', { value: parseInt(this.value) })">
                <button class="icon-btn danger" onclick="removeInequality('${item.id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
        }
        uiList.appendChild(el);
    });

    // Render Points
    state.points.forEach(item => {
        const el = document.createElement('div');
        el.className = 'inequality-item';
        el.innerHTML = `
            <div class="color-indicator" style="background-color: ${item.color}"></div>
            <div class="axis-label">P</div>
            <div style="display: flex; gap: 4px; align-items: center;">
                <span style="color: var(--text-secondary); font-size: 12px;">X:</span>
                <input type="number" class="number-input" style="width: 40px;" value="${item.x}" onchange="updatePoint('${item.id}', { x: parseInt(this.value) })">
            </div>
            <div style="display: flex; gap: 4px; align-items: center;">
                <span style="color: var(--text-secondary); font-size: 12px;">Y:</span>
                <input type="number" class="number-input" style="width: 40px;" value="${item.y}" onchange="updatePoint('${item.id}', { y: parseInt(this.value) })">
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" id="dist-${item.id}" ${item.showDistances ? 'checked' : ''} onchange="updatePoint('${item.id}', { showDistances: this.checked })">
                <label for="dist-${item.id}" style="color: var(--text-secondary); font-size: 12px; cursor: pointer;">Show Distances</label>
            </div>
            <button class="icon-btn danger" onclick="removePoint('${item.id}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        uiList.appendChild(el);
    });
}

// Expose functions to global scope for HTML event handlers
window.updateInequality = updateInequality;
window.removeInequality = removeInequality;
window.updatePoint = updatePoint;
window.removePoint = removePoint;

// Start
init();
