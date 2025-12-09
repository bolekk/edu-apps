// 3D Cubes Builder - No-Module Version

// Globals
let scene, camera, renderer, controls, groundPlane;
let cubes = [];
let hoverCube;
let selectionBox; // For delete mode highlighting
let deleteMode = false;
let selectedColor = null; // Start in View Mode (null)
let potentialPlacementPosition = null;
let hoveredCube = null; // The actual cube object being hovered in delete mode

// Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function init() {
    const container = document.getElementById('canvas-container');

    // --- SCENE SETUP ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);
    // Remove fog for cleaner look, or keep it? Requirement says "no shadows". Fog is fine. logic-wise.
    scene.fog = new THREE.Fog(0x222222, 20, 100);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    // Shadows removed
    container.appendChild(renderer.domElement);

    // Controls (OrbitControls is added to THREE namespace by the script)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 50;
    controls.zoomSpeed = 0.3; // Slower zoom

    // Grid
    const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x333333);
    scene.add(gridHelper);

    // Ground Plane (Invisible)
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    groundPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(groundPlane);

    // --- CUBES SETUP ---
    // Ghost for placement
    const ghostGeo = new THREE.BoxGeometry(1, 1, 1);
    const ghostMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        wireframe: true
    });
    hoverCube = new THREE.Mesh(ghostGeo, ghostMat);
    hoverCube.visible = false;
    scene.add(hoverCube);

    // Selection Box for delete mode
    const selGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05); // Slightly larger
    const selMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.8 });
    selectionBox = new THREE.Mesh(selGeo, selMat);
    selectionBox.visible = false;
    scene.add(selectionBox);

    // --- LISTENERS ---
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('contextmenu', e => e.preventDefault());

    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteMode = false;
            selectedColor = e.target.dataset.color;
            updateUIState();
        });
    });

    document.getElementById('btn-clear').addEventListener('click', clearCubes);
    document.getElementById('btn-save').addEventListener('click', saveScene);
    document.getElementById('btn-load').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', loadScene);

    const btnDelete = document.getElementById('btn-delete');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            if (deleteMode) return; // Already in delete mode
            deleteMode = true;
            selectedColor = null;
            updateUIState();
        });
    }

    const btnView = document.getElementById('btn-view');
    if (btnView) {
        btnView.addEventListener('click', () => {
            deleteMode = false;
            selectedColor = null;
            updateUIState();
        });
    }

    // Start Loop
    createCube(new THREE.Vector3(0.5, 0.5, 0.5), '#ff5555'); // Initial seed cube
    animate();
}

function saveScene() {
    const data = {
        cubes: cubes.map(c => ({
            x: c.position.x,
            y: c.position.y,
            z: c.position.z,
            color: '#' + c.material.color.getHexString()
        }))
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cubes-scene.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadScene(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.cubes && Array.isArray(data.cubes)) {
                clearCubes();
                data.cubes.forEach(c => {
                    createCube(new THREE.Vector3(c.x, c.y, c.z), c.color);
                });
            }
        } catch (err) {
            console.error('Failed to load scene:', err);
            alert('Invalid scene file');
        }
        // Reset input so same file can be loaded again
        event.target.value = '';
    };
    reader.readAsText(file);
}

function updateUIState() {
    // Reset all states
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    const btnDelete = document.getElementById('btn-delete');
    const btnView = document.getElementById('btn-view');

    if (btnDelete) btnDelete.classList.remove('active');
    if (btnView) btnView.classList.remove('active');

    // Reset cursor/ghosts
    document.body.style.cursor = 'default';
    hoverCube.visible = false;
    selectionBox.visible = false;

    // Default to controls disabled, enable only in view mode
    controls.enabled = false;

    if (deleteMode) {
        if (btnDelete) btnDelete.classList.add('active');
        document.body.style.cursor = 'crosshair';
    } else if (selectedColor) {
        // Color Mode
        const colorBtn = document.querySelector(`.color-btn[data-color="${selectedColor}"]`);
        if (colorBtn) colorBtn.classList.add('selected');
    } else {
        // View Mode
        if (btnView) btnView.classList.add('active');
        controls.enabled = true; // Enable controls ONLY in view mode
    }
}

function createCube(position, color) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    // Switch to MeshBasicMaterial
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color)
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.copy(position);
    // No shadows

    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }));
    cube.add(line);

    scene.add(cube);
    cubes.push(cube);
}

function clearCubes() {
    for (const cube of cubes) {
        scene.remove(cube);
    }
    cubes = [];
}

function updateHoverCube(intersection) {
    if (!intersection) {
        hoverCube.visible = false;
        return null;
    }

    const { object, point, face } = intersection;
    const position = point.clone();

    // Determine candidate position
    if (object === groundPlane) {
        position.divideScalar(1).floor().addScalar(0.5);
        position.y = 0.5;

        // Validation: If cubes exist, new pos MUST be adjacent to at least one cube
        if (cubes.length > 0) {
            let isAdjacent = false;
            for (const cube of cubes) {
                if (position.distanceTo(cube.position) < 1.1) { // 1.0 distance means touching faces
                    isAdjacent = true;
                    break;
                }
            }
            if (!isAdjacent) {
                hoverCube.visible = false;
                return null;
            }
        }
    } else {
        // Intersecting an existing cube
        const normal = face.normal.clone();
        // Ensure normal is in world space (for safety, though with no rotation it's same)
        normal.transformDirection(object.matrixWorld).round();

        position.copy(object.position).add(normal);
        position.multiplyScalar(2).round().divideScalar(2);
    }

    hoverCube.position.copy(position);
    hoverCube.visible = true;
    return position;
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    if (deleteMode) {
        // Logic for Delete Mode: Highlight cubes only
        // Recursive = true to hit lines too, then we check parent
        const intersects = raycaster.intersectObjects(cubes, true);

        let foundCube = null;
        if (intersects.length > 0) {
            let hit = intersects[0].object;
            // Traverse up to find the cube in our list
            // This handles if we hit the LineSegments (edges) which are children of the cube
            while (hit && !cubes.includes(hit)) {
                hit = hit.parent;
            }
            if (cubes.includes(hit)) {
                foundCube = hit;
            }
        }

        if (foundCube) {
            hoveredCube = foundCube;
            selectionBox.position.copy(foundCube.position);
            selectionBox.visible = true;
        } else {
            hoveredCube = null;
            selectionBox.visible = false;
            // Hide selection box if we moved off
        }
        hoverCube.visible = false; // Ensure placement ghost is hidden
        return;
    }

    // Logic for Placement Mode
    if (!selectedColor) {
        hoverCube.visible = false;
        selectionBox.visible = false;
        potentialPlacementPosition = null;
        return;
    }

    selectionBox.visible = false;

    // Check intersections against Cubes AND Ground
    const objectsToCheck = [...cubes, groundPlane];
    const intersects = raycaster.intersectObjects(objectsToCheck, false);

    if (intersects.length > 0) {
        potentialPlacementPosition = updateHoverCube(intersects[0]);
    } else {
        potentialPlacementPosition = updateHoverCube(null);
    }
}

function onMouseClick(event) {
    if (event.button !== 0) return;

    if (!deleteMode && !selectedColor) return; // View Mode - do nothing

    if (deleteMode) {
        if (hoveredCube) {
            scene.remove(hoveredCube);
            cubes = cubes.filter(c => c !== hoveredCube);
            hoveredCube = null;
            selectionBox.visible = false;

            // Re-check under mouse immediately
            onMouseMove(event);
        }
        return;
    }

    if (!selectedColor) return;

    if (potentialPlacementPosition) {
        createCube(potentialPlacementPosition, selectedColor);

        // Immediate update
        raycaster.setFromCamera(mouse, camera);
        const objectsToCheck = [...cubes, groundPlane];
        const intersects = raycaster.intersectObjects(objectsToCheck, false);
        if (intersects.length > 0) {
            potentialPlacementPosition = updateHoverCube(intersects[0]);
        }
    }
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
