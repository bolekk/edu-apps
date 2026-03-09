'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
    dividend: 12,
    divisor: 3,
    showRemainder: false,
};
let dirty = true;

const DIVIDEND_MIN = 1, DIVIDEND_MAX = 40;
const DIVISOR_MIN  = 1, DIVISOR_MAX  = 10;

// Panel right edge + breathing room (panel: left:20 + width:240 = 260px)
const PANEL_RIGHT = 295;

const ARC_COLORS = [
    '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

// ── Canvas sizing ─────────────────────────────────────────────────────────────
function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    dirty = true;
}
window.addEventListener('resize', resize);
resize();

// ── Derived ───────────────────────────────────────────────────────────────────
function quotient()  { return Math.floor(state.dividend / state.divisor); }
function remainder() { return state.dividend % state.divisor; }

// ── Drawing ───────────────────────────────────────────────────────────────────
function draw() {
    const w = canvas.width, h = canvas.height;
    const q = quotient(), r = remainder();
    const lastHop = q * state.divisor;

    // Background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // ── Layout ────────────────────────────────────────────────────────────────
    const lineLeft  = PANEL_RIGHT;
    const lineRight = w - 60;
    const lineW     = lineRight - lineLeft;
    const lineY     = h * 0.60;

    // Map number → x coordinate (0..dividend spans lineLeft..lineRight)
    const maxN = Math.max(state.dividend, 1);
    function toX(n) { return lineLeft + (n / maxN) * lineW; }

    const hopPx = toX(state.divisor) - toX(0); // pixels per one hop
    const arcH  = Math.min(h * 0.22, Math.max(hopPx * 0.5, 28));

    // ── Equation ──────────────────────────────────────────────────────────────
    const rPart  = state.showRemainder ? ` R ${r}` : '';
    const eqText = `${state.dividend} ÷ ${state.divisor} = ${q}${rPart}`;
    const eqSize = Math.round(Math.min(56, Math.max(32, h * 0.075)));
    const eqCx   = lineLeft + lineW / 2; // center of number line

    ctx.save();
    ctx.font = `600 ${eqSize}px Outfit, sans-serif`;
    ctx.fillStyle = '#f1f5f9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(eqText, eqCx, h * 0.07);
    ctx.restore();

    // ── Number line ───────────────────────────────────────────────────────────
    ctx.save();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineLeft - 8, lineY);
    ctx.lineTo(lineRight + 8, lineY);
    ctx.stroke();
    ctx.restore();

    // ── Tick marks & labels ───────────────────────────────────────────────────
    const showHopLabels         = hopPx >= 26;
    const showIntermediateTicks = state.divisor > 1 && hopPx >= 14;

    for (let i = 0; i <= state.dividend; i++) {
        const isHop      = (i % state.divisor === 0);
        const isDividend = (i === state.dividend);
        const isEdge     = (i === 0 || isDividend);

        // Skip minor ticks if hops are narrow
        if (!isHop && !isDividend && !showIntermediateTicks) continue;

        const x     = toX(i);
        const major = isHop || isDividend;
        const tickH = major ? 10 : 4;

        ctx.save();
        ctx.strokeStyle = major
            ? 'rgba(148, 163, 184, 0.75)'
            : 'rgba(148, 163, 184, 0.25)';
        ctx.lineWidth = major ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x, lineY - tickH);
        ctx.lineTo(x, lineY + tickH);
        ctx.stroke();
        ctx.restore();

        if (isEdge || (isHop && showHopLabels)) {
            ctx.save();
            ctx.font = `${isDividend ? '600 ' : ''}13px Outfit, sans-serif`;
            ctx.fillStyle = isDividend
                ? '#f1f5f9'
                : 'rgba(148, 163, 184, 0.75)';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(i, x, lineY + 15);
            ctx.restore();
        }
    }

    // ── Arcs ──────────────────────────────────────────────────────────────────
    const showArcLabels = q <= 20 && hopPx >= 30;

    for (let i = 0; i < q; i++) {
        const x1    = toX(i * state.divisor);
        const x2    = toX((i + 1) * state.divisor);
        const midX  = (x1 + x2) / 2;
        const color = ARC_COLORS[i % ARC_COLORS.length];
        const cp    = lineY - arcH * 1.35; // bezier control point y

        // Arc stroke
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x1, lineY);
        ctx.bezierCurveTo(x1, cp, x2, cp, x2, lineY);
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2.5;
        ctx.stroke();
        ctx.restore();

        // Hop label above arc peak
        if (showArcLabels) {
            ctx.save();
            ctx.font         = 'bold 12px Outfit, sans-serif';
            ctx.fillStyle    = color;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(`×${i + 1}`, midX, cp - 4);
            ctx.restore();
        }

        // Landing dot
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x2, lineY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Origin dot
    ctx.save();
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.beginPath();
    ctx.arc(toX(0), lineY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ── Dividend flag ─────────────────────────────────────────────────────────
    const flagX   = toX(state.dividend);
    const flagTop = lineY - arcH * 1.35 - 36;

    ctx.save();
    ctx.strokeStyle = 'rgba(241, 245, 249, 0.55)';
    ctx.lineWidth   = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(flagX, lineY);
    ctx.lineTo(flagX, flagTop);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Flag pennant
    ctx.save();
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.moveTo(flagX, flagTop);
    ctx.lineTo(flagX + 22, flagTop + 10);
    ctx.lineTo(flagX, flagTop + 20);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // ── Remainder highlight ───────────────────────────────────────────────────
    if (state.showRemainder) {
        if (r > 0) {
            const rx1    = toX(lastHop);
            const rx2    = toX(state.dividend);
            const remMid = (rx1 + rx2) / 2;

            // Shaded band
            ctx.save();
            ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
            ctx.fillRect(rx1, lineY - 8, rx2 - rx1, 16);
            ctx.restore();

            // Dashed gap line
            ctx.save();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth   = 2.5;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(rx1, lineY);
            ctx.lineTo(rx2, lineY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // End-cap ticks
            ctx.save();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth   = 2;
            for (const bx of [rx1, rx2]) {
                ctx.beginPath();
                ctx.moveTo(bx, lineY - 12);
                ctx.lineTo(bx, lineY + 12);
                ctx.stroke();
            }
            ctx.restore();

            // "R N" badge
            const badgeY = lineY - 34;
            ctx.save();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.roundRect(remMid - 22, badgeY - 11, 44, 22, 7);
            ctx.fill();
            ctx.font         = 'bold 13px Outfit, sans-serif';
            ctx.fillStyle    = '#0f172a';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`R ${r}`, remMid, badgeY);
            ctx.restore();

        } else {
            // r === 0 — show green "R 0" badge at the dividend flag position
            const badgeY = lineY - 34;
            ctx.save();
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.roundRect(flagX - 22, badgeY - 11, 44, 22, 7);
            ctx.fill();
            ctx.font         = 'bold 13px Outfit, sans-serif';
            ctx.fillStyle    = '#0f172a';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('R 0', flagX, badgeY);
            ctx.restore();
        }
    }
}

// ── Render loop ───────────────────────────────────────────────────────────────
const dividendDisplay = document.getElementById('dividend-display');
const divisorDisplay  = document.getElementById('divisor-display');

function loop() {
    if (dirty) {
        dividendDisplay.textContent = state.dividend;
        divisorDisplay.textContent  = state.divisor;
        draw();
        dirty = false;
    }
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ── Button wiring (with auto-repeat) ─────────────────────────────────────────
function wireButton(btnId, getVal, setVal, min, max, delta) {
    const btn = document.getElementById(btnId);
    let timeout = null, interval = null;

    function step() {
        const next = getVal() + delta;
        if (next < min || next > max) return;
        setVal(next);
        dirty = true;
    }

    function stop() {
        clearTimeout(timeout);
        clearInterval(interval);
        timeout = null;
        interval = null;
    }

    btn.addEventListener('mousedown', () => {
        step();
        timeout = setTimeout(() => { interval = setInterval(step, 80); }, 400);
    });
    btn.addEventListener('mouseup',    stop);
    btn.addEventListener('mouseleave', stop);

    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        step();
        timeout = setTimeout(() => { interval = setInterval(step, 80); }, 400);
    }, { passive: false });
    btn.addEventListener('touchend', stop);
}

wireButton('dividend-down', () => state.dividend, v => { state.dividend = v; }, DIVIDEND_MIN, DIVIDEND_MAX, -1);
wireButton('dividend-up',   () => state.dividend, v => { state.dividend = v; }, DIVIDEND_MIN, DIVIDEND_MAX, +1);
wireButton('divisor-down',  () => state.divisor,  v => { state.divisor  = v; }, DIVISOR_MIN,  DIVISOR_MAX,  -1);
wireButton('divisor-up',    () => state.divisor,  v => { state.divisor  = v; }, DIVISOR_MIN,  DIVISOR_MAX,  +1);

// ── Remainder toggle ──────────────────────────────────────────────────────────
document.getElementById('remainder-toggle').addEventListener('change', (e) => {
    state.showRemainder = e.target.checked;
    dirty = true;
});
