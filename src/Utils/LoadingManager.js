import * as THREE from 'three';
import { ANIMATION } from '../constants.js';

/**
 * Creates and configures the Three.js LoadingManager
 * @returns {THREE.LoadingManager} Configured LoadingManager
 */
export function createLoadingManager() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.querySelector('.progress-bar');
    const percentageText = document.querySelector('.loading-percentage');

    return new THREE.LoadingManager(
        // onLoad
        () => {
            console.log('All assets loaded!');

            // 1. Complete Bar Width (just in case)
            if (progressBar) progressBar.style.width = '100%';
            if (percentageText) percentageText.textContent = '100%';

            // 2. Reveal Enter & Dissolve Bar
            setTimeout(() => {
                const enterButton = document.getElementById('enter-button');

                // Dissolve Bar & Text
                if (progressBar) progressBar.classList.add('fade-out');
                if (percentageText) percentageText.classList.add('hidden');

                // Show Button
                if (enterButton) enterButton.classList.remove('hidden');
            }, 500);
        },
        // onProgress
        (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (percentageText) percentageText.textContent = `${Math.round(progress)}%`;
        },
        // onError
        (url) => {
            console.error('Error loading:', url);
        }
    );
}
