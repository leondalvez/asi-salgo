/**
 * Prototipo Línea B — fondo generativo + entrada GSAP.
 * Solo exploración visual; no reemplaza el flujo principal.
 */

function iniciarCanvas() {
    const canvas = document.querySelector('#canvas-fondo');
    if (!canvas) return null;

    const ctx = canvas.getContext('2d');
    let ancho = 0;
    let alto = 0;
    let tiempo = 0;
    let frame = 0;

    const blobs = [
        { x: 0.2, y: 0.3, r: 0.22, color: '#79c995', speed: 0.00035 },
        { x: 0.75, y: 0.2, r: 0.18, color: '#d98c7d', speed: 0.00028 },
        { x: 0.55, y: 0.72, r: 0.2, color: '#a99ac7', speed: 0.00031 }
    ];

    function redimensionar() {
        ancho = window.innerWidth;
        alto = window.innerHeight;
        canvas.width = ancho;
        canvas.height = alto;
    }

    function dibujar() {
        ctx.clearRect(0, 0, ancho, alto);
        tiempo += 1;

        for (const blob of blobs) {
            const cx = (blob.x + Math.sin(tiempo * blob.speed * 1000) * 0.06) * ancho;
            const cy = (blob.y + Math.cos(tiempo * blob.speed * 900) * 0.05) * alto;
            const radio = blob.r * Math.min(ancho, alto);

            const gradiente = ctx.createRadialGradient(cx, cy, 0, cx, cy, radio);
            gradiente.addColorStop(0, blob.color + '55');
            gradiente.addColorStop(1, blob.color + '00');

            ctx.fillStyle = gradiente;
            ctx.beginPath();
            ctx.arc(cx, cy, radio, 0, Math.PI * 2);
            ctx.fill();
        }

        frame = requestAnimationFrame(dibujar);
    }

    redimensionar();
    dibujar();
    window.addEventListener('resize', redimensionar);

    return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', redimensionar);
    };
}

function animarEntrada() {
    if (!window.gsap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    gsap.from('.exploracion__hero', {
        y: 28,
        opacity: 0,
        duration: 0.7,
        ease: 'power2.out'
    });

    gsap.from('.exploracion__card', {
        y: 22,
        opacity: 0,
        duration: 0.55,
        stagger: 0.1,
        delay: 0.15,
        ease: 'power2.out'
    });
}

function enlazarCards() {
    document.querySelectorAll('.exploracion__card').forEach((card) => {
        card.addEventListener('click', () => {
            const energia = card.dataset.energia;
            window.location.href = `index.html?exploracion=${energia}`;
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    iniciarCanvas();
    animarEntrada();
    enlazarCards();
});
