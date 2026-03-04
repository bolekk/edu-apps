'use strict';

// State (stored as integers × 10 to avoid float issues)
let startTenths = 13; // 1.3
let addTenths = 0;    // 0.0

const START_MIN = 0;
const START_MAX = 39;
const ADD_MIN = 0;
const ADD_MAX = 40;

// DOM refs
const startDisplay = document.getElementById('start-display');
const addDisplay = document.getElementById('add-display');
const sumDisplay = document.getElementById('sum-display');
const legendStart = document.getElementById('legend-start');
const legendAdd = document.getElementById('legend-add');
const groupsContainer = document.getElementById('groups-container');

function fmt(tenths) {
    return (tenths / 10).toFixed(1);
}

function updateDisplays() {
    const sumTenths = startTenths + addTenths;
    startDisplay.textContent = fmt(startTenths);
    addDisplay.textContent = fmt(addTenths);
    sumDisplay.textContent = fmt(sumTenths);
    legendStart.textContent = fmt(startTenths);
    legendAdd.textContent = '+ ' + fmt(addTenths);
}

function render() {
    const totalTenths = startTenths + addTenths;
    const wholeGroups = Math.floor(totalTenths / 10);
    const numGroups = wholeGroups + 1; // always include decimal group

    groupsContainer.innerHTML = '';

    for (let g = 0; g < numGroups; g++) {
        const isLastGroup = g === numGroups - 1;

        const groupEl = document.createElement('div');
        groupEl.className = 'block-group';

        const stack = document.createElement('div');
        stack.className = 'blocks-stack';

        for (let s = 0; s < 10; s++) {
            const blockIndex = g * 10 + s;
            const block = document.createElement('div');
            block.className = 'block';

            if (blockIndex < startTenths) {
                block.classList.add('primary');
            } else if (blockIndex < totalTenths) {
                block.classList.add('secondary');
            } else {
                block.classList.add('empty');
            }

            stack.appendChild(block);
        }

        const label = document.createElement('div');
        label.className = 'group-label';

        if (!isLastGroup) {
            label.textContent = '1.0';
            label.classList.add('full');
        } else {
            const decimalPart = totalTenths % 10;
            label.textContent = '0.' + decimalPart;
            label.classList.add('decimal');
        }

        groupEl.appendChild(stack);
        groupEl.appendChild(label);
        groupsContainer.appendChild(groupEl);
    }
}

function update() {
    updateDisplays();
    render();
}

// Auto-repeat on hold
function makeAdjuster(getVal, setVal, delta) {
    let timeout = null;
    let interval = null;

    function step() {
        const next = getVal() + delta;
        const clamped = Math.max(
            delta > 0 ? getVal() : (getVal() === startTenths ? START_MIN : ADD_MIN),
            Math.min(
                delta > 0 ? (getVal() === startTenths ? START_MAX : ADD_MAX) : getVal(),
                next
            )
        );
        setVal(clamped);
        update();
    }

    function start() {
        step();
        timeout = setTimeout(() => {
            interval = setInterval(step, 80);
        }, 400);
    }

    function stop() {
        clearTimeout(timeout);
        clearInterval(interval);
        timeout = null;
        interval = null;
    }

    return { start, stop };
}

function wireButton(btnId, getVal, setVal, min, max, delta) {
    const btn = document.getElementById(btnId);
    let timeout = null;
    let interval = null;

    function step() {
        const next = getVal() + delta;
        if (next < min || next > max) return;
        setVal(next);
        update();
    }

    function stop() {
        clearTimeout(timeout);
        clearInterval(interval);
    }

    btn.addEventListener('mousedown', () => {
        step();
        timeout = setTimeout(() => {
            interval = setInterval(step, 80);
        }, 400);
    });

    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);

    btn.addEventListener('touchstart', (e) => { e.preventDefault(); step(); timeout = setTimeout(() => { interval = setInterval(step, 80); }, 400); }, { passive: false });
    btn.addEventListener('touchend', stop);
}

wireButton('start-up',   () => startTenths, v => { startTenths = v; }, START_MIN, START_MAX, +1);
wireButton('start-down', () => startTenths, v => { startTenths = v; }, START_MIN, START_MAX, -1);
wireButton('add-up',     () => addTenths,   v => { addTenths = v; },   ADD_MIN,   ADD_MAX,   +1);
wireButton('add-down',   () => addTenths,   v => { addTenths = v; },   ADD_MIN,   ADD_MAX,   -1);

// Init
update();
