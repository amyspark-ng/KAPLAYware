import { Minigame } from "../../src/game/types";

const avoidGame: Minigame = {
	prompt: "avoid",
	author: "amyspark-ng",
	rgb: (ctx) => ctx.mulfok.DARK_BLUE,
	duration: 6,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSound("squash", "sounds/squash.mp3");
		ctx.loadSound("stomp", "sounds/stomp.wav");
		ctx.loadAseprite("foot", "sprites/avoid/leg.png", "sprites/avoid/leg.json");
		ctx.loadAseprite("marky", "sprites/avoid/marky.png", "sprites/avoid/marky.json");
	},
	start(ctx) {
		let SPEED = 300 * ctx.speed;
		const movement = ctx.vec2(0);
		const icy = 0.25 * ctx.speed;

		let footInGame = true;
		let markDead = false;

		ctx.setGravity(1300);

		const ground = ctx.add([
			ctx.rect(ctx.width(), 50),
			ctx.outline(5, ctx.BLACK),
			ctx.area(),
			ctx.pos(0, ctx.height() - 50),
			ctx.body({ isStatic: true, gravityScale: 0 }),
		]);

		const mark = ctx.add([
			ctx.sprite("marky", { anim: "Fwonk" }),
			ctx.pos(ctx.center().x, ctx.center().y + 120),
			ctx.anchor("bot"),
			ctx.area({ scale: ctx.vec2(0.5), offset: ctx.vec2(0, -10) }),
			ctx.body(),
			ctx.scale(),
		]);

		const foot = ctx.add([
			ctx.sprite("foot", { anim: "Leg" }),
			ctx.anchor("bot"),
			ctx.area({ scale: ctx.vec2(0.5, 0.9), offset: ctx.vec2(0, -50) }),
			ctx.pos(ctx.center()),
			"foot",
		]);

		ctx.onUpdate(() => {
			if (markDead) return;
			mark.flipX = ctx.isInputButtonDown("left");
			mark.area.scale = ctx.isInputButtonDown("down") ? ctx.vec2(0.5, 0.25) : ctx.vec2(0.5);
			SPEED = ctx.isInputButtonDown("down") ? 350 * ctx.speed : 300 * ctx.speed;

			if (footInGame) {
				if (ctx.isInputButtonDown("down")) {} // mark.play("crouch")
				else if (ctx.isInputButtonPressed("left") || ctx.isInputButtonPressed("right") && !ctx.isInputButtonDown("down")) mark.play("Walk");
				if (!ctx.isInputButtonDown("down") && !ctx.isInputButtonDown("left") && !ctx.isInputButtonDown("right")) mark.play("Fwonk");

				if (ctx.isInputButtonDown("left")) movement.x = ctx.lerp(movement.x, -SPEED, icy);
				else if (ctx.isInputButtonDown("right")) movement.x = ctx.lerp(movement.x, SPEED, icy);
				else movement.x = ctx.lerp(movement.x, 0, icy);

				mark.move(movement.x, 0);
			}
			mark.pos.x = ctx.clamp(mark.pos.x, 0, ctx.width());

			// feet
			if (footInGame) foot.pos.x = ctx.lerp(foot.pos.x, ctx.wave(20, ctx.width() - 20, ctx.time() / ctx.speed), 0.05 * ctx.speed);
			else foot.pos.y = ctx.lerp(foot.pos.y, -100, 0.5 * ctx.speed);
		});

		function stomp() {
			ctx.wait(0.05 / 2 / ctx.speed, () => mark.jump());
			ctx.tween(foot.pos.y, ctx.height() - 45, 0.1 / ctx.speed, (p) => foot.pos.y = p, ctx.easings.easeOutExpo).onEnd(() => {
				ctx.play("stomp", { detune: ctx.rand(-50, 50) });
				if (!mark.isColliding(foot)) ctx.tween(foot.pos.y, ctx.center().y, 0.5 / ctx.speed, (p) => foot.pos.y = p);
			});
		}

		mark.onCollide("foot", () => {
			markDead = true;
			ctx.play("squash", { detune: ctx.rand(-50, 50) });
			mark.destroy();
			ctx.lose();
			ctx.wait(0.5, () => ctx.finish());
		});

		ctx.wait(0.75 / ctx.speed, () => {
			ctx.loop(2 / ctx.speed, () => {
				if (mark.isGrounded() && footInGame) {
					stomp();
				}
			});
		});

		ctx.onTimeout(() => {
			if (markDead) return;
			ctx.win();
			footInGame = false;

			ctx.wait(0.5 / ctx.speed, () => {
				ctx.finish();
			});
		});
	},
};

export default avoidGame;
