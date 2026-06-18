import { AudioPlay, GameObj, KAPLAYCtx } from "kaplay";
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
	root: GameObj;
	engine: {
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

	const window: GameAct = {
		scenery,
		root: k.add([]),
		ctx: null,
		engine: null,
		destroy: null,
	};

	window.ctx = {
		...pickKeysInObj(k, [...gameAPIs]),
		// modified functions
		add: (comps) => window.root.add(comps),
		play: (src, options) => window.engine.play(src, options),
		get: (tag, opts) => window.root.get(tag, opts),

		opacity(o) {
			const comp = k.opacity(o);
			return {
				...comp,
				fadeOut(time: number, easeFunc = k.easings.linear) {
					return window.root.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return window.root.tween(
						0,
						this.opacity,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
			};
		},

		getCamRot: () => window.scenery.camera.angle,
		setCamRot: (val: number) => window.scenery.camera.angle = val,
		getCamPos: () => window.scenery.camera.pos,
		setCamPos: (val) => window.scenery.camera.pos = k.vec2(val),
		getCamScale: () => window.scenery.camera.scale,
		setCamScale: (val) => window.scenery.camera.scale = k.vec2(val),
		shake: (val: number = 12) => window.scenery.camera.shake += val,
		addConfetti: (opt) => {
			const confetti = k.addConfetti(opt);
			if (window.root.exists()) confetti.parent = window.root;
			else confetti.destroy();
			return confetti;
		},
		flash(flashColor, fadeOutTime) {
			const obj = window.root.add([
				this.rect(window.ctx.width(), window.ctx.height()),
				window.ctx.color(flashColor),
				window.ctx.opacity(),
				window.ctx.z(99999999),
			]);
			const tween = window.root.tween(1, 0, fadeOutTime, (p) => obj.opacity = p);
			return tween;
		},
	};

	window.engine = {
		sounds: [],
		disabledSounds: [],

		getSoundsPaused() {
			return _soundsPaused;
		},

		setSoundsPaused(val: boolean) {
			_soundsPaused = val;

			if (window.engine.getSoundsPaused() == true) {
				window.engine.sounds.forEach((sound) => {
					if (sound.paused) return;
					// sound is intended to play but sounds were disabled
					window.engine.disabledSounds.push(sound);
					sound.paused = true;
				});
			}
			else if (window.engine.getSoundsPaused() == false) {
				window.engine.disabledSounds.forEach((sound) => {
					// re enable the good sounds
					sound.paused = false;
					window.engine.disabledSounds.splice(window.engine.disabledSounds.indexOf(sound), 1);
				});
			}
		},

		play: (src, options) => {
			const sound = k.play(src, options);
			// options.paused is undefined, don't use it for checks

			if (window.engine.getSoundsPaused() && sound.paused == false) {
				sound.paused = true;
				window.engine.disabledSounds.push(sound);
			}

			window.engine.sounds.push(sound);

			sound.onEnd(() => {
				window.engine.sounds.splice(window.engine.sounds.indexOf(sound), 1);
				if (window.engine.disabledSounds.includes(sound)) window.engine.disabledSounds.splice(window.engine.disabledSounds.indexOf(sound), 1);
			});

			return sound;
		},
	};

	window.root = scenery.scene.add([k.timer(), k.rect(window.ctx.width(), window.ctx.height()), k.color()]);
	window.destroy = () => {
		window.root.destroy();
		window.engine.sounds.forEach((sound) => sound.stop());
	};

	return window;
}
