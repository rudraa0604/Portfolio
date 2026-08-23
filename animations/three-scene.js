// css-3d-scene.js (Replaced three-scene.js)

// Expose a global initialization function to be called after data is fetched
window.initThreeBackground = function(backgroundUrl) {
    const bgImg = document.getElementById('bg-gif');

    if (!bgImg) return;
    
    // Set the dynamic source
    bgImg.src = backgroundUrl || 'ezgif.com-gif-maker.gif';

    // 3D tilt effect temporarily disabled by user request. 
    // The image will remain a static full-screen background (the GIF will still play).
    /*
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
        ...
    }
    */
};
