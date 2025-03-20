import { TimerController } from "kaplay";
import mulfokColors from "../../src/plugins/colors";
import { Minigame } from "../../src/types";

const flipGame: Minigame = {
	prompt: "flip",
	author: "amyspark-ng",
	rgb: mulfokColors.BURPMAN_BLUE,
	duration: 999, // 6
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
	},
	start(ctx) {
		const game = ctx.make();

		ctx.setGravity(1500);

		let posAtFlip = ctx.vec2();
		let deltaAtFlip = ctx.vec2();
		let flipping = false;

		const pan = game.add([
			ctx.rect(500, 70),
			ctx.anchor("right"),
			ctx.pos(),
			ctx.color(mulfokColors.BLACK),
			ctx.area(),
			"pan",
		]);

		const cake = game.add([
			ctx.rect(400, 50),
			ctx.anchor("center"),
			ctx.pos(),
			ctx.color(mulfokColors.YELLOW),
			ctx.rotate(),
			ctx.area(),
		]);

		game.onUpdate(() => {
			pan.pos = ctx.mousePos();

			if (!flipping) {
				cake.pos.x = pan.pos.x - cake.width / 2;
				cake.pos.y = pan.pos.y - cake.height;
				cake.angle = 0;

				if (ctx.mouseDeltaPos().y <= -40) {
					ctx.debug.log("FLIPPED");
					flipping = true;
					// cake.area.scale = ctx.vec2(0);

					ctx.tween(cake.angle, ctx.mouseDeltaPos().x > 1 ? 180 : -180, 0.5 / ctx.speed, (p) => cake.angle = p);
					ctx.tween(pan.pos.y, pan.pos.y + 10 * ctx.mouseDeltaPos().y, 0.5 / ctx.speed, (p) => cake.pos.y = p, ctx.easings.easeOutExpo).onEnd(() => {
						const fallTween = ctx.tween(cake.pos.y, pan.pos.y, 0.5 / ctx.speed, (p) => cake.pos.y = p, ctx.easings.easeOutExpo);
						cake.onCollide("pan", () => {
							fallTween.cancel();
							flipping = false;
						});
					});
				}
			}
		});

		return game;
	},
};

export default flipGame;
