function initMediaViewer() {
    const galleryButtons = document.querySelectorAll("#media-gallery button");
    if (!galleryButtons || !galleryButtons.length) return;

    let mediaViewer = document.getElementById("media-viewer");
    if (!mediaViewer) {
        mediaViewer = document.createElement("div");
        mediaViewer.id = "media-viewer";
        mediaViewer.setAttribute("role", "dialog");
        mediaViewer.setAttribute("aria-modal", "true");
        mediaViewer.setAttribute("aria-labelledby", "viewer-label");
        mediaViewer.className = "media-viewer fixed inset-0 z-50 px-6 py-8 sm:px-10 sm:py-10";
        mediaViewer.tabIndex = -1;
        mediaViewer.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
        mediaViewer.hidden = true;
        mediaViewer.innerHTML = `
        <button type="button" id="viewer-close" aria-label="Close viewer"
            class="absolute right-5 top-5 z-20 h-11 w-11 text-lg text-white/80 hover:text-white transition-colors duration-150 cursor-pointer">
            ✕
        </button>
        <button type="button" id="viewer-prev" aria-label="Previous media"
            class="absolute left-5 top-1/2 z-20 h-11 w-11 -translate-y-1/2 text-2xl text-white/80 hover:text-white transition-colors duration-150 cursor-pointer">
            ←
        </button>
        <button type="button" id="viewer-next" aria-label="Next media"
            class="absolute right-5 top-1/2 z-20 h-11 w-11 -translate-y-1/2 text-2xl text-white/80 hover:text-white transition-colors duration-150 cursor-pointer">
            →
        </button>
        <div class="mx-auto flex h-full max-w-6xl items-center justify-center">
            <div class="relative flex w-full flex-col items-center justify-center">
                <div id="viewer-frame" class="flex min-h-[320px] w-full items-center justify-center overflow-hidden">
                </div>
                <p id="viewer-label" aria-live="polite" class="mt-4 text-center text-base text-white">
                </p>
            </div>
        </div>
    `;
        const footer = document.getElementById("site-footer");
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(mediaViewer, footer);
        } else if (document.body) {
            document.body.appendChild(mediaViewer);
        }
    }

    const viewerFrame = document.getElementById("viewer-frame");
    const viewerLabel = document.getElementById("viewer-label");
    if (!viewerFrame || !viewerLabel) return;

    const backgroundElements = ["nav", "main", "footer"]
        .map((selector) => document.querySelector(selector))
        .filter(Boolean);

    const mediaItems = Array.from(galleryButtons).map((button, index) => {
        const media = button.querySelector("img, video");
        const type = media && media.tagName.toLowerCase() === "video" ? "video" : "image";
        const label = button.dataset.label
            || media?.getAttribute("alt")
            || media?.getAttribute("aria-label")
            || `Media ${index + 1}`;

        return {
            type,
            src: media?.getAttribute("src") || "",
            poster: media?.getAttribute("poster") || "",
            label,
        };
    });

    let activeMediaIndex = 0;
    let lastFocusedTrigger = null;

    function renderViewer(index) {
        const activeVideo = viewerFrame.querySelector("video");
        if (activeVideo) {
            activeVideo.pause();
            activeVideo.removeAttribute("src");
            activeVideo.load();
        }

        const item = mediaItems[index];

        activeMediaIndex = index;
        viewerFrame.innerHTML = "";
        viewerLabel.textContent = item.label;

        if (item.type === "video") {
            const video = document.createElement("video");
            video.src = item.src;
            video.setAttribute("aria-label", item.label);
            if (item.poster) {
                video.poster = item.poster;
            }
            video.controls = true;
            video.playsInline = true;
            video.preload = "metadata";
            video.className = "max-h-[86vh] w-full max-w-full rounded-lg";
            viewerFrame.appendChild(video);
            return;
        }

        const image = document.createElement("img");
        image.src = item.src;
        image.alt = item.label;
        image.className = "max-h-[86vh] w-auto max-w-full rounded-lg";
        viewerFrame.appendChild(image);
    }

    function openViewerAt(index) {
        lastFocusedTrigger = document.activeElement;
        renderViewer(index);
        mediaViewer.hidden = false;
        document.body.classList.add("overflow-hidden");
        backgroundElements.forEach((el) => el.setAttribute("inert", ""));
        mediaViewer.focus();
    }

    function closeViewer() {
        const activeVideo = viewerFrame.querySelector("video");
        if (activeVideo) {
            activeVideo.pause();
            activeVideo.removeAttribute("src");
            activeVideo.load();
        }

        mediaViewer.hidden = true;
        viewerFrame.innerHTML = "";
        document.body.classList.remove("overflow-hidden");
        backgroundElements.forEach((el) => el.removeAttribute("inert"));

        if (lastFocusedTrigger && typeof lastFocusedTrigger.focus === "function") {
            lastFocusedTrigger.focus();
        }
    }

    function moveViewer(direction) {
        const total = mediaItems.length;
        const nextIndex = (activeMediaIndex + direction + total) % total;
        renderViewer(nextIndex);
    }

    galleryButtons.forEach((button, index) => {
        button.addEventListener("click", () => openViewerAt(index));
    });

    document.getElementById("viewer-close")?.addEventListener("click", closeViewer);
    document.getElementById("viewer-prev")?.addEventListener("click", () => moveViewer(-1));
    document.getElementById("viewer-next")?.addEventListener("click", () => moveViewer(1));

    mediaViewer.addEventListener("click", (event) => {
        if (!event.target.closest("img, video, button, #viewer-label")) {
            closeViewer();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (mediaViewer.hidden) return;

        if (event.key === "Escape") {
            closeViewer();
            return;
        }

        if (event.key === "Tab") {
            const focusables = mediaViewer.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"]), video[controls]');
            if (focusables.length > 0) {
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (event.shiftKey) {
                    if (document.activeElement === first || document.activeElement === mediaViewer) {
                        event.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }
            return;
        }

        const isVideoActive = document.activeElement?.tagName === "VIDEO" || event.target?.tagName === "VIDEO";
        if (isVideoActive) return;

        if (event.key === "ArrowLeft") moveViewer(-1);
        if (event.key === "ArrowRight") moveViewer(1);

        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            if (event.target.tagName === "BUTTON") return;
            event.preventDefault();
            moveViewer(1);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMediaViewer);
} else {
    initMediaViewer();
}