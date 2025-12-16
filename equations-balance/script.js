const state = {
    leftWeights: [],
    rightWeights: [],
    mysteryWeight: 0,
    isBalanced: false
};

const DOM = {
    balanceBeam: document.getElementById('balanceBeam'),
    leftPan: document.getElementById('leftPan'),
    rightPan: document.getElementById('rightPan'),
    weightsPalette: document.getElementById('weightsPalette'),
    trashZone: document.getElementById('trashZone'),
    guessInput: document.getElementById('guessInput'),
    checkBtn: document.getElementById('checkBtn'),
    newGameBtn: document.getElementById('newGameBtn'),
    feedback: document.getElementById('feedback'),
    difficultySelect: document.getElementById('difficultySelect')
};

function initGame() {
    // Generate mystery weight (1-9)
    state.mysteryWeight = Math.floor(Math.random() * 9) + 1;

    // Clear current weights
    state.leftWeights = [];
    state.rightWeights = [];

    const difficulty = DOM.difficultySelect.value;
    generateLevel(difficulty);

    render();
    updateScale();
}

function generateLevel(difficulty) {
    let numLeftX = 1;
    let numRightX = 0;

    if (difficulty === 'MEDIUM') {
        numLeftX = Math.floor(Math.random() * 2) + 2; // 2 or 3
    } else if (difficulty === 'HARD') {
        numLeftX = Math.floor(Math.random() * 2) + 2; // 2 or 3
        numRightX = Math.floor(Math.random() * 1) + 1; // 1 or 2
        // Ensure Left has more Xs to keep logic simple for balancing (Left will likely be lighter heavily if not careful, but we handle it)
    }

    // Add Mystery Weights
    for (let i = 0; i < numLeftX; i++) state.leftWeights.push(createWeightObj(state.mysteryWeight, 'mystery'));
    for (let i = 0; i < numRightX; i++) state.rightWeights.push(createWeightObj(state.mysteryWeight, 'mystery'));

    // Add random known weights
    // Strategy: Add some small randoms, then balance.

    // Add 0-2 randoms to left
    const extraLeft = Math.floor(Math.random() * 3);
    for (let i = 0; i < extraLeft; i++) {
        state.leftWeights.push(createWeightObj(Math.floor(Math.random() * 5) + 1, 'known'));
    }

    // Add 0-2 randoms to right
    const extraRight = Math.floor(Math.random() * 3);
    for (let i = 0; i < extraRight; i++) {
        state.rightWeights.push(createWeightObj(Math.floor(Math.random() * 5) + 1, 'known'));
    }

    // Check balance
    let leftSum = state.leftWeights.reduce((a, b) => a + b.value, 0);
    let rightSum = state.rightWeights.reduce((a, b) => a + b.value, 0);

    if (leftSum < rightSum) {
        // Add difference to left
        let diff = rightSum - leftSum;
        // Break usage of 10+? Try to keep weights small
        while (diff > 9) {
            state.leftWeights.push(createWeightObj(9, 'known'));
            diff -= 9;
        }
        if (diff > 0) state.leftWeights.push(createWeightObj(diff, 'known'));
    } else if (rightSum < leftSum) {
        let diff = leftSum - rightSum;
        while (diff > 9) {
            state.rightWeights.push(createWeightObj(9, 'known'));
            diff -= 9;
        }
        if (diff > 0) state.rightWeights.push(createWeightObj(diff, 'known'));
    }
}

function createWeightObj(val, type) {
    return {
        value: val,
        type: type,
        id: (type === 'mystery' ? 'myst-' : 'known-') + Date.now() + Math.random()
    };
}

function render() {
    // Render Left Pan
    const leftBasket = document.createElement('div');
    leftBasket.className = 'pan-basket';
    DOM.leftPan.innerHTML = ''; // Clear previous
    // Draw strings? CSS pseudo elements handle strings relative to pan container

    DOM.leftPan.appendChild(leftBasket);

    state.leftWeights.forEach(w => {
        const el = createWeightElement(w);
        leftBasket.appendChild(el);
    });

    // Render Right Pan
    const rightBasket = document.createElement('div');
    rightBasket.className = 'pan-basket';
    DOM.rightPan.innerHTML = '';
    DOM.rightPan.appendChild(rightBasket);

    state.rightWeights.forEach(w => {
        const el = createWeightElement(w);
        rightBasket.appendChild(el);
    });

    renderPalette();
}

function renderPalette() {
    DOM.weightsPalette.innerHTML = '';

    // Add Mystery Weight Source
    const xWeight = { value: state.mysteryWeight, type: 'mystery', id: 'palette-X' };
    const xEl = createWeightElement(xWeight, true);
    DOM.weightsPalette.appendChild(xEl);

    for (let i = 1; i <= 9; i++) {
        const w = { value: i, type: 'known', id: `palette-${i}` };
        const el = createWeightElement(w, true); // true = cloneable source
        DOM.weightsPalette.appendChild(el);
    }
}

function createWeightElement(weightObj, isSource = false) {
    const div = document.createElement('div');
    div.className = `weight ${weightObj.type === 'mystery' ? 'mystery' : ''}`;
    div.textContent = weightObj.type === 'mystery' ? 'X' : weightObj.value;
    div.draggable = true;
    div.dataset.value = weightObj.value;
    div.dataset.type = weightObj.type;
    div.dataset.id = weightObj.id;

    if (isSource) {
        div.classList.add('source-weight');
        div.addEventListener('dragstart', handleDragStartSource);
    } else {
        div.addEventListener('dragstart', handleDragStartExisting);
    }

    return div;
}

// Drag and Drop Logic
let draggedItem = null;
let draggedFrom = null; // 'palette', 'left', 'right'

function handleDragStartSource(e) {
    const type = e.target.dataset.type;
    const val = parseInt(e.target.dataset.value);

    draggedItem = createWeightObj(val, type);
    draggedFrom = 'palette';
    e.dataTransfer.effectAllowed = 'copy';
}

function handleDragStartExisting(e) {
    const id = e.target.dataset.id;
    // Find where it is
    const leftIndex = state.leftWeights.findIndex(w => w.id === id);
    if (leftIndex > -1) {
        draggedItem = state.leftWeights[leftIndex];
        draggedFrom = 'left';
    } else {
        const rightIndex = state.rightWeights.findIndex(w => w.id === id);
        if (rightIndex > -1) {
            draggedItem = state.rightWeights[rightIndex];
            draggedFrom = 'right';
        }
    }
    e.dataTransfer.effectAllowed = 'move';
}

// Drop Targets
[DOM.leftPan, DOM.rightPan, DOM.trashZone].forEach(zone => {
    zone.addEventListener('dragover', e => {
        e.preventDefault();

        // Validation:
        // If from palette, can drop on pans.
        // If from pan, can drop on trash.
        // Can NOT drop on other pan (moving).
        // Can NOT drop on same pan (reordering - allowed but trivial).

        const target = e.currentTarget;
        const isTrash = (target === DOM.trashZone);
        const isPan = (target === DOM.leftPan || target === DOM.rightPan || target.closest('.pan'));

        let allowed = false;
        if (draggedFrom === 'palette' && isPan) allowed = true;
        if ((draggedFrom === 'left' || draggedFrom === 'right') && isTrash) allowed = true;

        if (allowed) {
            e.dataTransfer.dropEffect = (draggedFrom === 'palette') ? 'copy' : 'move';
            zone.classList.add('drag-over');
        } else {
            e.dataTransfer.dropEffect = 'none';
        }
    });

    zone.addEventListener('dragleave', e => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', handleDrop);
});

function handleDrop(e) {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drag-over');

    if (!draggedItem) return;

    // SCENARIO 1: Adding from Palette (Add to BOTH sides)
    if (draggedFrom === 'palette') {
        const isPan = (target === DOM.leftPan || target.closest('#leftPan') || target === DOM.rightPan || target.closest('#rightPan'));
        if (isPan) {
            // Add to Left
            state.leftWeights.push(createWeightObj(draggedItem.value, draggedItem.type));
            // Add to Right
            state.rightWeights.push(createWeightObj(draggedItem.value, draggedItem.type));

            showFeedback(`Added ${draggedItem.type === 'mystery' ? 'X' : draggedItem.value} to BOTH sides.`, 'info');
        }
    }

    // SCENARIO 2: Removing from Pan (Subtract from BOTH sides)
    else if ((draggedFrom === 'left' || draggedFrom === 'right') && target === DOM.trashZone) {

        const otherSide = (draggedFrom === 'left') ? 'right' : 'left';
        const otherSideWeights = (otherSide === 'right') ? state.rightWeights : state.leftWeights;

        // Try to subtract from other side
        if (canSubtract(otherSideWeights, draggedItem)) {
            // Perform subtraction on other side
            performSubtract(otherSideWeights, draggedItem, otherSide); // Pass otherSide to update correct state array

            // Remove from source side (simple filter as we have ID)
            if (draggedFrom === 'left') {
                state.leftWeights = state.leftWeights.filter(w => w.id !== draggedItem.id);
            } else {
                state.rightWeights = state.rightWeights.filter(w => w.id !== draggedItem.id);
            }

            showFeedback(`Removed ${draggedItem.type === 'mystery' ? 'X' : draggedItem.value} from BOTH sides.`, 'info');
        } else {
            showFeedback(`Cannot remove! Other side doesn't have enough weight to match.`, 'error');
            draggedItem = null;
            draggedFrom = null;
            return;
        }
    }

    render();
    updateScale();
    draggedItem = null;
    draggedFrom = null;
}

function canSubtract(list, itemToRemove) {
    if (itemToRemove.type === 'mystery') {
        // Must have at least one X
        return list.some(w => w.type === 'mystery');
    } else {
        // Value based subtraction
        // Can we sum up enough to remove? 
        // Logic: Greedy reduction. 
        // We're simulating "Subtract 5". 
        // If we have a 5, great. If we have a 9, we can make it 4.
        // If we have 2, 2, 2 (Sum 6), we can remove 2, 2, and turn last 2 into ??? No, complex.
        // Let's stick to: "Can reduce total generic weight value by N without going negative".
        // BUT, visually we must modify the blocks.
        // PROPOSED ALGORITHM:
        // 1. Sort list descending.
        // 2. Iterate and eat up value.
        // 3. Return true if we can eat up exact value using splits.
        // Actually, just checking total value is enough? No, physical constraints if we don't want to create "negative" blocks.
        // Since we allow splitting (9->4), practically any Set of known weights summing >= val is sufficient?
        // Yes, if we allow splitting arbitrary blocks.

        const totalValue = list.filter(w => w.type === 'known').reduce((sum, w) => sum + w.value, 0);
        return totalValue >= itemToRemove.value;
    }
}

function performSubtract(list, itemToRemove, sideToUpdate) {
    if (itemToRemove.type === 'mystery') {
        // Find an X and remove it
        const idx = list.findIndex(w => w.type === 'mystery');
        if (idx > -1) list.splice(idx, 1);
    } else {
        let remainingToRemove = itemToRemove.value;

        // Sort descending to tackle biggest blocks first (cleaner splits)
        // We need to modify the array in place or rebuild it.
        // Let's categorize knowns vs mysteries
        let knowns = list.filter(w => w.type === 'known').sort((a, b) => b.value - a.value);
        let others = list.filter(w => w.type !== 'known');

        let newKnowns = [];

        // Greedy subtract
        for (let w of knowns) {
            if (remainingToRemove <= 0) {
                newKnowns.push(w);
                continue;
            }

            if (w.value > remainingToRemove) {
                // Split this block!
                w.value -= remainingToRemove;
                remainingToRemove = 0;
                newKnowns.push(w);
            } else {
                // Eat this whole block
                remainingToRemove -= w.value;
                // Don't push w (it's gone)
            }
        }

        // Rebuild list (order might change, that's fine)
        if (sideToUpdate === 'left') {
            state.leftWeights = [...others, ...newKnowns];
        } else { // sideToUpdate === 'right'
            state.rightWeights = [...others, ...newKnowns];
        }
    }
}

function updateScale() {
    const leftSum = state.leftWeights.reduce((sum, w) => sum + w.value, 0);
    const rightSum = state.rightWeights.reduce((sum, w) => sum + w.value, 0);

    const diff = rightSum - leftSum;
    // Calculate rotation angle. Max rotation around 20deg?
    // Sensitive scale.
    // Increase sensitivity: multiply by 5 instead of 2
    let angle = diff * 5;
    // Increase max tilt to 45 degrees
    if (angle > 45) angle = 45;
    if (angle < -45) angle = -45;

    DOM.balanceBeam.style.transform = `rotate(${angle}deg)`;

    // Also rotate baskets opposite to keep them upright
    const baskets = document.querySelectorAll('.pan-basket');
    baskets.forEach(b => {
        b.style.transform = `rotate(${-angle}deg)`;
    });

    state.isBalanced = (leftSum === rightSum);

    // update status light
    const statusLight = document.getElementById('balanceStatus');
    if (state.isBalanced) {
        statusLight.classList.remove('red');
        statusLight.classList.add('green');
        statusLight.textContent = "BALANCED";
        statusLight.title = "BALANCED";
    } else {
        statusLight.classList.remove('green');
        statusLight.classList.add('red');
        statusLight.textContent = "NOT BALANCED";
        statusLight.title = "NOT BALANCED";
    }
}

// Guess Logic
DOM.checkBtn.addEventListener('click', () => {
    const val = parseInt(DOM.guessInput.value);
    if (!val) return;

    if (val === state.mysteryWeight) {
        showFeedback("Correct! You found the mystery weight! 🎉", 'success');
        triggerWinAnimation();
    } else {
        showFeedback("Not quite. Check the balance and try again!", 'error');
    }
});

DOM.difficultySelect.addEventListener('change', () => {
    initGame();
});

DOM.newGameBtn.addEventListener('click', () => {
    DOM.guessInput.value = '';
    hideFeedback();
    initGame();
});

function showFeedback(msg, type) {
    DOM.feedback.textContent = msg;
    DOM.feedback.className = `feedback-message feedback-${type}`;
    DOM.feedback.classList.remove('hidden');
}

function hideFeedback() {
    DOM.feedback.classList.add('hidden');
}

function triggerWinAnimation() {
    // maybe some confetti later
}

// Start
initGame();
