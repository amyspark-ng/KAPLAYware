import { Minigame } from "../../src/game/types.ts";

const colorGame: Minigame = {
	prompt: "CHOOSE!",
	author: "luizbills",
	rgb: [0, 0, 0],
	urlPrefix: "games/luizbills/assets/",
	input: "mouse",
	duration: 4,
	colorDependant: true,
	load(ctx) {
		ctx.loadSound("correct", "sounds/applause.ogg");
	},
	// TODO: Do the remake
	start(ctx) {
		const possibleColors = {
			"red": ctx.mulfok.RED,
			"green": ctx.mulfok.BEAN_GREEN,
			"blue": ctx.mulfok.DARK_BLUE,
			"brown": ctx.mulfok.BROWN,
			"pink": ctx.mulfok.PINK,
		};
		const qty = Math.min(4, ctx.difficulty + 1);
		const hasLabels = ctx.difficulty >= 2;

		let done = false;

		// pick 3 random colors
		const gameColors: string[] = ctx.chooseMultiple(Object.keys(possibleColors), qty);

		// choose a random as the correct color
		const correctColor = ctx.choose(gameColors);

		// randomize the options
		const colorNames = Array.from(gameColors);
		if (ctx.difficulty >= 3) {
			ctx.shuffle(colorNames);
		}

		let i = qty;
		while (gameColors.length > 0) {
			const color = gameColors.pop();
			const name = colorNames.pop();

			i--;

			const y = (250 - 50 * (ctx.difficulty - 1)) + 100 * i;
			const h = 75;

			const option = ctx.add([
				ctx.pos(ctx.width() / 2, y),
				ctx.anchor("center"),
				ctx.rect(ctx.width() / 3, h, {
					radius: 10,
				}),
				// @ts-ignore
				ctx.color(possibleColors[color]),
				ctx.area(),
				ctx.opacity(),
				ctx.outline(4, ctx.mulfok.WHITE),
				{
					colorName: color,
				},
			]);

			option.tag(correctColor === color ? "correct" : "wrong");

			if (hasLabels) {
				option.add([
					ctx.pos(0, 0),
					ctx.text(ctx.difficulty >= 3 ? name : correctColor),
					ctx.anchor("center"),
					ctx.color(),
					"label",
				]);
			}

			option.onClick(() => {
				if (done) return;
				option.pos.x += 25;
				end(option.colorName === correctColor);
			});
		}

		ctx.add([
			ctx.text(`Choose the "${correctColor}" color:`, {
				size: 30,
			}),
			ctx.pos(20, 20),
		]);

		ctx.onTimeout(() => {
			if (!done) return;
			end(false);
		});

		function end(victory = true) {
			done = true;
			for (const wrong of ctx.get("wrong")) {
				wrong.color = ctx.mulfok.WHITE;
				wrong.opacity = 0.5;
				if (hasLabels) {
					wrong.get("label")[0].color = ctx.mulfok.GRAY;
				}
			}
			if (victory) {
				ctx.play("correct", {
					speed: 1.25 * ctx.speed,
				});
				ctx.win();
			}
			else {
				ctx.burp();
				ctx.lose();
			}
			ctx.wait(1 / ctx.speed, () => ctx.finish());
		}
	},
};

export default colorGame;
