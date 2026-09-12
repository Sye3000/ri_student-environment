(function () {
  const hamburger = document.getElementById("hamburgerBtn");
  const drawer = document.getElementById("sidebarDrawer");
  const overlay = document.getElementById("sidebarOverlay");
  const closeBtn = document.getElementById("sidebarClose");

  if (!hamburger || !drawer || !overlay) return;

  function openSidebar() {
    drawer.classList.add("open");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", openSidebar);
  closeBtn?.addEventListener("click", closeSidebar);
  overlay.addEventListener("click", closeSidebar);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSidebar();
  });
})();

(function () {
  const icons = {
    cafe: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 3h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V3Z"/>
        <path d="M17 8h2a3 3 0 0 1 0 6h-2"/>
        <path d="M5 21h12"/>
      </svg>
    `,
    store: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8Z"/>
        <path d="M9 8V6a3 3 0 1 1 6 0v2"/>
        <path d="M9 12h6"/>
      </svg>
    `,
    lost: `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6"/>
        <path d="m16 16 5 5"/>
        <path d="M11 8v3"/>
        <path d="M11 14h.01"/>
      </svg>
    `
  };

  document.querySelectorAll(".sidebar-link").forEach((link) => {
    const iconSlot = link.querySelector(".sidebar-icon");
    if (!iconSlot || iconSlot.querySelector("svg")) return;

    const label = (link.textContent || "").toLowerCase();
    let svg = icons.cafe;

    if (label.includes("store")) {
      svg = icons.store;
    } else if (label.includes("lost") || label.includes("found")) {
      svg = icons.lost;
    }

    iconSlot.innerHTML = svg;
  });
})();