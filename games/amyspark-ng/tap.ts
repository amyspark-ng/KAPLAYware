import { Vec2 } from "kaplay";
import { Minigame } from "../../src/game/types";
import mulfokColors from "../../src/plugins/colors";

const tapGame: Minigame = {
	prompt: "tap",
	author: "amyspark-ng",
	rgb: [0, 0, 0],
	input: { cursor: { hide: true } },
	duration: 8,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("screenframe", "sprites/tap/screenframe.png");
		ctx.loadSprite("screen", "sprites/tap/screen.png");
		ctx.loadSprite("hand", "sprites/tap/hand.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("bananas", "sprites/tap/banana.png");
		ctx.loadSound("monkey", "sounds/monkey.mp3");
		ctx.loadSound("sadmonkey", "sounds/sadmonkey.mp3");
		ctx.loadSound("buzzer", "sounds/buzzer.mp3");
	},
	start(ctx) {
		const game = ctx.make();
		const screenframe = game.add([ctx.sprite("screenframe")]);
		const screen = game.add([ctx.sprite("screen"), ctx.color(mulfokColors.VOID_PURPLE)]);
		const hand = game.add([ctx.sprite("hand"), ctx.pos(), ctx.z(1)]);

		const numbers = ctx.difficulty == 1
			? [0, 1, 2, 3, 4]
			: ctx.difficulty == 2
			? [0, 1, 2, 3, 4, 5, 6]
			: ctx.difficulty == 3
			? [0, 1, 2, 3, 4, 5, 6, 7, 8]
			: [];

		const numbersHit: number[] = [0];
		let lost = false;

		function generateGrid(rows = 8, cols = 6) {
			const grid: Vec2[] = [];

			for (let row = 0; row < rows; row++) {
				for (let col = 0; col < cols; col++) {
					const v = ctx.vec2(row * 90, col * 80);
					v.x += 70;
					v.y += 80;
					grid.push(v);
				}
			}

			return grid;
		}

		function monkeyWrong() {
			lost = true;
			ctx.play("sadmonkey", { detune: ctx.rand(-50, 50) });
			game.get("number").forEach((n) => n.destroy());
			ctx.tween(mulfokColors.DARK_RED, mulfokColors.VOID_PURPLE, 0.5 / ctx.speed, (p) => screen.color = p, ctx.easings.easeOutQuint);
			ctx.play("buzzer", { detune: ctx.rand(-50, 50) });
			ctx.lose();
			ctx.wait(0.5 / ctx.speed, () => ctx.finish());
		}

		game.onUpdate(() => {
			hand.pos = ctx.isButtonDown("click") ? ctx.mousePos().sub(0, 30) : ctx.mousePos();
			hand.frame = ctx.isButtonDown("click") ? 1 : 0;
		});

		const grid = generateGrid();
		for (let i = 0; i < numbers.length - 1; i++) {
			const cellPos = ctx.choose(grid);
			grid.splice(grid.indexOf(cellPos), 1);

			const num = i + 1;
			const number = game.add([
				ctx.rect(50, 60, { fill: false }),
				ctx.area(),
				ctx.anchor("center"),
				ctx.pos(cellPos),
				ctx.z(0),
				"number",
				{
					n: num,
				},
			]);

			number.onDraw(() => {
				ctx.drawText({
					text: num.toString(),
					color: ctx.WHITE,
					anchor: "center",
					size: 60,
				});
			});
		}

		ctx.onButtonPress("click", () => {
			for (const number of game.get("number").reverse()) {
				if (number.isHovering()) {
					if (lost) return;
					if (number.n == numbers[numbersHit.length]) {
						numbersHit.push(number.n);
						number.destroy();
						const flash = game.add([ctx.rect(50, 60), ctx.opacity(), ctx.anchor("center"), ctx.pos(number.pos)]);
						flash.fadeOut(0.35 / ctx.speed, ctx.easings.easeOutQuint).onEnd(() => {
							flash.destroy();
						});
					}
					else monkeyWrong();

					if (numbersHit.length >= numbers.length) {
						ctx.play("monkey", { detune: ctx.rand(50, 100) });
						ctx.tween(mulfokColors.BEAN_GREEN, mulfokColors.VOID_PURPLE, 0.5 / ctx.speed, (p) => screen.color = p, ctx.easings.easeOutQuint);
						ctx.win();
						ctx.wait(1 / ctx.speed, () => ctx.finish());
						const banana = game.add([
							ctx.sprite("bananas"),
							ctx.anchor("center"),
							ctx.pos(ctx.center().x, -500),
						]);

						ctx.tween(-200, ctx.center().y, 0.5 / ctx.speed, (p) => banana.pos.y = p, ctx.easings.easeOutQuint);
					}
				}
			}
		});

		ctx.onTimeout(() => {
			if (numbersHit.length < numbers.length + 1) monkeyWrong();
		});

		return game;
	},
};

export default tapGame;
