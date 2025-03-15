import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types";

const getGame: Minigame = {
	prompt: "get",
	author: "amyspark-ng",
	rgb: [133, 97, 97],
	start(ctx) {
		const game = ctx.make();
		const SPEED = 300 * ctx.speed;

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
				? 300
				: 0;

			const X = ctx.center().x + magnitude * Math.cos(randAngle);
			const Y = ctx.center().y + magnitude * Math.sin(randAngle);
			return ctx.vec2(X, Y);
		};

		bean.pos = ctx.center();
		apple.pos = getApplePos();

		const movement = ctx.vec2();
		let lerpMovement = ctx.vec2();
		bean.onUpdate(() => {
			bean.pos.x = ctx.clamp(bean.pos.x, -bean.width / 2, ctx.width() + bean.width / 2);
			bean.pos.y = ctx.clamp(bean.pos.y, -bean.height / 2, ctx.height() + bean.height / 2);

			// this is to prevent bean going faster on diagonal movement
			movement.x = ctx.isButtonDown("left") ? -1 : ctx.isButtonDown("right") ? 1 : 0;
			movement.y = ctx.isButtonDown("up") ? -1 : ctx.isButtonDown("down") ? 1 : 0;

			// this just lerps a movement to the unit, which rounds that 1.4 to 1 :thumbsup:
			lerpMovement = ctx.lerp(lerpMovement, movement.unit().scale(SPEED), 0.75);
			bean.move(lerpMovement);
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
