import { GameObj, PosComp, SpriteComp, Vec2 } from "kaplay";
import { createMicrogame } from "../../../src/registry";
import { k } from "../../../src/kaplay";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "get",
	prompt: "GET!",
	duration: 5,
	bgColor: "6bc96c",
	hardMode: {
		duration: 6,
	},
	urlPrefix: "microgames/chill/get/",
	load(ctx) {
		ctx.loadCrew("bean");
		ctx.loadCrew("beant");
		ctx.loadCrew("apple");
		ctx.loadCrew("skuller");

		ctx.loadSprite("grass", "sprites/grass.png");
		ctx.loadSprite("trunk", "sprites/trunk.png");
		ctx.loadSprite("bush", "sprites/bush.png");
		ctx.loadSprite("badapple", "sprites/badapple.png"); // cool reference (not related to reference at all)

		ctx.loadSprite("flowers", "sprites/flowers.png");
		ctx.loadSprite("badderapple", "sprites/badderapple.png");
		ctx.loadSprite("basket", "sprites/basket.png", { sliceX: 3, sliceY: 1 });

		ctx.loadSound("rustle", "sounds/bushrustle.mp3");
		ctx.loadSound("box", "../../assets/sounds/box.ogg");
		ctx.loadSound("crunch", "../../assets/sounds/crunch.mp3");
	},
	start(ctx) {
		// TODO
		// RE DRAW TREE
		// ADD MUSIC

		const SPEED = 99999 / 3 * ctx.dt() * ctx.speed;
		const timer = ctx.add([ctx.timer()]);
		ctx.add([ctx.sprite("grass"), ctx.pos(ctx.rand(-20, 20))]); // decoration with random offset
		if (ctx.isHardMode) ctx.add([ctx.sprite("flowers"), ctx.pos(ctx.rand(-20, 20))]);

		const apples = ctx.get("apple", { liveUpdate: true });

		const getRandomPos = () => {
			return ctx.vec2(ctx.rand(0, ctx.width()), ctx.rand(0, ctx.height()));
		};

		const trunkPos = k.vec2(649, 584);

		const applePositions = [ctx.center(), trunkPos, trunkPos.sub(0, 140), trunkPos.sub(0, 250), trunkPos.sub(0, 300)]; // { x, y }

		const MIN_RADIUS = 140; // no other position can be inside this radius
		const MAX_ATTEMPTS = 100;

		function isValid(candidate: Vec2) {
			for (const pos of applePositions) {
				const dx = candidate.x - pos.x;
				const dy = candidate.y - pos.y;
				if (dx * dx + dy * dy < MIN_RADIUS * MIN_RADIUS) {
					return false;
				}
			}
			return true;
		}

		function getRandApplePos() {
			for (let i = 0; i < MAX_ATTEMPTS; i++) {
				const candidate = getRandomPos();

				if (isValid(candidate)) {
					applePositions.push(candidate);
					return candidate;
				}
			}

			throw new Error("Could not find valid position");
		}

		let basket = null as GameObj<SpriteComp>;
		const bean = ctx.add([
			ctx.sprite("bean"),
			ctx.pos(ctx.center()),
			ctx.area({ isSensor: true }),
			ctx.anchor("bot"),
			ctx.scale(1.5),
			ctx.rotate(),
			ctx.z(0.5),
			ctx.body(),
			{
				canMove: true,
			},
		]);

		if (ctx.isHardMode) {
			basket = bean.add([
				ctx.sprite("basket"),
				ctx.pos(-25, -110),
				ctx.z(1),
			]);
		}

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

		const movement = ctx.vec2();
		let lerpMovement = ctx.vec2();
		bean.onUpdate(() => {
			bean.pos.x = ctx.clamp(bean.pos.x, bean.width / 2, ctx.width() - bean.width / 2);
			bean.pos.y = ctx.clamp(bean.pos.y, bean.height / 2, ctx.height() - bean.height / 2);

			if (bean.canMove) {
				// this is to prevent bean going faster on diagonal movement
				movement.x = ctx.isButtonDown("left") ? -1 : ctx.isButtonDown("right") ? 1 : 0;
				movement.y = ctx.isButtonDown("up") ? -1 : ctx.isButtonDown("down") ? 1 : 0;
			}

			// this just lerps a movement to the unit, which rounds the magnitude of 1.4 to 1 :thumbsup:
			lerpMovement = ctx.lerp(lerpMovement, movement.unit().scale(SPEED), 0.75);
			bean.move(lerpMovement);

			if (ctx.getResult() != undefined) {
				movement.x = 0;
				movement.y = 0;
			}

			if (!movement.isZero()) bean.angle = ctx.lerp(bean.angle, ctx.wave(-25, 25, ctx.time() * 12 * ctx.speed), 0.25);
			else {
				if (ctx.getResult() != "lose") bean.angle = ctx.lerp(bean.angle, 0, 0.25);
			}
			bean.flipX = movement.x < 0;
		});

		bean.onCollide("apple", (apple) => {
			apple.destroy();

			if (apple.good) {
				if (!ctx.isHardMode) {
					ctx.setResult("win");
					bean.canMove = false;
					timer.tween(ctx.vec2(3), ctx.vec2(1.5), 0.35 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);
					const crunch = ctx.play("crunch", { detune: ctx.rand(-50, 50) });
					timer.wait(crunch.duration(), () => {
						timer.tween(ctx.vec2(1), ctx.vec2(1.5), 0.25 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);
						const burp = ctx.burp({ detune: ctx.rand(-50 / ctx.speed, 50 * ctx.speed) });
						timer.wait(burp.duration(), () => {
							timer.wait(0.1 / ctx.speed, () => {
								ctx.finishGame();
							});
						});
					});
				}
				else {
					const goodApples = apples.filter((apple) => apple.good);
					basket.frame = 2 - goodApples.length;

					timer.tween(ctx.vec2(3), ctx.vec2(1.5), 0.35 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);
					ctx.play("box", { detune: ctx.rand(-50, 50), speed: 1.25 * ctx.speed });

					if (goodApples.length == 0) {
						ctx.setResult("win");
						bean.canMove = false;

						for (let i = 0; i < 2; i++) {
							timer.wait(0.5 / ctx.speed * i + 0.1, () => {
								ctx.play("crunch", { detune: ctx.rand(-50, 50) });
								basket.frame -= 1;
								timer.tween(ctx.vec2(1), ctx.vec2(1.5), 0.25 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);
							});
						}

						timer.wait(1 / ctx.speed, () => {
							ctx.finishGame();
						});
					}
				}
			}
			else {
				ctx.setResult("lose");
				bean.canMove = false;

				bean.sprite = "skuller";
				ctx.play("crunch", { detune: ctx.rand(-50, 50) });
				timer.tween(ctx.vec2(3), ctx.vec2(1.5), 0.35 / ctx.speed, (p) => bean.scale = p, ctx.easings.easeOutQuint);

				timer.wait(0.5, () => {
					// if it's closer to the left die to the left and visceversa
					timer.tween(0, Math.sign(bean.angle) * 90, 0.15 / ctx.speed, (p) => bean.angle = p, ctx.easings.easeOutExpo);
				});

				timer.wait(1 / ctx.speed, () => {
					ctx.finishGame();
				});
			}
		});

		timer.onDraw(() => {
			// bean shadow
			ctx.drawCircle({
				radius: 20,
				scale: ctx.vec2(2, 1),
				color: ctx.mulfok.VOID_VIOLET,
				opacity: 0.4,
				pos: bean.pos.add(25, -20),
			});

			if (ctx.debug.inspect) {
				applePositions.forEach((pos) => {
					ctx.drawCircle({
						radius: MIN_RADIUS,
						pos: pos,
						anchor: "center",
					});
				});
			}
		});

		ctx.play("rustle", { detune: ctx.rand(-50, 50) });
		bush.shake();
		timer.wait(0.01 / ctx.speed, () => {
			if (ctx.isHardMode) {
				spawnApple(true);
				spawnApple(true);
				spawnApple(false);
				if (ctx.chance(0.5)) spawnApple(false);
			}
			else {
				spawnApple(true);
				if (ctx.chance(0.25)) spawnApple(false);
			}
		});

		function spawnApple(good: boolean) {
			const apple = ctx.add([
				ctx.sprite(good ? "apple" : "badderapple"),
				ctx.pos(bush.screenPos),
				ctx.area({ scale: ctx.vec2(0.5), isSensor: true }),
				ctx.anchor("center"),
				ctx.z(1),
				ctx.rotate(),
				"apple",
				{
					good,
					onFloor: false,
				},
			]);

			timer.onDraw(() => {
				if (apple.onFloor && apple.exists()) {
					ctx.drawCircle({
						radius: 10,
						scale: ctx.vec2(2, 1),
						color: ctx.mulfok.VOID_VIOLET,
						opacity: 0.4,
						pos: apple.pos.add(10, 0),
					});
				}
			});

			apple.collisionIgnore = ["*"];

			timer.tween(apple.pos, trunk.pos, 0.5 / ctx.speed, (p) => apple.pos = p, ctx.easings.easeOutExpo).onEnd(() => {
				apple.onFloor = true;
				timer.wait(0.25 / ctx.speed, () => apple.collisionIgnore = [""]);
				timer.tween(apple.pos, getRandApplePos(), 0.5 / ctx.speed, (p) => apple.pos = p, ctx.easings.easeOutQuint);
				timer.tween(apple.angle, 360 * 2, 0.5 / ctx.speed, (p) => apple.angle = p, ctx.easings.easeOutQuint);
			});
		}

		ctx.onTimeout(() => {
			if (ctx.getResult() != undefined) return;

			// this means you ran out of time to pick up the good apples
			bean.canMove = false;
			bean.sprite = "beant";
			ctx.setResult("lose");
			timer.wait(0.5 / ctx.speed, () => ctx.finishGame());

			apples.filter((apple) => apple.good).forEach((apple) => {
				apple.destroy();
				const badapple = ctx.add([ctx.sprite("badapple"), ctx.scale(), ctx.pos(apple.pos.sub(15, 0)), ctx.anchor("center")]);
				timer.tween(ctx.vec2(1.5), ctx.vec2(1), 0.15 / ctx.speed, (p) => badapple.scale = p, ctx.easings.easeOutQuint);
			});
		});

		for (let i = 0; i < 10; i++) {
			ctx.add([
				ctx.circle(ctx.rand(1, 5)),
				ctx.opacity(ctx.rand(0.1, 0.5)),
				ctx.pos(getRandomPos()),
			]);
		}
	},
});
