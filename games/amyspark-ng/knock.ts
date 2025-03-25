import { assets } from "@kaplayjs/crew";
import { Minigame } from "../../src/game/types";
import { mulfokColors } from "../../src/plugins/colors";

const knockGame: Minigame = {
	prompt: "knock",
	input: { cursor: { hide: false } },
	author: "amyspark-ng",
	rgb: [74, 48, 82],
	duration: (ctx) => ctx.difficulty == 3 ? 4.5 : 4,
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("angry", "sprites/knock/angry.png");
		ctx.loadSprite("text", "sprites/knock/text.png");
		ctx.loadSprite("door", "sprites/knock/door.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSound("knock", "sounds/knock.ogg");
		ctx.loadSound("escape", "sounds/cartoonescape.ogg");
		ctx.loadSound("door", "sounds/door.ogg");
	},
	start(ctx) {
		const game = ctx.make();
		game.add([ctx.rect(ctx.width() * 10, ctx.height() * 3), ctx.anchor("top"), ctx.color(74, 48, 82)]);
		const totalKnocks = ctx.difficulty == 1 ? 3 : ctx.difficulty == 2 ? 6 : ctx.difficulty == 3 ? 10 : 10;
		let knocksLeft = totalKnocks;
		let hasWon = false;

		function addTextbox(string: string, angry: boolean) {
			const t = game.add([
				ctx.sprite(angry ? "angry" : "text"),
				ctx.anchor("center"),
				ctx.scale(),
				ctx.pos(),
			]);

			const s = t.add([
				ctx.text(string, { font: "happy", align: "center" }),
				ctx.scale(),
				ctx.anchor("center"),
				ctx.color(mulfokColors.VOID_VIOLET),
			]);

			ctx.tween(ctx.vec2(0), ctx.vec2(1), 0.1 / ctx.speed, (p) => t.scale = p, ctx.easings.easeOutQuint);
			ctx.tween(ctx.vec2(0), ctx.vec2(1), 0.2 / ctx.speed, (p) => s.scale = p, ctx.easings.easeOutQuint);

			return t;
		}

		const DOOR_SCALE = 4;
		const door = game.add([
			ctx.sprite("door"),
			ctx.anchor("center"),
			ctx.pos(ctx.center()),
			ctx.scale(DOOR_SCALE),
			ctx.area(),
		]);

		function beanComeOut() {
			door.frame = 1;

			ctx.play("door", { detune: ctx.rand(-50, 50) });
			const bean = game.add([
				ctx.sprite("@bean"),
				ctx.pos(ctx.center().add(0, 50)),
				ctx.scale(3),
				ctx.anchor("center"),
				ctx.offscreen(),
			]);

			if (knocksLeft == 0) {
				const textbox = addTextbox("WHAT?!", true);
				ctx.burp({ detune: -50 });
				textbox.pos = bean.pos.sub(0, 200);
			}
			else {
				const textbox = addTextbox("Yeah?", false);
				ctx.burp({ detune: 50 });
				textbox.pos = bean.pos.sub(0, 200);
			}
		}

		door.onClick(() => {
			if (!door.isHovering()) return;

			if (!ctx.hasWon()) {
				ctx.tween(ctx.vec2(DOOR_SCALE - 0.05 * totalKnocks - knocksLeft), ctx.vec2(DOOR_SCALE), 0.15 / ctx.speed, (p) => door.scale = p, ctx.easings.easeOutQuint);
			}

			if (knocksLeft > 0) {
				knocksLeft--;
				ctx.play("knock");
				return;
			}
			else if (knocksLeft == 0) {
				if (hasWon) return;
				if (!hasWon) {
					hasWon = true;
					ctx.win();
				}

				beanComeOut();

				ctx.wait(0.5 / ctx.speed, () => {
					ctx.play("escape", { speed: ctx.speed });
					let camX = ctx.getCamPos().x;
					let camY = ctx.getCamPos().y;
					ctx.tween(camX, camX - 800, 2 / ctx.speed, (p) => camX = p, ctx.easings.easeOutCubic);

					ctx.wait(0.5 / ctx.speed, () => {
						ctx.burp({ speed: ctx.speed * 0.8 });
						ctx.debug.log("HEY");
						const heytextbox = addTextbox("HEY!", true);
						heytextbox.use(ctx.fixed()); // TODO: this will work when fixed works
						heytextbox.pos = ctx.center().sub(200, 0);
					});

					game.onUpdate(() => {
						const wavedY = ctx.wave(ctx.center().y - 20, ctx.center().y, ctx.time() * 8 * ctx.speed);
						camY = ctx.lerp(camY, wavedY, 0.5);
						ctx.setCamPos(ctx.vec2(camX, camY));
					});

					ctx.wait(1.25 / ctx.speed, () => {
						ctx.finish();
					});
				});
			}
		});

		ctx.onTimeout(() => {
			if (hasWon) return;

			if (knocksLeft > 0) {
				ctx.lose();
				beanComeOut();
				ctx.wait(1 / ctx.speed, () => {
					ctx.finish();
				});
			}
		});

		return game;
	},
};

export default knockGame;
