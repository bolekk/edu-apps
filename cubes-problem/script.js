// 3D Visualization for Cube Problem

// Globals
let scene, camera, renderer, controls;
let cubes = [];
let bands = []; // Store band meshes
const CUBE_SIZE = 1;
const GAP = 0.05; // Small gap for visual clarity
const TOTAL_WIDTH = 3 * (CUBE_SIZE + GAP);
const TOTAL_HEIGHT = 2 * (CUBE_SIZE + GAP);
const TOTAL_DEPTH = 3 * (CUBE_SIZE + GAP);

// State
let answerRevealed = false;

function init() {
    // --- SCENE ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // --- CAMERA ---
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);

    // --- RENDERER ---
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // --- CONTROLS ---
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // --- BUILD OBJECTS ---
    createCubes();
    createBands();

    // --- EVENT LISTENERS ---
    window.addEventListener('resize', onWindowResize);
    setupUI();

    // --- ANIMATION LOOP ---
    animate();
}

function createCubes() {
    // 3x3x2 Stack
    // Coordinates: x (0..2), y (0..2), z (0..1)

    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

    // Offset to center the stack at (0,0,0)
    const offsetX = (2 * (CUBE_SIZE + GAP)) / 2;
    const offsetZ = (2 * (CUBE_SIZE + GAP)) / 2;
    const offsetY = (1 * (CUBE_SIZE + GAP)) / 2;

    for (let x = 0; x < 3; x++) {
        for (let z = 0; z < 3; z++) { // Depth
            for (let y = 0; y < 2; y++) { // Height
                // Color: Greenish like the image
                const material = new THREE.MeshLambertMaterial({ color: 0x99cc99 });
                const cube = new THREE.Mesh(geometry, material);

                // Position
                cube.position.set(
                    x * (CUBE_SIZE + GAP) - offsetX,
                    y * (CUBE_SIZE + GAP) - offsetY + (GAP / 2),
                    z * (CUBE_SIZE + GAP) - offsetZ
                );

                // Add Edges
                const edges = new THREE.EdgesGeometry(geometry);
                const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x558855, linewidth: 2 }));
                cube.add(line);

                // Store metadata for logic
                cube.userData = {
                    gridX: x,
                    gridY: y, // Height
                    gridZ: z, // Depth
                    isTouchingBand: false
                };

                // Note: isTouchingBand will be calculated in highlightCubes dynamically based on the current logic

                scene.add(cube);
                cubes.push(cube);
            }
        }
    }
}

function createBands() {
    // Band 1 (Red): Vertical Loop (Front-Back-Top-Bot)
    // Band 2 (Orange): Horizontal Loop around Top Layer (Front-Right-Back-Left)

    const bandThickness = 0.05;
    const colorRed = 0xff3333;
    const colorOrange = 0xffaa33;

    // Offset calc
    const offsetX = (2 * (CUBE_SIZE + GAP)) / 2;
    const offsetZ = (2 * (CUBE_SIZE + GAP)) / 2;
    const offsetY = (1 * (CUBE_SIZE + GAP)) / 2;

    // Bounds for Faces
    // Note: Cubes have a small Y offset (GAP/2) to lift them slightly.
    // topFaceY needs to be: TopCubeCenterY + 0.5 + epsilon
    // TopCubeCenterY = (1 * (CUBE_SIZE + GAP)) - offsetY + (GAP/2)
    const topFaceY = ((1 * (CUBE_SIZE + GAP)) - offsetY + (GAP / 2)) + (CUBE_SIZE / 2) + 0.01;

    // Bottom: BotCubeCenterY - 0.5 - epsilon
    // BotCubeCenterY = (0 * (CUBE_SIZE + GAP)) - offsetY + (GAP/2)
    const botFaceY = ((0 * (CUBE_SIZE + GAP)) - offsetY + (GAP / 2)) - (CUBE_SIZE / 2) - 0.01;

    const frontFaceZ = (2 * (CUBE_SIZE + GAP)) - offsetZ + (CUBE_SIZE / 2) + 0.01;
    const backFaceZ = (0 * (CUBE_SIZE + GAP)) - offsetZ - (CUBE_SIZE / 2) - 0.01;
    const rightFaceX = (2 * (CUBE_SIZE + GAP)) - offsetX + (CUBE_SIZE / 2) + 0.01;
    const leftFaceX = (0 * (CUBE_SIZE + GAP)) - offsetX - (CUBE_SIZE / 2) - 0.01;

    // Top Layer Center Y (for horizontal band)
    const topLayerY = (1 * (CUBE_SIZE + GAP)) - offsetY + (GAP / 2);

    // --- BAND 1 (Red): Vertical Loop (Front-Back) ---
    const b1_group = new THREE.Group();
    const matRed = new THREE.MeshBasicMaterial({ color: colorRed, side: THREE.DoubleSide, opacity: 0.9, transparent: true });

    // Top Strip
    const topGeo = new THREE.PlaneGeometry(CUBE_SIZE, (3 * CUBE_SIZE + 2 * GAP));
    const topMesh = new THREE.Mesh(topGeo, matRed);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.y = topFaceY;
    b1_group.add(topMesh);

    // Bottom Strip
    const botMesh = topMesh.clone();
    botMesh.position.y = botFaceY;
    b1_group.add(botMesh);

    // Front Strip (Vertical)
    const frontGeo = new THREE.PlaneGeometry(CUBE_SIZE, (2 * CUBE_SIZE + 1 * GAP));
    const frontMesh = new THREE.Mesh(frontGeo, matRed);
    frontMesh.position.z = frontFaceZ;
    b1_group.add(frontMesh);

    // Back Strip
    const backMesh = frontMesh.clone();
    backMesh.position.z = backFaceZ;
    b1_group.add(backMesh);

    scene.add(b1_group);
    bands.push(b1_group);

    // --- BAND 2 (Orange): Horizontal Loop around Top Layer ---
    const b2_group = new THREE.Group();
    const matOrange = new THREE.MeshBasicMaterial({ color: colorOrange, side: THREE.DoubleSide, opacity: 0.9, transparent: true });

    // Front Horizontal Strip
    const hLoopGeo = new THREE.PlaneGeometry((3 * CUBE_SIZE + 2 * GAP), CUBE_SIZE);

    const frontHMesh = new THREE.Mesh(hLoopGeo, matOrange);
    frontHMesh.position.z = frontFaceZ + 0.001;
    frontHMesh.position.y = topLayerY;
    b2_group.add(frontHMesh);

    // Back Horizontal Strip
    const backHMesh = frontHMesh.clone();
    backHMesh.position.z = backFaceZ - 0.001;
    backHMesh.rotation.y = Math.PI;
    b2_group.add(backHMesh);

    // Right Horizontal Strip
    const sideHGeo = new THREE.PlaneGeometry((3 * CUBE_SIZE + 2 * GAP), CUBE_SIZE);

    const rightHMesh = new THREE.Mesh(sideHGeo, matOrange);
    rightHMesh.rotation.y = Math.PI / 2;
    rightHMesh.position.x = rightFaceX + 0.001;
    rightHMesh.position.y = topLayerY;
    b2_group.add(rightHMesh);

    const leftHMesh = rightHMesh.clone();
    leftHMesh.position.x = leftFaceX - 0.001;
    b2_group.add(leftHMesh);

    scene.add(b2_group);
    bands.push(b2_group);
}


function setupUI() {
    // Option Buttons
    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = parseInt(e.target.dataset.value);
            checkAnswer(val, e.target);
        });
    });

    // Control Buttons
    document.getElementById('btn-highlight-touched').addEventListener('click', () => highlightCubes(true));
    document.getElementById('btn-highlight-untouched').addEventListener('click', () => highlightCubes(false));
    document.getElementById('btn-reset').addEventListener('click', resetColors);
}

function checkAnswer(val, btnElement) {
    const feedback = document.getElementById('feedback');
    feedback.classList.remove('hidden');

    // Clear previous selection
    document.querySelectorAll('.option-btn').forEach(b => {
        b.classList.remove('correct', 'incorrect');
    });

    if (val === 6) {
        btnElement ? btnElement.classList.add('correct') : null;
        feedback.innerHTML = `<strong>Correct! (A)</strong> <br>
        1. <strong>Red Band (Vertical):</strong> Touches the middle column (6 cubes).<br>
        2. <strong>Orange Band (Horizontal):</strong> Wraps around the exterior of the top layer (8 cubes).<br>
        3. <strong>Overlap:</strong> The front and back center cubes of the top layer are touched by both (2 cubes).<br>
        4. <strong>Calculations:</strong> $6 + 8 - 2 = 12$ touched cubes.<br>
        5. <strong>Untouched:</strong> $18 - 12 = 6$.<br>
        (The untouched cubes are the 6 outer cubes of the bottom layer).`;

        highlightCubes(false); // Show the answer visually
    } else {
        btnElement ? btnElement.classList.add('incorrect') : null;
        feedback.innerHTML = `<strong>Incorrect.</strong> <br>
        - Red band touches the vertical middle stack.<br>
        - Orange band wraps horizontally around the top layer.`;
    }
}

function highlightCubes(showTouched) {
    resetColors();
    cubes.forEach(cube => {
        const { gridX, gridY, gridZ } = cube.userData;

        // Logic for touching
        // Red: Vertical Middle (x=1)
        const touchedRed = (gridX === 1);

        // Orange: Horizontal Top Layer (y=1) AND on the perimeter
        // Perimeter: x=0, x=2, z=0, z=2.
        // Or NOT middle (x=1 && z=1)
        const isMiddle = (gridX === 1 && gridZ === 1);
        const touchedOrange = (gridY === 1) && !isMiddle;

        const isTouching = touchedRed || touchedOrange;

        if (showTouched) {
            if (isTouching) {
                if (touchedRed && touchedOrange) {
                    cube.material.color.setHex(0xffaa55); // Overlap
                } else if (touchedRed) {
                    cube.material.color.setHex(0xff5555);
                } else {
                    cube.material.color.setHex(0xffaa00); // Orange
                }
                cube.material.opacity = 1.0;
                cube.material.transparent = false;
            } else {
                cube.material.opacity = 0.2;
                cube.material.transparent = true;
            }
        } else {
            // Highlight Untouched (The Answer)
            if (!isTouching) {
                cube.material.color.setHex(0x55ff55); // Bright Green
                cube.material.opacity = 1.0;
                cube.material.transparent = false;
            } else {
                cube.material.opacity = 0.2;
                cube.material.transparent = true;
                cube.material.color.setHex(0x555555); // Dim touched
            }
        }
    });
}

function resetColors() {
    cubes.forEach(cube => {
        cube.material.color.setHex(0x99cc99);
        cube.material.opacity = 1.0;
        cube.material.transparent = false;
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Start
init();
