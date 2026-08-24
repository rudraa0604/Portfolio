// cursor.js
const cursor = document.querySelector('.custom-cursor');

// Only run on non-touch devices
if (window.matchMedia("(hover: hover)").matches) {
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let speed = 0.2; // Adjust for more/less lag

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateCursor() {
        // Interpolate
        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;
        
        cursor.style.left = cursorX + 'px';
        cursor.style.top = cursorY + 'px';
        
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effect for links, buttons, and clickable items using event delegation
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .btn, .project-card, .contact-item, input, textarea, select')) {
            cursor.classList.add('hovering');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .btn, .project-card, .contact-item, input, textarea, select')) {
            cursor.classList.remove('hovering');
        }
    });
}
