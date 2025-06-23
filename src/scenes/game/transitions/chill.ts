import k from "../../../engine";
import { TransitionDefinition } from "./makeTransition";

/** The cool "chill guy" transition for first pack of games */
export const chillTransition: TransitionDefinition = (parent, camera, stageManager, wareApp, wareEngine) => {
	const { tween, wait, play, createConductor } = wareApp.transCtx;

	const conductor = createConductor(140 * wareEngine.speed);
	conductor.onUpdate(() => {
		conductor.bpm = 140 * wareEngine.speed;
	});

	parent.add([k.sprite("trans1-bg")]);
	parent.add([k.sprite("trans1-grass")]);
	parent.add([k.sprite("trans1-table")]);

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const coffee = parent.add([
		k.sprite("trans1-coffee"),
		k.pos(65, 290),
		k.anchor("center"),
	]);
	coffee.play("hot", { speed: 8 * wareEngine.speed, loop: true });

	const flowerpot = parent.add([
		k.sprite("trans1-flowerpot"),
		k.pos(680, 280),
		k.anchor("top"),
	]);

	function addFlower() {
		const flower = parent.add([
			k.sprite("trans1-flower"),
			k.pos(flowerpot.pos.x, flowerpot.pos.y + 2),
			k.anchor("bot"),
			k.scale(),
			k.color(),
			"flower",
			{
				canBeat: true,
				rise() {},
				bury() {},
			},
		]);

		flower.rise = () => {
			flower.canBeat = false;
			tween(0, 1, 1 / wareEngine.speed, (p) => flower.scale.y = p, k.easings.easeOutElastic).onEnd(() => flower.canBeat = true);
		};

		flower.bury = () => {
			flower.untag("flower");
			flower.canBeat = false;
			tween(1, 0, 0.25 / wareEngine.speed, (p) => flower.scale.y = p).onEnd(() => flower.destroy());
		};

		flower.rise();

		let flowerGap = ((flowerpot.width * 0.8) - flower.width * parent.get("flower").length) / (parent.get("flower").length + 1);
		let flowerX = flowerGap;
		parent.get("flower").forEach((flower, index) => {
			flower.pos.x = (flowerpot.pos.x - 10) + flowerX;
			flowerX += flowerGap + flower.width;
		});

		flower.frame = wareEngine.difficulty - 1;
		return flower;
	}

	// adds the hearts
	for (let i = 0; i < (stageManager.stages[0] == "lose" ? wareEngine.lives + 1 : wareEngine.lives); i++) {
		let shake = 0;

		const heart = parent.add([
			k.sprite("trans1-heart"),
			k.pos(220, 60),
			k.scale(),
			k.color(),
			k.anchor("center"),
			k.opacity(),
			k.rotate(),
			"heart",
			{
				kill() {},
				shake(val: number = 14) {},
			},
		]);

		heart.pos.x += (heart.width * 1.15) * i;
		let pos = heart.pos;

		heart.onUpdate(() => {
			shake = k.lerp(shake, 0, 0.5);
			const newPos = pos.add(k.Vec2.fromAngle(k.rand(0, 360)).scale(shake));
			heart.pos = newPos;
		});

		heart.shake = (val: number = 14) => {
			shake = val;
		};

		heart.kill = () => {
			tween(heart.color, k.BLACK, 0.75 / wareEngine.speed, (p) => heart.color = p);
			heart.fadeOut(0.75 / wareEngine.speed).onEnd(() => heart.destroy());
		};
	}

	// TODO: Fix all the screen stuff when the new transition comes out
	const screen = parent.add([
		k.sprite("trans1-screen"),
		k.pos(396, 214),
		k.opacity(),
		k.anchor("center"),
	]);

	const computer = parent.add([
		k.sprite("trans1-computer"),
		k.pos(236, 130),
	]);

	const chillguy = parent.add([
		k.sprite("trans1-chillguy"),
		k.scale(),
		k.pos(214, 599),
		k.anchor("bot"),
	]);

	const chillcat = parent.add([
		k.sprite("trans1-chillcat"),
		k.scale(),
		k.pos(598, 600),
		k.anchor("bot"),
	]);

	const chillbutterfly = parent.add([
		k.sprite("trans1-chillbutterfly"),
		k.scale(),
		k.pos(470, 491),
		k.anchor("center"),
	]);

	const calendar = parent.add([
		k.sprite("trans1-calendar"),
		k.pos(714, 84),
		k.anchor("center"),
	]);

	function addCalendarPage(score: number) {
		const fallingPage = parent.add([
			k.sprite("trans1-page"),
			k.pos(calendar.pos.sub(calendar.width / 2, calendar.height / 2)),
			k.anchor("top"),
			k.scale(),
			k.opacity(),
			k.z(1),
		]);
		fallingPage.pos.x += fallingPage.width / 2 - 15;
		fallingPage.onDraw(() => {
			k.drawText({
				text: score.toString(),
				font: "happy",
				anchor: fallingPage.anchor,
				align: "center",
				pos: k.vec2(-5, 20),
				color: k.Color.fromHex("#abdd64"),
				opacity: fallingPage.opacity,
			});
		});

		return fallingPage;
	}

	let fallingPage = addCalendarPage(wareEngine.score - 1);

	conductor.onBeat((beat) => {
		parent.get("flower").forEach((flower) => {
			if (!flower.canBeat) return;

			if (wareEngine.difficulty == 1) {
				tween(0.6, 1, 0.35 / wareEngine.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
			}
			else {
				if (beat % 2 == 0) {
					if (flower.id % 2 == 0) {
						tween(1, 0.6, 0.35 / wareEngine.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						tween(0.6, 1, 0.35 / wareEngine.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
				else {
					if (flower.id % 2 != 0) {
						tween(1, 0.6, 0.35 / wareEngine.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						tween(0.6, 1, 0.35 / wareEngine.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
			}
		});
	});

	function zoomOut() {
		tween(ZOOM_Y, k.center().y, 0.5 / wareEngine.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / wareEngine.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
	}

	function zoomIn() {
		tween(camera.pos.y, ZOOM_Y, 1 / wareEngine.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(camera.scale, ZOOM_SCALE, 1 / wareEngine.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
	}

	let oldDifficulty = wareEngine.difficulty;
	stageManager.onStart(() => {
		conductor.time = 0; // desyncing
		coffee.play("hot", { speed: 8 * wareEngine.speed, loop: true });
	});

	stageManager.defineStage("prep", () => {
		play("prepJingle", { speed: wareEngine.speed });
		chillguy.frame = 0;
		screen.frame = 0;
		chillcat.frame = 0;
		chillbutterfly.frame = 0;

		const prepConductor = createConductor(140 * wareEngine.speed);
		fallingPage.destroy();
		fallingPage = addCalendarPage(wareEngine.score - 1);

		// page funny
		tween(fallingPage.scale.y, 1.8, 0.35 / wareEngine.speed, (p) => fallingPage.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			fallingPage.scale.y = 0.5;
			fallingPage.pos.y += calendar.height;
			const Xpos = fallingPage.pos.x;
			fallingPage.onUpdate(() => {
				const xWave = k.wave(Xpos - 20, Xpos + 20, k.time() * wareEngine.speed * 2);
				fallingPage.pos.x = k.lerp(fallingPage.pos.x, xWave, 0.5);
			});
			tween(fallingPage.pos.y, fallingPage.pos.y + 50, 0.4 / wareEngine.speed, (p) => fallingPage.pos.y = p, k.easings.easeOutCubic);
			tween(fallingPage.opacity, 0, 0.4 / wareEngine.speed, (p) => fallingPage.opacity = p, k.easings.linear);
		});

		const newPage = addCalendarPage(wareEngine.score);
		newPage.z = fallingPage.z - 1;

		// TODO: when there are 3 flowers they don't beat anymore

		// tween the first one here bc conductor doesn't do beat 0
		const hearts = parent.get("heart");
		tween(k.vec2(1.5), k.vec2(1), 0.35 / wareEngine.speed, (p) => hearts[0].scale = p, k.easings.easeOutQuint);
		prepConductor.onBeat((beat) => {
			if (beat == 1) {
				stageManager.callInput();
			}
			else if (beat == 2) {
				stageManager.callPrompt();
				// set gamebox
				wareApp.boxObj.width = screen.width;
				wareApp.boxObj.height = screen.height;
				wareApp.boxObj.pos = screen.pos;
				tween(1, 0, 0.5 / wareEngine.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
			}

			const heartIdx = beat % (hearts.length);
			const heartToBeat = hearts[heartIdx];
			tween(k.vec2(1.5), k.vec2(1), 0.35 / wareEngine.speed, (p) => heartToBeat.scale = p, k.easings.easeOutQuint);

			if (beat == 3) {
				zoomIn();
				tween(
					k.vec2(wareApp.boxObj.width, wareApp.boxObj.height),
					k.vec2(k.width(), k.height()),
					0.5 / wareEngine.speed,
					(p) => [wareApp.boxObj.width, wareApp.boxObj.height] = [p.x, p.y],
					k.easings.easeOutQuint,
				);
				tween(wareApp.boxObj.pos, k.center(), 0.5 / wareEngine.speed, (p) => wareApp.boxObj.pos = p, k.easings.easeOutQuint).onEnd(() => {
					prepConductor.destroy();
					stageManager.finishStage("prep");
				});
			}
		});

		// adds the first flower in case there isn't one
		if (!parent.get("flower")[0] && !parent.get("piranha")[0]) {
			for (let i = 0; i < wareEngine.difficulty; i++) {
				addFlower();
			}
		}
	});

	stageManager.defineStage("win", () => {
		screen.opacity = 0;
		zoomOut();
		tween(0, 1, 0.5 / wareEngine.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		tween(wareApp.boxObj.pos, screen.pos, 0.5 / wareEngine.speed, (p) => screen.pos = p, k.easings.easeOutQuint);
		tween(
			k.vec2(wareApp.boxObj.width, wareApp.boxObj.height),
			k.vec2(screen.width, screen.height),
			0.5 / wareEngine.speed,
			(p) => [wareApp.boxObj.width, wareApp.boxObj.height] = [p.x, p.y],
			k.easings.easeOutQuint,
		);

		const winConductor = createConductor(140 * wareEngine.speed);
		const hearts = parent.get("heart");
		winConductor.onBeat(() => {
		});

		const sound = play("winJingle", { speed: wareEngine.speed });
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;
		wait(sound.duration() / wareEngine.speed, () => {
			stageManager.finishStage("win");
		});
	});

	stageManager.defineStage("lose", () => {
		tween(ZOOM_Y, k.center().y, 0.5 / wareEngine.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / wareEngine.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		tween(0, 1, 0.25 / wareEngine.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		const sound = play("loseJingle", { speed: wareEngine.speed });
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		const dyingHeart = parent.get("heart")[parent.get("heart").length - 1];
		dyingHeart.kill();
		parent.get("heart").forEach((heart, index, arr) => {
			if (index < arr.length - 1) heart.shake(7);
		});

		wait(sound.duration() / wareEngine.speed, () => {
			stageManager.finishStage("lose");
		});
	});

	stageManager.defineStage("speed", () => {
		const sound = play("speedJingle", { speed: wareEngine.speed });

		const overlay = parent.add([
			k.rect(k.width(), k.height()),
			k.color(),
			k.opacity(0.5),
		]);

		overlay.onUpdate(() => {
			const HUE = (k.time() * (wareEngine.speed * 10)) % 1;
			overlay.color = k.lerp(overlay.color, k.hsl2rgb(HUE, 0.7, 0.8), 0.1);
		});

		wait(sound.duration() / wareEngine.speed, () => {
			overlay.destroy();
			stageManager.finishStage("speed");
		});
	});

	function cleanFlowers() {
		parent.get("flower").forEach((flower) => flower.bury());
		const piranhaFlower = addFlower();
		piranhaFlower.canBeat = false;
		piranhaFlower.untag("flower");
		piranhaFlower.tag("piranha");
		piranhaFlower.color = k.RED;
	}

	function bossPrepCleanup() {
		const piranhaFlower = parent.get("piranha")[0];
		piranhaFlower.bury();
	}

	stageManager.defineStage("bossPrep", () => {
		const sound = play("bossJingle", { speed: wareEngine.speed });

		const bossText = parent.add([
			k.text("BOSS"),
			k.anchor("center"),
			k.pos(k.center()),
		]);

		cleanFlowers();
		wait(sound.duration() / wareEngine.speed, () => {
			stageManager.finishStage("bossPrep");
			bossText.destroy();
		});
	});

	stageManager.defineStage("bossWin", () => {
		const sound = play("bossWinJingle", { speed: wareEngine.speed });

		bossPrepCleanup();
		tween(ZOOM_Y, k.center().y, 0.5 / wareEngine.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / wareEngine.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		tween(0, 1, 0.25 / wareEngine.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;

		wait(sound.duration() / wareEngine.speed, () => {
			stageManager.finishStage("bossWin");
		});
	});

	stageManager.defineStage("bossLose", () => {
		const sound = play("loseJingle", { speed: wareEngine.speed });

		bossPrepCleanup();
		tween(ZOOM_Y, k.center().y, 0.5 / wareEngine.speed, (p) => camera.pos.y = p, k.easings.easeOutQuint);
		tween(ZOOM_SCALE, k.vec2(1), 0.5 / wareEngine.speed, (p) => camera.scale = p, k.easings.easeOutQuint);
		tween(0, 1, 0.25 / wareEngine.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		wait(sound.duration() / wareEngine.speed, () => {
			stageManager.finishStage("bossLose");
		});
	});
};

export default chillTransition;
