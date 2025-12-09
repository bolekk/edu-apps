// Imports removed for global script usage
// Assumes THREE, OrbitControls, NETS are global variables

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.currentNetIndex = 0;
        this.folding = false;
        this.foldDirection = 1; // 1 for fold, -1 for unfold
        this.foldProgress = 0; // 0 to 1
        this.speed = 0.5; // Speed multiplier
        this.clock = new THREE.Clock();
        this.joints = [];

        this.initThree();
        this.initUI();
        this.loadNet(0);
        this.animate();
    }

    initThree() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        // Camera
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 0, 15);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 10, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const ptLight = new THREE.PointLight(0x4fdda0, 0.5);
        ptLight.position.set(-5, -5, 5);
        this.scene.add(ptLight);

        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initUI() {
        // Thumbnail generation
        const thumbContainer = document.getElementById('net-thumbnails');
        window.NETS.forEach((net, index) => {
            const div = document.createElement('div');
            div.className = 'net-thumb';
            if (index === 0) div.classList.add('active');

            // Create simple SVG mini-map
            const bounds = this.getBounds(net.layout);
            const w = bounds.maxX - bounds.minX + 1;
            const h = bounds.maxY - bounds.minY + 1;
            const size = 20; // px per block
            const svgW = w * size;
            const svgH = h * size;

            let svg = `<svg viewBox="0 0 ${svgW} ${svgH}">`;
            net.layout.forEach(pos => {
                const x = (pos[0] - bounds.minX) * size;
                const y = (bounds.maxY - pos[1]) * size; // Flip Y for SVG
                svg += `<rect x="${x}" y="${y}" width="${size - 2}" height="${size - 2}" rx="2" ry="2" />`;
            });
            svg += `</svg>`;
            div.innerHTML = svg;

            div.addEventListener('click', () => {
                document.querySelectorAll('.net-thumb').forEach(el => el.classList.remove('active'));
                div.classList.add('active');
                this.loadNet(index);
            });
            thumbContainer.appendChild(div);
        });

        // Mode Switching
        this.mode = 'global'; // 'global' or 'manual'
        this.globalProgress = 0; // Current global state
        this.globalTarget = 0;   // Target global state
        this.isPaused = false;   // Only for global animation

        const modeRadios = document.getElementsByName('mode');
        const setupMode = () => {
            this.mode = Array.from(modeRadios).find(r => r.checked).value;
            const globControls = document.getElementById('global-controls');
            const manControls = document.getElementById('manual-controls');

            if (this.mode === 'global') {
                globControls.style.display = 'block';
                manControls.style.display = 'none';
                // Sync Back: Snap global state to average of joints?
                // Or just reset? Let's be smart: if most joints are folded, snap to 1.
                let sum = 0;
                this.joints.forEach(j => sum += j.current);
                const avg = this.joints.length ? sum / this.joints.length : 0;
                this.globalProgress = avg;
                this.globalTarget = Math.round(avg);
                this.slider.value = this.globalProgress;
            } else {
                globControls.style.display = 'none';
                manControls.style.display = 'block';
                // Init individual targets from current global state
                this.joints.forEach(j => {
                    // Keep current as-is
                    // Set target to rounded current (so they complete their fold if mid-way)
                    j.target = Math.round(j.current);
                });
            }
        };

        modeRadios.forEach(r => r.addEventListener('change', setupMode));

        // Global Controls
        this.btnFold = document.getElementById('btn-fold');
        this.btnUnfold = document.getElementById('btn-unfold');
        this.btnPause = document.getElementById('btn-pause');
        this.slider = document.getElementById('slider-progress');

        this.btnFold.addEventListener('click', () => {
            this.globalTarget = 1;
        });

        this.btnUnfold.addEventListener('click', () => {
            this.globalTarget = 0;
        });

        this.btnPause.addEventListener('click', () => {
            if (this.mode !== 'global') return;
            this.isPaused = !this.isPaused;
            this.btnPause.innerText = this.isPaused ? "Resume" : "Pause";
        });

        this.slider.addEventListener('input', (e) => {
            if (this.mode !== 'global') return;
            const val = parseFloat(e.target.value);
            this.globalTarget = val;
            this.globalProgress = val; // Snapping feeling, but animation loop will handle smoothing if we differ
        });

        // Raycaster for clicks
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.renderer.domElement.addEventListener('click', (e) => this.onCanvasClick(e));
        setupMode(); // Call once to set initial state
    }

    onCanvasClick(event) {
        if (this.mode !== 'manual') return;

        // Calculate mouse position
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Intersect
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            // Find first mesh with jointData
            let hit = intersects.find(i => i.object.userData && i.object.userData.jointData);
            if (hit) {
                const jointData = hit.object.userData.jointData;
                // Toggle target
                if (jointData.dir) { // Ignore root which has no direction
                    jointData.target = jointData.target > 0.5 ? 0 : 1;
                }
            }
        }
    }

    getBounds(layout) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        layout.forEach(p => {
            minX = Math.min(minX, p[0]);
            maxX = Math.max(maxX, p[0]);
            minY = Math.min(minY, p[1]);
            maxY = Math.max(maxY, p[1]);
        });
        return { minX, maxX, minY, maxY };
    }

    loadNet(index) {
        this.currentNetIndex = index;
        if (this.currentRoot) {
            this.scene.remove(this.currentRoot);
        }

        // Reset state
        this.globalProgress = 0;
        this.globalTarget = 0;
        this.slider.value = 0;

        // Build Tree
        const layout = window.NETS[index].layout;
        const root = this.buildTree(layout);

        this.joints = []; // To store references for animation
        this.currentRoot = this.create3DGraph(root);

        // Center the net
        const bounds = this.getBounds(layout);
        const cx = (bounds.minX + bounds.maxX) / 2;
        const cy = (bounds.minY + bounds.maxY) / 2;
        this.currentRoot.position.set(-cx, -cy, 0); // Center at world origin

        this.scene.add(this.currentRoot);
    }

    buildTree(layout) {
        // Convert to string set for easy lookup
        const set = new Set(layout.map(p => `${p[0]},${p[1]}`));
        const getKey = (p) => `${p[0]},${p[1]}`;

        // Pick root: The node with most neighbors, or just the first
        // Finding node with max neighbors
        let bestRoot = layout[0];
        let maxNeighbors = -1;

        layout.forEach(p => {
            let n = 0;
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
                if (set.has(getKey([p[0] + d[0], p[1] + d[1]]))) n++;
            });
            if (n > maxNeighbors) {
                maxNeighbors = n;
                bestRoot = p;
            }
        });

        // BFS
        const queue = [bestRoot];
        const visited = new Set([getKey(bestRoot)]);
        const nodes = {}; // Map key -> node object

        nodes[getKey(bestRoot)] = { pos: bestRoot, children: [] };

        const treeRoot = nodes[getKey(bestRoot)];

        while (queue.length > 0) {
            const curr = queue.shift();
            const currNode = nodes[getKey(curr)];

            [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'up'], [0, -1, 'down']].forEach(d => {
                const nextPos = [curr[0] + d[0], curr[1] + d[1]];
                const key = getKey(nextPos);
                if (set.has(key) && !visited.has(key)) {
                    visited.add(key);
                    queue.push(nextPos);

                    const childNode = { pos: nextPos, children: [], directionFromParent: d[2] };
                    nodes[key] = childNode;
                    currNode.children.push(childNode);
                }
            });
        }

        return treeRoot;
    }

    create3DGraph(node) {
        const S = 1.0; // Square size
        const G = 0.05; // Gap slightly

        // Material
        const geometry = new THREE.BoxGeometry(S * 0.95, S * 0.95, 0.1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4fdda0,
            roughness: 0.2,
            metalness: 0.1
        });
        const edgeGeo = new THREE.EdgesGeometry(geometry);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff });

        // Helper to create a face mesh
        const createFace = () => {
            const group = new THREE.Group();
            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);

            const lines = new THREE.LineSegments(edgeGeo, edgeMat);
            group.add(lines);

            return { group, mesh }; // Return mesh for raycasting
        };

        const build = (n) => {
            const { group: faceGroup, mesh: faceMesh } = createFace();

            const joint = new THREE.Group();

            // Define joint data object
            const jointData = {
                obj: joint,
                dir: n.directionFromParent,
                current: 0,
                target: 0
            };

            this.joints.push(jointData);

            // Attach data to mesh for click detection
            faceMesh.userData.jointData = jointData;

            // Position the mesh relative to the joint
            if (!n.directionFromParent) {
                faceGroup.position.set(0, 0, 0);
                joint.add(faceGroup);
                joint.position.set(n.pos[0], n.pos[1], 0);
            } else {
                const dist = S / 2;
                if (n.directionFromParent === 'right') {
                    faceGroup.position.set(dist, 0, 0);
                } else if (n.directionFromParent === 'left') {
                    faceGroup.position.set(-dist, 0, 0);
                } else if (n.directionFromParent === 'up') {
                    faceGroup.position.set(0, dist, 0);
                } else if (n.directionFromParent === 'down') {
                    faceGroup.position.set(0, -dist, 0);
                }
                joint.add(faceGroup);
            }

            // Recurse for children
            n.children.forEach(child => {
                const childJoint = build(child);
                const dist = S / 2;

                if (child.directionFromParent === 'right') { // Child is to the Right of THIS
                    childJoint.position.set(dist, 0, 0);
                } else if (child.directionFromParent === 'left') {
                    childJoint.position.set(-dist, 0, 0);
                } else if (child.directionFromParent === 'up') {
                    childJoint.position.set(0, dist, 0);
                } else if (child.directionFromParent === 'down') {
                    childJoint.position.set(0, -dist, 0);
                }

                if (!n.directionFromParent) {
                    // Root case
                    if (child.directionFromParent === 'right') childJoint.position.set(dist, 0, 0);
                    if (child.directionFromParent === 'left') childJoint.position.set(-dist, 0, 0);
                    if (child.directionFromParent === 'up') childJoint.position.set(0, dist, 0);
                    if (child.directionFromParent === 'down') childJoint.position.set(0, -dist, 0);
                } else {
                    // Child case
                    if (n.directionFromParent === 'right') {
                        const cx = dist; const cy = 0;
                        if (child.directionFromParent === 'right') childJoint.position.set(cx + dist, cy, 0);
                        if (child.directionFromParent === 'up') childJoint.position.set(cx, cy + dist, 0);
                        if (child.directionFromParent === 'down') childJoint.position.set(cx, cy - dist, 0);
                    }
                    else if (n.directionFromParent === 'left') {
                        const cx = -dist; const cy = 0;
                        if (child.directionFromParent === 'left') childJoint.position.set(cx - dist, cy, 0);
                        if (child.directionFromParent === 'up') childJoint.position.set(cx, cy + dist, 0);
                        if (child.directionFromParent === 'down') childJoint.position.set(cx, cy - dist, 0);
                    }
                    else if (n.directionFromParent === 'up') {
                        const cx = 0; const cy = dist;
                        if (child.directionFromParent === 'up') childJoint.position.set(cx, cy + dist, 0);
                        if (child.directionFromParent === 'right') childJoint.position.set(cx + dist, cy, 0);
                        if (child.directionFromParent === 'left') childJoint.position.set(cx - dist, cy, 0);
                    }
                    else if (n.directionFromParent === 'down') {
                        const cx = 0; const cy = -dist;
                        if (child.directionFromParent === 'down') childJoint.position.set(cx, cy - dist, 0);
                        if (child.directionFromParent === 'right') childJoint.position.set(cx + dist, cy, 0);
                        if (child.directionFromParent === 'left') childJoint.position.set(cx - dist, cy, 0);
                    }
                }

                joint.add(childJoint);
            });

            return joint;
        };

        return build(node);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const deltaTime = this.clock.getDelta();

        if (this.mode === 'global') {
            if (!this.isPaused) {
                // Animate global progress towards global target
                const diff = this.globalTarget - this.globalProgress;
                if (Math.abs(diff) > 0.001) {
                    const step = Math.sign(diff) * this.speed * deltaTime;
                    if (Math.abs(step) > Math.abs(diff)) {
                        this.globalProgress = this.globalTarget;
                    } else {
                        this.globalProgress += step;
                    }
                }

                // FORCE Update all joints to match global progress
                this.joints.forEach(j => {
                    j.current = this.globalProgress;
                    this.updateJointRotation(j);
                });

                // Update slider if we are animating (not dragging)
                if (document.activeElement !== this.slider) {
                    this.slider.value = this.globalProgress;
                }
            }
        } else {
            // Manual Mode: Animate individual joints
            this.joints.forEach(j => {
                if (!j.dir) return;

                const diff = j.target - j.current;
                if (Math.abs(diff) > 0.001) {
                    const step = Math.sign(diff) * this.speed * deltaTime;
                    if (Math.abs(step) > Math.abs(diff)) {
                        j.current = j.target;
                    } else {
                        j.current += step;
                    }
                    this.updateJointRotation(j);
                }
            });
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateJointRotation(j) {
        const angle = j.current * (Math.PI / 2);

        if (j.dir === 'right') {
            j.obj.rotation.set(0, -angle, 0);
        } else if (j.dir === 'left') {
            j.obj.rotation.set(0, angle, 0);
        } else if (j.dir === 'up') {
            j.obj.rotation.set(angle, 0, 0);
        } else if (j.dir === 'down') {
            j.obj.rotation.set(-angle, 0, 0);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
