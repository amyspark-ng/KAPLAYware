import { createMicrogame } from "../../../src/registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "dont",
	prompt: "DON'T!",
	duration: 4,
	hardModeOpt: {
		duration: 5,
	},
	bgColor: "1f102a",
	urlPrefix: "microgames/chill/dont/",
	load(ctx) {
		ctx.loadSprite("explosion", "sprites/explosion.png", { sliceX: 7, sliceY: 1, anims: { "a": { from: 0, to: 6 } } });
		ctx.loadSprite("button", "sprites/button.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("earth", "sprites/earth.png");
		ctx.loadSprite("frame", "sprites/frame.png");
		ctx.loadSprite("marky", "sprites/marky.png");
		ctx.loadSprite("moon", "sprites/moon.png");
		ctx.loadSprite("shooting", "sprites/shooting.png");
		ctx.loadSprite("stars", "sprites/stars.png");
		ctx.loadSprite("clock", "sprites/clock.png");
		ctx.loadSprite("line", "sprites/line.png");
		ctx.loadSprite("panel", "sprites/panel.png");
		ctx.loadSprite("cables", "sprites/cables.png");

		ctx.loadSprite("sign", "sprites/sign.png");

		ctx.loadSound("music", "sounds/music.ogg");
		ctx.loadSound("tick", "sounds/tick.ogg");
		ctx.loadSound("explode", "../../assets/sounds/explode.mp3");
	},
	start(ctx) {
		ctx.play("music");
		const game = ctx.add([ctx.timer()]);
		const frame = ctx.add([ctx.sprite("frame"), ctx.z(1)]);

		const stars = ctx.add([ctx.sprite("stars"), ctx.pos()]);
		const earth = ctx.add([ctx.sprite("earth"), ctx.pos(400, 480), ctx.anchor("center"), ctx.rotate(0)]);
		const moon = ctx.add([ctx.sprite("moon"), ctx.pos(580, 290), ctx.anchor("center"), ctx.rotate(0)]);
		const clock = ctx.add([ctx.sprite("clock"), ctx.pos(675, 404), ctx.anchor("center"), ctx.z(2)]);
		ctx.add([ctx.sprite("cables"), ctx.pos(111, 71), ctx.anchor("center"), ctx.z(2)]);
		ctx.add([ctx.sprite("panel"), ctx.pos(151, 460), ctx.anchor("center"), ctx.z(2)]);

		const button = ctx.add([
			ctx.sprite("button"),
			ctx.anchor("center"),
			ctx.pos(400, 436),
			ctx.z(2),
		]);

		function explodeEverything() {
			if (ctx.getResult() == "lose") return;
			ctx.setResult("lose");
			ctx.flash(ctx.WHITE, 0.2 / ctx.speed);
			ctx.play("explode", { speed: 0.5 * ctx.speed });

			const explosion = ctx.add([
				ctx.sprite("explosion"),
				ctx.anchor("bot"),
				ctx.pos(406, 313),
			]);

			explosion.play("a", { speed: 10 * ctx.speed });
			game.wait(0.5 / ctx.speed, () => {
				ctx.finishGame();
			});
		}

		ctx.onTimeout(() => {
			if (ctx.getResult() != undefined) return;
			ctx.setResult("win");
			game.wait(0.5, () => ctx.finishGame());
		});

		// adds either mark or shooting star
		if (ctx.chance(0.25)) {
			if (ctx.chance(0.5)) {
				game.wait(1 / ctx.speed, () => {
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
						if (ctx.getResult() == "lose") shooting.destroy();
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
					if (ctx.getResult() == "lose") {
						vel = ctx.lerp(vel, ctx.vec2(-200, -350).scale(ctx.speed), 0.75);
						angle = ctx.lerp(angle, 10 * ctx.speed, 0.75);
					}
					marky.move(vel);
					marky.angle -= angle * ctx.speed;
				});
			}
		}

		let moonRotation = ctx.randi(179.5, 181);
		game.onUpdate(() => {
			moonRotation += ctx.dt() / 15 * ctx.speed;
			button.frame = ctx.isButtonDown("action") ? 1 : 0;
			stars.move(-ctx.rand(5, 10) * ctx.speed, 0);
			earth.angle -= ctx.rand(0.005, 0.05) * ctx.speed;

			// rotate moon around earth for astronomical accuracy
			const x = earth.pos.x + 260 * Math.cos(moonRotation);
			const y = earth.pos.y + 260 * Math.sin(moonRotation);
			moon.pos = ctx.vec2(x, y);
			moon.angle += ctx.speed / 5;
		});

		const now = new Date();
		const seconds = now.getSeconds();
		const minutes = now.getMinutes();
		const hour = now.getHours() % 12 + minutes / 60;

		// clock manecillas
		// hour
		clock.add([
			ctx.sprite("line"),
			ctx.anchor("bot"),
			ctx.z(2),
			ctx.pos(0, 7),
			ctx.color(ctx.mulfok.VOID_VIOLET),
			ctx.scale(1.2, 0.7),
			ctx.rotate(15 * hour),
		]);

		// minutes
		clock.add([
			ctx.sprite("line"),
			ctx.anchor("bot"),
			ctx.z(2),
			ctx.pos(0, 7),
			ctx.color(ctx.mulfok.VOID_VIOLET),
			ctx.scale(1, 0.9),
			ctx.rotate(minutes * 6),
		]);

		// seconds
		const secondsTab = clock.add([
			ctx.sprite("line"),
			ctx.anchor("bot"),
			ctx.z(2),
			ctx.pos(0, 7),
			ctx.scale(0.7, 1.2),
			ctx.color(ctx.mulfok.DARK_ORANGE),
			ctx.rotate(seconds * 6),
		]);

		game.loop(1, () => {
			ctx.play("tick", { detune: ctx.rand(-50, 50) });
			secondsTab.angle += 6;
		});

		if (ctx.isHardMode) {
			const sign = ctx.add([
				ctx.sprite("sign"),
				ctx.pos(512, 96),
				ctx.z(2),
			]);
		}

		game.onButtonPress("action", explodeEverything);
	},
});
