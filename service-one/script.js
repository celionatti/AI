document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       1. ANIMATION OBSERVER (Reveal on Scroll)
    ========================================== */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));


    /* ==========================================
       2. ACTIVE LINK HIGHLIGHTING
    ========================================== */
    const sections = document.querySelectorAll('section');
    const navLinksDesktop = document.querySelectorAll('.desktop-nav .nav-item');
    const navLinksMobile = document.querySelectorAll('.mobile-link');

    window.addEventListener('scroll', () => {
        let current = '';
        const offset = window.innerHeight / 3;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= (sectionTop - offset)) {
                current = section.getAttribute('id');
            }
        });

        // Update Desktop
        navLinksDesktop.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });

        // Update Mobile
        navLinksMobile.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });


    /* ==========================================
       3. PROGRESS BACK TO TOP BUTTON
    ========================================== */
    const progressPath = document.querySelector('.progress-wrap path');
    const pathLength = progressPath.getTotalLength();

    // Set up SVG Stroke
    progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
    progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.getBoundingClientRect();
    progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';

    const updateProgress = () => {
        const scroll = window.scrollY;
        const height = document.body.scrollHeight - window.innerHeight;
        const progress = pathLength - (scroll * pathLength / height);
        progressPath.style.strokeDashoffset = progress;

        // Show/Hide Button
        const offset = 50;
        if (window.scrollY > offset) {
            document.querySelector('.progress-wrap').classList.add('active-progress');
        } else {
            document.querySelector('.progress-wrap').classList.remove('active-progress');
        }
    };

    window.addEventListener('scroll', updateProgress);

    // Click to Scroll Top
    document.querySelector('.progress-wrap').addEventListener('click', (event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

});