const toggle = document.getElementById("theme-toggle");
const sunIcon = document.getElementById("icon-sun");
const moonIcon = document.getElementById("icon-moon");

if (toggle && sunIcon && moonIcon) {
    function updateIcons() {
        const isDark = document.documentElement.classList.contains("dark");
        sunIcon.classList.toggle("hidden", isDark);
        moonIcon.classList.toggle("hidden", !isDark);
    }

    updateIcons();

    toggle.addEventListener("click", () => {
        const isDark = document.documentElement.classList.toggle("dark");
        try {
            localStorage.setItem("theme", isDark ? "dark" : "light");
        } catch (e) {}
        updateIcons();
    });
}