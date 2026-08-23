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

    // Hover effect for links and buttons
    const addHover = () => cursor.classList.add('hovering');
    const removeHover = () => cursor.classList.remove('hovering');

    document.querySelectorAll('a, button, .btn').forEach(el => {
        el.addEventListener('mouseenter', addHover);
        el.addEventListener('mouseleave', removeHover);
    });
}
