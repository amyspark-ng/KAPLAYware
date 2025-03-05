import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types";

const getGame: Minigame = {
	prompt: "get",
	author: "amyspark-ng",
	rgb: [133, 97, 97],
	urlPrefix: "",
	load(ctx) {
	},
	start(ctx) {
		const game = ctx.make();
		const SPEED = 5 * ctx.speed;

		const bean = game.add([
			ctx.sprite("@bean"),
			ctx.pos(),
			ctx.area(),
			ctx.anchor("center"),
			ctx.scale(1.5),
		]);

		const apple = game.add([
			ctx.sprite("@apple"),
			ctx.pos(),
			ctx.area({ scale: ctx.vec2(0.5) }),
			ctx.scale(1.5),
			ctx.anchor("center"),
			"apple",
		]);

		// TODO: Fix this
		const getApplePos = () => {
			const randAngle = ctx.rand(0, 360);
			const magnitude = ctx.difficulty == 1
				? 150
				: ctx.difficulty == 2
				? 250
				: ctx.difficulty == 3
				? 350
				: 0;

			const X = ctx.center().x + magnitude * Math.cos(randAngle);
			const Y = ctx.center().y + magnitude * Math.sin(randAngle);
			return ctx.vec2(X, Y);
		};

		bean.pos = ctx.center();
		apple.pos = getApplePos();

		bean.onUpdate(() => {
			bean.pos.x = ctx.clamp(bean.pos.x, -bean.width / 2, ctx.width() + bean.width / 2);
			bean.pos.y = ctx.clamp(bean.pos.y, -bean.height / 2, ctx.height() + bean.height / 2);
		});

		ctx.onButtonDown("left", () => bean.pos.x -= SPEED);

		ctx.onButtonDown("right", () => {
			bean.pos.x += SPEED * ctx.speed;
		});

		ctx.onButtonDown("down", () => {
			bean.pos.y += SPEED * ctx.speed;
		});

		ctx.onButtonDown("up", () => {
			bean.pos.y -= SPEED * ctx.speed;
		});

		bean.onCollide("apple", () => {
			apple.destroy();
			ctx.win();
			ctx.burp().onEnd(() => {
				ctx.wait(0.1, () => {
					ctx.finish();
				});
			});
		});

		ctx.onTimeout(() => {
			if (apple.exists()) {
				bean.sprite = "@beant";
				ctx.lose();
				ctx.wait(0.5, () => ctx.finish());
			}
		});

		return game;
	},
};

export default getGame;
