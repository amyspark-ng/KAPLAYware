import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "dial",
	prompt: "DIAL!",
	duration: 7,
	hardModeOpt: {
		duration: 8,
	},
	bgColor: "7b5480",
	urlPrefix: "microgames/chill/dial/",
	iconPath: "sprites/icon.png",
	input: "mouseclick",
	boss: false,
	hideCursor: true,
	async load(ctx) {
		return await Promise.all([
			// ctx.loadSound("music", "sounds/music.mp3"),
			ctx.loadSound("dialtone", "sounds/dialtone.ogg"),
			ctx.loadSound("phonetalking", "sounds/phonetalking.ogg"),
			ctx.loadSound("button", "sounds/button.ogg"),
			ctx.loadSprite("left", "sprites/left.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("bg1", "sprites/bg1.png"),
			ctx.loadSprite("bg2", "sprites/bg2.png"),
			ctx.loadSprite("note", "sprites/note.png"),
			ctx.loadSprite("right", "sprites/right.png"),
			ctx.loadSprite("calling", "sprites/calling.png"),
			ctx.loadSprite("thumb", "sprites/thumb.png"),
			ctx.loadSprite("delete", "sprites/delete.png"),
			ctx.loadSprite("call", "sprites/call.png"),
		]);
	},
	start(ctx) {
		const generateNumber = (): string => {
			let s = "";
			for (let i = 0; i < (ctx.isHardMode ? 4 : 5); i++) {
				s += (Math.floor(Math.random() * 9)).toString();
			}
			return s;
		};

		const realNumber = generateNumber();
		let inputtedNumber = "";
		let hasDialed = false;

		ctx.add([ctx.sprite(ctx.isHardMode ? "bg2" : "bg1")]);

		const timer = ctx.add([ctx.timer()]);

		const left = ctx.add([
			ctx.sprite("left", { frame: 0 }),
			ctx.pos(0, ctx.rand(350, 360)),
		]);
		const note = left.add([ctx.sprite("note"), ctx.pos(160, -100), ctx.color(ctx.choose([ctx.mulfok.DARK_PINK, ctx.mulfok.YELLOW, ctx.mulfok.GREEN, ctx.mulfok.BEANT_BLUE]))]);
		const pos = ctx.vec2(ctx.rand(-5, 5), ctx.rand(-5, 5));
		const scale = ctx.vec2(ctx.rand(0.9, 1.1), ctx.rand(0.9, 1.1));
		const angle = ctx.rand(-10, 10);
		note.add([
			ctx.pos(ctx.rand(40, 50), ctx.rand(50, 70)),
			ctx.color(ctx.BLACK),
			ctx.text(realNumber, {
				font: "happy",
				transform: (idx, ch) => ({
					pos: pos,
					scale: scale,
					angle: angle,
				}),
			}),
		]);
		left.add([ctx.sprite("left", { frame: 1 })]);

		const phoneRight = ctx.add([
			ctx.sprite("right"),
			ctx.anchor("botright"),
			ctx.pos(ctx.width(), ctx.height()),
		]);

		const rightThumb = ctx.add([
			ctx.sprite("thumb"),
			ctx.anchor(ctx.vec2(1, 0)),
			ctx.rotate(),
			ctx.pos(720, 440),
			ctx.z(1),
		]);

		const fakeCursor = rightThumb.add([
			ctx.rect(10, 10),
			ctx.anchor("center"),
			ctx.area(),
			ctx.color(ctx.RED),
			ctx.pos(),
			ctx.z(100),
			ctx.opacity(0),
		]);

		rightThumb.onUpdate(() => {
			const clampedMousePos = ctx.vec2(ctx.clamp(ctx.mousePos().x, 545, 667), ctx.clamp(ctx.mousePos().y, 306, 500));
			rightThumb.angle = clampedMousePos.angle(rightThumb.pos) - 170;

			const width = rightThumb.pos.dist(clampedMousePos) + 15;
			fakeCursor.pos = ctx.vec2(-width + 5, 15);
			rightThumb.width = width;
		});

		const numberDraw = ctx.add([]).onDraw(() => {
			ctx.drawText({
				text: inputtedNumber,
				font: "happy",
				pos: ctx.vec2(525, 225),
			});
		});

		// this is for the hardmode
		const originalList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		// Make a shallow copy so you don't ruin the original list
		const pool = [...originalList];

		let dial = () => {};
		for (let i = 0; i < 3; i++) {
			// rows
			for (let j = 0; j < 4; j++) {
				// columns
				const circle = ctx.add([
					ctx.circle(20),
					ctx.area({ shape: new ctx.Circle(ctx.vec2(0), 20) }),
					ctx.color(ctx.mulfok.DARK_VIOLET),
					ctx.pos(550 + 45 * i, 310 + 45 * j),
					ctx.anchor("center"),
					"circle",
				]);

				function colliding() {
					return new ctx.Circle(circle.pos, circle.radius).contains(fakeCursor.worldPos);
				}

				let number = (j * 3) + i + 1;
				if (number == 10) number = undefined;
				else if (number == 11) number = 0;
				else if (number == 12) number = null;

				if (ctx.isHardMode && typeof number == "number") {
					number = pool.splice(pool.indexOf(ctx.choose(pool)), 1)[0];
				}

				circle.onDraw(() => {
					if (number == null) {
						ctx.drawSprite({
							sprite: "delete",
							anchor: "center",
						});
					}

					if (number === undefined) {
						ctx.drawSprite({
							sprite: "call",
							anchor: "center",
						});
					}

					if (number != undefined || number != null && (number < 10)) {
						ctx.drawText({
							text: number.toString(),
							anchor: "center",
							font: "happy",
							size: 30,
						});
					}

					if (!colliding()) return;
					ctx.drawCircle({
						radius: 20,
						fill: false,
						outline: {
							width: 2,
							color: ctx.WHITE,
						},
					});
				});

				dial = () => {
					if (!hasDialed) hasDialed = true;
					else return;

					if (inputtedNumber == realNumber) ctx.setResult("win");
					else ctx.setResult("lose");
					if (ctx.getResult() == "lose") timer.wait(1 / ctx.speed, () => ctx.finishGame());
					else timer.wait(3 / ctx.speed, () => ctx.finishGame());

					phoneRight.sprite = "calling";
					ctx.get("circle").forEach((circle) => {
						circle.removeAll();
						circle.destroy();
					});
					numberDraw.cancel();
					let time = 0;
					timer.loop(1, () => {
						time += 1;
					});
					ctx.add([]).onDraw(() => {
						ctx.drawText({
							text: (ctx.getResult() == "win") ? "SUPPORT" : "XXXXX",
							size: (ctx.getResult() == "win") ? 30 : 35,
							font: "happy",
							anchor: "center",
							pos: ctx.vec2(530, 225).add(65, 30),
						});

						let thingy = new Date(time * 1000).toISOString().substring(14, 19);

						ctx.drawText({
							text: (inputtedNumber == realNumber) ? thingy : "wrong.",
							size: 20,
							font: "happy",
							anchor: "center",
							pos: ctx.vec2(530, 225).add(65, 70),
						});
					});

					if (inputtedNumber != realNumber) {
						ctx.play("dialtone", { detune: ctx.rand(-50, 50) });
					}
					else {
						ctx.play("phonetalking", { detune: ctx.rand(-50, 50), speed: 1 + ctx.speed / 2 });
					}
				};

				circle.onUpdate(() => {
					if (ctx.isButtonPressed("click") && colliding()) {
						const circleFlash = circle.add([ctx.circle(20), ctx.color(ctx.WHITE), ctx.opacity()]);
						circleFlash.fadeOut(0.1).onEnd(() => circleFlash.destroy());

						let baseNumberTone = number;
						if (typeof number === "undefined") baseNumberTone = 12;
						else if (typeof number === "object") baseNumberTone - 5;
						ctx.play("button", { detune: 30 * baseNumberTone + ctx.rand(-20, 20) });

						// actual workings
						if ((number != undefined || number != null) && (number < 10 && inputtedNumber.length < 5)) {
							inputtedNumber += number.toString();
						}
						else if (number === null) {
							inputtedNumber = inputtedNumber.slice(0, -1);
						}
						else if (number == undefined) dial();
					}
				});
			}
		}

		ctx.onTimeout(() => {
			// if player hasn't dialed dial automatically, if they win they win if not pailas
			if (hasDialed) {
				ctx.finishGame();
				return;
			}
			else {
				dial();
			}
		});
	},
});
