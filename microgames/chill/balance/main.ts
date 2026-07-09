import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "balance",
	prompt: "BALANCE!",
	duration: 7,
	hardModeOpt: {
		duration: 8,
	},
	bgColor: "8db7ff",
	urlPrefix: "microgames/chill/balance/",
	iconPath: "sprites/icon.png",
	input: "arrowkeys",
	hideCursor: true,
	boss: false,
	async load(ctx) {
		return await Promise.all([
			ctx.loadSprite("bg-s", "sprites/bg-s.png"),
			ctx.loadSprite("background", "sprites/background.png"),
			ctx.loadSprite("background-s", "sprites/background-s.png"),
			ctx.loadSprite("backclouds", "sprites/backclouds.png"),
			ctx.loadSprite("backclouds-s", "sprites/backclouds-s.png"),
			ctx.loadSprite("birb", "sprites/birb.png", { sliceX: 3, sliceY: 1 }),
			ctx.loadSprite("birb-s", "sprites/birb-s.png", { sliceX: 3, sliceY: 1 }),
			ctx.loadSprite("wind", "sprites/wind.png"),
			ctx.loadSprite("wind-s", "sprites/wind-s.png"),
			ctx.loadSprite("topclouds", "sprites/topclouds.png"),

			ctx.loadSprite("guylegs", "sprites/guylegs.png"),
			ctx.loadSprite("guytop", "sprites/guytop.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("guyanim", "sprites/guyanim.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("arrow", "../../assets/sprites/arrow.png"),

			ctx.loadSound("windambient", "sounds/windambient.mp3"),
			ctx.loadSound("birb", "sounds/birb.mp3"),
			ctx.loadSound("rope", "sounds/rope.mp3"),
			ctx.loadSound("scream", "sounds/wilhelm_scream.mp3"),
			ctx.loadSound("wind", "sounds/wind.mp3"),
		]);
	},
	start(ctx) {
		// TODO: legs animation
		// TODO: winning animation
		// TODO: music

		if (ctx.isHardMode) ctx.add([ctx.sprite("bg-s")]);

		ctx.play("windambient", { volume: 0.25, detune: ctx.rand(-100, 100), loop: true });

		const backclouds = ctx.add([ctx.sprite(ctx.isHardMode ? "backclouds-s" : "backclouds"), ctx.pos(), ctx.scale(ctx.rand(0.9, 1.1)), {
			update() {
				this.pos.x = ctx.wave(-10, 10, ctx.time());
			},
		}]);
		ctx.add([ctx.sprite(ctx.isHardMode ? "background-s" : "background")]);
		const topclouds = ctx.add([ctx.sprite("topclouds"), ctx.pos(), ctx.scale(ctx.rand(0.9, 1.1)), {
			update() {
				this.pos.x = ctx.wave(-15, 5, ctx.time());
			},
		}]);
		if (ctx.isHardMode) topclouds.destroy();

		const DURATION = ctx.timeLeft() - 2 / ctx.speed;

		const guylegs = ctx.add([ctx.sprite("guylegs"), ctx.animate(), ctx.anchor("center"), ctx.pos(ctx.center())]);
		const guytop = guylegs.add([ctx.sprite("guytop"), ctx.pos(5, -30), ctx.anchor(ctx.vec2(0.025, 0.5)), ctx.rotate()]);

		const pointOpacity = 0;
		const point1 = ctx.add([ctx.rotate(25), ctx.pos(270, 160), ctx.rect(20, 20), ctx.opacity(pointOpacity), ctx.color(ctx.RED), ctx.anchor("center")]);
		const point2 = ctx.add([ctx.rotate(10), ctx.pos(320, 220), ctx.rect(20, 20), ctx.opacity(pointOpacity), ctx.color(ctx.RED), ctx.anchor("center")]);
		const point3 = ctx.add([ctx.rotate(5), ctx.pos(390, 260), ctx.rect(20, 20), ctx.opacity(pointOpacity), ctx.color(ctx.RED), ctx.anchor("center")]);
		const point4 = ctx.add([ctx.rotate(-7), ctx.pos(450, 290), ctx.rect(20, 20), ctx.opacity(pointOpacity), ctx.color(ctx.RED), ctx.anchor("center")]);
		const point5 = ctx.add([ctx.rotate(-15), ctx.pos(540, 310), ctx.rect(20, 20), ctx.opacity(pointOpacity), ctx.color(ctx.RED), ctx.anchor("center")]);

		guylegs.animate("angle", [point1.angle, point2.angle, point3.angle, point4.angle, point5.angle], { duration: DURATION, direction: "forward", loops: 1 });
		guylegs.animate("pos", [point1.pos, point2.pos, point3.pos, point4.pos, point5.pos], { duration: DURATION, direction: "forward", loops: 1 });

		guylegs.onAnimateChannelFinished((name) => {
			if (name != "pos") return;
			guylegs.destroy();
			ctx.add([
				ctx.sprite("guyanim", { frame: 0 }),
				ctx.pos(520, 220),
			]);
			ctx.onTimeout(() => {
				ctx.setResult("win");
				ctx.wait(0.5 / ctx.speed, () => ctx.finishGame());
			});
		});

		function die(left: boolean) {
			ctx.play("scream", { detune: ctx.rand(-100, 100) });
			guylegs.destroy();
			ctx.setResult("lose");
			ctx.wait(1, () => ctx.finishGame());
			const death = ctx.add([
				ctx.sprite("guyanim", { frame: 1 }),
				ctx.pos(left ? guylegs.pos.sub(25, 30) : guylegs.pos.add(20)),
				ctx.rotate(0),
				ctx.anchor("center"),
			]);
			let speed = 4;
			death.onUpdate(() => {
				speed += 0.5;
				death.pos.y += speed;
				death.angle -= left ? 0.5 : 1;
			});
		}

		let guyTopAngle = ctx.rand(-5, 5);
		let direction = ctx.choose([-1, 1]);
		guytop.onUpdate(() => {
			guytop.angle = ctx.lerp(guytop.angle, guyTopAngle, 0.1);
			if (ctx.isButtonDown("left")) {
				direction = ctx.rand(-1, -2);
				guyTopAngle -= 1;
			}
			if (ctx.isButtonDown("right")) {
				direction = ctx.rand(1, 2);
				guyTopAngle += 1;
			}

			guyTopAngle += ctx.rand(0.25, 1) * direction;

			if (guytop.angle >= 35 && guytop.frame == 0) {
				guytop.frame = 1;
				ctx.play("rope", { speed: 2, detune: ctx.rand(-50, 50) });
				guytop.angle = 0;
			}
			else if (guytop.angle <= -20 && guytop.frame == 1) {
				guytop.frame = 0;
				guytop.angle = 0;
				ctx.play("rope", { speed: 2, detune: ctx.rand(-50, 50) });
			}

			// lose conditions
			if (guytop.frame == 0 && guytop.angle <= -35) {
				die(true);
			}
			else if (guytop.frame == 1 && guytop.angle >= 40) {
				die(false);
			}
		});

		// tightrope sound effect
		ctx.wait(ctx.rand(1, 3) / ctx.speed, () => {
			ctx.play("rope", { detune: ctx.rand(-100, 100), volume: 0.6 });
		});

		if (ctx.isHardMode) {
			ctx.wait(ctx.rand(1, 5) / ctx.speed, () => {
				// hard
				const direction = ctx.choose([-1, 1]);
				guyTopAngle += ctx.rand(15, 25) * direction;

				const wind = ctx.add([
					ctx.sprite(ctx.isHardMode ? "wind-s" : "wind"),
					ctx.pos(guylegs.pos),
					ctx.anchor("center"),
					ctx.opacity(),
				]);

				ctx.tween(wind.pos, wind.pos.add(30 * direction, 30 * -direction), 0.25, (p) => wind.pos = p, ctx.easings.easeOutQuint);
				wind.fadeOut(1 / ctx.speed);
				ctx.play("wind", { detune: ctx.rand(-100, 100) });
			});
		}

		const arrow = ctx.add([ctx.scale(0.75, 0.75), ctx.sprite("arrow", { flipX: direction == 1 ? true : false }), ctx.anchor("center"), ctx.opacity(1), ctx.pos(), {
			add() {
				this.fadeIn(0.1 / ctx.speed);
			},

			update() {
				arrow.scale.x = ctx.lerp(arrow.scale.x, guyTopAngle <= 10 ? -0.75 : 0.75, 0.5);
				arrow.pos = guytop.worldPos.sub(0, 110);

				if (7 / ctx.speed - ctx.timeLeft() > 2) {
					this.opacity = ctx.lerp(this.opacity, 0, 0.25);
				}
			},
		}]);

		// add birbs
		for (let i = ctx.randi(1, 3); i > 0; i--) {
			const birb = ctx.add([
				ctx.sprite(ctx.isHardMode ? "birb-s" : "birb", { frame: 0 }),
				ctx.pos(ctx.vec2(30, 110).add(30 * i, 15 * -i)),
			]);

			if (ctx.isHardMode ? ctx.chance(0.5) : ctx.chance(0.25)) {
				ctx.wait(1 / ctx.speed, () => {
					ctx.play("birb", { detune: ctx.rand(-50, 50), speed: 1.1 });
					birb.frame = 2;
					ctx.tween(birb.pos, ctx.vec2(650, 380).add(30 * i, 15 * -i), 2 / ctx.speed, (p) => birb.pos = p, ctx.easings.easeInSine).onEnd(() => {
						birb.frame = 1;
					});
				});

				let collided = false;
				birb.onUpdate(() => {
					if (birb.pos.dist(guytop.worldPos) < 50 && !collided) {
						collided = true;
						guyTopAngle += ctx.rand(10, 15) * ctx.choose([-1, 1]);
					}
				});
			}
		}

		// HARDMODE SHOULD BE LIKE SUNDOWN (atardecer)
		// use animate to move the birds and the guy
	},
});
