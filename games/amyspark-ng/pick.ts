import k from "../../src/engine";
import { Minigame } from "../../src/types";

const pickGame: Minigame = {
	prompt: "pick",
	author: "amyspark-ng",
	rgb: k.WHITE,
	duration: 6,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSound("sniff", "sounds/sniff.mp3");
		ctx.loadSprite("hand", "sprites/pick/hand.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSprite("booger", "sprites/pick/booger.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSprite("nosetop", "sprites/pick/nosetop.png", { sliceY: 1, sliceX: 3 });
		ctx.loadSprite("nosebot", "sprites/pick/nosebot.png", { sliceY: 1, sliceX: 3 });
	},
	start(ctx) {
		const game = ctx.make();

		const hand = game.add([
			ctx.sprite("hand"),
			ctx.anchor("bot"),
			ctx.pos(ctx.center().x, ctx.height()),
			ctx.z(1),
		]);

		const indexFingerArea = hand.add([
			ctx.anchor("center"),
			ctx.rect(40, 40),
			ctx.area(),
			ctx.pos(),
			ctx.opacity(0),
			"handarea",
		]);

		hand.pos.y = ctx.height() + hand.height / 2;
		hand.frame = ctx.difficulty - 1;
		indexFingerArea.pos.y = -hand.height + 40;
		indexFingerArea.pos.x = ctx.difficulty == 1 || ctx.difficulty == 3 ? -hand.width / 2 + 40 : hand.width / 2 - 40;

		let pinkyFingerArea: typeof indexFingerArea;
		if (ctx.difficulty == 3) {
			pinkyFingerArea = hand.add([
				ctx.anchor("center"),
				ctx.rect(40, 40),
				ctx.area(),
				ctx.pos(),
				ctx.opacity(0),
				"handarea",
			]);

			pinkyFingerArea.pos.y = -hand.height + 40;
			pinkyFingerArea.pos.x = hand.width / 2 - 40;
		}

		const nosebot = game.add([
			ctx.sprite("nosebot"),
			ctx.pos(ctx.center().x + 1, 188),
			ctx.anchor("top"),
			ctx.z(0),
		]);

		const nosetop = game.add([
			ctx.sprite("nosetop"),
			ctx.pos(ctx.center().x, 0),
			ctx.anchor("top"),
			ctx.scale(),
			ctx.z(2),
		]);

		const leftnostril = nosebot.add([ctx.area(), ctx.opacity(0), ctx.rect(50, 40), ctx.pos(-90, 0), "nostril"]);
		const middleofnose = nosebot.add([ctx.area(), ctx.opacity(0), ctx.rect(30, 40), ctx.pos(-15, 0)]);
		const rightnostril = nosebot.add([ctx.area(), ctx.opacity(0), ctx.rect(50, 40), ctx.pos(30, 0), "nostril"]);

		let moving = true;
		let pressedAction = false;
		game.onUpdate(() => {
			if (!moving) return;

			// nosebot.pos.y = ctx.mousePos().y;
			// ctx.debug.log(nosebot.pos.y);

			const x = ctx.wave(hand.width, ctx.width() - hand.width, ctx.time() * ctx.speed);
			hand.pos.x = ctx.lerp(hand.pos.x, x, 0.5);
		});

		let boogersLeft = ctx.difficulty < 3 ? 1 : 2;
		let collidedWithMiddle = false;
		ctx.onButtonPress("action", () => {
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
					ctx.wait(0.5 / ctx.speed, () => ctx.finish());
				}
			}, ctx.easings.easeInBack);

			const collide = ctx.onCollide("handarea", "nostril", (fingerarea, boogernostril, col) => {
				boogersLeft--;
				if (boogersLeft == 0 || collidedWithMiddle) collide.cancel();
				if (collidedWithMiddle) return;
				ctx.wait(0.1 / ctx.speed, () => {
					ctx.tween(ctx.vec2(1.1), ctx.vec2(1), 0.25 / ctx.speed, (p) => nosetop.scale = p, ctx.easings.easeOutQuint);
					const booger = hand.add([
						ctx.sprite("booger"),
						ctx.pos(fingerarea.pos.x, fingerarea.pos.y - 20),
						ctx.anchor("center"),
					]);

					booger.frame = ctx.randi(0, 2);

					const trail = game.add([
						ctx.sprite("booger"),
						ctx.pos(nosebot.toWorld(boogernostril.pos).x + 25, nosebot.toWorld(boogernostril.pos).y),
						ctx.z(hand.z),
						ctx.opacity(0.75),
						ctx.anchor("top"),
					]);

					let initialWidth = trail.width;
					trail.frame = ctx.randi(0, 2);
					trail.onUpdate(() => {
						const difference = hand.toWorld(indexFingerArea.pos).y - nosebot.toWorld(boogernostril.pos).y;
						trail.height = difference;
						trail.width = ctx.map(difference, 0, 207, initialWidth, 0);
						if (trail.width <= 0) trail.destroy();
					});
				});
			});

			moveUpTween.onEnd(() => {
				ctx.wait(0.5 / ctx.speed, () => {
					const moveDownTween = ctx.tween(hand.pos.y, ctx.height() + hand.height / 2, 0.5 / ctx.speed, (p) => hand.pos.y = p, ctx.easings.easeOutQuint).onEnd(() => {
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
			if (boogersLeft > 0) {
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => {
					ctx.finish();
				});
			}
		});

		return game;
	},
};

export default pickGame;
