import { createMicrogame } from "../../../src/registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "sort",
	prompt: "SORT!",
	duration: 7,
	bgColor: "6bc96c",
	urlPrefix: "microgames/chill/sort/",
	load(ctx) {
	},
	start(ctx) {
		const game = ctx.add([ctx.timer()]);
		ctx.setResult("win");
		game.wait(1, () => ctx.finishGame());
	},
});
