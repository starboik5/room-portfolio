import './style.scss';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';

import { setupThreeJS } from './Experience/Setup.js';
import { createLoadingManager } from './Utils/LoadingManager.js';
import { PATHS, COLORS, ANIMATION, CAMERA } from './constants.js';

// --- Initialization ---
const { scene, camera, cameraGroup, renderer, controls, sizes } = setupThreeJS('.experience-canvas');

// Set Initial Camera Position (Intro Start)
camera.position.set(CAMERA.INTRO.START.x, CAMERA.INTRO.START.y, CAMERA.INTRO.START.z);

// Auto-Reset Camera Logic
let cameraResetTimeout = null;

const startCameraResetTimer = () => {
    if (cameraResetTimeout) clearTimeout(cameraResetTimeout);

    // Wait 3 seconds after interaction stops, then reset
    cameraResetTimeout = setTimeout(() => {
        gsap.to(camera.position, {
            x: CAMERA.INTRO.END.x,
            y: CAMERA.INTRO.END.y,
            z: CAMERA.INTRO.END.z,
            duration: 3.5, // Slow and smooth
            ease: "power2.inOut"
        });

        // Also reset target if needed (optional, depends on if user panned)
        // gsap.to(controls.target, { ... });
    }, 2000); // 2s wait before starting return
};

controls.addEventListener('start', () => {
    if (cameraResetTimeout) clearTimeout(cameraResetTimeout);
    gsap.killTweensOf(camera.position);
});

controls.addEventListener('end', () => {
    startCameraResetTimer();
});

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

// Click-to-Enter Sequence
const enterButton = document.getElementById('enter-button');
const loadingScreen = document.getElementById('loading-screen');
const progressBar = document.querySelector('.progress-bar');
const percentageText = document.querySelector('.loading-percentage');

if (enterButton) {
    enterButton.addEventListener('click', () => {
        // 1. Play Audio
        bgMusic.play().catch(e => console.error('Audio play failed:', e));

        // 2. Camera Intro Animation
        gsap.to(camera.position, {
            x: CAMERA.INTRO.END.x,
            y: CAMERA.INTRO.END.y,
            z: CAMERA.INTRO.END.z,
            duration: 2.5,
            ease: "power2.inOut"
        });

        // 3. Direct Reveal (Fade Out Overlay)
        if (loadingScreen) {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.remove();
            }, 2500);
        }

        if (enterButton) enterButton.classList.add('hidden');
    });
}

// Audio Toggle Logic
const mediaToggle = document.getElementById('media-toggle');
const iconOn = document.querySelector('.icon-on');
const iconOff = document.querySelector('.icon-off');

if (mediaToggle && iconOn && iconOff) {
    mediaToggle.addEventListener('click', () => {
        bgMusic.muted = !bgMusic.muted;

        if (bgMusic.muted) {
            iconOn.classList.add('hidden');
            iconOff.classList.remove('hidden');
        } else {
            iconOn.classList.remove('hidden');
            iconOff.classList.add('hidden');
        }
    });
}

// Side Drawer Navigation Logic
const sideDrawer = document.getElementById('side-drawer');
const drawerClose = document.getElementById('drawer-close');
const canvasElement = document.querySelector('.experience-canvas');

// Content Sections
const contentSections = document.querySelectorAll('.drawer-section');

// Buttons
const btnAbout = document.getElementById('btn-about');
const btnSkills = document.getElementById('btn-skills');
const btnWork = document.getElementById('btn-work');
const btnContact = document.getElementById('btn-contact');

const openDrawer = (sectionId) => {
    // 1. Hide all sections
    contentSections.forEach(section => section.classList.add('hidden'));

    // 2. Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.remove('hidden');

    // 3. Open Drawer & Blur Canvas
    sideDrawer.classList.add('open');
    canvasElement.classList.add('blurred');
};

const closeDrawer = () => {
    sideDrawer.classList.remove('open');
    canvasElement.classList.remove('blurred');
};

// Event Listeners for Nav
if (sideDrawer) {
    if (btnAbout) btnAbout.addEventListener('click', (e) => { e.stopPropagation(); openDrawer('content-about'); });
    if (btnSkills) btnSkills.addEventListener('click', (e) => { e.stopPropagation(); openDrawer('content-skills'); });
    if (btnWork) btnWork.addEventListener('click', (e) => { e.stopPropagation(); openDrawer('content-work'); });
    if (btnContact) btnContact.addEventListener('click', (e) => { e.stopPropagation(); openDrawer('content-contact'); });

    // Close Button
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

    // Click Outside to Close
    document.addEventListener('click', (e) => {
        const isClickInside = sideDrawer.contains(e.target);
        // We use closest('.nav-grid') to ensure clicks on ANY nav button don't close the drawer immediately before reopening
        const isClickNav = e.target.closest('.nav-grid');

        if (!isClickInside && !isClickNav && sideDrawer.classList.contains('open')) {
            closeDrawer();
        }
    });
}

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

const updateCameraParallax = () => {
    // Current Controls State
    const currentPolar = controls.getPolarAngle();
    const currentAzimuth = controls.getAzimuthalAngle();

    // Potential Shifts
    const shiftY = mouse.x * ANIMATION.PARALLAX.INTENSITY * 0.5; // Yaw
    const shiftX = -mouse.y * ANIMATION.PARALLAX.INTENSITY * 0.5; // Pitch

    // Clamp Pitch (Polar Angle)
    let targetX = shiftX;
    // Approximating impact: if currentPolar is near limits, restrict shiftX
    if (currentPolar + shiftX < CAMERA.MIN_POLAR) targetX = Math.max(shiftX, CAMERA.MIN_POLAR - currentPolar);
    if (currentPolar + shiftX > CAMERA.MAX_POLAR) targetX = Math.min(shiftX, CAMERA.MAX_POLAR - currentPolar);

    // Clamp Yaw (Azimuth Angle)
    let targetY = shiftY;
    if (currentAzimuth + shiftY < CAMERA.MIN_AZIMUTH) targetY = Math.max(shiftY, CAMERA.MIN_AZIMUTH - currentAzimuth);
    if (currentAzimuth + shiftY > CAMERA.MAX_AZIMUTH) targetY = Math.min(shiftY, CAMERA.MAX_AZIMUTH - currentAzimuth);

    cameraGroup.rotation.y = THREE.MathUtils.lerp(cameraGroup.rotation.y, targetY, ANIMATION.PARALLAX.EASE);
    cameraGroup.rotation.x = THREE.MathUtils.lerp(cameraGroup.rotation.x, targetX, ANIMATION.PARALLAX.EASE);
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
    updateCameraParallax();

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();
