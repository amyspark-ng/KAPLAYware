import { Minigame } from "../../src/types";

const spamGame: Minigame = {
	prompt: "spam",
	author: "amyspark-ng",
	rgb: [26, 26, 26],
	duration: 6,
	urlPrefix: "/games/amyspark-ng/assets",
	load(ctx) {
		ctx.loadSprite("hexagon", "/sprites/hexagon.png");
	},
	start(ctx) {
		let score = 0;
		const SCORE_TO_WIN = ctx.difficulty == 1 ? 20 : ctx.difficulty == 2 ? 60 : ctx.difficulty == 3 ? 100 : 100;
		const game = ctx.make();

		const wait = ctx.wait(1, () => {
			console.log("WAIT FINISHED");
		});

		const scoreText = game.add([
			ctx.text("0"),
			ctx.color(ctx.rgb(255, 255, 255)),
			ctx.pos(ctx.center().x, 60),
			ctx.anchor("center"),
			ctx.scale(1),
			ctx.rotate(0),
		]);

		const hexagon = game.add([
			ctx.sprite("hexagon"),
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
			ctx.rotate(0),
			ctx.scale(),
			ctx.color(),
		]);

		ctx.onButtonPress("action", () => {
			score++;
			ctx.tween(ctx.vec2(1.5), ctx.vec2(1), 0.15, (p) => scoreText.scale = p);
			ctx.tween(score % 2 == 0 ? -10 : 10, 0, 0.15, (p) => scoreText.angle = p);
			ctx.tween(ctx.vec2(1 + (0.009 * score)), ctx.vec2(1), 0.15, (p) => hexagon.scale = p);
			scoreText.text = `${score.toString()}/${SCORE_TO_WIN}`;
		});

		ctx.onTimeout(() => {
			if (score >= SCORE_TO_WIN) {
				ctx.win();
				ctx.tween(ctx.vec2(1.25), ctx.vec2(1), 0.15, (p) => hexagon.scale = p);
				hexagon.color = ctx.rgb(99, 217, 81);
			}
			else {
				ctx.lose();
				ctx.tween(ctx.vec2(0.5), ctx.vec2(1), 0.15, (p) => hexagon.scale = p);
				hexagon.color = ctx.rgb(217, 81, 81);
			}

			ctx.wait(1, () => {
				ctx.finish();
			});
		});

		hexagon.onUpdate(() => {
			hexagon.angle = ctx.lerp(hexagon.angle, hexagon.angle + score / 8, 0.5);
		});

		return game;
	},
};

export default spamGame;
