import * as THREE from 'three';

export const COLORS = {
    BACKGROUND: '#1a1a2e',
    ALPHA_OBJECTS: 0x333333,
    TEXT_GLOW: 0xEFF2F1,
    LOGO_GLOW_MULTIPLIER: 0xffffff
};

export const PATHS = {
    MODEL: '/models/room.glb',
    DRACO: '/draco/',
    VIDEO_1: '/video/video1.mp4',
    VIDEO_2: '/video/video2.mp4',
    AUDIO_BG: '/audio/background.mp3',
    TEXTURE_PAINTING: '/textures/unnamed.png' // Only if used fallback
};

export const ANIMATION = {
    DURATION: {
        HOVER_ENTER: 0.5,
        HOVER_LEAVE: 0.5,
        FADE_OUT: 2000
    },
    EASE: {
        HOVER_ENTER: "back.out(1.7)",
        HOVER_LEAVE: "power2.out"
    },
    PARALLAX: {
        INTENSITY: 0.25,
        EASE: 0.2 // Lerp factor
    }
};

export const CAMERA = {
    FOV: 20,
    NEAR: 0.1,
    FAR: 100,
    POSITION: { x: 5.00, y: 1.40, z: 4.00 }, // Default/Target Position
    INTRO: {
        START: { x: 6.55, y: 0.00, z: 7.60 },
        END: { x: 5.00, y: 1.40, z: 4.00 }
    },
    MIN_DISTANCE: 4,
    MAX_DISTANCE: 10,
    MIN_POLAR: 0,
    MAX_POLAR: Math.PI / 2,
    MIN_AZIMUTH: 0,
    MAX_AZIMUTH: Math.PI / 2
};
