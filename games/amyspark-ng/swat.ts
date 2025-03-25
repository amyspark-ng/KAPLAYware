import { Minigame } from "../../src/game/types";
import mulfokColors from "../../src/plugins/colors";

const swatGame: Minigame = {
	prompt: "swat",
	author: "amyspark-ng",
	rgb: mulfokColors.LIGHT_BROWN,
	duration: (ctx) => ctx.difficulty == 3 ? 5 : 4,
	input: { cursor: { hide: true } },
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("hand", "sprites/hand.png");
		ctx.loadSprite("shock", "sprites/shock.png");
		ctx.loadSprite("fly", "sprites/fly.png");
		ctx.loadSound("slap", "sounds/slap.mp3");
		ctx.loadSound("bzz", "sounds/bzz.mp3");
	},
	start(ctx) {
		const game = ctx.make();
		const randPos = () => ctx.vec2(ctx.rand(0, ctx.width()), ctx.rand(0, ctx.height()));
		let flies = ctx.difficulty;

		const hand = game.add([
			ctx.sprite("hand"),
			ctx.pos(),
			ctx.anchor("top"),
			ctx.z(1),
			ctx.scale(),
		]);

		ctx.onButtonPress("click", () => {
			if (game.get("shock").length > 0 || game.get("fly").length <= 0) return;

			ctx.play("slap", { detune: ctx.rand(-50, 50), volume: 0.5 });
			ctx.tween(ctx.vec2(0.5), ctx.vec2(1), 0.15 / ctx.speed, (p) => hand.scale = p);
			const shock = game.add([
				ctx.sprite("shock"),
				ctx.pos(ctx.mousePos().add(0, 100)),
				ctx.anchor("center"),
				ctx.area({ scale: ctx.vec2(0.4) }),
				ctx.z(0),
				ctx.scale(),
				"shock",
			]);
			ctx.tween(ctx.vec2(1.5), ctx.vec2(1), 0.15 / ctx.speed, (p) => shock.scale = p);

			shock.onCollide("fly", (fly) => {
				flies--;
				if (flies <= 0 && !ctx.hasWon()) ctx.win();
				fly.tag("dead");
				ctx.play("bzz", { volume: 3, speed: 3 });
				ctx.tween(ctx.vec2(2), ctx.vec2(1), 0.15 / ctx.speed, (p) => fly.scale = p, ctx.easings.easeOutQuint);
				ctx.tween(ctx.RED, ctx.WHITE, 0.15 / ctx.speed, (p) => fly.color = p, ctx.easings.easeOutQuint);
				ctx.tween(fly.angle, 90, 0.15 / ctx.speed, (p) => fly.angle = p, ctx.easings.easeOutQuint);
				ctx.tween(fly.pos.y, ctx.height() + 10, 0.5 / ctx.speed, (p) => fly.pos.y = p, ctx.easings.easeOutQuint).onEnd(() => {
					if (ctx.hasWon()) ctx.finish();
				});
			});

			ctx.wait(0.5 / ctx.speed, () => shock.destroy());
		});

		function addFly() {
			let flyTime = 0.5;
			const bzzSfx = ctx.play("bzz", { loop: true, volume: 1.5 });

			const fly = game.add([
				ctx.sprite("fly"),
				ctx.anchor("center"),
				ctx.pos(randPos()),
				ctx.area(),
				ctx.scale(),
				ctx.color(),
				ctx.rotate(0),
				"fly",
			]);

			fly.onUpdate(() => {
				// fly loop
				bzzSfx.paused = fly.is("dead");
				if (fly.is("dead")) return;
				flyTime -= ctx.dt();
				if (flyTime <= 0) {
					flyTime = ctx.rand(0.5 / ctx.speed, 0.9 / ctx.speed);
					ctx.tween(fly.pos, randPos(), ctx.rand(0.5, 0.75) / ctx.speed, (p) => {
						if (fly.is("dead")) return;
						fly.pos = p;
					}, ctx.easings.easeOutCubic);
				}
			});
		}

		game.onUpdate(() => {
			hand.pos = ctx.lerp(hand.pos, ctx.mousePos(), 0.5 * ctx.speed);
		});

		ctx.onTimeout(() => {
			if (flies > 0) {
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}
		});

		for (let i = 0; i < flies; i++) addFly();

		return game;
	},
};

export default swatGame;
