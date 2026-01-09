import './style.scss';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';

import { setupThreeJS } from './Experience/Setup.js';
import { createLoadingManager } from './Utils/LoadingManager.js';
import { PATHS, COLORS, ANIMATION } from './constants.js';

// --- Initialization ---
const { scene, camera, renderer, controls, sizes } = setupThreeJS('.experience-canvas');

// --- Interaction State ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentIntersect = null;
const targetMeshes = [];

// --- Animation State ---
let clockHourHand = null;
let clockMinuteHand = null;
let clockSecondsHand = null;
let chairTop = null;
const glowingTextMeshes = [];
const glowingLogoMeshes = [];

// --- Mouse Tracking ---
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

// Touch Interaction Support
window.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        mouse.x = (event.touches[0].clientX / sizes.width) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / sizes.height) * 2 + 1;

        // Optional: Trigger raycaster immediately for tap responsiveness
        // handleRaycaster(); 
    }
}, { passive: false });

// --- Media Setup ---
// Audio
const bgMusic = document.createElement('audio');
bgMusic.src = PATHS.AUDIO_BG;
bgMusic.loop = true;
bgMusic.volume = 0.3;

const attemptAudioPlay = () => {
    bgMusic.play().catch(() => {
        const playOnInteraction = () => {
            bgMusic.play();
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
        };
        document.addEventListener('click', playOnInteraction);
        document.addEventListener('keydown', playOnInteraction);
        console.log('Audio autoplay blocked. Will play on first interaction.');
    });
};
attemptAudioPlay();

// Helper: Setup Video Element
function createVideo(path) {
    const video = document.createElement('video');
    video.src = path;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = true;
    video.style.display = 'none';
    document.body.appendChild(video);

    // Event Listeners
    video.addEventListener('loadeddata', () => {
        console.log(`Video loaded: ${path}`);
        video.play().catch(e => console.error(`Play failed for ${path}:`, e));
    });

    return video;
}

// Videos
const video1 = createVideo(PATHS.VIDEO_1);
const video2 = createVideo(PATHS.VIDEO_2);

// Video Textures
const videoTexture1 = new THREE.VideoTexture(video1);
videoTexture1.flipY = false;
videoTexture1.minFilter = THREE.LinearFilter;
videoTexture1.colorSpace = THREE.SRGBColorSpace;

const videoTexture2 = new THREE.VideoTexture(video2);
videoTexture2.flipY = false;
videoTexture2.minFilter = THREE.LinearFilter;
videoTexture2.colorSpace = THREE.SRGBColorSpace;

// --- Loaders ---
const loadingManager = createLoadingManager();
const textureLoader = new THREE.TextureLoader(loadingManager);
const dracoLoader = new DRACOLoader(loadingManager);
dracoLoader.setDecoderPath(PATHS.DRACO);

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

// --- Material Configuration Helpers ---
const configureMonitor = (child) => {
    child.material = new THREE.MeshBasicMaterial({
        map: videoTexture1,
        transparent: true,
        opacity: 0.9,
    });
    console.log('Applied monitor video');
};

const configurePainting = (child) => {
    child.material = new THREE.MeshBasicMaterial({
        map: videoTexture2,
        transparent: true,
        opacity: 0.9,
    });
    console.log('Applied painting video');
};

const configureAlpha = (child) => {
    child.material = new THREE.MeshBasicMaterial({
        map: child.material.map,
        color: new THREE.Color(COLORS.ALPHA_OBJECTS),
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide
    });
};

const configureGlowingText = (child) => {
    child.material = new THREE.MeshStandardMaterial({
        map: child.material.map,
        emissive: new THREE.Color(COLORS.TEXT_GLOW),
        emissiveIntensity: 5,
        toneMapped: false
    });
    glowingTextMeshes.push(child);
};

const configureGlowingLogo = (child) => {
    const originalMap = child.material.map;
    child.material = new THREE.MeshStandardMaterial({
        map: originalMap,
        emissiveMap: originalMap,
        emissive: new THREE.Color(COLORS.LOGO_GLOW_MULTIPLIER),
        emissiveIntensity: 1,
        toneMapped: false
    });
    glowingLogoMeshes.push(child);
};

// --- Model Loading & Traversal ---
gltfLoader.load(PATHS.MODEL, (gltf) => {
    const model = gltf.scene;
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    model.traverse((child) => {
        if (child.isMesh && child.material) {
            // Apply texture fidelity settings
            if (child.material.map) {
                child.material.map.anisotropy = maxAnisotropy;
                child.material.map.minFilter = THREE.LinearMipmapLinearFilter;
            }

            const name = child.name.toLowerCase();

            // Detect Interactive Targets
            if (name.startsWith('target_')) {
                targetMeshes.push(child);
            }

            // Material Assignment Logic
            if (name.includes('screen')) {
                configureMonitor(child);
            } else if (name.includes('painting')) {
                configurePainting(child);
            } else if (name.includes('alpha')) {
                configureAlpha(child);
            } else if (name.startsWith('text_')) {
                configureGlowingText(child);
            } else if (name.startsWith('logo_') || name.startsWith('curve022') || name.startsWith('curve023') || name.startsWith('curve024')) {
                configureGlowingLogo(child);
            } else if (name.includes('clock_hourhand')) {
                clockHourHand = child;
                child.material = new THREE.MeshBasicMaterial({ map: child.material.map });
            } else if (name.includes('clock_minutehand')) {
                clockMinuteHand = child;
                child.material = new THREE.MeshBasicMaterial({ map: child.material.map });
            } else if (name.includes('clock_secondshand')) {
                clockSecondsHand = child;
                child.material = new THREE.MeshBasicMaterial({ map: child.material.map });
            } else if (name.includes('chair_top')) {
                chairTop = child;
                child.userData.initialRotation = { y: child.rotation.y };
                child.material = new THREE.MeshBasicMaterial({ map: child.material.map });
            } else {
                // Default: Baked Lighting via MeshBasicMaterial
                child.material = new THREE.MeshBasicMaterial({
                    map: child.material.map
                });
            }
        }
    });

    scene.add(model);
});

// --- Animation Loop Handlers ---
const updateVideoTextures = () => {
    if (video1.readyState >= video1.HAVE_CURRENT_DATA) videoTexture1.needsUpdate = true;
    if (video2.readyState >= video2.HAVE_CURRENT_DATA) videoTexture2.needsUpdate = true;
};

const updateClock = () => {
    if (!clockHourHand || !clockMinuteHand || !clockSecondsHand) return;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // 20 minute offset correction
    const minuteOffset = (2.3 * Math.PI) / 3;
    const hourOffset = minuteOffset / 12;

    const hourAngle = -((hours % 12) + minutes / 60) * (Math.PI / 6) + hourOffset;
    const minuteAngle = -(minutes + seconds / 60) * (Math.PI / 30) + minuteOffset;
    const secondAngle = -seconds * (Math.PI / 30);

    clockHourHand.rotation.x = hourAngle;
    clockMinuteHand.rotation.x = minuteAngle;
    clockSecondsHand.rotation.x = secondAngle;
};

const updateGlow = (time) => {
    // Text Glow
    if (glowingTextMeshes.length > 0) {
        const min = 0.1, max = 1;
        const intensity = min + (Math.sin(time * Math.PI) + 1) * 0.5 * (max - min);
        glowingTextMeshes.forEach(mesh => mesh.material.emissiveIntensity = intensity);
    }
    // Logo Glow
    if (glowingLogoMeshes.length > 0) {
        const min = 0.5, max = 2;
        const intensity = min + (Math.sin(time * Math.PI) + 1) * 0.5 * (max - min);
        glowingLogoMeshes.forEach(mesh => mesh.material.emissiveIntensity = intensity);
    }
};

const updateChair = (time) => {
    if (chairTop) {
        const baseAmplitude = Math.PI / 8;
        const rotationOffset = baseAmplitude * Math.sin(time * 0.5) * (1 - Math.abs(Math.sin(time * 0.5)) * 0.3);
        chairTop.rotation.y = chairTop.userData.initialRotation.y + rotationOffset;
    }
};

const handleRaycaster = () => {
    raycaster.setFromCamera(mouse, camera);

    if (targetMeshes.length > 0) {
        const intersects = raycaster.intersectObjects(targetMeshes);

        if (intersects.length > 0) {
            const hitObject = intersects[0].object;
            if (currentIntersect !== hitObject) {
                // Reset previous
                if (currentIntersect) {
                    gsap.to(currentIntersect.scale, { x: 1, y: 1, z: 1, duration: ANIMATION.DURATION.HOVER_LEAVE, ease: ANIMATION.EASE.HOVER_LEAVE });
                }
                currentIntersect = hitObject;
                // Animate new
                gsap.to(currentIntersect.scale, { x: 1.2, y: 1.2, z: 1.2, duration: ANIMATION.DURATION.HOVER_ENTER, ease: ANIMATION.EASE.HOVER_ENTER });
            }
        } else {
            if (currentIntersect) {
                gsap.to(currentIntersect.scale, { x: 1, y: 1, z: 1, duration: ANIMATION.DURATION.HOVER_LEAVE, ease: ANIMATION.EASE.HOVER_LEAVE });
                currentIntersect = null;
            }
        }
    }
};

// --- Main Tick ---
const tick = () => {
    const time = performance.now() * 0.001;

    controls.update();
    updateVideoTextures();
    updateClock();
    updateGlow(time);
    updateChair(time);
    handleRaycaster();

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();
