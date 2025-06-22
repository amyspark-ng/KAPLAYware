import { Outline, Vec2 } from "kaplay";
import { Minigame } from "../../src/types/Minigame";

const spreadGame: Minigame = {
	name: "spread",
	author: "amyspark-ng",
	prompt: "SPREAD!",
	duration: 20,
	rgb: (ctx) => ctx.mulfok.BROWN,
	input: "mouse (hidden)",
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("bg", "sprites/spread/jambackground.png");
		ctx.loadSprite("coffee", "sprites/spread/coffee.png", {
			sliceX: 3,
			sliceY: 3,
			anims: {
				"idle": { from: 0, to: 3, loop: true },
				"idlesad": { from: 4, to: 7, loop: true },
			},
		});
		ctx.loadSprite("knife", "sprites/spread/knife.png");
		ctx.loadSprite("knifejam", "sprites/spread/knifejam.png");

		ctx.loadSprite("bread", "sprites/spread/bread.png", {
			sliceX: 6,
			sliceY: 1,
			anims: {
				"eat": {
					from: 1,
					to: 5,
				},
			},
		});
		ctx.loadSprite("breadderp", "sprites/spread/breadderp.png");

		ctx.loadSpriteAtlas("sprites/spread/bread.png", {
			"jammedbread": {
				width: 240,
				height: 234,
				x: 240,
				y: 0,
			},
		});

		ctx.loadSound("crunch", "sounds/crunch.mp3");
		ctx.loadSound("scrape", "sounds/scrape.ogg");
	},
	start(ctx) {
		ctx.add([ctx.sprite("bg")]);
		const coffeeCup = ctx.add([ctx.sprite("coffee", { anim: "idle", animSpeed: ctx.speed }), ctx.pos(460, 13)]);

		const draw = ctx.add([ctx.z(1)]);

		const outline: Outline = {
			width: 65 - 5 * ctx.difficulty,
			cap: "round",
		};

		const anchor = ctx.vec2(0, -0.70);
		const knife = draw.add([
			ctx.sprite("knife"),
			ctx.pos(),
			ctx.opacity(1),
			ctx.anchor(anchor),
		]);

		let jamOpacity = 1;
		knife.onDraw(() => {
			ctx.drawSprite({
				sprite: "knifejam",
				opacity: jamOpacity,
				anchor: ctx.vec2(0.70),
				pos: ctx.vec2(15, 30),
			});
		});

		const bread = ctx.add([
			ctx.sprite("bread"),
			ctx.pos(413, 400),
			ctx.anchor("center"),
			ctx.scale(1 + 0.15 * (ctx.difficulty - 1)),
		]);

		// const jam square is around 156x152
		const jamArea = ctx.add([
			ctx.rect(156, 152, { fill: false }),
			ctx.area(),
			ctx.scale(bread.scale),
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
					pos: bread.pos,
					angle: 0,
					scale: bread.scale,
					anchor: "center",
				});
			}

			if (ctx.winState == true) return;
			ctx.drawMasked(drawMask, drawContent);
		});

		ctx.onUpdate(() => {
			knife.pos = ctx.lerp(knife.pos, ctx.mousePos(), 0.75);
			if (ctx.isMouseMoved() && jamArea.isHovering() && ctx.winState == undefined) {
				if (!doodles[0][0]) doodles[0][0] = ctx.mousePos();
				if (!doodles[doodles.length - 1].includes(ctx.mousePos())) doodles[doodles.length - 1].push(ctx.mousePos());
			}

			if (ctx.timeLeft <= 0 && ctx.winState == undefined) {
				ctx.lose();
				coffeeCup.play("idlesad", { speed: ctx.speed });
				bread.sprite = "breadderp";
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
			const areaToCover = jamArea.width * jamArea.scale.x * jamArea.height * jamArea.scale.y;
			const percentage = areaSpread / areaToCover;

			if (jamArea.isHovering() && !ctx.mouseDeltaPos().isZero() && ctx.winState == undefined) {
				if (ctx.chance(0.15)) ctx.play("scrape", { detune: ctx.rand(-50, 50) });
			}

			// if at least covered 80%
			if (percentage >= 0.8 && ctx.winState == undefined) {
				ctx.win();

				bread.frame = 1;
				let eatFrames = 4;
				const loop = ctx.loop(0.5 / ctx.speed, () => {
					eatFrames--;
					bread.frame += 1;
					ctx.tween(0.75, 1, 0.15 / ctx.speed, (p) => bread.scale.y = p, ctx.easings.easeOutQuint);
					ctx.play("crunch", { detune: ctx.rand(-25, 25) * bread.frame });
					if (eatFrames == 0) {
						ctx.burp({ detune: ctx.rand(-50, 50) });
						loop.cancel();
						ctx.wait(0.5 / ctx.speed, () => ctx.finish());
					}
				});
			}

			jamOpacity = 1 - percentage;
		});
	},
};

export default spreadGame;
