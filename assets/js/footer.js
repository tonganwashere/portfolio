// Injects the shared site footer into <footer id="site-footer">

const footer = document.getElementById("site-footer");
if (footer) {
    footer.innerHTML = `
        <p class="text-sm text-muted">© 2026 Hor Tongan</p>
        <p class="text-sm text-muted">
            Designed and built from scratch ·
            <a href="https://github.com/tonganwashere/portfolio" target="_blank" rel="noopener noreferrer"
                class="hover:text-primary transition-colors duration-150 underline underline-offset-4 decoration-sub hover:decoration-primary">Source on GitHub</a>
        </p>
    `;
}