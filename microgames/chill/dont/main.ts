import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "dont",
	prompt: "DON'T!",
	duration: 5,
	hardModeOpt: {
		duration: 4,
	},
	bgColor: "1f102a",
	urlPrefix: "microgames/chill/dont/",
	iconPath: "sprites/icon.png",
	input: "all",
	boss: false,
	async load(ctx) {
		return Promise.all([
			ctx.loadSprite("explosion", "sprites/explosion.png", { sliceX: 7, sliceY: 1, anims: { "a": { from: 0, to: 6 } } }),
			ctx.loadSprite("mug", "sprites/mug.png", { sliceX: 7, sliceY: 1, anims: { "a": { from: 0, to: 6, loop: true, speed: 5 } } }),
			ctx.loadSprite("moon", "sprites/moon.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("button", "sprites/button.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("panel", "sprites/panel.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("earth", "sprites/earth.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("frame", "sprites/frame.png"),
			ctx.loadSprite("marky", "sprites/marky.png"),
			ctx.loadSprite("shooting", "sprites/shooting.png"),
			ctx.loadSprite("stars", "sprites/stars.png"),
			ctx.loadSprite("clock", "sprites/clock.png"),
			ctx.loadSprite("line", "sprites/line.png"),
			ctx.loadSprite("cables", "sprites/cables.png"),
			ctx.loadSprite("sign", "sprites/sign.png"),
			ctx.loadSound("tick", "sounds/tick.ogg"),
			ctx.loadSound("explode", "../../assets/sounds/explode.mp3"),
			ctx.loadSound("music", "sounds/music.ogg"),
		]);
	},
	start(ctx) {
		ctx.play("music");
		const game = ctx.add([ctx.timer()]);
		const frame = game.add([ctx.sprite("frame"), ctx.z(1)]);

		const stars = game.add([ctx.sprite("stars"), ctx.pos()]);
		const earth = game.add([ctx.sprite("earth"), ctx.pos(400, 480), ctx.anchor("center"), ctx.rotate(0)]);
		const moon = game.add([ctx.sprite("moon", { frame: 0 }), ctx.pos(580, 290), ctx.anchor("center"), ctx.rotate(0)]);
		const clock = game.add([ctx.sprite("clock"), ctx.pos(675, 404), ctx.anchor("center"), ctx.z(2)]);
		const mug = game.add([ctx.sprite("mug", { anim: "a" }), ctx.pos(550, 360), ctx.anchor("center"), ctx.z(2)]);
		const panel = game.add([ctx.sprite("panel"), ctx.pos(165, 470), ctx.anchor("center"), ctx.z(2)]);
		game.add([ctx.sprite("cables"), ctx.pos(111, 71), ctx.anchor("center"), ctx.z(2)]);

		const button = game.add([
			ctx.sprite("button"),
			ctx.anchor("center"),
			ctx.pos(400, 436),
			ctx.z(2),
		]);

		function explodeEverything() {
			if (ctx.getResult() != undefined) return;
			ctx.setResult("lose");
			ctx.flash(ctx.WHITE, 0.2 / ctx.speed);
			ctx.play("explode", { speed: 0.5 * ctx.speed });

			button.frame = 1;
			moon.frame = 1;
			panel.frame = 1;
			earth.frame = 1;

			const explosion = game.add([
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
					const shooting = game.add([
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
				const marky = game.add([
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
			const sign = game.add([
				ctx.sprite("sign"),
				ctx.pos(512, 96),
				ctx.z(2),
			]);
		}

		game.wait(0.1, () => {
			game.onButtonPress(["click", "left", "right", "down", "up"], explodeEverything);
		});
	},
});
