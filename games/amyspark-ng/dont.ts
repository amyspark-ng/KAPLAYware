import { assets } from "@kaplayjs/crew";
import mulfokColors from "../../src/plugins/colors";
import { Minigame } from "../../src/types";

const dontGame: Minigame = {
	prompt: "don't",
	author: "amyspark-ng",
	rgb: mulfokColors.DARK_BLUE,
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("button", "sprites/button.png", {
			sliceX: 2,
			sliceY: 1,
			anims: {
				"pressed": 0,
				"dont": 1,
			},
		});
		ctx.loadSound("explode", "sounds/explode.mp3");
	},
	start(ctx) {
		const game = ctx.make();
		let hasWon = true;

		const button = game.add([
			ctx.sprite("button", { anim: "dont" }),
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
		]);

		// oh no you didn't!!
		function Did() {
			hasWon = false;
			ctx.lose();
			ctx.wait(1.5, () => ctx.finish());

			button.play("pressed");
			ctx.wait(0.1, () => {
				button.play("dont");

				let explosions = 0;
				let time = 0.1;
				game.onUpdate(() => {
					time -= ctx.dt();
					if (time <= 0) {
						if (explosions >= 35) return;
						ctx.play("explode", { volume: 0.5 });
						ctx.addKaboom(ctx.vec2(ctx.rand(0, ctx.width()), ctx.rand(0, ctx.height())), { scale: 1 + 0.5 * explosions });
						explosions++;
						time = 0.25 - 0.05 * explosions;
					}
				});
			});
		}

		ctx.onTimeout(() => {
			if (!hasWon) return;
			ctx.win();
			ctx.wait(0.5, () => ctx.finish());
		});

		ctx.onButtonPress("action", Did);
		return game;
	},
};

export default dontGame;
