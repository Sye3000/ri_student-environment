/* Part 3: Hiking gallery lightbox */
document.addEventListener("DOMContentLoaded", () => {
    const slides = Array.from(document.querySelectorAll(".hiking-slide"));
    if (!slides.length) return;

    let currentIndex = 0;
    let lastFocused = null;

    const overlay = document.createElement("div");
    overlay.className = "hiking-lightbox";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Hiking photo gallery");

    const image = document.createElement("img");
    image.className = "hiking-lightbox-image";

    const caption = document.createElement("p");
    caption.className = "hiking-lightbox-caption";

    const close = document.createElement("button");
    close.type = "button";
    close.className = "hiking-lightbox-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close gallery");

    const previous = document.createElement("button");
    previous.type = "button";
    previous.className = "hiking-lightbox-previous";
    previous.textContent = "‹";
    previous.setAttribute("aria-label", "Previous photo");

    const next = document.createElement("button");
    next.type = "button";
    next.className = "hiking-lightbox-next";
    next.textContent = "›";
    next.setAttribute("aria-label", "Next photo");

    overlay.append(close, previous, image, next, caption);
    document.body.appendChild(overlay);

    function showPhoto(index) {
        currentIndex = (index + slides.length) % slides.length;

        const source = slides[currentIndex].querySelector("img");
        if (!source) return;

        image.src = source.currentSrc || source.src;
        image.alt = source.alt || "Hiking programme photograph";
        caption.textContent = image.alt;

        if (typeof showHikingSlide === "function") {
            showHikingSlide(currentIndex);
        }
    }

    function openGallery(index) {
        lastFocused = slides[index];
        showPhoto(index);
        overlay.hidden = false;
        document.body.classList.add("hiking-lightbox-open");
        close.focus();
    }

    function closeGallery() {
        overlay.hidden = true;
        document.body.classList.remove("hiking-lightbox-open");
        if (lastFocused) lastFocused.focus();
    }

    slides.forEach((slide, index) => {
        slide.addEventListener("click", event => {
            event.preventDefault();
            openGallery(index);
        });
    });

    close.addEventListener("click", closeGallery);
    previous.addEventListener("click", () => showPhoto(currentIndex - 1));
    next.addEventListener("click", () => showPhoto(currentIndex + 1));

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeGallery();
    });

    document.addEventListener("keydown", event => {
        if (overlay.hidden) return;

        if (event.key === "Escape") closeGallery();
        if (event.key === "ArrowLeft") showPhoto(currentIndex - 1);
        if (event.key === "ArrowRight") showPhoto(currentIndex + 1);
    });
});
