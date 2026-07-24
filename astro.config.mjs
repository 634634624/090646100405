import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

let devComponentIdPlugin;
try {
    ({ devComponentIdPlugin } = await import("./.phantomwp/ide/dev-tools.mjs"));
} catch {
    devComponentIdPlugin = () => ({
        name: "phantom-dev-tools-noop",
        apply: "serve",
    });
}

export default defineConfig({
    integrations: [react()],
    image: {
        service: { entrypoint: "astro/assets/services/sharp" },
    },
    server: {
        host: true,
        allowedHosts: [".app.github.dev", ".fly.dev"],
    },
    devToolbar: { enabled: false },
    vite: {
        plugins: [tailwindcss(), devComponentIdPlugin()],
        server: {
            allowedHosts: ["localhost", ".app.github.dev", ".fly.dev"],
            headers: {
                "Content-Security-Policy": "frame-ancestors *",
            },
            hmr: {
                clientPort: 443,
                protocol: "wss",
            },
            watch: {
                ignored: [
                    "**/node_modules/**",
                    "**/.git/**",
                    "**/dist/**",
                    "**/.output/**",
                ],
            },
        },
    },
});
