const mediaViewer = document.getElementById("media-viewer");
const viewerFrame = document.getElementById("viewer-frame");
const viewerLabel = document.getElementById("viewer-label");
const galleryButtons = document.querySelectorAll("#media-gallery button");

if (mediaViewer && viewerFrame && viewerLabel && galleryButtons.length) {
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
        const item = mediaItems[index];

        activeMediaIndex = index;
        viewerFrame.innerHTML = "";
        viewerLabel.textContent = item.label;

        if (item.type === "video") {
            const video = document.createElement("video");
            video.src = item.src;
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
        mediaViewer.focus();
    }

    function closeViewer() {
        mediaViewer.hidden = true;
        viewerFrame.innerHTML = "";
        document.body.classList.remove("overflow-hidden");

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
        if (event.target === mediaViewer) {
            closeViewer();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (mediaViewer.hidden) return;

        if (event.key === "Escape") closeViewer();
        if (event.key === "ArrowLeft") moveViewer(-1);
        if (event.key === "ArrowRight") moveViewer(1);
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
            event.preventDefault();
            moveViewer(1);
        }
    });
}