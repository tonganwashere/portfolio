// Injects the shared navigation bar into <nav id="site-nav">
// Also handles marking the current page's link as active

const path = window.location.pathname;

const navLinks = [
    { href: "/",          label: "Home" },
    { href: "/projects/", label: "Projects" },
    { href: "/about/",    label: "About" },
    { href: "/cv/",       label: "CV" },
];

function isActive(href) {
    if (href === "/") return path === "/";
    return path.startsWith(href);
}

const linkHTML = navLinks.map(link => {
    const active = isActive(link.href);
    const classes = active
        ? "text-primary"
        : "text-sub hover:text-primary transition-colors duration-150";
    return `<a href="${link.href}" class="${classes}">${link.label}</a>`;
}).join("\n            ");

document.getElementById("site-nav").innerHTML = `
    <div class="flex gap-6 text-base text-sub">
        ${linkHTML}
    </div>
    <div class="flex items-center gap-4 text-sub">
        <a href="https://t.me/tonganwashere" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors duration-150" aria-label="Telegram">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </a>
        <a href="https://facebook.com/TongAnWasHere" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors duration-150" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        </a>
        <a href="https://github.com/tonganwashere" target="_blank" rel="noopener noreferrer" class="hover:text-primary transition-colors duration-150" aria-label="GitHub">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </a>
        <button id="theme-toggle" class="hover:text-primary transition-colors duration-150" aria-label="Toggle theme">
            <svg id="icon-sun" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            <svg id="icon-moon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
        </button>
    </div>
`;