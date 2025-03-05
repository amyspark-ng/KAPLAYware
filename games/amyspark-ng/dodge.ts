import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/types.ts";

const newGame: Minigame = {
	prompt: "dodge",
	author: "amyspark-ng",
	duration: 6,
	rgb: [166, 133, 159],
	urlPrefix: "games/amyspark-ng/assets",
	load(ctx) {
		ctx.loadSprite("bean", assets.bean.sprite);
		ctx.loadSprite("butterfly", assets.btfly.sprite);
		ctx.loadSprite("beant", assets.beant.sprite);
	},
	start(ctx) {
		const game = ctx.make();
		ctx.setGravity(2000);

		const SPEED = 480 * ctx.speed;
		const JUMP_FORCE = 900;
		let beanIsDead = false; // nooo
		let canSpawn = true;
		let detectCollect = true;

		function jump(force = JUMP_FORCE) {
			bean.jump(force);
			ctx.tween(0.6, 1.5, 1 / ctx.speed, (p) => bean.scale.x = p, ctx.easings.easeOutQuint);
		}

		function setupSpawnLoop() {
			function spawnTree() {
				if (!canSpawn) return;
				game.add([
					ctx.rect(48, ctx.rand(32, 96)),
					ctx.area(),
					ctx.outline(4),
					ctx.pos(ctx.width(), ctx.height() - 48),
					ctx.anchor("botleft"),
					ctx.color(255, 180, 255),
					ctx.move(ctx.LEFT, SPEED / ctx.speed),
					"enemy",
				]);

				// wait a random amount of time to spawn next tree
				ctx.wait(ctx.rand(0.75 / ctx.speed, 1.5 / ctx.speed), spawnTree);
			}

			function spawnButterfly() {
				if (ctx.difficulty == 1) {
					return;
				}
				if (!canSpawn) return;

				game.add([
					ctx.sprite("@butterfly"),
					ctx.area(),
					ctx.pos(ctx.width(), ctx.height() - 60),
					ctx.anchor("center"),
					ctx.move(ctx.LEFT, SPEED / ctx.speed),
					"enemy",
				]);

				// wait a random amount of time to spawn next tree
				ctx.wait(ctx.rand(1.5 / ctx.speed, 4 / ctx.speed), spawnButterfly);
			}

			// start spawning trees
			spawnTree();
			// spawnButterfly();
		}

		const bean = game.add([
			ctx.sprite("@bean"),
			ctx.pos(80, ctx.height() / 2),
			ctx.scale(1.5),
			ctx.area({ scale: ctx.vec2(0.5) }),
			ctx.anchor("bot"),
			ctx.rotate(0),
			ctx.body(),
		]);

		const ground = game.add([
			ctx.rect(ctx.width(), 48),
			ctx.pos(0, ctx.height() - 48),
			ctx.outline(4),
			ctx.area(),
			ctx.body({ isStatic: true }),
			ctx.color(ctx.WHITE),
		]);

		bean.onCollide("enemy", () => {
			if (!detectCollect) return;

			if (!beanIsDead) {
				beanIsDead = true;
				bean.sprite = "@beant";
				jump();
				ctx.addKaboom(bean.pos);
				ctx.shake();
				bean.area.scale = ctx.vec2(0);
				bean.onUpdate(() => {
					bean.angle -= 1;
				});
			}
		});

		ctx.onButtonDown("down", () => {
			bean.move(0, SPEED * 1.05 / 2);
			if (bean.isGrounded()) bean.scale.y = ctx.lerp(bean.scale.y, 1, 0.5 * ctx.speed);
		});

		ctx.onButtonRelease("down", () => {
			ctx.tween(bean.scale.y, 1.5, 0.25 / ctx.speed, (p) => bean.scale.y = p, ctx.easings.easeOutQuint);
		});

		ctx.onButtonPress("action", () => {
			if (bean.isGrounded()) jump();
		});

		ctx.onTimeout(() => {
			detectCollect = false;

			if (beanIsDead) ctx.lose();
			else {
				canSpawn = false;
				game.get("enemy").forEach((tree) => {
					tree.area.scale = ctx.vec2(0);
					ctx.tween(tree.pos.x, -50, 0.5 / ctx.speed, (p) => tree.pos.x = p, ctx.easings.easeOutQuint);
				});
				ctx.tween(bean.pos.x, ctx.center().x, 0.5, (p) => bean.pos.x = p, ctx.easings.easeOutQuint);
				bean.onGround(() => jump());
				ctx.win();
			}

			ctx.wait(0.8, () => {
				ctx.finish();
			});
		});

		setupSpawnLoop();

		return game;
	},
};

export default newGame;
