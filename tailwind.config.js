// tailwind.config.js
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                "primary": "#13ec13",
                "background-light": "#f6f8f6",
                "background-dark": "#102210",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: {
                "lg": "0.5rem",
                "xl": "0.75rem",
            },
        },
    },
    plugins: [],
}
