import * as THREE from 'three';
import { ANIMATION } from '../constants.js';

/**
 * Creates and configures the Three.js LoadingManager
 * @returns {THREE.LoadingManager} Configured LoadingManager
 */
export function createLoadingManager() {
    const loadingScreen = document.getElementById('loading-screen');

    return new THREE.LoadingManager(
        // onLoad
        () => {
            console.log('All assets loaded!');
            if (loadingScreen) {
                loadingScreen.classList.add('fade-out');
                setTimeout(() => {
                    loadingScreen.remove();
                }, ANIMATION.DURATION.FADE_OUT);
            }
        },
        // onProgress
        (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Loading: ${progress.toFixed(0)}% (${itemsLoaded}/${itemsTotal})`);
        },
        // onError
        (url) => {
            console.error('Error loading:', url);
        }
    );
}
