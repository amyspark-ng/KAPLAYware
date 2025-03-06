import type { Minigame } from "../../src/types";
import { mulfokColors as palette } from "../../src/plugins/colors";

const colorGame: Minigame = {
	prompt: "color",
	author: "luizbills",
	rgb: [0, 0, 0],
	urlPrefix: "games/luizbills/assets/",
	mouse: { hidden: false },
	duration: 4,
	start(ctx) {
		const game = ctx.make();
		const possibleColors = {
			'red': palette.RED,
			'green': palette.BEAN_GREEN,
			'blue': palette.DARK_BLUE,
			'brown': palette.BROWN,
			'pink': palette.PINK
		}
		const colorNum = 3
		let done = false

		// pick 3 random colors
		const gameColors: string[] = ctx.chooseMultiple(Object.keys(possibleColors), colorNum)

		// choose a random as the correct color
		const correctColor = ctx.choose(gameColors)

		// randomize the options
		for (const [i, color] of (gameColors).entries()) {
			const y = 200 + 100 * i
			const h = 75

			const option = game.add([
				ctx.pos(ctx.width() / 2, y),
				ctx.anchor('center'),
				ctx.rect(ctx.width()/3, h, {
					radius: 10,
				}),
				ctx.color(possibleColors[color]),
				ctx.area(),
				ctx.opacity(),
				{
					colorName: color,
				}
			])

			option.tag(correctColor === color ? "correct" : "wrong")

			option.add([
				ctx.pos(0, 0),
				ctx.text(correctColor),
				ctx.anchor('center'),
				ctx.color(),
				"label"
			]);

			option.onClick(() => {
				if (done) return
				option.pos.x += 25
				end(option.colorName === correctColor)
			})
		}

		game.add([
			ctx.text(`Tap the correct "${correctColor}":`, {
				size: 30
			}),
			ctx.pos(20, 20),
		]);

		ctx.onTimeout(() => {
			if (!done) return
			end(false)
		})

		function end(victory = true) {
			done = true
			for (const wrong of game.get("wrong")) {
				wrong.color = palette.WHITE
				wrong.opacity = 0.5
				wrong.get("label")[0].color = palette.GRAY
			}
			if (victory) {
				ctx.win()
			} else {
				ctx.lose()
			}
			ctx.wait(1, () => ctx.finish());
		}

		return game;
	},
};

export default colorGame;