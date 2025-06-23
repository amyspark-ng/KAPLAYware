import { AudioPlay, TimerController, TweenController } from "kaplay";
import k from "../../../engine";
import { Conductor, createConductor } from "../../../plugins/conductor";

/** A type of context that can be paused (es clave) */
export type TransCtx = {
	play: typeof k["play"];
	tween: typeof k["tween"];
	loop: typeof k["loop"];
	wait: typeof k["wait"];
	createConductor: typeof createConductor;
	paused: boolean;
	cancel(): void;
};

export function createTransCtx(): TransCtx {
	let sounds: AudioPlay[] = [];
	let timers: (TimerController | TweenController)[] = [];
	let conductors: Conductor[] = [];

	let disabledSounds: AudioPlay[] = [];
	let paused = false;

	return {
		play(src, options) {
			const snd = k.play(src, options);

			if (paused && snd.paused == false) {
				snd.paused = true;
				disabledSounds.push(snd);
			}

			sounds.push(snd);

			snd.onEnd(() => {
				sounds.splice(sounds.indexOf(snd), 1);
				if (disabledSounds.includes(snd)) disabledSounds.splice(disabledSounds.indexOf(snd), 1);
			});

			return snd;
		},
		loop(t, action, maxLoops, waitFirst) {
			const l = k.loop(t, action, maxLoops, waitFirst);
			timers.push(l);
			return l;
		},
		wait(n, action) {
			const w = k.wait(n, action);
			timers.push(w);
			return w;
		},
		tween(from, to, duration, setValue, easeFunc) {
			const t = k.tween(from, to, duration, setValue, easeFunc);
			timers.push(t);
			return t;
		},
		get paused() {
			return paused;
		},
		set paused(val: boolean) {
			paused = val;
			timers.forEach((t) => t.paused = paused);
			conductors.forEach((c) => c.paused = paused);

			if (paused == true) {
				sounds.forEach((sound) => {
					if (sound.paused) return;
					// sound is intended to play but sounds were disabled
					disabledSounds.push(sound);
					sound.paused = true;
				});
			}
			else if (paused == false) {
				disabledSounds.forEach((sound) => {
					// re enable the good sounds
					sound.paused = false;
					disabledSounds.splice(disabledSounds.indexOf(sound), 1);
				});
			}
		},
		cancel() {
			sounds.forEach((snd) => snd.stop());
			sounds = [];
			timers.forEach((t) => t.cancel());
			timers = [];
			conductors.forEach((conductor) => conductor.destroy());
			conductors = [];
		},
		createConductor(bpm, startPaused) {
			const c = createConductor(bpm, startPaused);
			conductors.push(c);
			return c;
		},
	};
}
