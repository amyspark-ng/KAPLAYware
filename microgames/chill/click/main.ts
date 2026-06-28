import { Vec2 } from "kaplay";
import { createMicrogame } from "../../../src/core/game_registry";
import { MicrogameContext } from "../../../src/core/context/game";

function getHexagonShape(ctx: MicrogameContext) {
	// some cool math
	const pts = [] as Vec2[];
	for (let i = 0; i < 6; i++) {
		const angle = Math.PI / 3 * i;
		const x = -221 * Math.cos(angle);
		const y = -221 * Math.sin(angle);
		pts.push(ctx.vec2(x, y));
	}
	return new ctx.Polygon(pts);
}

function addBackground(ctx: MicrogameContext) {
	const color = {
		ColorPrimary: ctx.Color.fromHex("#291834"),
		ColorSecondary: ctx.Color.fromHex("#36213f"),
	};

	const bg = ctx.add([
		ctx.rect(ctx.width(), ctx.height()),
		ctx.rotate(5),
		{
			offsetX: -80,
			offsetY: -80,
			cellSize: 148,
			speed: 32 * ctx.speed,
		},
	]);

	bg.onDraw(() => {
		for (let y = -2; y < bg.height / bg.cellSize; y++) {
			for (let x = -2; x < bg.width / bg.cellSize; x++) {
				ctx.drawRect({
					pos: ctx.vec2(x * bg.cellSize + bg.offsetX, y * bg.cellSize + bg.offsetY),
					width: bg.cellSize,
					height: bg.cellSize,
					color: (x + y) % 2
						? ctx.rgb(color.ColorPrimary.r, color.ColorPrimary.g, color.ColorPrimary.b)
						: ctx.rgb(color.ColorSecondary.r, color.ColorSecondary.g, color.ColorSecondary.b),
				});
			}
		}
	});

	bg.onUpdate(() => {
		bg.offsetX += bg.speed * ctx.dt();
		bg.offsetY += bg.speed * ctx.dt();

		if (bg.offsetX >= bg.cellSize * 2) {
			bg.offsetX = 0;
		}
		if (bg.offsetY >= bg.cellSize * 2) {
			bg.offsetY = 0;
		}
	});

	return bg;
}

function addComboText(ctx: MicrogameContext) {
	let blendFactor = 0;
	let words = ["MAX COMBO", "MAX COMBO!!", "YOO-HOO!!!", "YEEEOUCH!!", "FINISH IT"];
	let maxComboText = ctx.add([
		ctx.text(`[combo]${ctx.choose(words)}[/combo]`, {
			size: 55,
			align: "center",
			styles: {
				"combo": (idx) => ({
					pos: ctx.vec2(0, ctx.wave(-4, 4, ctx.time() * 6 + idx * 0.5)),
					color: ctx.WHITE.lerp(ctx.hsl2rgb((ctx.time() * 0.2 + idx * 0.1) % 1, 0.7, 0.8), blendFactor),
				}),
			},
		}),
		ctx.pos(ctx.vec2(ctx.mousePos().x, ctx.mousePos().y - 65)),
		ctx.color(),
		ctx.scale(),
		ctx.opacity(),
		ctx.anchor("center"),
		{
			update() {
				this.pos.y -= 1;

				blendFactor = 1;
				if (ctx.time() % 0.25 > (0.1 / 2)) blendFactor = 1;
				else blendFactor = 0;
			},
		},
	]);

	let timeToDie = 2;
	ctx.tween(ctx.vec2(0.5), ctx.vec2(1), 0.1, (p) => maxComboText.scale = p, ctx.easings.easeOutQuad);
	ctx.tween(0.5, 1, 0.1, (p) => maxComboText.opacity = p, ctx.easings.easeOutQuint).onEnd(() => {
		ctx.tween(maxComboText.opacity, 0, timeToDie, (p) => maxComboText.opacity = p, ctx.easings.easeOutQuint);
		ctx.wait(timeToDie, () => {
			maxComboText.destroy();
		});
	});
}

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "click",
	prompt: "CLICK!",
	duration: 5.5,
	hardModeOpt: {
		duration: 6,
	},
	bgColor: "291834",
	urlPrefix: "microgames/chill/click/",
	iconPath: "sprites/icon.png",
	input: "mouseclick",
	boss: false,
	async load(ctx) {
		return await Promise.all([
			ctx.loadCrew("sprite", "cursor", "cursory"),
			ctx.loadSprite("hexagon", "sprites/hexagon.png"),
			ctx.loadSprite("background", "sprites/background.png"),
			ctx.loadSprite("powerup", "sprites/powerup.png"),
			ctx.loadSprite("blur", "sprites/blur.png"),
			ctx.loadSprite("part_star", "sprites/part_star.png"),
			ctx.loadSprite("explosion", "../../assets/sprites/explosion.png", {
				sliceX: 17,
				sliceY: 1,
				anims: {
					"a": {
						from: 0,
						to: 16,
					},
				},
			}),
			ctx.loadSound("fullcombo", "sounds/clickeryfullcombo.ogg"),
			ctx.loadSound("explode", "../../assets/sounds/explodedr.mp3"),
			ctx.loadSound("clickpress", "sounds/clickPress.ogg"),
			ctx.loadSound("powerup", "sounds/powerup.ogg"),
			ctx.loadSound("music", "sounds/music.mp3"),
		]);
	},
	start(ctx) {
		ctx.play("music", { speed: ctx.speed });

		const SCORE_TO_WIN = ctx.isHardMode ? Math.round(ctx.randi(30, 40) / ctx.speed) : Math.round(ctx.randi(12, 25) / ctx.speed);
		let score = 0;
		let power = 1;
		let spinspeed = ctx.speed;
		let clicksInSecond = 0;
		let secondTimer = 0;
		let duration = ctx.timeLeft();

		addBackground(ctx);

		const scoreText = ctx.add([
			ctx.text(`0/${SCORE_TO_WIN}`),
			ctx.pos(ctx.center().x, 60),
			ctx.anchor("center"),
			ctx.scale(2),
			ctx.rotate(0),
		]);

		const cpsText = scoreText.add([
			ctx.text("0/sec"),
			ctx.pos(0, 25),
			ctx.scale(0.5),
			ctx.anchor("center"),
		]);

		const hexagon = ctx.add([
			ctx.sprite("hexagon"),
			ctx.anchor("center"),
			ctx.color(),
			ctx.opacity(),
			ctx.pos(ctx.center().x, ctx.center().y + 50),
			ctx.rotate(ctx.rand(0, 360)),
			ctx.area({ scale: ctx.vec2(0.85), shape: getHexagonShape(ctx), cursor: "" }),
			ctx.scale(),
			"cursor-hover",
		]);

		hexagon.onUpdate(() => {
			const hexagonClicked = hexagon.isHovering() && ctx.isButtonDown("click");
			if (ctx.getResult() == "lose") return;

			hexagon.scale = ctx.lerp(hexagon.scale, hexagonClicked ? ctx.vec2(0.95) : ctx.vec2(1), 0.25);
			hexagon.angle = ctx.lerp(hexagon.angle, hexagon.angle + 0.1 + (score / 8 * spinspeed), 0.5);
			scoreText.angle = ctx.wave(-15, 15, ctx.time() * ctx.speed);
			secondTimer += ctx.dt();
			if (secondTimer >= 1) {
				cpsText.text = `${clicksInSecond}/sec`;
				secondTimer = 0;
				clicksInSecond = 0;
			}
		});

		hexagon.onButtonPress("click", () => {
			if (!hexagon.isHovering()) return;
			score += power;
			clicksInSecond++;
			ctx.tween(ctx.vec2(2.25), ctx.vec2(2), 0.75 / ctx.speed, (p) => scoreText.scale = p, ctx.easings.easeOutQuint);
			ctx.play("clickpress", { detune: ctx.rand(-100, 100) });
			scoreText.text = `${score.toString()}/${SCORE_TO_WIN}`;
			const plusScoreText = ctx.add([
				ctx.text(`+${power}`),
				ctx.anchor("center"),
				ctx.opacity(),
				ctx.scale(1.5),
				ctx.pos(ctx.mousePos().add(ctx.rand(-10, 10), ctx.rand(-10, 10))),
			]);
			plusScoreText.fadeOut(1 / ctx.speed, ctx.easings.easeOutQuad).onEnd(() => plusScoreText.destroy());
			plusScoreText.onUpdate(() => plusScoreText.move(0, ctx.rand(-80, -90) * ctx.speed));
		});

		hexagon.onButtonRelease("click", () => {
			if (!hexagon.isHovering()) return;
			ctx.play("clickpress", { detune: ctx.rand(-400, -200) });
		});

		const clicksText = ctx.add([
			ctx.text("1", {
				styles: {
					"blue": {
						color: ctx.mulfok.BLUE,
						scale: ctx.vec2(0.75),
					},
				},
			}),
			ctx.anchor("left"),
			ctx.pos(15, 560),
			ctx.scale(1),
			ctx.scale(1.5),
			{
				draw() {
					ctx.drawSprite({
						sprite: "cursory",
						scale: ctx.vec2(1.25),
						pos: ctx.vec2(ctx.formatText({ text: this.text }).width, 0),
						anchor: "center",
					});
				},
			},
		]);

		clicksText.onUpdate(() => {
			if (power > 1) clicksText.text = `1[blue](+${power})[/blue]`;
			else clicksText.text = `1`;
			clicksText.pos = ctx.vec2(10, ctx.lerp(clicksText.pos.y, ctx.wave(560, 570, ctx.time() * ctx.speed * 2), 0.5));
		});

		const uselessFold = ctx.add([
			ctx.rect(60, 60, { radius: 10 }),
			ctx.anchor("center"),
			ctx.pos(750, 560),
			ctx.outline(7.5, ctx.mulfok.VOID_VIOLET),
			{
				draw() {
					ctx.drawSprite({
						sprite: "test-arrow",
						scale: ctx.vec2(0.7, 0.6),
						anchor: "center",
						color: ctx.mulfok.VOID_VIOLET,
						opacity: 1,
					});
				},
			},
		]);

		// combo bar
		const comboBarCheck = hexagon.onButtonPress("click", () => {
			if (!hexagon.isHovering()) return;
			comboBarCheck.cancel();
			const barFrame = scoreText.add([
				ctx.rect(100, 10, { fill: false, radius: 3 }),
				ctx.outline(3, ctx.mulfok.VOID_VIOLET),
				ctx.pos(),
				ctx.anchor("left"),
				ctx.opacity(),
				ctx.z(1),
			]);

			const barContent = scoreText.add([
				ctx.rect(0, 10),
				ctx.pos(),
				ctx.anchor("left"),
				ctx.opacity(),
				ctx.z(0),
				ctx.color(),
			]);

			barFrame.onUpdate(() => {
				barFrame.pos = ctx.vec2(-50, 23);
				barContent.pos = barFrame.pos;

				// wil only reach the percentage if both the time and score ir accurate
				const timeProgress = (duration - ctx.timeLeft()) / duration;
				const scoreProgress = score / SCORE_TO_WIN;

				const barProgress = Math.min(timeProgress, scoreProgress);

				barContent.width = 100 * barProgress;
				barContent.color = ctx.WHITE.lerp(ctx.hsl2rgb((ctx.time() * 0.2 * 0.1) % 1, 1.5, 0.8), barContent.width / 100);
			});

			barContent.fadeIn(0.15 / ctx.speed);
			barFrame.fadeIn(0.15 / ctx.speed);
			ctx.tween(cpsText.pos, cpsText.pos.add(0, 12), 0.35 / ctx.speed, (p) => cpsText.pos = p, ctx.easings.easeOutQuint);
		});

		if (ctx.isHardMode) {
			hexagon.color = ctx.choose(Object.values(ctx.mulfok)).lerp(ctx.WHITE, 0.5);

			let powerupTimer = 0;
			let theresPowerup = false;

			hexagon.onUpdate(() => {
				powerupTimer += ctx.dt() * ctx.speed;
				if (powerupTimer > 0.65 && !theresPowerup) {
					theresPowerup = true;
					const pos = ctx.vec2(ctx.rand(50, ctx.width() - 50), ctx.rand(50, ctx.height() - 50));

					const powerup = ctx.add([
						ctx.sprite("powerup"),
						ctx.anchor("center"),
						ctx.pos(pos),
						ctx.opacity(0),
						ctx.scale(0),
						ctx.area({ cursor: "" }),
						ctx.z(1),
						ctx.color(),
						{
							dead: false,
						},
					]);

					ctx.tween(ctx.vec2(0), ctx.vec2(1), 0.15 / ctx.speed, (p) => powerup.scale = p, ctx.easings.easeOutBack);
					ctx.tween(0, 1, 0.15 / ctx.speed, (p) => powerup.opacity = p, ctx.easings.easeOutQuad);

					powerup.onUpdate(() => {
						if (powerup.dead) return;
						powerup.pos.y = ctx.wave(pos.y - 5, pos.y + 5, ctx.time() / ctx.speed);
					});

					powerup.onClick(() => {
						const blur = ctx.add([
							ctx.sprite("blur"),
							ctx.opacity(),
						]);

						ctx.play("powerup", { speed: ctx.speed, detune: ctx.rand(-50, 50) });
						powerup.dead = true;

						ctx.tween(0, 1, 0.15 / ctx.speed, (p) => blur.opacity = p, ctx.easings.easeOutQuad);
						ctx.tween(powerup.pos.y, powerup.pos.y - 100, 2 / ctx.speed, (p) => powerup.pos.y = p, ctx.easings.easeOutQuad);
						ctx.tween(ctx.WHITE, ctx.mulfok.LIGHT_BLUE, 0.15 / ctx.speed, (p) => powerup.color = p, ctx.easings.easeOutQuad);
						ctx.tween(powerup.opacity, 0, 0.15 / ctx.speed, (p) => powerup.opacity = p, ctx.easings.easeOutCubic).onEnd(() => {
							powerup.destroy();
						});

						let powerClicksLeft = ctx.randi(1, 3);
						power = 2;
						const test = hexagon.onClick(() => {
							ctx.tween(1, 0, 0.15 / ctx.speed, (p) => blur.opacity = p, ctx.easings.easeOutQuad).onEnd(() => blur.destroy());
							powerClicksLeft--;
							if (powerClicksLeft == 0) {
								power = 1;
								test.cancel();
								theresPowerup = false;
							}
						});
					});

					const loop = ctx.loop(0.5, () => {
						let shimmer = ctx.add([
							ctx.pos(powerup.pos.add(0, 10)),
							ctx.opacity(1),
							ctx.particles({
								max: 20,
								speed: [50, 100],
								angle: [0, 360],
								angularVelocity: [45, 90],
								lifeTime: [1, 2],
								scales: [1, 1.2],
								colors: [ctx.mulfok.LIGHT_BLUE, ctx.mulfok.LIGHT_BLUE.darken(25), ctx.mulfok.LIGHT_BLUE.lighten(100)],
								opacities: [0.1, 1.0, 0.0],
								texture: ctx.getSprite("part_star").data.frames[0].tex,
								quads: [ctx.getSprite("part_star").data.frames[0].q],
							}, {
								position: ctx.vec2(),
								lifetime: 1.5,
								rate: 0,
								direction: 90,
								spread: 20,
							}),
						]);

						shimmer.emit(ctx.randi(2, 4));
						shimmer.onEnd(() => shimmer.destroy());
					});

					powerup.onDestroy(() => loop.cancel());
				}
			});
		}

		ctx.onTimeout(() => {
			if (score >= SCORE_TO_WIN) {
				ctx.play("fullcombo", { detune: ctx.rand(-50, 50) });
				ctx.setResult("win");
				addComboText(ctx);
				ctx.addConfetti({ pos: ctx.mousePos() });
				ctx.tween(1.1, 1, 1 / ctx.speed, (p) => ctx.setCamScale(p), ctx.easings.easeOutQuint);
				ctx.tween(-25, 0, 1 / ctx.speed, (p) => ctx.setCamRot(p), ctx.easings.easeOutQuint);
			}
			else {
				ctx.shake();
				ctx.setResult("lose");
				ctx.tween(spinspeed, spinspeed * 2, 1 / ctx.speed, (p) => spinspeed = p, ctx.easings.easeOutExpo);

				ctx.play("explode", { detune: ctx.rand(-25, 25), speed: ctx.speed });
				ctx.add([
					ctx.sprite("explosion", { anim: "a", animSpeed: 1.5 * ctx.speed }),
					ctx.z(10),
					ctx.scale(3.5),
					ctx.pos(ctx.center().add(10, 0)),
					ctx.anchor("center"),
				]);

				hexagon.area.scale = ctx.vec2(0);
				ctx.tween(hexagon.opacity, 0, 1 / ctx.speed, (p) => hexagon.opacity = p, ctx.easings.easeOutCirc);
				ctx.tween(hexagon.scale, ctx.vec2(0), 0.35 / ctx.speed, (p) => hexagon.scale = p, ctx.easings.easeOutCirc);
				ctx.tween(hexagon.angle, 360, 0.5 / ctx.speed, (p) => hexagon.angle = p, ctx.easings.easeOutCirc);
				ctx.tween(hexagon.pos.x, hexagon.pos.x + 250, 0.35 / ctx.speed, (p) => hexagon.pos.x = p, ctx.easings.easeOutCirc);
				let elapsed = 0;
				let startY = hexagon.pos.y - 200;
				let endY = hexagon.pos.y;
				hexagon.onUpdate(() => {
					elapsed += ctx.dt() * ctx.speed;
					const t = elapsed / 0.5 / ctx.speed;
					const baseY = ctx.lerp(startY, endY, t);
					const jumpY = -Math.sin(t * Math.PI) * 100;
					hexagon.pos.y = baseY + jumpY;
				});
			}

			ctx.wait(1.5 / ctx.speed, () => {
				ctx.finishGame();
			});
		});
	},
});
