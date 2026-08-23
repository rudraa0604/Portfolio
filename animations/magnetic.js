// magnetic.js
if (window.matchMedia("(hover: hover)").matches) {
    const magneticElements = document.querySelectorAll('.btn, .logo-text');

    magneticElements.forEach((el) => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            // Calculate distance from center of element
            const h = rect.width / 2;
            const w = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - w;

            // Move element slightly towards cursor (magnetic pull)
            gsap.to(el, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.4,
                ease: "power2.out"
            });
        });

        el.addEventListener('mouseleave', () => {
            // Spring back to center
            gsap.to(el, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
}
