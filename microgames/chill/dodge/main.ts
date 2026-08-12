import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "dodge",
	prompt: "DODGE!",
	duration: 5.5,
	hardModeOpt: {
		duration: 6,
		prompt: "SMASH",
	},
	bgColor: "291834",
	urlPrefix: "microgames/chill/dodge/",
	iconPath: "sprites/icon.png",
	input: "arrowkeys",
	boss: false,
	hideCursor: false,
	async load(ctx) {
		return await Promise.all([
			// ctx.loadSound("music", "sounds/music.mp3"),
		]);
	},
	start(ctx) {
	},
});
