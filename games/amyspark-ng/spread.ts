import { Outline, Vec2 } from "kaplay";
import { Minigame } from "../../src/game/types";

const spreadGame: Minigame = {
	prompt: "SPREAD!",
	author: "amyspark-ng",
	rgb: (ctx) => ctx.mulfok.PINK,
	input: "mouse (hidden)",
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSpriteAtlas("sprites/spread/bread.png", {
			"jammedbread": {
				width: 260,
				height: 260,
				x: 260,
				y: 0,
			},
		});

		ctx.loadAseprite("bread", "sprites/spread/bread.png", "sprites/spread/bread.json");

		ctx.loadSprite("knife", "sprites/spread/knife.png", {
			sliceX: 2,
			sliceY: 1,
			anims: {
				"knife": 0,
				"jammed": 1,
			},
		});

		ctx.loadSound("crunch", "sounds/crunch.mp3");
	},
	// TODO: Do the remake
	start(ctx) {
		let overChecker = false;
		let canSpread = true;
		let hasFinished = false;

		const draw = ctx.add([ctx.z(1)]);

		const outline: Outline = {
			width: 60,
			cap: "round",
		};

		const anchor = ctx.vec2(0, -0.30);
		const jamKnife = draw.add([
			ctx.sprite("knife", { anim: "jammed" }),
			ctx.pos(1),
			ctx.opacity(),
			ctx.anchor(anchor),
		]);

		const knife = draw.add([
			ctx.sprite("knife", { anim: "knife" }),
			ctx.pos(),
			ctx.opacity(0),
			ctx.anchor(anchor),
		]);

		const bread = ctx.add([
			ctx.sprite("bread"),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
			ctx.scale(),
		]);

		// const jam square is around 145x150
		const jamArea = ctx.add([
			ctx.rect(145, 150, { fill: false }),
			ctx.area(),
			ctx.pos(bread.pos),
			ctx.anchor("center"),
		]);

		const doodles = [[]] as Vec2[][]; // array of Vec2[]

		draw.onDraw(() => {
			function drawContent() {
				doodles.forEach((pts) => {
					ctx.drawLines({
						...outline,
						pts: pts,
					});
				});
			}

			function drawMask() {
				ctx.drawSprite({
					sprite: "jammedbread",
					pos: ctx.center(),
					angle: 0,
					anchor: "center",
				});
			}

			if (hasFinished) return;
			ctx.drawMasked(drawMask, drawContent);
		});

		ctx.onUpdate(() => {
			jamKnife.pos = ctx.lerp(jamKnife.pos, ctx.mousePos(), 0.75);
			knife.pos = jamKnife.pos;
			if (ctx.isMouseMoved() && jamArea.isHovering() && canSpread) {
				if (!doodles[0][0]) doodles[0][0] = ctx.mousePos();
				if (!doodles[doodles.length - 1].includes(ctx.mousePos())) doodles[doodles.length - 1].push(ctx.mousePos());
			}

			if (!hasFinished && overChecker) {
				overChecker = false;
				canSpread = false;
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}

			if (!doodles[0][0]) return;

			const Xs = doodles[0].map((d) => d.x);
			const Ys = doodles[0].map((d) => d.y);
			const minX = Math.min(...Xs) + (outline.width as number) / 2;
			const maxX = Math.max(...Xs) + (outline.width as number) / 2;
			const minY = Math.min(...Ys) + (outline.width as number) / 2;
			const maxY = Math.max(...Ys) + (outline.width as number) / 2;

			const jamXLength = maxX - minX;
			const jamYLength = maxY - minY;
			const areaSpread = jamXLength * jamYLength;
			const areaToCover = jamArea.width * jamArea.height;

			// if at least covered 80%
			if (areaSpread >= areaToCover - areaToCover * 0.2 && !hasFinished) {
				hasFinished = true;
				canSpread = true;
				ctx.win();

				bread.frame = 1;
				let eatFrames = 4;
				ctx.tween(0.75, 1, 0.15 / ctx.speed, (p) => bread.scale.y = p, ctx.easings.easeOutQuint);
				const loop = ctx.loop(0.5 / ctx.speed, () => {
					eatFrames--;
					bread.frame += 1;
					ctx.play("crunch", { detune: ctx.rand(-25, 25) * bread.frame });
					if (eatFrames == 0) {
						ctx.burp({ detune: ctx.rand(-50, 50) });
						loop.cancel();
						ctx.wait(0.5 / ctx.speed, () => ctx.finish());
					}
				});
			}

			knife.opacity = areaSpread / (areaToCover - areaToCover * 0.2);
			jamKnife.opacity = 1 - areaSpread / areaToCover;
		});

		ctx.onTimeout(() => {
			overChecker = true;
		});
	},
};

export default spreadGame;
