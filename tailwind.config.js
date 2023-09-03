/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        flash: {
          "100%": { backgroundColor: "bg-slate-500" },
          "0%": { backgroundColor: "rgb(16 185 129)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
