import { Minigame } from "../../src/game/types";

const mineGame: Minigame = {
	prompt: "MINE!",
	author: "amyspark-ng",
	rgb: (ctx) => ctx.mulfok.VOID_VIOLET,
	input: "mouse (hidden)",
	duration: 5,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSound("bling", "sounds/bling.mp3");
		ctx.loadSound("rockhit", "sounds/rockhit.mp3");
		ctx.loadSound("avalanche", "sounds/avalanche.mp3");
		ctx.loadSprite("pickaxe", "sprites/mine/pickaxe.png");
		ctx.loadSprite("bg", "sprites/mine/background.png");
		ctx.loadSprite("peddle", "sprites/mine/peddle.png");
		ctx.loadSprite("rocks", "sprites/mine/rocks.png", {
			sliceX: 7,
			sliceY: 1,
			anims: {
				"diamond": {
					from: 4,
					to: 6,
					loop: true,
				},
			},
		});
	},
	start(ctx) {
		ctx.add([ctx.sprite("bg")]);
		const getHits = () => {
			if (ctx.difficulty == 1 || ctx.difficulty == 2) return ctx.randi(2, 3);
			else return ctx.randi(4, 5);
		};
		const totalHits = getHits();
		let hitsLeft = totalHits;
		let timeOut = false;
		let insideRock = false;
		let hasWon = false;

		const rocks = ctx.add([
			ctx.sprite("rocks"),
			ctx.pos(ctx.center().x, ctx.height()),
			ctx.anchor("bot"),
			ctx.scale(),
			ctx.z(2),
		]);

		const pickaxe = ctx.add([
			ctx.sprite("pickaxe"),
			ctx.anchor("center"),
			ctx.rotate(0),
			ctx.pos(),
			ctx.scale(),
			ctx.z(rocks.z + 1),
		]);

		function hitParticles() {
			const particleSpeed = ctx.vec2(ctx.rand(-10, 10), 500).scale(ctx.speed);
			const splatter = ctx.add([
				ctx.pos(rocks.pos.sub(0, rocks.height / 2).add(ctx.rand(-40, 50), ctx.rand(-40, 50))),
				ctx.z(rocks.z + 1),
				ctx.particles({
					max: 20,
					speed: [particleSpeed.x, particleSpeed.y],
					acceleration: [particleSpeed.scale(2), particleSpeed.scale(3)],
					lifeTime: [999, 999],
					colors: [ctx.WHITE],
					opacities: [1.0],
					angle: [0, 360],
					angularVelocity: [0, 50 * ctx.speed],
					// @ts-ignore
					texture: ctx.getSprite("peddle").data.tex,
					// @ts-ignore
					quads: [ctx.getSprite("peddle").data.frames[0]],
				}, {
					lifetime: 1,
					rate: 0,
					direction: -90,
					spread: 45,
					position: ctx.vec2(),
				}),
			]);

			splatter.emit(ctx.randi(10, 20));
			splatter.onEnd(() => splatter.destroy());
		}

		ctx.onUpdate(() => {
			pickaxe.pos = ctx.mousePos();
			const angle = ctx.mousePos().x >= ctx.center().x ? -90 : 90;
			pickaxe.angle = ctx.lerp(pickaxe.angle, ctx.map(ctx.mousePos().y, 100, ctx.height() - 50, 0, angle), 0.5);

			if (ctx.mousePos().y >= ctx.height() - 50 && !insideRock) {
				insideRock = true;

				// you hit too soft
				if (ctx.mouseDeltaPos().y < 40) {
					ctx.tween(0.9, 1, 0.15 / ctx.speed, (p) => rocks.scale.y = p, ctx.easings.easeOutQuint);
					return;
				}

				if (!timeOut && hitsLeft > 0) {
					hitsLeft--;
					hitParticles();
					ctx.play("rockhit", { detune: ctx.rand(-50, 50) });
					rocks.frame = ctx.mapc(hitsLeft, 1, totalHits, 3, 0);
					ctx.tween(0.1, 1, 0.15 / ctx.speed, (p) => rocks.scale.y = p, ctx.easings.easeOutQuint);
				}

				if (hitsLeft == 0 && !timeOut && !hasWon) {
					hasWon = true;
					hitParticles();
					ctx.play("rockhit", { detune: ctx.rand(-50, 50) });
					// TODO: Figure out why frames 5 and 6 are empty
					rocks.play("diamond", { speed: 5 * ctx.speed });
					ctx.play("bling", { detune: ctx.rand(-50, 50), speed: ctx.speed });
					ctx.tween(ctx.vec2(1.5), ctx.vec2(1), 0.15 / ctx.speed, (p) => rocks.scale = p, ctx.easings.easeOutQuint);
					ctx.win();
					ctx.wait(1 / ctx.speed, () => ctx.finish());
				}
			}
			else if (ctx.mousePos().y <= ctx.height() - 50 && insideRock) insideRock = false;
		});

		ctx.onTimeout(() => {
			timeOut = true;
			if (hitsLeft > 0) {
				ctx.lose();

				for (let i = 0; i < 10; i++) {
					ctx.shakeCam(5);
					const boulder = ctx.add([
						ctx.sprite("peddle"),
						ctx.scale(ctx.rand(3, 5)),
						ctx.pos(ctx.randi(0, ctx.width()), -10),
						ctx.rotate(0),
						ctx.z(4),
					]);

					boulder.onUpdate(() => {
						boulder.angle += 1.5 * ctx.speed;
						boulder.pos.y += 5 * boulder.scale.y * ctx.speed;
					});
				}

				ctx.play("avalanche", { detune: ctx.rand(-100, -50), volume: 2 });
				ctx.wait(1 / ctx.speed, () => ctx.finish());
			}
		});
	},
};

export default mineGame;
