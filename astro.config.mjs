import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({ integrations: [react()], image: { service: { entrypoint: "astro/assets/services/sharp" } }, vite: { plugins: [tailwindcss()] } });
