import { Microgame } from "../../src/types/Microgame";

const dontGame: Microgame = {
	name: "dont",
	prompt: "DONT'T!",
	author: "amyspark-ng",
	rgb: (ctx) => ctx.mulfok.VOID_VIOLET,
	duration: 3,
	input: "keys",
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("explosion", "sprites/dont/explosion.png", { sliceX: 7, sliceY: 1, anims: { "a": { from: 0, to: 6 } } });
		ctx.loadSprite("button", "sprites/dont/button.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("earth", "sprites/dont/earth.png");
		ctx.loadSprite("frame", "sprites/dont/frame.png");
		ctx.loadSprite("marky", "sprites/dont/marky.png");
		ctx.loadSprite("moon", "sprites/dont/moon.png");
		ctx.loadSprite("shooting", "sprites/dont/shooting.png");
		ctx.loadSprite("stars", "sprites/dont/stars.png");
		ctx.loadSound("explode", "sounds/explode.mp3");
	},
	start(ctx) {
		// positions itself
		const frame = ctx.add([ctx.sprite("frame"), ctx.z(1)]);

		const stars = ctx.add([ctx.sprite("stars"), ctx.pos()]);
		const earth = ctx.add([ctx.sprite("earth"), ctx.pos(400, 480), ctx.anchor("center"), ctx.rotate(0)]);
		const moon = ctx.add([ctx.sprite("moon"), ctx.pos(580, 290), ctx.anchor("center"), ctx.rotate(0)]);

		const button = ctx.add([
			ctx.sprite("button"),
			ctx.anchor("center"),
			ctx.pos(400, 436),
			ctx.z(2),
		]);

		function explodeEverything() {
			ctx.lose();
			ctx.flashCam(ctx.WHITE, 0.1 / ctx.speed);
			ctx.play("explode", { speed: 0.5 * ctx.speed });

			const explosion = ctx.add([
				ctx.sprite("explosion"),
				ctx.anchor("bot"),
				ctx.pos(406, 313),
			]);

			explosion.play("a", { speed: 10 * ctx.speed });
			ctx.wait(0.5 / ctx.speed, () => {
				ctx.finish();
			});
		}

		ctx.onTimeout(() => {
			if (ctx.winState != undefined) return;
			ctx.win();
			ctx.wait(0.5, () => ctx.finish());
		});

		// adds either mark or shooting star
		if (ctx.chance(0.25)) {
			if (ctx.chance(0.5)) {
				ctx.wait(1 / ctx.speed, () => {
					const shooting = ctx.add([
						ctx.sprite("shooting"),
						ctx.opacity(),
						ctx.anchor("center"),
						ctx.pos(ctx.center().add(ctx.rand(50, 100), -100 + ctx.rand(-10, 10))),
					]);

					shooting.fadeOut(0.25 / ctx.speed).onEnd(() => {
						shooting.destroy();
					});

					shooting.onUpdate(() => {
						shooting.move(-100, 0);
						if (ctx.winState == false) shooting.destroy();
					});
				});
			}
			else {
				const marky = ctx.add([
					ctx.sprite("marky"),
					ctx.pos(ctx.center().add(ctx.rand(-50, 50), ctx.rand(-100, -50))),
					ctx.anchor("center"),
					ctx.rotate(ctx.rand(90, 180)),
				]);

				let vel = ctx.vec2(-50, 0).scale(ctx.speed);
				let angle = 0.5 * ctx.speed;
				marky.onUpdate(() => {
					if (ctx.winState == false) {
						vel = ctx.lerp(vel, ctx.vec2(-200, -350).scale(ctx.speed), 0.75);
						angle = ctx.lerp(angle, 10 * ctx.speed, 0.75);
					}
					marky.move(vel);
					marky.angle -= angle * ctx.speed;
				});
			}
		}

		ctx.onUpdate(() => {
			button.frame = ctx.isButtonDown("action") ? 1 : 0;
			stars.move(-ctx.rand(5, 10) * ctx.speed, 0);
			earth.angle -= ctx.rand(0.005, 0.05) * ctx.speed;
		});
		ctx.onButtonPress("action", explodeEverything);
	},
};

export default dontGame;
