import { Minigame } from "../../src/game/types";

const avoidGame: Minigame = {
	prompt: "avoid",
	author: "amyspark-ng",
	rgb: (ctx) => ctx.mulfok.BLUE,
	duration: 6,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSound("squash", "sounds/squash.mp3");
		ctx.loadSound("stomp", "sounds/stomp.wav");
		ctx.loadSound("crawl", "sounds/crawl.ogg");
		ctx.loadSprite("floor", "sprites/avoid/floor.png");
		ctx.loadSprite("cloudsBack", "sprites/avoid/cloudsback.png");
		ctx.loadSprite("cloudsFront", "sprites/avoid/cloudsfront.png");
		ctx.loadSprite("dirt", "sprites/avoid/dirt.png");
		ctx.loadSprite("foot", "sprites/avoid/foot.png", {
			sliceX: 2,
			sliceY: 1,
			anims: {
				"idle": {
					from: 0,
					to: 1,
					loop: true,
				},
			},
		});
		ctx.loadSprite("mark", "sprites/avoid/mark.png", {
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
		});
	},
	start(ctx) {
		ctx.setGravity(1300);

		const crawl = ctx.play("crawl", { loop: true, paused: true, detune: ctx.rand(0, 50) });
		const floor = ctx.add([
			ctx.sprite("floor"),
			ctx.area(),
			ctx.pos(ctx.center().x, ctx.center().y + ctx.height() / 2 - 15),
			ctx.anchor("center"),
			ctx.body({ isStatic: true }),
		]);
		floor.gravityScale = 0;

		const mark = ctx.add([
			ctx.sprite("mark", { anim: "idle" }),
			ctx.area({ scale: ctx.vec2(0.5, 0.75), offset: ctx.vec2(0, -2) }),
			ctx.anchor("center"),
			ctx.body(),
			ctx.pos(floor.pos.x, floor.pos.y - 60),
			{
				adjusting: false,
			},
		]);

		const cloudsBack = ctx.add([
			ctx.sprite("cloudsBack"),
			ctx.pos(),
		]);

		const foot = ctx.add([
			ctx.sprite("foot", { anim: "idle" }),
			ctx.pos(),
			ctx.area({ scale: ctx.vec2(0.5, 1) }),
			ctx.anchor("bot"),
			ctx.z(0),
			ctx.pos(ctx.center()),
			"foot",
		]);

		const cloudsFront = ctx.add([
			ctx.sprite("cloudsFront"),
			ctx.pos(),
			ctx.z(1),
		]);

		function stomp() {
			const highFeet = foot.pos.y;

			ctx.tween(foot.pos.y, ctx.height() - 40, 0.1 / ctx.speed, (p) => foot.pos.y = p, ctx.easings.easeOutExpo).onEnd(() => {
				if (mark.isColliding(foot)) {
					ctx.lose();
					mark.destroy();
					ctx.play("squash");
					ctx.wait(0.5 / ctx.speed, () => ctx.finish());
				}

				ctx.play("stomp");
				ctx.shakeCam(ctx.rand(13, 15));
				if (ctx.winState() == undefined) {
					ctx.tween(foot.pos.y, highFeet, 0.35 / ctx.speed, (p) => foot.pos.y = p, ctx.easings.easeOutExpo);
					jump();
				}

				const particleSpeed = ctx.vec2(0, 500).scale(ctx.speed);
				const splatter = ctx.add([
					ctx.pos(foot.pos),
					ctx.z(foot.z - 1),
					ctx.particles({
						max: 20,
						speed: [particleSpeed.x, particleSpeed.y],
						acceleration: [particleSpeed.scale(2), particleSpeed.scale(2)],
						lifeTime: [999, 999],
						colors: [ctx.mulfok.GREEN, ctx.mulfok.BROWN],
						opacities: [1.0, 0.0],
						angle: [0, 0],
						// @ts-ignore
						texture: ctx.getSprite("dirt").data.tex,
						// @ts-ignore
						quads: [ctx.getSprite("dirt").data.frames[0]],
					}, {
						lifetime: 1,
						rate: 0,
						direction: -90,
						spread: 45,
						position: ctx.vec2(),
					}),
				]);

				splatter.emit(ctx.randi(15, 25));
				splatter.onEnd(() => splatter.destroy());
			});

			function jump() {
				mark.play("squish");
				mark.jump();
				const ground = mark.onGround(() => {
					ground.cancel();
					mark.adjusting = true;
					mark.play("squash");
					ctx.wait(0.1, () => {
						mark.adjusting = false;
					});
				});
			}
		}

		const SPEED = 350 * ctx.speed;
		let mov = ctx.vec2(0);
		let lerpMov = ctx.vec2(0);
		mark.onUpdate(() => {
			// foot
			if (ctx.timeLeft > 0) foot.pos.x = ctx.lerp(foot.pos.x, ctx.wave(20, ctx.width() - 20, ctx.time() / ctx.speed), 0.05 * ctx.speed);
			else foot.pos.y = ctx.lerp(foot.pos.y, -100, 0.5 * ctx.speed);
			if (mark.adjusting || !mark.isGrounded()) foot.area.scale = ctx.vec2(0);
			else foot.area.scale = ctx.vec2(0.5, 1);

			// clouds
			cloudsBack.pos.y = ctx.wave(0, 10, ctx.time() / 2);
			cloudsFront.pos.y = ctx.wave(0, 10, ctx.time());

			if (ctx.winState() == false) return;
			const walking = ctx.isInputButtonDown("left") || ctx.isInputButtonDown("right");

			if (mark.isGrounded() && mark.adjusting == false) {
				if (walking && mark.getCurAnim()?.name != "walk") mark.play("walk");
				else if (!walking && mark.getCurAnim()?.name != "idle" && mark.isGrounded()) mark.play("idle");
			}

			crawl.paused = !(walking && mark.isGrounded() && ctx.winState() == undefined);
			mark.flipX = ctx.isInputButtonDown("left");
			mov.x = ctx.isInputButtonDown("left") ? -1 : ctx.isInputButtonDown("right") ? 1 : 0;
			lerpMov = ctx.lerp(lerpMov, mov, 0.5);
			mark.move(lerpMov.scale(SPEED));
		});

		ctx.wait(0.75 / ctx.speed, () => {
			ctx.loop(2 / ctx.speed, () => {
				if (mark.isGrounded() && ctx.timeLeft > 0 && ctx.winState() == undefined) {
					stomp();
				}
			});
		});

		ctx.onTimeout(() => {
			if (ctx.winState() != undefined) return;
			ctx.win();
			ctx.wait(0.5 / ctx.speed, () => {
				ctx.finish();
			});
		});
	},
};

export default avoidGame;
