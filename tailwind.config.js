/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}","./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { navy:"#1d3557", slateDeep:"#152238", sky:"#457b9d", snow:"#f1faee", highlight:"#e63946" },
      borderRadius: { "2xl":"1rem" }
    }
  },
  plugins: []
};