import { AudioPlay, KAPLAYCtx, KEventController } from "kaplay";
import k from "../engine";

export type Conductor = {
	time: number;
	bpm: number;
	paused: boolean;
	readonly beatInterval: number;
	destroy(): void;
	onBeat(action: (beat: number, beatTime: number) => void): KEventController;
	onUpdate(action: () => void): KEventController;
};

/** Small conductor class for managing beat hit behaviour
 * @param bpm The BPM (beats per minute) to use
 * @param startPaused Wheter to start paused (default false)
 *
 * @example
 * ```ts
 * const conductor = createConductor(140)
 * conductor.onBeat(() => {
 * 	// bops the bean
 * 	k.tween(k.vec2(1.25), k.vec2(1), 0.15, (p) => bean.scale = p)
 * })
 * ```
 */
export function createConductor(bpm: number, startPaused: boolean = false): Conductor {
	const beatHitEv = new k.KEvent();
	let currentBeat = 0;
	let time = 0;
	let beatInterval = 60 / bpm;
	let paused = startPaused;
	const updateEv = new k.KEvent();
	const update = k.onUpdate(() => updateEv.trigger());
	updateEv.add(() => {
		if (paused) return;
		beatInterval = 60 / bpm;
		time = (time + k.dt()) % 60;

		const beatTime = time / beatInterval;
		const oldBeat = Math.floor(currentBeat);
		currentBeat = Math.floor(beatTime);
		if (currentBeat != oldBeat) {
			beatHitEv.trigger(currentBeat, beatTime);
		}
	});

	return {
		onBeat(action: (beat: number, beatTime: number) => void) {
			return beatHitEv.add(action);
		},
		set bpm(val: number) {
			bpm = val;
		},
		get bpm() {
			return bpm;
		},
		get beatInterval() {
			return beatInterval;
		},
		get paused() {
			return paused;
		},
		set paused(val: boolean) {
			paused = val;
		},
		set time(val: number) {
			time = 0;
		},
		get time() {
			return time;
		},
		destroy() {
			update.cancel();
			beatHitEv.clear();
		},
		onUpdate(action) {
			return updateEv.add(action);
		},
	};
}
