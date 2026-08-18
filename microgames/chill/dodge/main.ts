import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "dodge",
	prompt: "DODGE!",
	duration: 8,
	bgColor: "8db7ff",
	urlPrefix: "microgames/chill/dodge/",
	iconPath: "sprites/icon.png",
	input: "arrowkeys",
	boss: false,
	hideCursor: false,
	async load(ctx) {
		return await Promise.all([
			ctx.loadCrew("sprite", "sun"),
			ctx.loadSprite("foot", "sprites/foot.png"),
			ctx.loadSprite("punch", "sprites/punch.png"),
			ctx.loadSprite("floor", "sprites/floor.png"),
			ctx.loadSprite("backdrop", "sprites/backdrop.png"),
			ctx.loadSprite("backdrop2", "sprites/backdrop2.png"),
			ctx.loadSprite("snowparts", "sprites/snowparts.png"),
			ctx.loadSprite("backclouds", "sprites/backclouds.png"),
			ctx.loadSprite("topclouds", "sprites/topclouds.png"),
			ctx.loadSprite("dirt", "sprites/dirt.png"),
			ctx.loadSprite("bush", "sprites/bush.png"),
			ctx.loadSprite("marky", "sprites/marky.png", {
				sliceX: 11,
				sliceY: 1,
				anims: {
					"idle": {
						from: 0,
						to: 3,
						loop: true,
						pingpong: true,
						speed: 5,
					},
					"squish": {
						from: 8,
						to: 7,
					},
					"squash": {
						from: 5,
						to: 6,
					},
					"walk": {
						from: 9,
						to: 10,
						loop: true,
					},
				},
			}),

			ctx.loadSound("music", "sounds/music.mp3"),
			ctx.loadSound("squash", "sounds/squash.mp3"),
			ctx.loadSound("stomp", "sounds/stomp.wav"),
			ctx.loadSound("crawl", "sounds/crawl.ogg"),
		]);
	},
	start(ctx) {
		ctx.play("music", { speed: ctx.speed });

		const clampedSpeed = ctx.clamp(ctx.speed, 1, 1.5);

		ctx.setGravity(1400);

		ctx.add([ctx.sprite(ctx.isHardMode ? "backdrop2" : "backdrop"), ctx.opacity(0.75), ctx.pos(0, -30)]);

		if (ctx.isHardMode) {
			const snowparts = ctx.add([
				ctx.sprite("snowparts"),
				ctx.z(0),
				ctx.pos(ctx.center().add(0, 50)),
				ctx.anchor("center"),
				{
					update() {
						this.pos.y += ctx.dt() * 2;
					},
				},
			]);
		}

		let footTime = 2;
		let handTime = 1.5;
		let randomTime = ctx.rand(1, 5);

		const crawl = ctx.play("crawl", { loop: true, paused: true, detune: ctx.rand(0, 50) });
		const floor = ctx.add([
			ctx.sprite("floor"),
			ctx.pos(ctx.rand(-10, -20), ctx.height() - 30),
			ctx.anchor("left"),
			ctx.body({ isStatic: true }),
			ctx.area({ scale: ctx.vec2(10, 1) }),
		]);
		floor.gravityScale = 0;

		const timer = ctx.add([ctx.timer()]);

		const backclouds = ctx.add([
			ctx.sprite("backclouds"),
			ctx.pos(ctx.center().sub(0, 100)),
			ctx.anchor("center"),
			{
				update() {
					this.pos.y = ctx.center().y - 70 - ctx.wave(-5, 5, randomTime * 2 * ctx.speed);
				},
			},
		]);

		const marky = ctx.add([
			ctx.sprite("marky", { anim: "idle" }),
			ctx.area({ scale: ctx.vec2(0.5, 0.75), offset: ctx.vec2(0, -3) }),
			ctx.anchor("center"),
			ctx.body({ gravityScale: 1.5 }),
			ctx.z(0),
			ctx.pos(floor.pos.x + ctx.rand(30, 700), floor.pos.y - 60),
			{
				adjusting: false,
			},
		]);

		const foot = ctx.add([
			ctx.sprite("foot", { frame: 0 }),
			ctx.pos(),
			ctx.area({ scale: ctx.vec2(0.5, 1) }),
			ctx.anchor("bot"),
			ctx.pos(ctx.center().add(ctx.rand(-100, 100), 0)),
			ctx.z(1),
			"foot",
		]);

		let hand: typeof foot;
		if (ctx.isHardMode) {
			hand = ctx.add([
				ctx.sprite("punch", { frame: 0 }),
				ctx.pos(),
				ctx.area({ scale: ctx.vec2(0.5, 1) }),
				ctx.anchor("bot"),
				ctx.pos(ctx.center().add(ctx.rand(-100, 100), 0)),
				ctx.z(1),
				"foot",
			]);
		}

		const SPEED = 450 * clampedSpeed;
		let mov = ctx.vec2(0);
		let lerpMov = ctx.vec2(0);
		marky.onUpdate(() => {
			randomTime += ctx.dt();
			// foot
			if (ctx.timeLeft() > 0) {
				foot.pos.x = ctx.lerp(
					foot.pos.x,
					ctx.wave(-100, ctx.width() + 100, randomTime * clampedSpeed * 1.5),
					0.05 * clampedSpeed * 1.5,
				);

				// Completely off the left -> appear on the right
				if (foot.pos.x < -100) {
					foot.pos.x = ctx.width() + 100;
				}
				// Completely off the right -> appear on the left
				else if (foot.pos.x > ctx.width() + 100) {
					foot.pos.x = -100;
				}
			}
			else {
				foot.pos.y = ctx.lerp(foot.pos.y, -100, 0.5 * clampedSpeed);
			}

			// hand
			if (ctx.isHardMode) {
				if (ctx.timeLeft() > 0) {
					const minDistance = 80;
					const maxOvershoot = 100;

					// Direction the target is moving
					const direction = mov.x;

					// Follow marky, but stay behind it
					let targetX = marky.pos.x - direction * minDistance;

					// Add a continuously changing overshoot
					targetX += ctx.wave(
						-maxOvershoot,
						maxOvershoot,
						randomTime * ctx.speed,
					);

					hand.pos.x = ctx.lerp(
						hand.pos.x,
						targetX,
						0.05 * ctx.speed,
					);

					// Screen wrapping
					if (hand.pos.x < -100) {
						hand.pos.x = ctx.width() + 100;
					}
					else if (hand.pos.x > ctx.width() + 100) {
						hand.pos.x = -100;
					}
				}
				else {
					hand.pos.y = ctx.lerp(hand.pos.y, -100, 0.5 * ctx.speed);
				}
			}

			if (marky.adjusting || !marky.isGrounded()) foot.area.scale = ctx.vec2(0);
			else foot.area.scale = ctx.vec2(0.5, 1);

			if (ctx.isHardMode) {
				if (marky.adjusting || !marky.isGrounded()) hand.area.scale = ctx.vec2(0);
				else hand.area.scale = ctx.vec2(0.5, 1);
			}

			// mark
			if (ctx.getResult() == "lose") return;
			const walking = ctx.isButtonDown("left") || ctx.isButtonDown("right");

			if (marky.isGrounded() && marky.adjusting == false) {
				if (walking && marky.getCurAnim()?.name != "walk") marky.play("walk");
				else if (!walking && marky.getCurAnim()?.name != "idle" && marky.isGrounded()) marky.play("idle");
			}

			crawl.paused = !(walking && marky.isGrounded() && ctx.getResult() == undefined);
			marky.flipX = ctx.isButtonDown("left");
			mov.x = ctx.isButtonDown("left") ? -1 : ctx.isButtonDown("right") ? 1 : 0;
			lerpMov = ctx.lerp(lerpMov, mov, 0.5);
			marky.move(lerpMov.scale(SPEED));

			// wrap around the screen
			if (marky.pos.x <= -marky.width / 2 - 10) marky.pos.x = ctx.width() + marky.width / 2;
			if (marky.pos.x >= ctx.width() + marky.width / 2 + 10) marky.pos.x = -marky.width / 2;
		});

		const topclouds = ctx.add([
			ctx.sprite("topclouds"),
			ctx.pos(ctx.center().sub(0, 90)),
			ctx.anchor("center"),
			ctx.z(2),
			{
				update() {
					this.pos.y = ctx.center().y - 90 - ctx.wave(-5, 5, randomTime * clampedSpeed);
				},
			},
		]);

		ctx.add([
			ctx.sprite("@sun"),
			ctx.pos(700, 100),
			ctx.scale(1.5),
			ctx.rotate(0),
			ctx.opacity(0.75),
			ctx.anchor("center"),
			{
				update() {
					this.scale = ctx.vec2(ctx.wave(1.5, 1.75, randomTime));
					this.angle = ctx.wave(-10, 10, randomTime);
				},
			},
		]);

		function jump() {
			marky.play("squish");
			marky.jump(800);
			const ground = marky.onGround(() => {
				ground.cancel();
				marky.adjusting = true;
				marky.play("squash");
				ctx.wait(0.1, () => {
					marky.adjusting = false;
				});
			});
		}

		function stomp(limb: typeof foot) {
			const highLimb = limb.pos.y;

			// tells you when they're about to hit
			ctx.tween(limb.pos.y, limb.pos.y - 100, 0.5 / ctx.speed, (p) => limb.pos.y = p, ctx.easings.easeOutExpo).onEnd(() => {
				ctx.tween(limb.pos.y, ctx.height() - 40, 0.1 / ctx.speed, (p) => limb.pos.y = p, ctx.easings.easeOutExpo).onEnd(() => {
					if (marky.isVisuallyColliding(limb)) {
						ctx.setResult("lose");
						marky.destroy();
						ctx.play("squash");
						ctx.wait(0.75 / ctx.speed, () => ctx.finishGame());
					}

					ctx.play("stomp");
					ctx.shake(ctx.rand(13, 15));
					if (ctx.getResult() == undefined) {
						ctx.tween(limb.pos.y, highLimb, 0.35 / ctx.speed, (p) => limb.pos.y = p, ctx.easings.easeOutExpo);
						if (marky.isGrounded()) jump();
					}

					const particleSpeed = ctx.vec2(0, 500).scale(ctx.speed);
					const splatter = ctx.add([
						ctx.pos(limb.pos),
						ctx.particles({
							max: 20,
							speed: [particleSpeed.x, particleSpeed.y],
							acceleration: [particleSpeed.scale(2), particleSpeed.scale(2)],
							lifeTime: [2, 4],
							colors: [ctx.mulfok.GREEN, ctx.mulfok.BROWN],
							opacities: [1.0, 0.0],
							angle: [0, 0],
							texture: ctx.getSprite("dirt").data.frames[0].tex,
							quads: [ctx.getSprite("dirt").data.frames[0].q],
						}, {
							lifetime: 1,
							rate: 0,
							direction: -90,
							spread: 60,
							position: ctx.vec2(),
						}),
					]);

					splatter.emit(ctx.randi(15, 25));
					splatter.onEnd(() => splatter.destroy());
				});
			});
		}

		timer.wait(0.75 / ctx.speed, () => {
			let footTimeLimit = footTime;
			let handTimeLimit = handTime;
			ctx.add([]).onUpdate(() => {
				footTime += ctx.dt();
				handTime += ctx.dt();

				if (footTime >= footTimeLimit) {
					if (ctx.isHardMode) footTimeLimit = ctx.rand(1.7, 1.9) / ctx.speed;
					else ctx.rand(1.8, 2) / ctx.speed;

					footTime = 0;
					if (ctx.timeLeft() > 0 && ctx.getResult() == undefined) {
						if (!ctx.isHardMode) {
							if (marky.isGrounded()) stomp(foot);
						}
						else stomp(foot);
					}
				}

				if (ctx.isHardMode) {
					// just foot time but faster
					if (handTime >= handTimeLimit) {
						handTimeLimit = ctx.rand(1.7, 2.1) / ctx.speed;
						handTime = 0;

						if (marky.isGrounded() && ctx.timeLeft() > 0 && ctx.getResult() == undefined) {
							stomp(hand);
						}
					}
				}
			});
		});

		ctx.onTimeout(() => {
			if (ctx.getResult() != undefined) return;
			ctx.setResult("win");
			ctx.wait(0.75 / ctx.speed, () => {
				ctx.finishGame();
			});
		});
	},
});
