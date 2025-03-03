import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/types.ts";

const transformGame: Minigame = {
	prompt: "transform",
	author: "ricjones",
	rgb: [0, 0, 0],
	urlPrefix: "games/ricjones/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
	},
	start(ctx) {
		const game = ctx.make();

		game.add([
			ctx.text("oh hi"),
			ctx.pos(100, 100)
		])

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.pos(150, 100),
		]);

		return game;
	},
};

export default transformGame;