document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const modeSelection = document.querySelector('.mode-selection');
    const gameArea = document.querySelector('.game-area');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const backBtn = document.getElementById('back-btn');
    const checkBtn = document.getElementById('check-btn');
    const nextBtn = document.getElementById('next-btn');
    const answerInput = document.getElementById('answer-input');
    const feedback = document.getElementById('feedback');
    const startTimeEl = document.getElementById('start-time');
    const endTimeEl = document.getElementById('end-time');
    const correctCountEl = document.getElementById('correct-count');
    const incorrectCountEl = document.getElementById('incorrect-count');

    const winOverlay = document.getElementById('win-overlay');
    const loseOverlay = document.getElementById('lose-overlay');
    const playAgainWinBtn = document.getElementById('play-again-win-btn');
    const playAgainLoseBtn = document.getElementById('play-again-lose-btn');

    // State
    let currentMode = null;
    let currentQuestion = null;
    let score = {
        correct: 0,
        incorrect: 0
    };

    // Event Listeners
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentMode = btn.dataset.mode;
            startGame();
        });
    });

    backBtn.addEventListener('click', () => {
        showModeSelection();
    });

    checkBtn.addEventListener('click', checkAnswer);

    nextBtn.addEventListener('click', () => {
        generateQuestion();
        resetInput();
    });

    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (nextBtn.classList.contains('hidden')) {
                checkAnswer();
            } else {
                generateQuestion();
                resetInput();
            }
        }
    });

    playAgainWinBtn.addEventListener('click', resetGame);
    playAgainLoseBtn.addEventListener('click', resetGame);

    // Functions
    function startGame() {
        modeSelection.classList.add('hidden');
        gameArea.classList.remove('hidden');
        resetScore();
        generateQuestion();
        resetInput();
    }

    function showModeSelection() {
        gameArea.classList.add('hidden');
        modeSelection.classList.remove('hidden');
        currentMode = null;
        resetScore();
    }

    function resetScore() {
        score.correct = 0;
        score.incorrect = 0;
        updateScoreDisplay();
    }

    function updateScoreDisplay() {
        correctCountEl.textContent = score.correct;
        incorrectCountEl.textContent = score.incorrect;
    }

    function resetInput() {
        answerInput.value = '';
        answerInput.disabled = false;
        feedback.textContent = '';
        feedback.className = 'feedback';
        checkBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');
        answerInput.focus();
    }

    function checkGameEnd() {
        if (score.correct >= 5) {
            showWinScreen();
        } else if (score.incorrect >= 5) {
            showLoseScreen();
        }
    }

    function showWinScreen() {
        winOverlay.classList.remove('hidden');
    }

    function showLoseScreen() {
        loseOverlay.classList.remove('hidden');
    }

    function resetGame() {
        winOverlay.classList.add('hidden');
        loseOverlay.classList.add('hidden');
        showModeSelection();
    }

    function generateQuestion() {
        let startHour, startMinute, endHour, endMinute;
        let startTotalMinutes, endTotalMinutes;

        // Helper to get random int between min and max (inclusive)
        const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        switch (currentMode) {
            case 'easy':
                // EASY: start and end times don't cross a full "ten". They only differ in the last digit of minutes.
                startHour = random(1, 12);
                const tens = random(0, 5);
                const startOne = random(0, 8);
                const endOne = random(startOne + 1, 9);

                startMinute = tens * 10 + startOne;
                endMinute = tens * 10 + endOne;
                endHour = startHour;
                break;

            case 'medium':
                // MEDIUM: Same hour, time difference between 7 and 16 minutes.
                startHour = random(1, 12);
                endHour = startHour;

                startMinute = random(0, 30);
                const add = 7 + random(0, 9);
                endMinute = startMinute + add;
                break;

            case 'hard':
                // HARD: Hours differ by at most 1. Any minute difference.
                startHour = random(1, 11); // 1 to 11 to allow +1 hour
                const hourDiff = random(0, 1);
                endHour = startHour + hourDiff;

                startMinute = random(0, 59);
                endMinute = random(0, 59);

                // If same hour, endMinute must be > startMinute
                if (hourDiff === 0) {
                    startMinute = random(0, 20);
                    endMinute = random(startMinute + 20, 59);
                }
                break;

            case 'very-hard':
                // VERY HARD: start and end differ in hours and minutes and also AM/PM.
                startHour = random(7, 11); // 7 AM to 11 AM
                endHour = random(1, 5); // 1 PM to 5 PM

                // Minutes must differ
                do {
                    startMinute = random(0, 59);
                    endMinute = random(0, 59);
                } while (startMinute === endMinute);
                break;
        }

        currentQuestion = {
            start: { h: startHour, m: startMinute, period: 'AM' },
            end: { h: endHour, m: endMinute, period: 'AM' }
        };

        if (currentMode === 'very-hard') {
            currentQuestion.start.period = 'AM';
            currentQuestion.end.period = 'PM';
        } else {
            currentQuestion.start.period = '';
            currentQuestion.end.period = '';
        }

        displayQuestion(currentQuestion);
    }

    function displayQuestion(q) {
        const formatTime = (h, m, p) => {
            const minStr = m.toString().padStart(2, '0');
            return `${h}:${minStr} ${p}`.trim();
        };

        startTimeEl.textContent = formatTime(q.start.h, q.start.m, q.start.period);
        endTimeEl.textContent = formatTime(q.end.h, q.end.m, q.end.period);
    }

    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedback.textContent = 'Please enter a number!';
            feedback.className = 'feedback error';
            return;
        }

        const correctDiff = calculateDifference(currentQuestion);

        if (userAnswer === correctDiff) {
            feedback.textContent = '🎉 Correct! Great job!';
            feedback.className = 'feedback success';
            score.correct++;
            checkBtn.classList.add('hidden');
            nextBtn.classList.remove('hidden');
            nextBtn.focus();
        } else {
            feedback.textContent = `Not quite. Try again!`;
            feedback.className = 'feedback error';
            score.incorrect++;
        }
        updateScoreDisplay();
        checkGameEnd();
    }

    function calculateDifference(q) {
        // Convert everything to minutes from start of day (or reference point)
        // For Easy/Medium/Hard (assuming same period or simple forward progression)

        let startTotal = q.start.h * 60 + q.start.m;
        let endTotal = q.end.h * 60 + q.end.m;

        if (currentMode === 'very-hard') {
            // AM to PM
            // 12 AM is 0, 12 PM is 12*60.
            // But standard clock: 12 is 0 mod 12?
            // Let's use standard 12h to 24h conversion.

            // Start is AM. 12 AM = 0, 1 AM = 60... 11 AM = 660.
            // If start hour is 12, it's 0 minutes (if 12 AM). But we generated 7-11.
            // So Start is just h*60 + m.

            // End is PM. 12 PM = 12*60, 1 PM = 13*60...
            // If end hour is 12, it's 12*60. If 1, it's 13*60.
            // We generated 1-5 PM. So add 12 to hour.

            let endH24 = q.end.h + 12;
            if (q.end.h === 12) endH24 = 12; // 12 PM is 12:00

            endTotal = endH24 * 60 + q.end.m;

            // Start is AM. 7-11.
            let startH24 = q.start.h;
            if (q.start.h === 12) startH24 = 0; // 12 AM

            startTotal = startH24 * 60 + q.start.m;
        } else {
            // Hard/Medium/Easy
            // If end hour < start hour (e.g. 11:00 to 1:00), add 12 hours?
            // But our generation logic for Hard was: start(1-10), end(start+1, 12).
            // So end is always greater.
            // Exception: 12:xx is usually treated as 0:xx in math but 12 on clock.
            // If we have 10:00 to 12:00, that's 2 hours (120 min).
            // 10*60=600. 12*60=720. Diff=120. Correct.

            // What if 12:00 to 1:00 (Hard)?
            // Our generator: start(1-10), end(start+1, 12).
            // So we never generate 12:00 as start in Hard.
            // We never generate 1:00 as end if start is 10:00 (end is 11 or 12).
            // So we are safe with simple subtraction.
        }

        return endTotal - startTotal;
    }
});
