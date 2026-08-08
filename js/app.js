document.addEventListener('DOMContentLoaded', () => {
    // 1. Zentrale BMZ instanziieren
    const bmz = new BMZ();

    // 2. UI-Komponenten instanziieren
    const fat = new FAT(bmz);
    const fbf = new FBF(bmz);
    const admin = new AdminUI(bmz);

    // 3. Komponenten als Subscriber registrieren
    bmz.subscribe((state) => fat.render(state));
    bmz.subscribe((state) => fbf.render(state));
    bmz.subscribe((state) => admin.render(state));

    // Vollbild-Button Logik
    const btnFullscreen = document.getElementById('btn-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        });
    }

    // Service Worker Registrierung
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

});
