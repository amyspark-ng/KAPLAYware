import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { DynamicPublicDirectory } from "vite-multiple-assets";

export default defineConfig({
	// index.html out file will start with a relative path for script
	base: "./",
	server: {
		port: 8000,
	},
	build: {
		// disable this for low bundle sizes
		sourcemap: true,
		rollupOptions: {
			output: {
				manualChunks: {
					kaplay: ["kaplay"],
				},
			},
		},
	},

	plugins: [
		viteSingleFile(),
		DynamicPublicDirectory(["assets/**/*", {
			input: "microgames/**",
			output: "microgames",
		}], {
			ignore: ["**/*.ts"],
		}),
	],
	define: {
		__GAME_CONFIG__: JSON.stringify({
			DEV_MICROGAME: process.env.DEV_MICROGAME === undefined
					|| process.env.DEV_MICROGAME === "null"
				? null
				: process.env.DEV_MICROGAME,

			DEV_SPEED: Number(process.env.DEV_SPEED ?? 1),

			DEV_HARD: process.env.DEV_HARD === "true",
		}),
	},
});
