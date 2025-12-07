/**
 * Multiplication Master App
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const views = {
        fullTable: document.getElementById('full-table-view'),
        practice: document.getElementById('practice-view'),
        singleNumber: document.getElementById('single-number-view')
    };

    const navBtns = {
        fullTable: document.getElementById('btn-full-table'),
        practice: document.getElementById('btn-practice'),
        singleNumber: document.getElementById('btn-single-number')
    };

    const gridContainer = document.getElementById('multiplication-grid');

    // Practice Mode Elements
    const practiceInput = document.getElementById('practice-input');
    const checkBtn = document.getElementById('btn-check');
    const qFactor1 = document.getElementById('q-factor1');
    const qFactor2 = document.getElementById('q-factor2');
    const scoreCorrectEl = document.getElementById('score-correct');
    const scoreIncorrectEl = document.getElementById('score-incorrect');
    const feedbackMsg = document.getElementById('feedback-msg');

    // Single Number Mode Elements
    const singleSelectionStage = document.getElementById('single-selection-stage');
    const singleGameStage = document.getElementById('single-game-stage');
    const singleResultsStage = document.getElementById('single-results-stage');
    const numberSelectionGrid = document.getElementById('number-selection-grid');
    const singleInput = document.getElementById('single-input');
    const singleCheckBtn = document.getElementById('btn-single-check');
    const sFactor1 = document.getElementById('s-factor1');
    const sFactor2 = document.getElementById('s-factor2');
    const singleRemainingEl = document.getElementById('single-remaining');
    const singleFeedbackMsg = document.getElementById('single-feedback-msg');
    const btnSingleRestart = document.getElementById('btn-single-restart');
    const finalCorrectEl = document.getElementById('final-correct');
    const finalMistakesEl = document.getElementById('final-mistakes');


    // State
    let state = {
        score: {
            correct: 0,
            incorrect: 0
        },
        currentQuestion: null,
        singleMode: {
            targetNumber: null,
            queue: [], // Questions to ask
            mistakes: 0, // Total mistakes in this session
            correctCount: 0, // Unique facts answered correctly
            currentQ: null // { num, target }
        }
    };

    // --- Navigation Logic ---
    function switchMode(mode) {
        // Toggle Nav Buttons
        Object.values(navBtns).forEach(btn => btn.classList.remove('active'));
        if (navBtns[mode]) navBtns[mode].classList.add('active');

        // Toggle Views
        Object.values(views).forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        if (views[mode]) {
            views[mode].classList.remove('hidden');
            views[mode].classList.add('active');
        }

        if (mode === 'practice') {
            resetPracticeMode();
        } else if (mode === 'singleNumber') {
            resetSingleNumberMode();
        }
    }

    navBtns.fullTable.addEventListener('click', () => switchMode('fullTable'));
    navBtns.practice.addEventListener('click', () => switchMode('practice'));
    navBtns.singleNumber.addEventListener('click', () => switchMode('singleNumber'));

    // --- Full Table Mode Logic ---
    function initGrid() {
        gridContainer.innerHTML = '';

        // Corner cell (empty or X)
        const corner = createCell('x', true);
        gridContainer.appendChild(corner);

        // Top Header Row (1-10)
        for (let i = 1; i <= 10; i++) {
            gridContainer.appendChild(createCell(i, true));
        }

        // Rows
        for (let row = 1; row <= 10; row++) {
            // Left Header Column
            gridContainer.appendChild(createCell(row, true));

            // Input Cells
            for (let col = 1; col <= 10; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';

                const input = document.createElement('input');
                input.type = 'number'; // Allow number input
                input.className = 'input-cell';
                input.dataset.row = row;
                input.dataset.col = col;

                // Event Listener for checking answer
                input.addEventListener('input', (e) => checkGridAnswer(e.target, row, col));

                cell.appendChild(input);
                gridContainer.appendChild(cell);
            }
        }
    }

    function createCell(content, isHeader = false) {
        const cell = document.createElement('div');
        cell.className = `cell ${isHeader ? 'header-cell' : ''}`;
        cell.textContent = content;
        return cell;
    }

    function checkGridAnswer(input, row, col) {
        const val = parseInt(input.value);
        const parent = input.parentElement;
        const correctProduct = row * col;

        if (isNaN(val)) {
            parent.classList.remove('correct', 'incorrect');
            return;
        }

        if (val === correctProduct) {
            parent.classList.add('correct');
            parent.classList.remove('incorrect');
        } else {
            parent.classList.add('incorrect');
            parent.classList.remove('correct');
        }
    }

    // --- Practice Mode Logic ---
    function generateNewQuestion() {
        // Clear input and feedback
        practiceInput.value = '';
        practiceInput.focus();
        feedbackMsg.textContent = '';
        feedbackMsg.className = 'feedback';

        // Generate numbers
        const f1 = Math.floor(Math.random() * 10) + 1;
        const f2 = Math.floor(Math.random() * 10) + 1;

        state.currentQuestion = { f1, f2, answer: f1 * f2 };

        qFactor1.textContent = f1;
        qFactor2.textContent = f2;
    }

    function checkPracticeAnswer() {
        if (!state.currentQuestion) return;

        const val = parseInt(practiceInput.value);
        if (isNaN(val)) return;

        const isCorrect = val === state.currentQuestion.answer;

        if (isCorrect) {
            state.score.correct++;
            scoreCorrectEl.textContent = state.score.correct;
            feedbackMsg.textContent = 'Awesome! Correct!';
            feedbackMsg.classList.add('success');

            setTimeout(generateNewQuestion, 1000);
        } else {
            state.score.incorrect++;
            scoreIncorrectEl.textContent = state.score.incorrect;
            feedbackMsg.textContent = 'Oops, try again!';
            feedbackMsg.classList.add('error');
            practiceInput.select();
        }

        checkGameOver();
    }

    function checkGameOver() {
        if (state.score.correct >= 10) {
            triggerGameOver(true);
        } else if (state.score.incorrect >= 10) {
            triggerGameOver(false);
        }
    }

    function triggerGameOver(isWin) {
        const overlay = document.getElementById('game-over-overlay');
        const title = document.getElementById('overlay-title');
        const msg = document.getElementById('overlay-message');
        const fireworksContainer = document.getElementById('fireworks-container');

        overlay.classList.remove('hidden', 'win-theme', 'lose-theme');
        fireworksContainer.innerHTML = ''; // Clear old fireworks

        if (isWin) {
            overlay.classList.add('win-theme');
            title.textContent = "You Win! 🌟";
            msg.textContent = "Great job! You reached 10 correct answers!";
            startFireworks();
        } else {
            overlay.classList.add('lose-theme');
            title.textContent = "Game Over 😔";
            msg.textContent = "You missed 10. Let's try again from the start!";
        }
    }

    function startFireworks() {
        const container = document.getElementById('fireworks-container');
        const colors = ['#FF6584', '#43D9AD', '#6C63FF', '#F6E05E', '#FF9F43'];

        // Simple "confetti/firework" effect
        for (let i = 0; i < 50; i++) {
            const firework = document.createElement('div');
            firework.className = 'firework';
            const size = Math.random() * 15 + 5;
            firework.style.width = `${size}px`;
            firework.style.height = `${size}px`;
            firework.style.background = colors[Math.floor(Math.random() * colors.length)];
            firework.style.left = `${Math.random() * 100}%`;
            firework.style.top = `${Math.random() * 100}%`;
            firework.style.animationDelay = `${Math.random() * 0.5}s`;
            container.appendChild(firework);
        }
    }

    function resetPracticeMode() {
        state.score.correct = 0;
        state.score.incorrect = 0;
        scoreCorrectEl.textContent = '0';
        scoreIncorrectEl.textContent = '0';
        document.getElementById('game-over-overlay').classList.add('hidden');
        generateNewQuestion();
    }

    checkBtn.addEventListener('click', checkPracticeAnswer);
    practiceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkPracticeAnswer();
    });
    document.getElementById('btn-restart').addEventListener('click', resetPracticeMode);

    // --- Single Number Mode Logic ---
    function initSingleNumberUI() {
        numberSelectionGrid.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = i;
            btn.addEventListener('click', () => startSingleNumberGame(i));
            numberSelectionGrid.appendChild(btn);
        }
    }

    function resetSingleNumberMode() {
        singleSelectionStage.classList.remove('hidden');
        singleGameStage.classList.add('hidden');
        singleResultsStage.classList.add('hidden');
        initSingleNumberUI();
    }

    function startSingleNumberGame(num) {
        state.singleMode.targetNumber = num;
        state.singleMode.mistakes = 0;
        state.singleMode.correctCount = 0;

        // Create queue [1..10]
        state.singleMode.queue = Array.from({ length: 10 }, (_, i) => i + 1);
        // Shuffle queue
        state.singleMode.queue.sort(() => Math.random() - 0.5);

        singleSelectionStage.classList.add('hidden');
        singleGameStage.classList.remove('hidden');

        nextSingleQuestion();
    }

    function nextSingleQuestion() {
        if (state.singleMode.queue.length === 0) {
            showSingleResults();
            return;
        }

        const nextNum = state.singleMode.queue.shift(); // Take from front
        state.singleMode.currentQ = {
            num: nextNum,
            target: state.singleMode.targetNumber,
            answer: nextNum * state.singleMode.targetNumber
        };

        sFactor1.textContent = state.singleMode.targetNumber;
        sFactor2.textContent = nextNum;
        singleRemainingEl.textContent = state.singleMode.queue.length + 1; // +1 includes current

        singleInput.value = '';
        singleInput.focus();
        singleFeedbackMsg.textContent = '';
        singleFeedbackMsg.className = 'feedback';
    }

    function checkSingleAnswer() {
        if (!state.singleMode.currentQ) return;

        const val = parseInt(singleInput.value);
        if (isNaN(val)) return;

        const isCorrect = val === state.singleMode.currentQ.answer;

        if (isCorrect) {
            state.singleMode.correctCount++;
            singleFeedbackMsg.textContent = 'Correct!';
            singleFeedbackMsg.classList.add('success');
            setTimeout(nextSingleQuestion, 800);
        } else {
            state.singleMode.mistakes++;
            singleFeedbackMsg.textContent = 'Oops! We\'ll try that one again later.';
            singleFeedbackMsg.classList.add('error');

            // Push back to queue to retry later
            state.singleMode.queue.push(state.singleMode.currentQ.num);
            singleRemainingEl.textContent = state.singleMode.queue.length + 1;

            setTimeout(() => {
                singleInput.value = '';
                singleInput.focus();
            }, 1000); // Just clear input, but maybe user wants to see what they typed? 
            // Actually, for "retry later", we usually move to next question or 
            // just shuffle it back. The requirement says "repeat questions with incorrect ones at the end".
            // So we pushed it to the end. But we should probably show the next question immediately or 
            // after a short delay?
            // Let's decide: If wrong, show feedback, then move to next item in queue (which might be the same if queue was empty, but usually isn't).
            setTimeout(nextSingleQuestion, 1200);
        }
    }

    function showSingleResults() {
        singleGameStage.classList.add('hidden');
        singleResultsStage.classList.remove('hidden');

        // We always answer 10 distinct facts correctly eventually.
        finalCorrectEl.textContent = "10";
        finalMistakesEl.textContent = state.singleMode.mistakes;
    }

    singleCheckBtn.addEventListener('click', checkSingleAnswer);
    singleInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkSingleAnswer();
    });
    btnSingleRestart.addEventListener('click', resetSingleNumberMode);

    // --- Initialization ---
    initGrid();
});
