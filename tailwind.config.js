module.exports = {
    content: ["./**/*.html", "./assets/js/**/*.js"],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            colors: {
                base: "var(--color-base)",
                surface: "var(--color-surface)",
                line: "var(--color-line)",
                muted: "var(--color-muted)",
                primary: "var(--color-primary)",
                sub: "var(--color-sub)",
            },
        },
    },
};