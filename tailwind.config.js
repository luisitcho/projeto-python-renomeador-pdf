const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // =================================================== //
        // 🌸 TEMA ROSA DA SUA AMIGA (DIA DAS MULHERES) 🌸
        // Para ATIVAR, deixe essas linhas como estão.
        // Para VOLTAR AO PRETO ORIGINAL, coloque um "//" antes de "zinc:" e "black:".
        // =================================================== //
        zinc: colors.pink,  // Substitui os tons neutros por rosa Barbie
        black: '#1b020c',   // Escurece o preto para um tom de vinho super denso
      },
    },
  },
  plugins: [],
};
