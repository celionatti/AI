document.addEventListener("DOMContentLoaded", () => {

    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    const closeBtn = document.getElementById('close-sidebar');

    /* ==========================================
       SIDEBAR TOGGLE
    ========================================== */
    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if(closeBtn) {
        closeBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // Close sidebar when clicking outside (Mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    /* ==========================================
       ACTION MENUS (DROPDOWN)
    ========================================== */
    const actionBtns = document.querySelectorAll('.action-btn');

    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent document click from firing immediately

            // Close other open menus
            document.querySelectorAll('.action-dropdown').forEach(menu => {
                if(menu !== btn.nextElementSibling) {
                    menu.classList.remove('active');
                }
            });

            // Toggle current menu
            const dropdown = btn.nextElementSibling;
            dropdown.classList.toggle('active');
        });
    });

    // Close dropdowns when clicking anywhere else
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown').forEach(menu => {
            menu.classList.remove('active');
        });
    });
});