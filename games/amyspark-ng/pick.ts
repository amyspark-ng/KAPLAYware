import k from "../../src/engine";
import { Minigame } from "../../src/game/types";

const pickGame: Minigame = {
	prompt: "PICK!",
	author: "amyspark-ng",
	rgb: k.WHITE,
	duration: 6,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("hand", "sprites/pick/hand.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSprite("booger", "sprites/pick/booger.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSprite("nosetop", "sprites/pick/nosetop.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSprite("nosebot", "sprites/pick/nosebot.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSound("sniff", "sounds/sniff.mp3");
		ctx.loadSound("splat", "sounds/splat.mp3");
		ctx.loadSound("pick", "sounds/pick.ogg");
	},
	start(ctx) {
		const hand = ctx.add([
			ctx.sprite("hand"),
			ctx.anchor("bot"),
			ctx.pos(ctx.center().x, ctx.height()),
			ctx.z(1),
		]);

		const indexFingerArea = ctx.add([
			ctx.anchor("center"),
			ctx.rect(40, 40),
			ctx.area(),
			ctx.pos(),
			ctx.opacity(0),
			ctx.z(0),
			ctx.follow(hand, ctx.vec2(-60, -hand.height + 20)),
			"handarea",
		]);

		hand.pos.y = ctx.height() + hand.height / 2;
		hand.frame = ctx.difficulty - 1;
		if (ctx.difficulty == 2) indexFingerArea.destroy();

		let pinkyFingerArea: typeof indexFingerArea;
		if (ctx.difficulty == 2 || ctx.difficulty == 3) {
			pinkyFingerArea = ctx.add([
				ctx.anchor("center"),
				ctx.rect(40, 40),
				ctx.area(),
				ctx.pos(),
				ctx.opacity(0),
				ctx.follow(hand, ctx.vec2(90, -hand.height + 30)),
				ctx.z(0),
				"handarea",
			]);
		}

		const nosebot = ctx.add([
			ctx.sprite("nosebot"),
			ctx.pos(ctx.center().x + 1, 188),
			ctx.anchor("top"),
			ctx.z(0),
		]);

		const mask = ctx.add([
			ctx.rect(ctx.width(), 200),
			ctx.z(1),
		]);

		const nosetop = ctx.add([
			ctx.sprite("nosetop"),
			ctx.pos(ctx.center().x, 0),
			ctx.anchor("top"),
			ctx.scale(),
			ctx.z(2),
		]);

		const leftnostril = ctx.add([ctx.area(), ctx.opacity(0), ctx.rect(50, 40), ctx.pos(nosebot.pos.add(-90, 0)), "nostril"]);
		const middleofnose = ctx.add([ctx.area(), ctx.opacity(0), ctx.rect(30, 40), ctx.pos(nosebot.pos.add(-15, 0))]);
		const rightnostril = ctx.add([ctx.area(), ctx.opacity(0), ctx.rect(50, 40), ctx.pos(nosebot.pos.add(30, 0)), "nostril"]);

		let moving = true;
		let pressedAction = false;
		ctx.onUpdate(() => {
			if (!moving) return;
			const x = ctx.wave(hand.width, ctx.width() - hand.width, ctx.time() * ctx.speed);
			hand.pos.x = ctx.lerp(hand.pos.x, x, 0.5);
		});

		let boogersLeft = ctx.difficulty < 3 ? 1 : 2;
		let collidedWithMiddle = false;
		ctx.onInputButtonPress("action", () => {
			if (pressedAction) return;
			pressedAction = true;
			moving = false;
			const moveUpTween = ctx.tween(hand.pos.y, hand.pos.y - hand.height / 2 + 20, 0.5 / ctx.speed, (p) => {
				hand.pos.y = p;

				if (indexFingerArea.isColliding(middleofnose) || pinkyFingerArea?.isColliding(middleofnose)) {
					nosetop.frame = 1;
					nosebot.frame = 1;
					collidedWithMiddle = true;
					moveUpTween.cancel();
					ctx.lose();
					ctx.play("pick", { detune: ctx.rand(-50, 50) });
					ctx.wait(0.5 / ctx.speed, () => ctx.finish());
				}
			}, ctx.easings.easeInBack);

			const collide = ctx.onCollide("handarea", "nostril", (fingerarea, nostril, col) => {
				if (!col?.isTop()) return;
				boogersLeft--;
				if (boogersLeft == 0 || collidedWithMiddle) collide.cancel();
				if (collidedWithMiddle) return;
				ctx.wait(0.1 / ctx.speed, () => {
					ctx.tween(ctx.vec2(1.1), ctx.vec2(1), 0.25 / ctx.speed, (p) => nosetop.scale = p, ctx.easings.easeOutQuint);
					const booger = ctx.add([
						ctx.sprite("booger"),
						ctx.pos(0, 0),
						ctx.follow(fingerarea, ctx.vec2(0, -20)),
						ctx.anchor("center"),
					]);

					ctx.play("splat", { detune: ctx.rand(-50, 50) });
					booger.frame = ctx.randi(0, 2);

					const trail = ctx.add([
						ctx.sprite("booger"),
						ctx.pos(nostril.pos.x + nostril.width / 2, nostril.pos.y),
						ctx.z(hand.z),
						ctx.opacity(0.75),
						ctx.anchor("top"),
					]);

					trail.frame = ctx.randi(0, 2);
					trail.onUpdate(() => {
						let difference = indexFingerArea.pos.y - nostril.pos.y;
						trail.width = ctx.map(difference, 0, 187, booger.width, 0);
						trail.height = difference;
					});
				});
			});

			moveUpTween.onEnd(() => {
				ctx.wait(0.5 / ctx.speed, () => {
					ctx.tween(hand.pos.y, ctx.height() + hand.height / 2, 0.5 / ctx.speed, (p) => hand.pos.y = p, ctx.easings.easeOutQuint).onEnd(() => {
						if (boogersLeft > 0) {
							ctx.lose();
							ctx.wait(0.5 / ctx.speed, () => ctx.finish());
						}
						else if (boogersLeft == 0) {
							ctx.win();
							ctx.play("sniff", { detune: ctx.rand(-50, 50), volume: 0.5, speed: ctx.speed });
							nosetop.frame = 2;
							nosebot.frame = 2;
							ctx.tween(ctx.vec2(1.1), ctx.vec2(1), 0.15 / ctx.speed, (p) => nosetop.scale = p, ctx.easings.easeOutQuint);
							ctx.wait(0.15 / ctx.speed, () => {
								nosetop.frame = 0;
								nosebot.frame = 0;
							});
							ctx.wait(0.5 / ctx.speed, () => ctx.finish());
						}
					});
				});
			});
		});

		ctx.onTimeout(() => {
			if (boogersLeft > 0 || !pressedAction) {
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => {
					ctx.finish();
				});
			}
		});
	},
};

export default pickGame;
