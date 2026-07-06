import { AudioPlay, ColorComp, GameObj, KAPLAYCtx, PosComp, RectComp, ScaleComp, TimerComp } from "kaplay";
import { k } from "../../kaplay";
import { gameAPIs } from "../context/api";
import { pickKeysInObj } from "../../utils";
import { Scenery } from "../scenery";

/**
 * Is the ACT that manages events, timers and sounds created by the microgame or function inside
 *
 * It's like a mini KAPLAY engine
 *
 * NEEDS a {@link Scenery} to exist
 */
export interface Act {
	scenery: Scenery;
	root: GameObj<TimerComp | ColorComp | RectComp>;
	engine: {
		time: number;
		play: KAPLAYCtx["play"];
		sounds: AudioPlay[];
		disabledSounds: AudioPlay[];
		isPaused(): boolean;
		pauseEverything(val: boolean): void;
		setSoundsPaused(newPause: boolean): void;
		getSoundsPaused(): boolean;
	};
	destroy(): void;
	ctx: Pick<typeof k, typeof gameAPIs[number]>;
}

/** Creates a {@link Act} */
export function createAct(scenery: Scenery): Act {
	let _soundsPaused = false;
	let _isEnginePaused = false;

	const act: Act = {
		scenery,
		root: scenery.scene.add([k.timer(), k.color(), k.rect(k.width(), k.height()), {
			update() {
				act.engine.time += k.dt();
			},
		}]),
		engine: {
			time: 0,
			sounds: [],
			disabledSounds: [],

			isPaused() {
				return _isEnginePaused;
			},

			getSoundsPaused() {
				return _soundsPaused;
			},

			setSoundsPaused(val: boolean) {
				_soundsPaused = val;

				if (act.engine.getSoundsPaused() == true) {
					act.engine.sounds.forEach((sound) => {
						// if it's already paused it's being managed by the actual game
						if (sound.paused) return;

						// sound is intended to play but sounds were disabled
						act.engine.disabledSounds.push(sound);
						sound.paused = true;
					});
				}
				else if (act.engine.getSoundsPaused() == false) {
					// have to do this because modifying the array while it's doing a forEach
					// it's not a good idea
					let newArray = [...act.engine.disabledSounds];
					act.engine.disabledSounds.forEach((sound, index) => {
						// re enable the good sounds
						newArray.splice(index, 1)[0];
						sound.paused = false;
					});
					act.engine.disabledSounds = newArray;
				}
			},

			play: (src, options) => {
				const sound = k.play(src, options);

				// this is for sounds that start paused
				if (options && options.paused) sound.paused = true;

				// if sounds are currently paused by the engine, pause it and add it to disabled sounds
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

			pauseEverything(val) {
				_isEnginePaused = val;
				act.root.paused = _isEnginePaused;
				act.engine.setSoundsPaused(_isEnginePaused);
			},
		},
		destroy: () => {
			act.root.destroy();
			act.engine.sounds.forEach((sound) => sound.stop());
		},
		ctx: null,
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
				act.ctx.rect(act.ctx.width() * 2, act.ctx.height() * 2),
				act.ctx.color(flashColor),
				act.ctx.opacity(),
				act.ctx.z(99999999),
				act.ctx.fixed(),
			]);
			const tween = act.root.tween(1, 0, fadeOutTime, (p) => obj.opacity = p);
			return tween;
		},

		time() {
			return act.engine.time;
		},
		tween: act.root.tween,
		loop: act.root.loop,
		wait: act.root.wait,
	};

	return act;
}
