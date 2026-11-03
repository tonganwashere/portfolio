(function () {
    'use strict';

    var STORAGE_KEY = 'tongan_font_pixel';
    var FONT_ID = 'pixel-font-link';
    var FONT_URL = 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap';

    function ensureFontLoaded() {
        if (!document.getElementById(FONT_ID)) {
            var link = document.createElement('link');
            link.id = FONT_ID;
            link.rel = 'stylesheet';
            link.href = FONT_URL;
            document.head.appendChild(link);
        }
    }

    function updateButtonUI(isPixel) {
        var btn = document.getElementById('pixel-toggle');
        if (!btn) return;
        if (isPixel) {
            btn.classList.add('text-primary');
            btn.classList.remove('text-sub');
            btn.setAttribute('aria-pressed', 'true');
            btn.title = 'Switch to default font';
        } else {
            btn.classList.remove('text-primary');
            btn.classList.add('text-sub');
            btn.setAttribute('aria-pressed', 'false');
            btn.title = 'Switch to pixel font';
        }
    }

    function setPixelMode(enable) {
        document.documentElement.classList.toggle('pixel', enable);
        try {
            localStorage.setItem(STORAGE_KEY, enable ? 'true' : 'false');
        } catch (e) {}

        if (enable) {
            ensureFontLoaded();
        }
        updateButtonUI(enable);
    }

    function init() {
        var isPixel = document.documentElement.classList.contains('pixel');
        try {
            if (!isPixel && localStorage.getItem(STORAGE_KEY) === 'true') {
                isPixel = true;
                document.documentElement.classList.add('pixel');
            }
        } catch (e) {}

        if (isPixel) {
            ensureFontLoaded();
        }

        var btn = document.getElementById('pixel-toggle');
        if (btn) {
            updateButtonUI(isPixel);
            btn.addEventListener('click', function () {
                var current = document.documentElement.classList.contains('pixel');
                setPixelMode(!current);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();