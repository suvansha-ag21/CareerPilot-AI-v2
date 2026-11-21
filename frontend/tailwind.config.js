const config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: "#6D5DFB",
                    secondary: "#8B7CFF",
                    hover: "#5B4BE8",
                    soft: "#EEF2FF",
                },
                surface: {
                    bg: "#F8FAFC",
                    sidebar: "#111827",
                    card: "#FFFFFF",
                    border: "#E2E8F0",
                },
                ink: {
                    DEFAULT: "#172033",
                    muted: "#64748B",
                    subtle: "#94A3B8",
                },
                status: {
                    success: "#16A34A",
                    warning: "#F59E0B",
                    danger: "#EF4444",
                },
            },
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
            },
            boxShadow: {
                card: "0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.04)",
                elevated: "0 12px 28px -6px rgba(23, 32, 51, 0.08), 0 4px 12px -4px rgba(109, 93, 251, 0.08)",
            },
        },
    },
    plugins: [],
};
export default config;
