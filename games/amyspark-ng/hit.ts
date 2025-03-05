import mulfokColors from "../../src/plugins/colors.ts";
import { Minigame } from "../../src/types.ts";

const hitGame: Minigame = {
	prompt: "hit",
	author: "amyspark-ng",
	rgb: mulfokColors.DARK_PINK,
	mouse: { hidden: true },
	duration: 5,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("tv", "sprites/hit/tvbox.png");
		ctx.loadSprite("tvstatic", "sprites/hit/tvstatic.png");
		ctx.loadSprite("tvbean", "sprites/hit/tvbean.png");
		ctx.loadSprite("hand", "sprites/hit/hand.png");
		ctx.loadSound("hit", "sounds/knock.ogg");
		ctx.loadSound("static", "sounds/static.mp3");
	},
	start(ctx) {
		const game = ctx.make();
		let hitsLeft = ctx.difficulty as number;
		let mouseInsideTV = false;
		let canHit = true;

		const staticSfx = ctx.play("static", { loop: true });
		const burpSfx = ctx.burp({ loop: true });

		const tv = game.add([ctx.scale(1, 1)]);

		const screen = tv.add([
			ctx.sprite("tvstatic"),
			ctx.pos(55, 192),
		]);

		const frame = tv.add([
			ctx.sprite("tv"),
			ctx.pos(20, 30),
		]);

		const hand = game.add([
			ctx.sprite("hand"),
			ctx.pos(),
			ctx.anchor("left"),
		]);

		ctx.onMouseMove(() => {
			const WALL_X = screen.width + 60;

			hand.pos.y = ctx.mousePos().y;
			hand.pos.x = ctx.clamp(ctx.mousePos().x, WALL_X, ctx.width());

			// got inside of the tv
			if (ctx.mousePos().x <= WALL_X && !mouseInsideTV) {
				mouseInsideTV = true;

				// you hit too soft
				if (ctx.mouseDeltaPos().x > -80) return;

				if (canHit == true) {
					hitsLeft--;
					ctx.play("hit", { detune: ctx.rand(-50, 50) });
					screen.flipX = !screen.flipX;
					if (ctx.chance(0.5)) screen.flipY = !screen.flipY;
					ctx.tween(0.9, 1, 0.15 / ctx.speed, (p) => tv.scale.x = p, ctx.easings.easeOutQuint);
				}

				// you fixed it yay!!
				if (hitsLeft == 0 && canHit == true) {
					canHit = false;
					screen.flipX = false;
					screen.flipY = false;
					screen.sprite = "tvbean";
					ctx.tween(0.9, 1, 0.15 / ctx.speed, (p) => tv.scale.x = p, ctx.easings.easeOutQuint);
					if (ctx.difficulty != 3) {
						ctx.win();
						ctx.wait(2, () => {
							ctx.finish();
						});
					}
				}
				// on hard mode, it was fixed and you hit it again, you dummy
				else if (hitsLeft == 0 && ctx.difficulty >= 3 && canHit == false) {
					canHit = true;
					hitsLeft = ctx.randi(1, 2);
					screen.sprite = "tvstatic";
					ctx.play("hit", { detune: ctx.rand(-50, 50) });
					ctx.tween(0.75, 1, 0.15 / ctx.speed, (p) => tv.scale.y = p, ctx.easings.easeOutQuint);
				}
			}
			// you got outside of the tv
			else if (ctx.mousePos().x >= WALL_X && mouseInsideTV) mouseInsideTV = false;
		});

		game.onUpdate(() => {
			staticSfx.paused = !canHit;
			burpSfx.paused = canHit;
		});

		ctx.loop(0.5, () => {
			if (!canHit) return;
			screen.flipX = !screen.flipX;
			if (ctx.chance(0.5)) screen.flipY = !screen.flipY;
			burpSfx.detune = ctx.rand(-10, 10);
		});

		ctx.onTimeout(() => {
			if (!canHit) {
				ctx.win();
				ctx.wait(1, () => {
					ctx.finish();
				});
			}
			else {
				ctx.lose();
				ctx.wait(1, () => {
					ctx.finish();
				});
			}
		});

		return game;
	},
};

export default hitGame;
