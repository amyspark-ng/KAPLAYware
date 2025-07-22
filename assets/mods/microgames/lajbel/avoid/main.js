/** @type {import("../../../../../src/types/Microgame").Microgame} */
const avoidGame = {
	prompt: "TEST MOD!",
	name: "test",
	pack: "",
	author: "lajbel",
	rgb: (ctx) => ctx.mulfok.BLUE,
	duration: 6,
	input: "keys",
	urlPrefix: "",
	load(ctx) {
		ctx;
	},
	start(ctx) {
		ctx.add([
			ctx.sprite("@bean"),
		]);

		ctx.onClick(() => {
			ctx.win();
			ctx.finish();
		});
	},
};

export default avoidGame;
