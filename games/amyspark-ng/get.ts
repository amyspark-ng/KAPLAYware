import { Vec2 } from "kaplay";
import { Minigame } from "../../src/types/Minigame";

const getGame: Minigame = {
	name: "get",
	author: "amyspark-ng",
	prompt: "GET!",
	rgb: (ctx) => ctx.mulfok.GREEN,
	duration: (ctx) => ctx.difficulty == 3 ? 3.5 : 4,
	input: "keys",
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("grass", "sprites/get/grass.png");
		ctx.loadSprite("trunk", "sprites/get/trunk.png");
		ctx.loadSprite("bush", "sprites/get/bush.png");
		ctx.loadSprite("badapple", "sprites/get/badapple.png"); // cool reference (not related to reference at all)
		ctx.loadSound("crunch", "sounds/crunch.mp3");
		ctx.loadSound("rustle", "sounds/bushrustle.mp3");
	},
	start(ctx) {
		const SPEED = 400 * ctx.speed;
		ctx.add([ctx.sprite("grass")]);

		let appleOnFloor = false;
		let appleFinishedMoving = false;

		const getApplePos = () => {
			const randAngle = ctx.rand(2, 4); // i don't get this angle system
			const magnitude = ctx.difficulty == 1
				? 150
				: ctx.difficulty == 2
				? 250
				: ctx.difficulty == 3
				? 300
				: 0;

			const X = ctx.center().x + magnitude * Math.cos(randAngle);
			const Y = ctx.center().y + magnitude * Math.sin(randAngle);
			return ctx.vec2(X, Y);
		};

		const bean = ctx.add([
			ctx.sprite("@bean"),
			ctx.pos(getApplePos()),
			ctx.area(),
			ctx.anchor("bot"),
			ctx.scale(1.5),
			ctx.rotate(),
			ctx.z(0.5),
			ctx.body(),
		]);

		const trunk = ctx.add([
			ctx.sprite("trunk"),
			ctx.anchor("bot"),
			ctx.scale(),
			ctx.pos(649, 584),
			ctx.z(1),
			ctx.area({ scale: ctx.vec2(0.5, 0.1), offset: ctx.vec2(-25, 0) }),
			ctx.body({ isStatic: true }),
		]);

		let bushShake = 0;
		const bush = ctx.add([
			ctx.sprite("bush"),
			ctx.anchor("center"),
			ctx.scale(),
			ctx.pos(trunk.pos.x, trunk.pos.y - trunk.height - 70),
			ctx.z(2),
			{
				shake() {
					const thePos = ctx.vec2(trunk.pos.x, trunk.pos.y - trunk.height - 70);
					bushShake = 14;
					this.onUpdate(() => {
						bushShake = ctx.lerp(bushShake, 0, 5 * ctx.dt());
						let posShake = ctx.Vec2.fromAngle(ctx.rand(0, 360)).scale(bushShake);
						this.pos = thePos.add(posShake);
					});
				},
			},
		]);

		const apple = ctx.add([
			ctx.sprite("@apple"),
			ctx.pos(bush.screenPos() as Vec2),
			ctx.area({ scale: ctx.vec2(0.5) }),
			ctx.anchor("center"),
			ctx.z(1),
			ctx.rotate(),
			"apple",
		]);

		bean.pos = ctx.center();

		const movement = ctx.vec2();
		let lerpMovement = ctx.vec2();
		bean.onUpdate(() => {
			bean.pos.x = ctx.clamp(bean.pos.x, bean.width / 2, ctx.width() - bean.width / 2);
			bean.pos.y = ctx.clamp(bean.pos.y, bean.height / 2, ctx.height() - bean.height / 2);

			// this is to prevent bean going faster on diagonal movement
			movement.x = ctx.isButtonDown("left") ? -1 : ctx.isButtonDown("right") ? 1 : 0;
			movement.y = ctx.isButtonDown("up") ? -1 : ctx.isButtonDown("down") ? 1 : 0;

			// this just lerps a movement to the unit, which rounds the magnitude of 1.4 to 1 :thumbsup:
			lerpMovement = ctx.lerp(lerpMovement, movement.unit().scale(SPEED), 0.75);
			bean.move(lerpMovement);
			if (!movement.isZero()) bean.angle = ctx.lerp(bean.angle, ctx.wave(-25, 25, ctx.time() * 12 * ctx.speed), 0.25);
			else bean.angle = ctx.lerp(bean.angle, 0, 0.25);
			bean.flipX = movement.x < 0;
		});

		bean.onCollide("apple", () => {
			if (!appleFinishedMoving) return;
			apple.destroy();
			ctx.win();
			ctx.tween(ctx.vec2(3), ctx.vec2(1.5), 0.35 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);
			const crunch = ctx.play("crunch", { detune: ctx.rand(-50, 50) });
			ctx.wait(crunch.duration(), () => {
				ctx.tween(ctx.vec2(1), ctx.vec2(1.5), 0.25 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);
				const burp = ctx.burp({ detune: ctx.rand(-50 / ctx.speed, 50 * ctx.speed) });
				ctx.wait(burp.duration(), () => {
					ctx.wait(0.1 / ctx.speed, () => {
						ctx.finish();
					});
				});
			});
		});

		ctx.onDraw(() => {
			if (appleOnFloor && !ctx.winState) {
				ctx.drawCircle({
					radius: 10,
					scale: ctx.vec2(2, 1),
					color: ctx.mulfok.VOID_VIOLET,
					opacity: 0.4,
					pos: apple.pos.add(10, 0),
				});
			}

			// bean shadow
			ctx.drawCircle({
				radius: 20,
				scale: ctx.vec2(2, 1),
				color: ctx.mulfok.VOID_VIOLET,
				opacity: 0.4,
				pos: bean.pos.add(25, -20),
			});
		});

		ctx.play("rustle", { detune: ctx.rand(-50, 50) });
		bush.shake();
		ctx.tween(apple.pos, trunk.pos, 0.5 / ctx.speed, (p) => apple.pos = p, ctx.easings.easeOutExpo).onEnd(() => {
			appleOnFloor = true;
			ctx.tween(apple.pos, getApplePos(), 0.5 / ctx.speed, (p) => apple.pos = p, ctx.easings.easeOutQuint).onEnd(() => appleFinishedMoving = true);
			ctx.tween(apple.angle, 360 * 2, 0.5 / ctx.speed, (p) => apple.angle = p, ctx.easings.easeOutQuint);
		});

		ctx.onTimeout(() => {
			if (apple.exists()) {
				bean.sprite = "@beant";
				apple.destroy();
				const badapple = ctx.add([ctx.sprite("badapple"), ctx.scale(), ctx.pos(apple.pos.sub(15, 0)), ctx.anchor("center")]);
				ctx.tween(ctx.vec2(1.5), ctx.vec2(1), 0.15 / ctx.speed, (p) => badapple.scale = p, ctx.easings.easeOutQuint);
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}
		});
	},
};

export default getGame;
