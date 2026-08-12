import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "dodge",
	prompt: "DODGE!",
	duration: 6,
	hardModeOpt: {
		duration: 6,
		prompt: "SMASH",
	},
	bgColor: "8db7ff",
	urlPrefix: "microgames/chill/dodge/",
	iconPath: "sprites/icon.png",
	input: "arrowkeys",
	boss: false,
	hideCursor: false,
	async load(ctx) {
		return await Promise.all([
			ctx.loadCrew("sprite", "sun"),
			ctx.loadSprite("foot", "sprites/foot.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("floor", "sprites/floor.png"),
			ctx.loadSprite("backdrop", "sprites/backdrop.png"),
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

		// #region NORMAL MODE
		if (!ctx.isHardMode) {
			ctx.setGravity(1300);

			ctx.add([ctx.sprite("backdrop"), ctx.opacity(0.75)]);

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
						this.pos.y = ctx.center().y - 70 - ctx.wave(-5, 5, ctx.time() * 2 * ctx.speed);
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

			const SPEED = 350 * ctx.speed;
			let mov = ctx.vec2(0);
			let lerpMov = ctx.vec2(0);
			marky.onUpdate(() => {
				// foot
				// make it faster, i think it doesn't wave according speed
				if (ctx.timeLeft() > 0) foot.pos.x = ctx.lerp(foot.pos.x, ctx.wave(20, ctx.width() - 20, ctx.time() * ctx.speed), 0.05 * ctx.speed);
				else foot.pos.y = ctx.lerp(foot.pos.y, -100, 0.5 * ctx.speed);

				if (marky.adjusting || !marky.isGrounded()) foot.area.scale = ctx.vec2(0);
				else foot.area.scale = ctx.vec2(0.5, 1);

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
						this.pos.y = ctx.center().y - 90 - ctx.wave(-5, 5, ctx.time() * ctx.speed);
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
						this.scale = ctx.vec2(ctx.wave(1.5, 1.75, ctx.time()));
						this.angle = ctx.wave(-10, 10, ctx.time());
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

			function stomp() {
				const highFeet = foot.pos.y;

				ctx.tween(foot.pos.y, ctx.height() - 40, 0.1 / ctx.speed, (p) => foot.pos.y = p, ctx.easings.easeOutExpo).onEnd(() => {
					if (marky.isVisuallyColliding(foot)) {
						ctx.setResult("lose");
						marky.destroy();
						ctx.play("squash");
						ctx.wait(0.5 / ctx.speed, () => ctx.finishGame());
					}

					ctx.play("stomp");
					ctx.shake(ctx.rand(13, 15));
					if (ctx.getResult() == undefined) {
						ctx.tween(foot.pos.y, highFeet, 0.35 / ctx.speed, (p) => foot.pos.y = p, ctx.easings.easeOutExpo);
						jump();
					}

					const particleSpeed = ctx.vec2(0, 500).scale(ctx.speed);
					const splatter = ctx.add([
						ctx.pos(foot.pos),
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
			}

			timer.wait(0.75 / ctx.speed, () => {
				ctx.loop(2 / ctx.speed, () => {
					if (marky.isGrounded() && ctx.timeLeft() > 0 && ctx.getResult() == undefined) {
						stomp();
					}
				});
			});

			ctx.onTimeout(() => {
				if (ctx.getResult() != undefined) return;
				ctx.setResult("win");
				ctx.wait(0.5 / ctx.speed, () => {
					ctx.finishGame();
				});
			});
		}
		// #endregion

		// #region HARD MODE
		else {
		}
		// #endregion
	},
});
