import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../../src/types.ts";

const transformGame: Minigame = {
	prompt: "transform",
	author: "ricjones",
	rgb: [74, 48, 82],  // rgb for #4a3052 from mulfok32 palette
	urlPrefix: "games/ricjones/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("left", "/left.png");
		ctx.loadSprite("right", "/right.png");
		ctx.loadSprite("up", "/up.png");
		ctx.loadSprite("down", "/down.png");
	},
	start(ctx) {
		const game = ctx.make();

		// checking box for the transform
		game.add([
			ctx.rect(200, 100, {fill: false}),
			ctx.pos(ctx.width()/2, ctx.height()*0.18),
			ctx.anchor("center"),
			ctx.area(),
			ctx.outline(2, ctx.RED)
		])

		const spawnPointLeft = ctx.vec2(0, ctx.height()*0.18)
		const spawnPointRight = ctx.vec2(ctx.width(), ctx.height()*0.18)

		// spawn button sprites
		const left_com = game.add([
			ctx.sprite("up"),
			ctx.anchor("left"),
			ctx.pos(spawnPointLeft)
		])

		const right_com = game.add([
			ctx.sprite("up"),
			ctx.anchor("right"),
			ctx.pos(spawnPointRight)
		])

		const bean = game.add([
			ctx.sprite("bean"),
			ctx.anchor("center"),
			ctx.pos(ctx.width()/2, ctx.height()*0.8),
			ctx.scale(1)
		]);

		return game;
	},
};

export default transformGame;