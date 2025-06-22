import { Minigame } from "../../src/types/Minigame";

const dodgeGame: Minigame = {
	name: "dodge",
	author: "amyspark-ng",
	prompt: "DODGE!",
	input: "keys",
	duration: (ctx) => ctx.difficulty == 1 || ctx.difficulty == 2 ? 6 : 8,
	rgb: [255, 255, 255],
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("dino", "sprites/dodge/dino.png", { sliceX: 5, sliceY: 1 });
		ctx.loadSprite("ptero", "sprites/dodge/ptero.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("cactus", "sprites/dodge/cactus.png");
		ctx.loadSprite("cloud", "sprites/dodge/cloud.png");
		ctx.loadSprite("ground", "sprites/dodge/ground.png");
		ctx.loadSprite("sand", "sprites/dodge/sand.png");
		ctx.loadSprite("comet", "sprites/dodge/comet.png");
		ctx.loadSprite("gameover", "sprites/dodge/gameover.png");
		ctx.loadSprite("kaboom", "sprites/dodge/kaboom.png");
		ctx.loadSprite("wifi", "sprites/dodge/wifi.png");
		ctx.loadSound("jump", "sounds/dino-jump.wav");
		ctx.loadSound("explosion", "sounds/explosion.wav");
		ctx.loadSound("wifi", "sounds/explosion.wav");
	},
	// TODO: Touch up (add the browser overlya)
	start(ctx) {
		const game = ctx.add([]);
		ctx.setGravity(2500);

		let timeout = false;
		let alpha = 0; // 0 means white 1 means dark
		let isDead = false;
		let frame = 0;

		let pteroEnabled = false;
		let pteroAllowed = false;
		let pteroTime = 0;
		let pteroDuration = 4;

		let cactusEnabled = true;
		let cactusDuration = 0;
		let cactusTime = 0;

		const DARK_COLOR = ctx.Color.fromHex("#4b3153");
		const CACTUS_SPEED = ctx.vec2(-480 * ctx.speed, 0);
		const GROUND_Y = 370;
		const changeColor = () => ctx.tween(alpha, alpha == 1 ? 0 : 1, 0.5, (p) => alpha = p);

		let PRIMARY_COLOR = DARK_COLOR;
		let SECONDARY_COLOR = ctx.WHITE;

		function runCloudLoop() {
			if (isDead || timeout) return;
			ctx.wait(ctx.rand(0.35, 1) / ctx.speed, () => {
				const cloud = game.add([
					ctx.sprite("cloud"),
					ctx.pos(ctx.width() + 300, ctx.center().y - ctx.rand(50, 200)),
					ctx.color(),
					ctx.opacity(0.25),
					ctx.vec2(0.75, 1),
					ctx.anchor("center"),
				]);

				cloud.onUpdate(() => {
					if (isDead) return;
					cloud.color = PRIMARY_COLOR;
					cloud.move(CACTUS_SPEED.scale(0.5));
					if (cloud.pos.x <= -100) cloud.destroy();
				});

				runCloudLoop();
			});
		}

		function addCactus() {
			if (isDead || !cactusEnabled || timeout) return;
			const cactus = game.add([
				ctx.pos(ctx.width() + 10, GROUND_Y + ctx.rand(20, 25)),
				ctx.sprite("cactus"),
				ctx.anchor("bot"),
				ctx.scale(ctx.rand(0.75, 1.5)),
				ctx.color(),
				ctx.area({ scale: ctx.vec2(0.75, 0.75) }),
				"enemy",
				"moving",
			]);

			cactus.onUpdate(() => {
				if (!isDead) cactus.move(CACTUS_SPEED);
				cactus.color = DARK_COLOR.lerp(ctx.WHITE, alpha);
			});
		}

		function addPtero() {
			if (isDead || !pteroEnabled || timeout) return;
			const y = ctx.choose([
				GROUND_Y - 100,
				GROUND_Y - 150,
			]);

			const ptero = game.add([
				ctx.pos(ctx.width() + 100, y),
				ctx.sprite("ptero"),
				ctx.color(),
				ctx.area({ scale: ctx.vec2(1, 0.5) }),
				ctx.anchor("center"),
				"moving",
				"enemy",
			]);

			ptero.onUpdate(() => {
				if (!isDead) ptero.move(CACTUS_SPEED.scale(1.25));
				ptero.frame = frame;
				ptero.color = PRIMARY_COLOR;
			});
		}

		function runSandLoop() {
			if (isDead || timeout) return;
			ctx.wait(ctx.rand(0.5, 2) / ctx.speed, () => {
				const sand = game.add([
					ctx.sprite("sand"),
					ctx.pos(ctx.width() + 300, GROUND_Y + ctx.rand(30, 40)),
					ctx.color(),
					ctx.anchor("right"),
				]);

				sand.onUpdate(() => {
					if (isDead) return;
					sand.color = PRIMARY_COLOR;
					sand.move(CACTUS_SPEED);
					if (sand.pos.x <= -100) sand.destroy();
				});

				runSandLoop();
			});
		}

		// TODO: Fix the ground of thi minigame
		function addGround() {
			const ground = game.add([
				ctx.sprite("ground", { tiled: true }),
				ctx.color(PRIMARY_COLOR),
				ctx.pos(0, GROUND_Y),
				ctx.area({ offset: ctx.vec2(0, 30), scale: ctx.vec2(1, 5) }),
				ctx.body({ isStatic: true }),
			]);
			ground.gravityScale = 0;
			ground.width = ctx.width();

			const ground2 = ground.add([
				ctx.sprite("ground", { tiled: true }),
				ctx.color(),
				ctx.pos(0, 0),
				ctx.area({ offset: ctx.vec2(0, 30), scale: ctx.vec2(1, 5) }),
				ctx.body({ isStatic: true }),
			]);

			ground.pos.x = -ground.width;
			ground2.gravityScale = 0;
			ground2.width = ctx.width();

			ground.onUpdate(() => {
				ground.color = PRIMARY_COLOR;
				ground2.color = ground.color;
				ground2.pos.x = ground.width;
				if (!isDead) ground.move(CACTUS_SPEED);
				if (ground.pos.x <= -ground.width) {
					ground.pos.x = 0;
				}
			});
		}

		const dino = game.add([
			ctx.sprite("dino"),
			ctx.color(PRIMARY_COLOR),
			ctx.anchor("bot"),
			ctx.pos(80, GROUND_Y + 50),
			ctx.area({ scale: ctx.vec2(0.25, 1), offset: ctx.vec2(-10, 0) }),
			ctx.body({ stickToPlatform: false }),
			ctx.z(3),
		]);

		ctx.onUpdate(() => {
			PRIMARY_COLOR = DARK_COLOR.lerp(ctx.WHITE, alpha);
			SECONDARY_COLOR = DARK_COLOR.lerp(ctx.WHITE, 1 - alpha);
			ctx.setRGB(SECONDARY_COLOR);

			frame = Math.floor((ctx.time() * 5 * ctx.speed) % 2);
			dino.paused = isDead;
			dino.color = PRIMARY_COLOR;

			dino.gravityScale = ctx.isButtonDown("down") ? 3 : 1;
			if (isDead) {
				dino.frame = 4;
				return;
			}
			if (ctx.isButtonDown("down")) dino.frame = 2 + frame;
			else if (dino.isGrounded()) dino.frame = frame;
			dino.area.scale.y = ctx.isButtonDown("down") ? 0.25 : 1;

			ctx.get("moving").forEach((obj) => {
				if (obj.pos.x <= -100) obj.destroy();
			});

			cactusTime += ctx.dt();
			pteroTime += ctx.dt();

			if (pteroEnabled) {
				if (pteroTime >= pteroDuration) {
					addPtero();
					pteroTime = 0;
					pteroDuration = ctx.rand(4, 5) / ctx.speed;
				}
			}

			if (cactusEnabled) {
				if (cactusTime >= cactusDuration) {
					addCactus();
					cactusTime = 0;
					cactusDuration = ctx.rand(1, 2) / ctx.speed;
				}
			}

			if (pteroAllowed) {
				pteroEnabled = Math.round(ctx.time() % 4) == 0;
				cactusEnabled = !pteroEnabled;
			}
		});

		dino.onCollide("enemy", (enemy) => {
			isDead = true;
			ctx.lose();

			ctx.add([
				ctx.sprite("gameover"),
				ctx.color(PRIMARY_COLOR),
			]);

			const comet = ctx.add([
				ctx.sprite("comet"),
				ctx.color(PRIMARY_COLOR),
				ctx.pos(ctx.width() + 50, -50),
				ctx.anchor("center"),
				ctx.z(100),
			]);

			ctx.tween(comet.pos, dino.pos, 0.25 / ctx.speed, (p) => comet.pos = p).onEnd(() => {
				ctx.play("explosion", { detune: ctx.rand(-50, 50) });
				const kaboom = ctx.add([
					ctx.sprite("kaboom"),
					ctx.pos(dino.pos),
					ctx.color(PRIMARY_COLOR),
					ctx.anchor("center"),
					ctx.scale(),
					ctx.z(100),
				]);

				ctx.tween(kaboom.scale, ctx.vec2(10), 0.5 / ctx.speed, (p) => kaboom.scale = p);
			});

			ctx.wait(0.5 / ctx.speed, () => {
				ctx.finish();
			});
		});

		ctx.onButtonPress("action", () => {
			if (timeout || isDead) return;
			if (dino.isGrounded() && !isDead && !ctx.isButtonDown("down")) {
				dino.jump(900);
				ctx.play("jump", { detune: ctx.rand(-50, 50) });
			}
		});

		ctx.onTimeout(() => {
			timeout = true;
			ctx.get("*").forEach((obj) => obj.destroy());

			ctx.win();
			ctx.play("wifi", { detune: ctx.rand(-50, 50) });
			ctx.add([
				ctx.sprite("wifi"),
				ctx.color(PRIMARY_COLOR),
			]);

			ctx.wait(1 / ctx.speed, () => {
				ctx.finish();
			});
		});

		if (ctx.difficulty == 3) changeColor();
		if (ctx.difficulty == 2 || ctx.difficulty == 3) pteroAllowed = true;

		ctx.onUpdate(() => {
			game.paused = timeout || isDead;
		});

		addGround();
		runSandLoop();
		runCloudLoop();
	},
};

export default dodgeGame;
