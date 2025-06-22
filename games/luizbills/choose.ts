import { AreaComp, Color } from "kaplay";
import { Minigame } from "../../src/types/Minigame";

// all art made by me (amyspark-ng) hehe
const colorGame: Minigame = {
	name: "choose",
	author: "luizbills",
	prompt: "CHOOSE!",
	rgb: (ctx) => ctx.mulfok.BLUE,
	urlPrefix: "games/luizbills/assets/",
	input: "mouse (hidden)",
	duration: 6,
	colorDependant: true,
	load(ctx) {
		ctx.loadSprite("beantellingmark", "sprites/beantellingmark.png");
		ctx.loadSprite("bigtextbox", "sprites/bigtextbox.png");
		ctx.loadSprite("smalltextbox", "sprites/smalltextbox.png");
		ctx.loadSprite("gamebg", "sprites/gameplaybg.png");

		ctx.loadSprite("brush", "sprites/brush.png");
		ctx.loadSprite("brushpaint", "sprites/brushpaint.png");

		ctx.loadSprite("bucket", "sprites/bucket.png");
		ctx.loadSprite("bucketpaint", "sprites/bucketpaint.png");
		ctx.loadSprite("label", "sprites/label.png");
		ctx.loadSprite("splash", "sprites/trans.png");
		ctx.loadSprite("biglabel", "sprites/biglabel.png");

		ctx.loadSprite("endingBg", "sprites/endingbg.png");
		ctx.loadSprite("house", "sprites/house.png");
		ctx.loadSprite("housepaint", "sprites/housepaint.png");
		ctx.loadSprite("bushes", "sprites/bushes.png");
		ctx.loadSprite("smallertextbox", "sprites/smallertextbox.png");

		ctx.loadSound("correct", "sounds/applause.ogg");
		ctx.loadSound("ding", "sounds/notification.mp3");
		ctx.loadSound("paint", "sounds/paint.mp3");
		ctx.loadSound("splash", "sounds/splash.ogg");
	},
	start(ctx) {
		const possibleColors = {
			"RED": ctx.mulfok.RED,
			"GREEN": ctx.mulfok.BEAN_GREEN,
			"BLUE": ctx.mulfok.DARK_BLUE,
			"BROWN": ctx.mulfok.BROWN,
			"PINK": ctx.mulfok.PINK,
		};

		const qty = Math.min(4, ctx.difficulty + 1);
		const hasLabels = ctx.difficulty >= 2;

		// pick 3 random colors
		const gameColors: string[] = ctx.chooseMultiple(Object.keys(possibleColors), qty);

		// choose a random as the correct color
		const correctColor = ctx.choose(gameColors);
		let pickedColor: string = "WHITE";

		const backgroundSprite = ctx.add([ctx.sprite("beantellingmark")]);

		const smalltextbox = ctx.add([
			ctx.sprite("smalltextbox"),
			ctx.anchor("botleft"),
			ctx.pos(206, 328),
			ctx.scale(0),
		]);

		const bigtextbox = ctx.add([
			ctx.sprite("bigtextbox"),
			ctx.anchor("botright"),
			ctx.pos(610, 289),
			ctx.opacity(),
			ctx.scale(0),
		]);

		bigtextbox.add([
			ctx.text(correctColor, { font: "happy", align: "center", size: 50 }),
			ctx.anchor("center"),
			ctx.color(ctx.BLACK),
			ctx.pos(-bigtextbox.width / 2, -bigtextbox.height / 2 - 30),
		]);

		ctx.tween(ctx.vec2(0), ctx.vec2(1), 0.75 / ctx.speed, (p) => bigtextbox.scale = p, ctx.easings.easeOutQuint).onEnd(() => {
			smalltextbox.scale = ctx.vec2(1);
			ctx.play("ding");

			ctx.wait(0.5 / ctx.speed, () => {
				const fadeInBlack = ctx.add([
					ctx.rect(ctx.width(), ctx.height()),
					ctx.color(ctx.BLACK),
					ctx.opacity(0),
					ctx.z(3),
				]);

				ctx.tween(0, 1, 0.25 / ctx.speed, (p) => fadeInBlack.opacity = p).onEnd(() => {
					ctx.setRGB(ctx.mulfok.GRAY);
					backgroundSprite.destroy();
					smalltextbox.destroy();
					bigtextbox.destroy();
					callGameplay();
					ctx.tween(1, 0, 0.25 / ctx.speed, (p) => fadeInBlack.opacity = p);
				});
			});
		});

		function callGameplay() {
			ctx.setRGB(ctx.mulfok.GRAY);
			const getHoveredBucket = () => ctx.get("bucket").find((bucket) => bucket.isHovering());
			let hasClicked = false;

			const gameplayBg = ctx.add([ctx.sprite("gamebg")]);
			const biglabel = ctx.add([ctx.sprite("biglabel"), ctx.pos(ctx.center().x, 50), ctx.anchor("center")]);
			biglabel.add([ctx.text(correctColor), ctx.anchor("center")]);

			const brushCursor = ctx.add([
				ctx.sprite("brush"),
				ctx.pos(),
				ctx.z(1),
				ctx.scale(),
				ctx.anchor("center"),
			]);

			const cursorPaint = brushCursor.add([
				ctx.sprite("brushpaint"),
				ctx.color(),
				ctx.opacity(0),
				ctx.pos(-30, 25),
				ctx.anchor("center"),
			]);

			brushCursor.onUpdate(() => {
				brushCursor.pos = ctx.mousePos();
				const hoveredBucket = getHoveredBucket();

				if (hasClicked) {
					cursorPaint.opacity = ctx.lerp(cursorPaint.opacity, 1, 0.9);
					brushCursor.scale = ctx.lerp(brushCursor.scale, ctx.vec2(1), 0.5);
					return;
				}

				if (hoveredBucket != undefined) {
					cursorPaint.color = ctx.lerp(cursorPaint.color, hoveredBucket.paintColor, 0.5);
					cursorPaint.opacity = ctx.lerp(cursorPaint.opacity, ctx.wave(0.25, 0.75, ctx.time() / ctx.speed), 0.5);
				}
				else {
					cursorPaint.opacity = ctx.lerp(cursorPaint.opacity, 0, 0.5);
				}
			});

			function clickOption(color: Color) {
				ctx.play("paint", { detune: ctx.rand(-50, 50) });
				ctx.wait(0.5 / ctx.speed, () => {
					ctx.play("splash", { detune: ctx.rand(-25, 25) });
					const splash = ctx.add([
						ctx.sprite("splash"),
						ctx.pos(),
						ctx.z(3),
						ctx.color(color),
					]);

					splash.pos.y = -splash.height;
					ctx.tween(splash.pos.y, 0, 0.5 / ctx.speed, (p) => splash.pos.y = p).onEnd(() => {
						ctx.get("bucket").forEach((bucket) => bucket.destroy());
						ctx.get("label").forEach((label) => label.destroy());
						brushCursor.destroy();
						gameplayBg.destroy();
						biglabel.destroy();

						ctx.tween(splash.pos.y, ctx.height(), 0.5 / ctx.speed, (p) => splash.pos.y = p);
						callEnding();
					});
				});
			}

			// add buckets
			gameColors.forEach((colorKey, index) => {
				const color = possibleColors[gameColors[index]] as Color;

				const bucket = ctx.add([
					ctx.sprite("bucket"),
					ctx.pos(72 + 160 * index, 207),
					ctx.area(),
					"bucket",
					{
						paintColor: color,
					},
				]);

				const paint = bucket.add([
					ctx.sprite("bucketpaint"),
					ctx.color(color),
					ctx.pos(34, 13),
				]);

				if (hasLabels) {
					const label = ctx.add([
						ctx.sprite("label"),
						ctx.anchor("center"),
						ctx.pos(bucket.pos.x + bucket.width / 2, bucket.pos.y + bucket.height + 25),
						"label",
					]);

					label.add([
						ctx.text(gameColors[index], { align: "center", size: 30, font: "happy" }),
						ctx.anchor("center"),
						ctx.color(ctx.BLACK),
						ctx.pos(),
					]);
				}

				bucket.onClick(() => {
					if (hasClicked) return;
					hasClicked = true;
					pickedColor = gameColors[index];
					brushCursor.scale = ctx.vec2(2);
					clickOption(possibleColors[pickedColor]);
				});
			});

			ctx.onTimeout(() => clickOption(ctx.WHITE));
		}

		function callEnding() {
			ctx.setRGB(ctx.mulfok.BLUE);
			pickedColor == correctColor ? ctx.win() : ctx.lose();

			ctx.add([ctx.sprite("endingBg")]);
			ctx.add([ctx.sprite("housepaint"), ctx.color(pickedColor == "WHITE" ? ctx.WHITE : possibleColors[pickedColor])]);
			ctx.add([ctx.sprite("house")]);
			ctx.add([ctx.sprite("bushes")]);

			const bean = ctx.add([
				ctx.sprite(ctx.winState == false ? "@beant" : "@bean"),
				ctx.pos(590, 515),
				ctx.anchor("center"),
				ctx.scale(1.25),
			]);

			const mark = ctx.add([
				ctx.sprite("@mark"),
				ctx.pos(680, 515),
				ctx.anchor("center"),
				ctx.scale(1.25),
			]);

			ctx.wait(1 / ctx.speed, () => {
				ctx.play("ding");
				const smallertextbox = ctx.add([
					ctx.sprite("smallertextbox"),
					ctx.pos(559, 436),
					ctx.anchor("center"),
				]);

				const smaller = smallertextbox.add([
					ctx.sprite("@like"),
					ctx.anchor("center"),
					ctx.pos(0, -15),
				]);

				if (ctx.winState == false) {
					smaller.flipY = true;
				}

				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			});
		}
	},
};

export default colorGame;
