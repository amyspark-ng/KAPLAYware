import { Minigame } from "../../src/types/Minigame";

const hitGame: Minigame = {
	name: "hit",
	author: "amyspark-ng",
	prompt: "HIT!",
	rgb: (ctx) => ctx.mulfok.DARK_PINK,
	input: "mouse (hidden)",
	duration: 5,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("table", "sprites/hit/table.png");
		ctx.loadSprite("static", "sprites/hit/static.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("news", "sprites/hit/news.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("sports", "sprites/hit/sports.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("products", "sprites/hit/products.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("hand", "sprites/hit/hand.png");
		ctx.loadSound("hit", "sounds/knock.ogg");
		ctx.loadSound("static", "sounds/static.ogg");
		ctx.loadSound("tvsound", "sounds/tvsound.mp3");
	},
	start(ctx) {
		let hitsLeft = ctx.difficulty == 1 ? 2 : ctx.difficulty == 2 ? 3 : ctx.difficulty == 3 ? ctx.randi(3, 5) : 0;
		let mouseInsideTV = false;
		let canHit = true;

		const staticSfx = ctx.play("static", { loop: true });
		const table = ctx.add([ctx.sprite("table"), ctx.pos(10, 563)]);
		const tv = ctx.add([ctx.sprite("static"), ctx.anchor("left"), ctx.pos(47, 309), ctx.scale()]);

		const hand = ctx.add([
			ctx.sprite("hand"),
			ctx.pos(),
			ctx.anchor("left"),
		]);

		ctx.onMouseMove(() => {
			const WALL_X = ctx.center().x + 15;

			hand.pos.y = ctx.lerp(hand.pos.y, ctx.mousePos().y, 0.8);
			hand.pos.x = ctx.lerp(hand.pos.x, ctx.clamp(ctx.mousePos().x, WALL_X, ctx.width()), 0.8);

			// got inside of the tv
			if (ctx.mousePos().x <= WALL_X && !mouseInsideTV) {
				mouseInsideTV = true;

				// you hit too soft
				if (ctx.mouseDeltaPos().x > -80) return;

				if (canHit == true) {
					hitsLeft--;
					ctx.play("hit", { detune: ctx.rand(-50, 50) });
					ctx.tween(0.9, 1, 0.15 / ctx.speed, (p) => tv.scale.x = p, ctx.easings.easeOutQuint);
				}

				// you fixed it yay!!
				if (hitsLeft == 0 && canHit == true) {
					canHit = false;
					tv.sprite = ctx.choose(["news", "sports", "products"]);
					staticSfx.stop();
					ctx.play("tvsound", { detune: ctx.rand(-150, 150), loop: true });
					ctx.tween(0.9, 1, 0.15 / ctx.speed, (p) => tv.scale.x = p, ctx.easings.easeOutQuint);
					ctx.win();
					ctx.wait(0.75 / ctx.speed, () => {
						ctx.finish();
					});
				}
			}
			// you got outside of the tv
			else if (ctx.mousePos().x >= WALL_X && mouseInsideTV) mouseInsideTV = false;
		});

		ctx.onUpdate(() => {
			if (hitsLeft <= 0) tv.frame = Math.floor(ctx.time() * 5 % 2);
			else tv.frame = Math.floor((ctx.time() * 10) % 2);
		});

		ctx.onTimeout(() => {
			if (hitsLeft > 0) {
				ctx.lose();
				ctx.wait(0.5, () => {
					ctx.finish();
				});
			}
		});
	},
};

export default hitGame;
