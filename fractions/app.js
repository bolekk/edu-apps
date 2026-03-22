'use strict';

const state = {
    aN: 1, aD: 3,
    bN: 1, bD: 4,
    lcdMode: false
};

// Math helpers
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }
function simplify(n, d) {
    if (n === 0) return { n: 0, d: 1 };
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
}

// SVG helpers
const SVG_NS = 'http://www.w3.org/2000/svg';
const CX = 100, CY = 100, R = 88;

function polarToXY(angleDeg) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) };
}

function wedgePath(startDeg, endDeg) {
    const s = polarToXY(startDeg);
    const e = polarToXY(endDeg);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function linePath(angleDeg) {
    const p = polarToXY(angleDeg);
    return `M ${CX} ${CY} L ${p.x} ${p.y}`;
}

function makeSvgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

// Draw a single-color pizza (for fraction A or B)
function drawPizza(svgEl, numerator, denominator, fillColor, lcd) {
    svgEl.innerHTML = '';

    // Background circle
    svgEl.appendChild(makeSvgEl('circle', {
        cx: CX, cy: CY, r: R,
        fill: '#1e293b', stroke: '#475569', 'stroke-width': 2
    }));

    if (denominator === 0) return;

    const sliceAngle = 360 / denominator;

    // Draw all slices
    for (let i = 0; i < denominator; i++) {
        const startDeg = i * sliceAngle;
        const endDeg = (i + 1) * sliceAngle;
        const filled = i < numerator;

        if (denominator === 1) {
            // Full circle
            svgEl.appendChild(makeSvgEl('circle', {
                cx: CX, cy: CY, r: R,
                fill: filled ? fillColor : '#1e293b',
                stroke: '#475569', 'stroke-width': 2
            }));
        } else {
            svgEl.appendChild(makeSvgEl('path', {
                d: wedgePath(startDeg, endDeg),
                fill: filled ? fillColor : '#1e293b',
                stroke: '#0f172a', 'stroke-width': 2
            }));
        }
    }

    // Outer ring
    svgEl.appendChild(makeSvgEl('circle', {
        cx: CX, cy: CY, r: R,
        fill: 'none', stroke: '#475569', 'stroke-width': 2.5
    }));

    // LCD subdivision lines (thinner, dashed)
    if (state.lcdMode && lcd && lcd > denominator) {
        const lcdSliceAngle = 360 / lcd;
        const subsPerSlice = lcd / denominator;
        for (let i = 0; i < lcd; i++) {
            if (i % subsPerSlice === 0) continue; // skip main slice lines
            const angleDeg = i * lcdSliceAngle;
            svgEl.appendChild(makeSvgEl('path', {
                d: linePath(angleDeg),
                fill: 'none',
                stroke: '#64748b',
                'stroke-width': 1,
                'stroke-dasharray': '4 3',
                opacity: '0.7'
            }));
        }
    }
}

// Draw the result pizza with two colors
function drawResultPizza(svgEl, aN, aD, bN, bD) {
    svgEl.innerHTML = '';

    const lcd = lcm(aD, bD);
    const aNlcd = aN * (lcd / aD);
    const bNlcd = bN * (lcd / bD);
    const totalN = aNlcd + bNlcd;
    const denominator = state.lcdMode ? lcd : (function() {
        // In non-lcd mode show as simplified over lcd
        return lcd;
    })();

    // Background circle
    svgEl.appendChild(makeSvgEl('circle', {
        cx: CX, cy: CY, r: R,
        fill: '#1e293b', stroke: '#475569', 'stroke-width': 2
    }));

    if (denominator === 0) return;

    const sliceAngle = 360 / denominator;

    if (denominator === 1) {
        const color = totalN >= 1 ? '#f97316' : '#1e293b';
        svgEl.appendChild(makeSvgEl('circle', {
            cx: CX, cy: CY, r: R,
            fill: color, stroke: '#475569', 'stroke-width': 2
        }));
    } else {
        for (let i = 0; i < denominator; i++) {
            const startDeg = i * sliceAngle;
            const endDeg = (i + 1) * sliceAngle;
            let fill;
            if (i < aNlcd) {
                fill = '#f97316'; // color A
            } else if (i < totalN) {
                fill = '#38bdf8'; // color B
            } else {
                fill = '#1e293b'; // empty
            }
            svgEl.appendChild(makeSvgEl('path', {
                d: wedgePath(startDeg, endDeg),
                fill,
                stroke: '#0f172a', 'stroke-width': 2
            }));
        }
    }

    // Outer ring
    svgEl.appendChild(makeSvgEl('circle', {
        cx: CX, cy: CY, r: R,
        fill: 'none', stroke: '#475569', 'stroke-width': 2.5
    }));

    // In non-lcd mode, show original denominator lines (if aD !== bD)
    if (!state.lcdMode) {
        // Draw lines for aD boundaries
        if (aD > 1 && aN > 0) {
            const aSliceAngle = 360 / aD;
            for (let i = 0; i < aD; i++) {
                const angleDeg = i * aSliceAngle;
                svgEl.appendChild(makeSvgEl('path', {
                    d: linePath(angleDeg),
                    fill: 'none', stroke: '#0f172a', 'stroke-width': 2
                }));
            }
        }
        // Draw lines for bD boundaries (thin dashed for the second)
        if (bD > 1 && bN > 0) {
            const bSliceAngle = 360 / bD;
            for (let i = 0; i < bD; i++) {
                const angleDeg = i * bSliceAngle;
                svgEl.appendChild(makeSvgEl('path', {
                    d: linePath(angleDeg),
                    fill: 'none', stroke: '#0f172a', 'stroke-width': 2
                }));
            }
        }
    }
}

function fmtFraction(n, d) {
    return `${n}/${d}`;
}

function render() {
    const { aN, aD, bN, bD, lcdMode } = state;
    const lcd = lcm(aD, bD);
    const totalN = aN * (lcd / aD) + bN * (lcd / bD);
    const sum = simplify(totalN, lcd);

    // Update text displays
    document.getElementById('an-display').textContent = aN;
    document.getElementById('ad-display').textContent = aD;
    document.getElementById('bn-display').textContent = bN;
    document.getElementById('bd-display').textContent = bD;

    const sumStr = `${fmtFraction(aN, aD)} + ${fmtFraction(bN, bD)} = ${fmtFraction(sum.n, sum.d)}`;
    document.getElementById('sum-formula').textContent = sumStr;

    document.getElementById('legend-a').textContent = fmtFraction(aN, aD);
    document.getElementById('legend-b').textContent = fmtFraction(bN, bD);

    // Pizza labels
    if (lcdMode) {
        const aNlcd = aN * (lcd / aD);
        const bNlcd = bN * (lcd / bD);
        document.getElementById('label-a').textContent = `${fmtFraction(aN, aD)} = ${fmtFraction(aNlcd, lcd)}`;
        document.getElementById('label-b').textContent = `${fmtFraction(bN, bD)} = ${fmtFraction(bNlcd, lcd)}`;
        document.getElementById('label-result').textContent = fmtFraction(totalN, lcd);
    } else {
        document.getElementById('label-a').textContent = fmtFraction(aN, aD);
        document.getElementById('label-b').textContent = fmtFraction(bN, bD);
        document.getElementById('label-result').textContent = fmtFraction(sum.n, sum.d);
    }

    // LCD button state
    const lcdBtn = document.getElementById('lcd-btn');
    lcdBtn.textContent = lcdMode ? 'Hide common denominator' : 'Show common denominator';
    lcdBtn.classList.toggle('active', lcdMode);

    // Draw pizzas
    drawPizza(document.getElementById('pizza-a'), aN, aD, '#f97316', lcdMode ? lcd : null);
    drawPizza(document.getElementById('pizza-b'), bN, bD, '#38bdf8', lcdMode ? lcd : null);
    drawResultPizza(document.getElementById('pizza-result'), aN, aD, bN, bD);
}

// Button wiring with auto-repeat
function wireButton(btnId, onStep) {
    const btn = document.getElementById(btnId);
    let timeout = null;
    let interval = null;

    function step() { onStep(); render(); }

    function start() {
        step();
        timeout = setTimeout(() => { interval = setInterval(step, 80); }, 400);
    }

    function stop() {
        clearTimeout(timeout);
        clearInterval(interval);
        timeout = null;
        interval = null;
    }

    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); start(); }, { passive: false });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
}

wireButton('an-up', () => { if (state.aN < state.aD) state.aN++; });
wireButton('an-down', () => { if (state.aN > 0) state.aN--; });
wireButton('ad-up', () => { if (state.aD < 12) state.aD++; });
wireButton('ad-down', () => {
    if (state.aD > 1) {
        state.aD--;
        if (state.aN > state.aD) state.aN = state.aD;
    }
});

wireButton('bn-up', () => { if (state.bN < state.bD) state.bN++; });
wireButton('bn-down', () => { if (state.bN > 0) state.bN--; });
wireButton('bd-up', () => { if (state.bD < 12) state.bD++; });
wireButton('bd-down', () => {
    if (state.bD > 1) {
        state.bD--;
        if (state.bN > state.bD) state.bN = state.bD;
    }
});

document.getElementById('lcd-btn').addEventListener('click', () => {
    state.lcdMode = !state.lcdMode;
    render();
});

render();
