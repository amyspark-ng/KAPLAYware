import { AudioPlay, TimerController } from "kaplay";
import { createWareApp } from "./kaplayware";
import k from "../engine";

const pausableAPI = ["tween", "wait", "loop", "play"] as const;
export type PausableCtx = Pick<typeof k, typeof pausableAPI[number]> & { resetContext(): void; };

/** Creates a small context that includes tween, wait, loop and play, these will be paused if the WareApp is paused */
export function createPausableCtx(wareApp: ReturnType<typeof createWareApp>) {
	const ctx = {} as PausableCtx;

	for (const api of pausableAPI) {
		if (api == "play") {
			ctx[api] = (...args: any[]) => {
				const sound = k.play(...args as unknown as [any]);
				wareApp.pausableSounds.push(sound);
				return sound;
			};
		}
		else {
			ctx[api] = (...args: any[]) => {
				// @ts-ignore
				const timer = k[api](...args as unknown as [any]);
				wareApp.pausableTimers.push(timer);
				return timer as any;
			};
		}
	}

	ctx.resetContext = () => {
		for (let i = wareApp.pausableTimers.length - 1; i >= 0; i--) {
			wareApp.pausableTimers[i].cancel();
			wareApp.pausableTimers.pop();
		}

		for (let i = wareApp.pausableSounds.length - 1; i >= 0; i--) {
			wareApp.pausableSounds[i].stop();
			wareApp.pausableSounds.pop();
		}
	};

	return ctx;
}

// TODO: Make this take an array of states, create all objects on start and run a forEach on the states
// Make a onStateEnd and onEnd (prep, win, lose, speed up)
export function runTransition(wareApp: ReturnType<typeof createWareApp>, state: "win" | "lose" | "prep" | "speed") {
	const ware = wareApp.wareCtx;
	const WareScene = wareApp.WareScene;
	const conductor = k.conductor(140 * wareApp.wareCtx.speed); // have to create a new one because then some beat things don't make sense

	const endEvent = new k.KEvent();
	const inputPromptEvent = new k.KEvent();
	const promptEvent = new k.KEvent();

	const pausableCtx = wareApp.pausableCtx;

	// woke agenda
	// "trans" controls scale and position of the transitions, obj is just to attach, don't remove this
	const trans = WareScene.add([k.scale(), k.pos(k.center()), k.anchor("center")]);
	const objs = trans.add([k.pos(-k.width() / 2, -k.height() / 2)]);
	objs.add([k.sprite("bg")]);
	objs.add([k.sprite("grass")]);
	objs.add([k.sprite("table")]);

	trans.onUpdate(() => {
		conductor.paused = wareApp.gamePaused;
	});

	const ZOOM_SCALE = k.vec2(5.9);
	const ZOOM_Y = 827;

	const coffee = objs.add([
		k.sprite("coffee"),
		k.pos(65, 290),
		k.anchor("center"),
	]);
	coffee.play("hot", { speed: 8 * ware.speed, loop: true });

	const flowerpot = objs.add([
		k.sprite("flowerpot"),
		k.pos(680, 280),
		k.anchor("top"),
	]);

	// add flowers
	for (let i = 0; i < ware.difficulty; i++) {
		const flower = objs.add([
			k.sprite("flower"),
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
	for (let i = 0; i < (state == "lose" ? ware.lives + 1 : ware.lives); i++) {
		const heart = objs.add([
			k.sprite("heart"),
			k.pos(220, 60),
			k.scale(),
			k.color(),
			k.anchor("center"),
			k.opacity(),
			k.rotate(),
			"heart",
			{
				kill() {},
			},
		]);

		heart.pos.x += (heart.width * 1.15) * i;

		heart.kill = () => {
			pausableCtx.tween(heart.color, k.BLACK, 0.5 / ware.speed, (p) => heart.color = p);
			heart.fadeOut(0.5 / ware.speed).onEnd(() => heart.destroy());
		};
	}

	const screen = objs.add([
		k.sprite("screen"),
		k.pos(288, 147),
		k.opacity(),
	]);

	const computer = objs.add([
		k.sprite("computer"),
		k.pos(236, 130),
	]);

	const chillguy = objs.add([
		k.sprite("chillguy"),
		k.scale(),
		k.pos(214, 599),
		k.anchor("bot"),
	]);

	const chillcat = objs.add([
		k.sprite("chillcat"),
		k.scale(),
		k.pos(598, 600),
		k.anchor("bot"),
	]);

	const chillbutterfly = objs.add([
		k.sprite("chillbutterfly"),
		k.scale(),
		k.pos(470, 491),
		k.anchor("center"),
	]);

	const calendar = objs.add([
		k.sprite("calendar"),
		k.pos(660, 42),
	]);

	const page = objs.add([
		k.sprite("page"),
		k.pos(calendar.pos),
		k.anchor("top"),
		k.scale(),
		k.z(1),
	]);
	page.pos.x += page.width / 2 - 15;
	page.add([k.text((ware.score - 1).toString(), { font: "happy" }), k.pos(0, 25), k.anchor("top"), k.z(1), k.color(k.Color.fromHex("#abdd64"))]);

	function finishTrans() {
		trans.destroy();
		pausableCtx.resetContext();
		conductor.destroy();
	}

	conductor.onBeat((beat) => {
		objs.get("flower").forEach((flower) => {
			if (ware.difficulty == 1) {
				pausableCtx.tween(0.6, 1, 0.15 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutQuint);
			}
			else {
				if (beat % 2 == 0) {
					if (flower.id % 2 == 0) {
						pausableCtx.tween(1, 0.6, 0.15 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutQuint);
					}
					else {
						pausableCtx.tween(0.6, 1, 0.15 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutQuint);
					}
				}
				else {
					if (flower.id % 2 != 0) {
						pausableCtx.tween(1, 0.6, 0.15 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutQuint);
					}
					else {
						pausableCtx.tween(0.6, 1, 0.15 / ware.speed, (p) => flower.scale.y = p, k.easings.easeOutQuint);
					}
				}
			}
		});
	});

	if (state == "prep") {
		pausableCtx.play("@prepJingle", { speed: ware.speed });

		pausableCtx.tween(page.scale.y, 1.8, 0.5 / ware.speed, (p) => page.scale.y = p, k.easings.easeOutExpo).onEnd(() => {
			page.scale.y = 0.5;
			page.pos.y += calendar.height;
			page.anchor = "center";
			page.onUpdate(() => {
				page.pos.y += 1;
				page.scale.y -= 0.1;
				if (page.scale.y <= 0) page.destroy();
			});
		});

		const pagebelow = objs.add([
			k.sprite("page"),
			k.pos(page.pos),
			k.anchor(page.anchor),
			k.z(page.z - 1),
		]);
		pagebelow.add([k.text(ware.score.toString(), { font: "happy" }), k.pos(0, 25), k.anchor("top"), k.z(page.z - 1), k.color(k.Color.fromHex("#abdd64"))]);

		conductor.onBeat((beat) => {
			if (beat == 1) {
				inputPromptEvent.trigger();
			}
			else if (beat == 2) {
				promptEvent.trigger();
			}

			objs.get("heart").forEach((heart, index, arr) => {
			});

			if (beat == 3) {
				pausableCtx.tween(trans.pos.y, ZOOM_Y, 1 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
				pausableCtx.tween(trans.scale, ZOOM_SCALE, 1 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint).onEnd(() => {
					finishTrans();
				});
				pausableCtx.tween(1, 0, 0.5 / ware.speed, (p) => screen.opacity = p, k.easings.easeOutQuint).onEnd(() => {
					endEvent.trigger();
				});
			}
		});
	}
	else if (state == "lose" || state == "win") {
		pausableCtx.tween(ZOOM_Y, k.center().y, 0.5 / ware.speed, (p) => trans.pos.y = p, k.easings.easeOutQuint);
		pausableCtx.tween(ZOOM_SCALE, k.vec2(1), 0.5 / ware.speed, (p) => trans.scale = p, k.easings.easeOutQuint);
		pausableCtx.tween(0, 1, 0.25 / ware.speed, (p) => screen.opacity = p, k.easings.easeOutQuint);

		if (state == "lose") {
			const sound = pausableCtx.play("@loseJingle", { speed: ware.speed });
			chillguy.frame = 2;
			screen.frame = 2;
			chillcat.frame = 2;
			chillbutterfly.frame = 2;

			objs.get("heart")[objs.get("heart").length - 1].kill();
			pausableCtx.wait(sound.duration() / ware.speed, () => {
				endEvent.trigger();
			});
		}
		else if (state == "win") {
			const sound = pausableCtx.play("@winJingle", { speed: ware.speed });
			chillguy.frame = 1;
			screen.frame = 1;
			chillcat.frame = 1;
			chillbutterfly.frame = 1;
			pausableCtx.wait(sound.duration() / ware.speed, () => {
				endEvent.trigger();
			});
		}
	}
	else if (state == "speed") {
		const sound = pausableCtx.play("@speedJingle", { speed: ware.speed });

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
			endEvent.trigger();
		});
	}

	return {
		destroy() {
			finishTrans();
		},

		onEnd(action: () => void) {
			return endEvent.add(action);
		},

		onInputPromptTime(action: () => void) {
			return inputPromptEvent.add(action);
		},

		onPromptTime(action: () => void) {
			return promptEvent.add(action);
		},
	};
}
