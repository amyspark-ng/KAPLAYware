import { AudioPlay, ColorComp, GameObj, KAPLAYCtx, PosComp, RectComp, ScaleComp, TimerComp } from "kaplay";
import { k } from "../../kaplay";
import { gameAPIs } from "../context/api";
import { pickKeysInObj } from "../../utils";
import { GameScenery } from "../scenery";

/**
 * Is the act that manages events, timers and sounds created by the microgame or function inside
 *
 * NEEDS an scenery to exist
 */
export interface GameAct {
	scenery: GameScenery;
	root: GameObj<TimerComp | ColorComp | RectComp>;
	engine: {
		pauseEverything(val: boolean): void;
		play: KAPLAYCtx["play"];
		sounds: AudioPlay[];
		disabledSounds: AudioPlay[];
		setSoundsPaused(newPause: boolean): void;
		getSoundsPaused(): boolean;
	};
	destroy(): void;
	ctx: Pick<typeof k, typeof gameAPIs[number]>;
}

export function createAct(scenery: GameScenery): GameAct {
	let _soundsPaused = false;

	const act: GameAct = {
		scenery,
		root: null,
		ctx: null,
		engine: null,
		destroy: null,
	};

	act.ctx = {
		...pickKeysInObj(k, [...gameAPIs]),
		// modified functions
		add: (comps) => act.root.add(comps),
		play: (src, options) => act.engine.play(src, options),
		get: (tag, opts) => act.root.get(tag, opts),

		opacity(o) {
			const comp = k.opacity(o);
			return {
				...comp,
				fadeOut(time: number, easeFunc = k.easings.linear) {
					return act.root.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return act.root.tween(
						0,
						this.opacity,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
			};
		},

		getCamRot: () => act.scenery.camera.angle,
		setCamRot: (val: number) => act.scenery.camera.angle = val,
		getCamPos: () => act.scenery.camera.pos,
		setCamPos: (val) => act.scenery.camera.pos = k.vec2(val),
		getCamScale: () => act.scenery.camera.scale,
		setCamScale: (val) => act.scenery.camera.scale = k.vec2(val),
		shake: (val: number = 12) => act.scenery.camera.shake += val,
		addConfetti: (opt) => {
			const confetti = k.addConfetti(opt);
			if (act.root.exists()) confetti.parent = act.root;
			else confetti.destroy();
			return confetti;
		},
		flash(flashColor, fadeOutTime) {
			const obj = act.root.add([
				act.ctx.rect(act.ctx.width(), act.ctx.height()),
				act.ctx.color(flashColor),
				act.ctx.opacity(),
				act.ctx.z(99999999),
			]);
			const tween = act.root.tween(1, 0, fadeOutTime, (p) => obj.opacity = p);
			return tween;
		},
	};

	act.engine = {
		sounds: [],
		disabledSounds: [],

		getSoundsPaused() {
			return _soundsPaused;
		},

		setSoundsPaused(val: boolean) {
			_soundsPaused = val;

			if (act.engine.getSoundsPaused() == true) {
				act.engine.sounds.forEach((sound) => {
					if (sound.paused) return;
					// sound is intended to play but sounds were disabled
					act.engine.disabledSounds.push(sound);
					sound.paused = true;
				});
			}
			else if (act.engine.getSoundsPaused() == false) {
				act.engine.disabledSounds.forEach((sound) => {
					// re enable the good sounds
					sound.paused = false;
					act.engine.disabledSounds.splice(act.engine.disabledSounds.indexOf(sound), 1);
				});
			}
		},

		play: (src, options) => {
			const sound = k.play(src, options);
			// options.paused is undefined, don't use it for checks

			if (act.engine.getSoundsPaused() && sound.paused == false) {
				sound.paused = true;
				act.engine.disabledSounds.push(sound);
			}

			act.engine.sounds.push(sound);

			sound.onEnd(() => {
				act.engine.sounds.splice(act.engine.sounds.indexOf(sound), 1);
				if (act.engine.disabledSounds.includes(sound)) act.engine.disabledSounds.splice(act.engine.disabledSounds.indexOf(sound), 1);
			});

			return sound;
		},

		// TODO: make sure input events are also paused with this
		pauseEverything(val) {
			if (val) {
				act.root.paused = true;
				act.engine.setSoundsPaused(true);
			}
			else {
				act.root.paused = false;
				act.engine.setSoundsPaused(false);
			}
		},
	};

	act.root = scenery.scene.add([k.timer(), k.color(), k.rect(act.ctx.width(), act.ctx.height())]);
	act.destroy = () => {
		act.root.destroy();
		act.engine.sounds.forEach((sound) => sound.stop());
	};

	return act;
}
