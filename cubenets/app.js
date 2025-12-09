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

        // Controls
        this.btnFold = document.getElementById('btn-fold');
        this.btnUnfold = document.getElementById('btn-unfold');
        this.btnPause = document.getElementById('btn-pause');
        this.slider = document.getElementById('slider-progress');

        this.btnFold.addEventListener('click', () => {
            this.folding = true;
            this.foldDirection = 1;
        });

        this.btnUnfold.addEventListener('click', () => {
            this.folding = true;
            this.foldDirection = -1;
        });

        this.btnPause.addEventListener('click', () => {
            this.folding = !this.folding;
        });

        this.slider.addEventListener('input', (e) => {
            this.foldProgress = parseFloat(e.target.value);
            this.folding = false; // Stop animation when dragging
            this.updateFold();
        });
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
        this.foldProgress = 0;
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

            return group;
        };

        // Recursive creation
        // Returns a Group that represents this node (and its children)
        // If it's a child, the Group is pivoted at the edge shared with parent.

        // Root is special: it's just at its position.
        // But to make recursion uniform, let's say createNode(node) returns the Pivot Group.
        // The Root's Pivot Group has no rotation (or matches the layout coords).

        // Actually, easiest way:
        // Root Group is at `node.pos`.
        // Child Group is attached to Root Group.
        // Pivot logic:
        // If Child is RIGHT of Parent.
        // Parent Mesh is at (0,0) (local).
        // Joint is at (S/2, 0).
        // Child Group is attached at Joint.
        // Child Mesh is, relative to Joint, at (S/2, 0).
        // Fold rotates Child Group around Joint.

        const build = (n) => {
            const face = createFace(); // The visible square
            // We wrapper face in a "Content Group" if needed, but 'face' group is fine as the mesh carrier.

            // However, we need a structure:
            // Joint -> FaceMesh
            //       -> ChildJoint1
            //       -> ChildJoint2

            // For the Root, "Joint" is just the world placement.
            // For children, "Joint" is the hinge.

            const joint = new THREE.Group();
            // Store ref for animation
            n.jointObject = joint;
            this.joints.push({
                obj: joint,
                dir: n.directionFromParent, // 'up', 'down', 'left', 'right'
            });

            // Position the mesh relative to the joint
            // If this is root, there's no direction, so mesh is at 0,0
            if (!n.directionFromParent) {
                face.position.set(n.pos[0], n.pos[1], 0);
                // We actually want the root to effectively be at (0,0) of the whole object, 
                // and we position the whole object later.
                // So let's keep local coordinates consistent with layout for the root.

                // BUT: The recursion logic depends on hierarchical transform.
                // If we use hierarchical, we ignore `n.pos` for children, only relative pos matters.

                face.position.set(0, 0, 0);
                joint.add(face);
                // For root, we position the joint at world coordinates (or relative to container)
                joint.position.set(n.pos[0], n.pos[1], 0);
            } else {
                // If child is RIGHT of parent:
                // Joint is at Parent's local X = 0.5
                // Child Mesh is at Joint's local X = 0.5
                const dist = S / 2;
                if (n.directionFromParent === 'right') {
                    // Mesh center is +0.5 from pivot
                    face.position.set(dist, 0, 0);
                } else if (n.directionFromParent === 'left') {
                    face.position.set(-dist, 0, 0);
                } else if (n.directionFromParent === 'up') {
                    face.position.set(0, dist, 0);
                } else if (n.directionFromParent === 'down') {
                    face.position.set(0, -dist, 0);
                }
                joint.add(face);
            }

            // Recurse for children
            n.children.forEach(child => {
                const childJoint = build(child);

                // Attach childJoint to THIS face/joint system
                // Where does the childJoint attach?
                // It attaches to the Edge of THIS face.
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

                // If this is root, we added face to joint.
                // If this is child, face is added to joint.
                // So adding childJoint to joint works.
                // WAIT. If I rotate `joint`, I rotate the face AND the children attached to it? YES.
                // That's exactly what we want.

                // Special case: Root 'joint' isn't really a hinge, it's the base.
                // So if root rotates, everything rotates. (That's fine, orbit controls handles camera).

                // IMPORTANT: The "Face" mesh is attached to `joint`.
                // The `childJoint` is attached to `joint`. -> NO.
                // If `joint` rotates (hinge), the Face rotates. The children attached to Face should rotate too.
                // So yes, attach childJoint to joint.

                // But wait, the childJoint's position must be relative to the Face center? No.
                // `joint` is the Pivot Point of THIS node.
                // Face is offset from Pivot.
                // ChildJoint is on the OTHER side of the Face.
                // So ChildJoint position = Face Center + Offset to Edge.

                // Let's re-verify offsets.
                // Case: Node (Right of Parent). 
                // Parent Pivot (at Left Edge of Node).
                // Node Mesh center (at +0.5).
                // Child (Right of Node).
                // Child Pivot needs to be at Right Edge of Node.
                // Right Edge of Node = Node Mesh Center + 0.5 = +1.0 from Parent Pivot.

                // Correct. Reference frame is `joint`.

                if (!n.directionFromParent) {
                    // Root case. Mesh is at 0,0.
                    // Child 'right' needs to be at +0.5.
                    if (child.directionFromParent === 'right') childJoint.position.set(dist, 0, 0);
                    if (child.directionFromParent === 'left') childJoint.position.set(-dist, 0, 0);
                    if (child.directionFromParent === 'up') childJoint.position.set(0, dist, 0);
                    if (child.directionFromParent === 'down') childJoint.position.set(0, -dist, 0);
                } else {
                    // Child case. Mesh is at `offset` (e.g. +0.5).
                    // Next Child 'right' needs to be at Mesh + 0.5 = +1.0.
                    if (n.directionFromParent === 'right') {
                        // Current mesh at +0.5.
                        // Right child joint at +1.0.
                        // Left child joint at 0.0 (Back at pivot? No, that's impossible in tree).
                        // Up child joint at (+0.5, +0.5).
                        // Down child joint at (+0.5, -0.5).
                        const cx = dist; const cy = 0;
                        if (child.directionFromParent === 'right') childJoint.position.set(cx + dist, cy, 0);
                        // if child is left, that's the parent, impossible.
                        if (child.directionFromParent === 'up') childJoint.position.set(cx, cy + dist, 0);
                        if (child.directionFromParent === 'down') childJoint.position.set(cx, cy - dist, 0);
                    }
                    else if (n.directionFromParent === 'left') { // Mesh at -0.5
                        const cx = -dist; const cy = 0;
                        if (child.directionFromParent === 'left') childJoint.position.set(cx - dist, cy, 0);
                        if (child.directionFromParent === 'up') childJoint.position.set(cx, cy + dist, 0);
                        if (child.directionFromParent === 'down') childJoint.position.set(cx, cy - dist, 0);
                    }
                    else if (n.directionFromParent === 'up') { // Mesh at +0.5 Y
                        const cx = 0; const cy = dist;
                        if (child.directionFromParent === 'up') childJoint.position.set(cx, cy + dist, 0);
                        if (child.directionFromParent === 'right') childJoint.position.set(cx + dist, cy, 0);
                        if (child.directionFromParent === 'left') childJoint.position.set(cx - dist, cy, 0);
                    }
                    else if (n.directionFromParent === 'down') { // Mesh at -0.5 Y
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

        if (this.folding) {
            this.foldProgress += this.foldDirection * this.speed * deltaTime;
            if (this.foldProgress > 1) {
                this.foldProgress = 1;
                this.folding = false;
            }
            if (this.foldProgress < 0) {
                this.foldProgress = 0;
                this.folding = false;
            }
            this.slider.value = this.foldProgress;
            this.updateFold();
        }

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateFold() {
        // Angle = 90 deg * progress
        const angle = this.foldProgress * (Math.PI / 2);

        this.joints.forEach(j => {
            if (!j.dir) return; // Root

            // Determine axis and direction
            // We fold "UP" (towards +Z usually)
            // If child is Right (X+), axis is Y. Rotate positive or negative?
            // Right Rule: Thumb on +Y. Fingers curl Z->X. 
            // We want Z to curl towards -X (Up and In). 
            // Actually, if we fold up, the face moves from XY plane to +Z.
            // Child at Right (+X). Folds up towards -X? No, folds up to stick up at X=pivot.
            // It rotates around Y axis.

            // Let's try uniform rotation.
            if (j.dir === 'right') {
                // Axis Y. 
                // Initial normal Z. Target normal -X.
                // Rotation +90 around Y? Z -> X. No.
                // Rotation -90 around Y? Z -> -X.
                j.obj.rotation.set(0, -angle, 0);
            } else if (j.dir === 'left') {
                // Left (-X).
                // Axis Y.
                // Rotation +90 around Y? Z -> X.
                j.obj.rotation.set(0, angle, 0);
            } else if (j.dir === 'up') {
                // Up (+Y).
                // Axis X.
                // Rotation +90 around X? Z -> -Y.
                j.obj.rotation.set(angle, 0, 0);
            } else if (j.dir === 'down') {
                // Down (-Y).
                // Axis X.
                // Rotation -90 around X? Z -> Y.
                j.obj.rotation.set(-angle, 0, 0);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
