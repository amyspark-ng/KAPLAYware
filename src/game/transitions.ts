import { AudioPlay, TimerController } from "kaplay";
import { createWareApp, WareApp } from "./kaplayware";
import k from "../engine";

export type TransitionState = "win" | "lose" | "prep" | "speed";

export function runTransition(wareApp: WareApp, states: TransitionState[]) {
	const ware = wareApp.wareCtx;
	const WareScene = wareApp.WareScene;
	const conductor = k.conductor(140 * wareApp.wareCtx.speed);

	const stateStartEvent = new k.KEvent();
	const stateEndEvent = new k.KEvent();
	const transitionEndEvent = new k.KEvent();
	const inputPromptEvent = new k.KEvent();
	const promptEvent = new k.KEvent();

	const pausableCtx = wareApp.pausableCtx;

	// woke agenda
	// "trans" controls scale and position of the transitions, obj is just to attach, don't remove this
	const trans = WareScene.add([k.scale(), k.pos(k.center()), k.anchor("center"), k.state(states[0], states)]);
	const objs = trans.add([k.pos(-k.width() / 2, -k.height() / 2)]);
	objs.add([k.sprite("trans1-bg")]);
	objs.add([k.sprite("trans1-grass")]);
	objs.add([k.sprite("trans1-table")]);

	trans.onUpdate(() => {
		conductor.paused = wareApp.gamePaused;
	});

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const coffee = objs.add([
		k.sprite("trans1-coffee"),
		k.pos(65, 290),
		k.anchor("center"),
	]);
	coffee.play("hot", { speed: 8 * ware.speed, loop: true });

	const flowerpot = objs.add([
		k.sprite("trans1-flowerpot"),
		k.pos(680, 280),
		k.anchor("top"),
	]);

	// add flowers
	for (let i = 0; i < ware.difficulty; i++) {
		const flower = objs.add([
			k.sprite("trans1-flower"),
			k.pos(flowerpot.pos.x, flowerpot.pos.y + 2),
			k.anchor("bot"),
			k.scale(),
			"flower",
		]);

		let flowerGap = ((flowerpot.width * 0.8) - flower.width * objs.get("flower").length) / (objs.get("flower").length + 1);
		let flowerX = flowerGap;
		objs.get("flower").forEach((flower, index) => {
			flower.pos.x = (flowerpot.pos.x - 10) + flowerX;
			flowerX += flowerGap + flower.width;
		});

		flower.frame = ware.difficulty - 1;
	}

	// add hearts
	for (let i = 0; i < (states[0] == "lose" ? ware.lives + 1 : ware.lives); i++) {
		let shake = 0;

		const heart = objs.add([
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
			pausableCtx.tween(heart.color, k.BLACK, 0.75 / ware.speed, (p) => heart.color = p);
			heart.fadeOut(0.75 / ware.speed).onEnd(() => heart.destroy());
		};
	}

	const screen = objs.add([
		k.sprite("trans1-screen"),
		k.pos(288, 147),
		k.opacity(),
	]);

	const computer = objs.add([
		k.sprite("trans1-computer"),
		k.pos(236, 130),
	]);

	const chillguy = objs.add([
		k.sprite("trans1-chillguy"),
		k.scale(),
		k.pos(214, 599),
		k.anchor("bot"),
	]);

	const chillcat = objs.add([
		k.sprite("trans1-chillcat"),
		k.scale(),
		k.pos(598, 600),
		k.anchor("bot"),
	]);

	const chillbutterfly = objs.add([
		k.sprite("trans1-chillbutterfly"),
		k.scale(),
		k.pos(470, 491),
		k.anchor("center"),
	]);

	const calendar = objs.add([
		k.sprite("trans1-calendar"),
		k.pos(714, 84),
		k.anchor("center"),
	]);

	function addCalendarPage(score: number) {
		const fallingPage = objs.add([
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

	const fallingPage = addCalendarPage(wareApp.wareCtx.score - 1);

	function destroy() {
		trans.destroy();
		pausableCtx.resetContext();
	}

	conductor.onBeat((beat) => {
		objs.get("flower").forEach((flower) => {
			if (ware.difficulty == 1) {
				pausableCtx.tween(0.6, 1, 0.35 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
			}
			else {
				if (beat % 2 == 0) {
					if (flower.id % 2 == 0) {
						pausableCtx.tween(1, 0.6, 0.35 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						pausableCtx.tween(0.6, 1, 0.35 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
				else {
					if (flower.id % 2 != 0) {
						pausableCtx.tween(1, 0.6, 0.35 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
					else {
						pausableCtx.tween(0.6, 1, 0.35 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutBack);
					}
				}
			}
		});
	});

	trans.onStateEnter("prep", () => {
		stateStartEvent.trigger("prep");
		pausableCtx.play("prepJingle", { speed: ware.speed });

		chillguy.frame = 0;
		screen.frame = 0;
		chillcat.frame = 0;
		chillbutterfly.frame = 0;

		const prepConductor = k.conductor(140 * wareApp.wareCtx.speed);
		trans.onUpdate(() => prepConductor.paused = wareApp.gamePaused);

		pausableCtx.tween(fallingPage.scale.y, 1.8, 0.35 / ware.speed, (p) => fallingPage.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			fallingPage.scale.y = 0.5;
			fallingPage.pos.y += calendar.height;
			const Xpos = fallingPage.pos.x;
			fallingPage.onUpdate(() => {
				const xWave = k.wave(Xpos - 20, Xpos + 20, k.time() * wareApp.wareCtx.speed * 2);
				fallingPage.pos.x = k.lerp(fallingPage.pos.x, xWave, 0.5);
			});
			pausableCtx.tween(fallingPage.pos.y, fallingPage.pos.y + 50, 0.4 / ware.speed, (p) => fallingPage.pos.y = p, k.easings.easeOutCubic);
			pausableCtx.tween(fallingPage.opacity, 0, 0.4 / ware.speed, (p) => fallingPage.opacity = p, k.easings.linear);
		});

		const newPage = addCalendarPage(wareApp.wareCtx.score);
		newPage.z = fallingPage.z - 1;

		// tween the first one here bc conductor doesn't do beat 0
		const hearts = objs.get("heart");
		pausableCtx.tween(k.vec2(1.5), k.vec2(1), 0.35 / ware.speed, (p) => hearts[0].scale = p, k.easings.easeOutQuint);
		prepConductor.onBeat((beat) => {
			if (beat == 1) {
				inputPromptEvent.trigger();
			}
			else if (beat == 2) {
				promptEvent.trigger();
			}

			const heartIdx = beat % (hearts.length);
			const heartToBeat = hearts[heartIdx];
			pausableCtx.tween(k.vec2(1.5), k.vec2(1), 0.35 / ware.speed, (p) => heartToBeat.scale = p, k.easings.easeOutQuint);

			if (beat == 3) {
				pausableCtx.tween(trans.pos.y, ZOOM_Y, 1 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
				pausableCtx.tween(trans.scale, ZOOM_SCALE, 1 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint);
				pausableCtx.tween(1, 0, 0.5 / ware.speed, (p) => screen.opacity = p, k.easings.easeOutQuint).onEnd(() => {
					stateEndEvent.trigger("prep");
					prepConductor.destroy();
				});
			}
		});
	});

	trans.onStateEnter("win", () => {
		stateStartEvent.trigger("win");
		pausableCtx.tween(ZOOM_Y, k.center().y, 0.5 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pausableCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint);
		pausableCtx.tween(0, 1, 0.25 / ware.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		const winConductor = k.conductor(140 * wareApp.wareCtx.speed);
		const hearts = objs.get("heart");
		winConductor.onBeat(() => {
		});

		const sound = pausableCtx.play("winJingle", { speed: ware.speed });
		chillguy.frame = 1;
		screen.frame = 1;
		chillcat.frame = 1;
		chillbutterfly.frame = 1;
		pausableCtx.wait(sound.duration() / ware.speed, () => {
			stateEndEvent.trigger("win");
		});
	});

	trans.onStateEnter("lose", () => {
		stateStartEvent.trigger("lose");
		pausableCtx.tween(ZOOM_Y, k.center().y, 0.5 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pausableCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint);
		pausableCtx.tween(0, 1, 0.25 / ware.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		const sound = pausableCtx.play("loseJingle", { speed: ware.speed });
		chillguy.frame = 2;
		screen.frame = 2;
		chillcat.frame = 2;
		chillbutterfly.frame = 2;

		const dyingHeart = objs.get("heart")[objs.get("heart").length - 1];
		dyingHeart.kill();
		objs.get("heart").forEach((heart, index, arr) => {
			if (index < arr.length - 1) heart.shake(7);
		});

		pausableCtx.wait(sound.duration() / ware.speed, () => {
			stateEndEvent.trigger("lose");
		});
	});

	trans.onStateEnter("speed", () => {
		stateStartEvent.trigger("speed");
		const sound = pausableCtx.play("speedJingle", { speed: ware.speed });

		const overlay = objs.add([
			k.rect(k.width(), k.height()),
			k.color(),
			k.opacity(0.5),
		]);

		overlay.onUpdate(() => {
			const HUE = (k.time() * (ware.speed * 10)) % 1;
			overlay.color = k.lerp(overlay.color, k.hsl2rgb(HUE, 0.7, 0.8), 0.1);
		});

		pausableCtx.wait(sound.duration() / ware.speed, () => {
			overlay.destroy();
			stateEndEvent.trigger("speed");
		});
	});

	stateEndEvent.add((state) => {
		if (states.indexOf(state) == states.length - 1) transitionEndEvent.trigger();
		else trans.enterState(states[states.indexOf(state) + 1]);
	});

	return {
		destroy,

		onStateStart(action: (state: TransitionState) => void) {
			return stateStartEvent.add(action);
		},

		onStateEnd(action: (state: TransitionState) => void) {
			return stateEndEvent.add(action);
		},

		onTransitionEnd(action: () => void) {
			return transitionEndEvent.add(action);
		},

		onInputPromptTime(action: () => void) {
			return inputPromptEvent.add(action);
		},

		onPromptTime(action: () => void) {
			return promptEvent.add(action);
		},
	};
}
