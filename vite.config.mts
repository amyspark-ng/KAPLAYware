// @ts-nocheck
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { DynamicPublicDirectory } from "vite-multiple-assets";

// TODO: Remove Tauri related stuff.
const assets = ["assets/**/*", {
	input: "games/**",
	output: "games",
}];

if (process.env.CUSTOM_GAMES_PATH) {
	assets.push({
		input: process.env.CUSTOM_GAMES_PATH,
		output: "custom_games/**",
	});
}

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		viteSingleFile(),
		DynamicPublicDirectory(["assets/**/*", {
			input: "games/**",
			output: "games",
		}], {
			ignore: ["**/*.ts"],
		}) as PluginOption,
	],
	server: {
		allowedHosts: true,
		hmr: {
			// TODO: Temporary fix for neutralino will try load
			overlay: false,
		},
		port: 8000,
		strictPort: true,
	},
	publicDir: false,
	assetsInclude: [],
	build: {
		minify: "terser",
		chunkSizeWarningLimit: 10000,
		sourcemap: "hidden", // Makes it so code is obstructed on release,
	},
	define: {
		DEV_MICROGAME: process.env.DEV_MICROGAME,
		DEV_SPEED: process.env.DEV_SPEED,
		DEV_DIFFICULTY: process.env.DEV_DIFFICULTY,
	},
}));
