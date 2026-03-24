// tailwind.config.js
module.exports = {
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: {
                    dark: '#0d1117',
                },
                surface: '#161b22',
                border: '#30363d',
                primary: '#3fb950', // GitHub contribution green
                warning: '#f0883e', // At-risk amber
                broken: '#6e7681',  // Broken grey
                text: {
                    primary: '#e6edf3',
                    secondary: '#8b949e',
                }
            },
            fontFamily: {
                mono: ['JetBrainsMono-Bold', 'monospace'], // Suggest installing this font
                sans: ['Geist-Regular', 'sans-serif'],    // Suggest installing this font
            },
        },
    },
};