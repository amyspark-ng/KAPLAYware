import { Minigame } from "../../src/game/types";

const testGame: Minigame = {
	prompt: "test",
	author: "amyspark-ng",
	rgb: [0, 0, 0],
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {},
	start(ctx) {
		const text = ctx.add([
			ctx.text(ctx.timeLeft.toString(), { align: "center" }),
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
		]);

		ctx.onUpdate(() => {
			text.text = ctx.timeLeft.toString();
		});

		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(),
		]);

		ctx.onClick(() => {
			ctx.addConfetti({ pos: ctx.mousePos() });
		});

		ctx.onTimeout(() => {
			bean.pos = ctx.center();
			bean.sprite = "@beant";
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});
	},
};

export default testGame;
