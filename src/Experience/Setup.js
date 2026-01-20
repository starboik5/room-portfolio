import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CAMERA } from '../constants.js';

export function setupThreeJS(canvasSelector) {
    const canvas = document.querySelector(canvasSelector);

    // Scene
    const scene = new THREE.Scene();

    // Sizes
    const sizes = {
        width: window.innerWidth,
        height: window.innerHeight
    };

    // Camera
    const camera = new THREE.PerspectiveCamera(CAMERA.FOV, sizes.width / sizes.height, CAMERA.NEAR, CAMERA.FAR);
    camera.position.set(CAMERA.POSITION.x, CAMERA.POSITION.y, CAMERA.POSITION.z);

    // Group for Parallax Overlay
    const cameraGroup = new THREE.Group();
    cameraGroup.add(camera);
    scene.add(cameraGroup);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Controls
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enablePan = false;
    // Zoom limits
    controls.minDistance = CAMERA.MIN_DISTANCE;
    controls.maxDistance = CAMERA.MAX_DISTANCE;
    // Rotation limits
    controls.minPolarAngle = CAMERA.MIN_POLAR;
    controls.maxPolarAngle = CAMERA.MAX_POLAR;
    controls.minAzimuthAngle = CAMERA.MIN_AZIMUTH;
    controls.maxAzimuthAngle = CAMERA.MAX_AZIMUTH;

    // Responsive Camera Logic (Dynamic Scaling)
    function updateCameraPosition() {
        // 1. Calculate Ratio (Reference Width: 1170px)
        const scaleRatio = Math.min(window.innerWidth / 1170, 1);

        // 2. Apply to Camera Zoom
        // This effectively "zooms out" on smaller screens without changing position
        camera.zoom = scaleRatio;
        camera.updateProjectionMatrix();
    }

    // Initialize position
    updateCameraPosition();

    // Resize Listener
    window.addEventListener('resize', () => {
        // Update sizes
        sizes.width = window.innerWidth;
        sizes.height = window.innerHeight;

        // Update camera
        camera.aspect = sizes.width / sizes.height;
        camera.updateProjectionMatrix();

        // Update position based on new width
        updateCameraPosition();

        // Update renderer
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    return { scene, camera, cameraGroup, renderer, controls, sizes };
}
