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
});
