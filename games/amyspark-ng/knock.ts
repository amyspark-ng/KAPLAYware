import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types";

const newGame: Minigame = {
	prompt: "knock",
	mouse: { hidden: false },
	author: "amyspark-ng",
	rgb: [74, 48, 82],
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSound("knock", "sounds/knock.ogg");
	},
	start(ctx) {
		const game = ctx.make();
		let knocksLeft = ctx.difficulty == 1 ? 3 : ctx.difficulty == 2 ? 6 : ctx.difficulty == 3 ? 10 : 10;
		let hasWon = false;

		const door = game.add([
			ctx.sprite("@door"),
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
			ctx.scale(2),
			ctx.area(),
		]);

		door.onClick(() => {
			if (!door.isHovering()) return;

			if (knocksLeft > 0) {
				knocksLeft--;
				ctx.play("knock");
				return;
			}
			else if (knocksLeft == 0) {
				if (hasWon) return;
				if (!hasWon) hasWon = true;
				door.destroy();

				const bean = game.add([
					ctx.sprite("@bean"),
					ctx.pos(ctx.center()),
					ctx.scale(3),
					ctx.anchor("center"),
				]);

				const WHATTEXT = game.add([
					ctx.text("WHAT"),
					ctx.pos(bean.pos.add(0, bean.height)),
				]);

				ctx.win();

				ctx.wait(1, () => {
					ctx.finish();
				});
			}
		});

		ctx.onTimeout(() => {
			if (hasWon) return;

			if (knocksLeft > 0) {
				ctx.lose();
				ctx.wait(1, () => {
					ctx.finish();
				});
			}
		});

		return game;
	},
};

export default newGame;
