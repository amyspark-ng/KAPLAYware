import { Minigame } from "../../src/types/Minigame";

const testGame: Minigame = {
	name: "test",
	author: "amyspark-ng",
	prompt: "TEST!",
	input: "keys",
	rgb: [255, 255, 255],
	duration: 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("kasquare", "sprites/kasquare.png");
	},
	start(ctx) {
		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(ctx.center().x + 50, 0),
			"bean",
		]);

		const ghosty = ctx.add([
			ctx.sprite("@ghosty"),
			ctx.pos(ctx.center()),
			ctx.fixed(),
		]);

		bean.on("eventName", (param) => {
			ctx.debug.log("Left trigged, param: " + param);
		});

		// draw overload works
		ctx.onDraw("*", (obj) => {
			if (!obj.width) return;

			ctx.drawText({
				text: ctx.vec2(obj.width, obj.height).toString(),
			});

			ctx.drawCircle({
				radius: 5,
				color: ctx.BLUE,
			});
		});

		ctx.onDraw(() => {
			ctx.drawSprite({
				sprite: "kasquare",
			});
		});

		ctx.onButtonPress("left", () => {
			bean.trigger("eventName", true);
		});

		ctx.onButtonPress("action", () => {
			ctx.lose();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});

		const timeText = ctx.add([
			ctx.text(""),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
		]);

		ctx.onUpdate(() => {
			timeText.text = `${ctx.timeLeft.toFixed(1)} / ${ctx.duration.toFixed(1)}`;
		});

		// this runs before the game even starts, bruh
		ctx.wait(1, () => {
			ctx.debug.log("finished waiting");
		});

		ctx.onUpdate(() => {
			// ctx.debug.log("im alive!!!");

			ctx.setRGB(ctx.lerp(ctx.getRGB(), ctx.winState == true ? ctx.mulfok.GREEN : ctx.winState == false ? ctx.mulfok.RED : ctx.WHITE, 0.5));

			const angle = (ctx.time() * ctx.speed) % 360;
			const spinCamera = ctx.vec2(40 * Math.cos(angle), 40 * Math.sin(angle));
			ctx.setCamPos(ctx.center().add(spinCamera));
		});

		// TODO: add more things to test, music, events, onDraw overloads, winState, etc

		ctx.onTimeout(() => {
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});

		ctx.onClick(() => {
			ctx.flashCam(ctx.GREEN, 0.5);
			if (ctx.winState != undefined) return;
			ctx.win();
			ctx.wait(1, () => {
				ctx.finish();
			});
		});
	},
};

export default testGame;
