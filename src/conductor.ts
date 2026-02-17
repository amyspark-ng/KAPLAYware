import { GameObj, KEventController } from "kaplay";
import { k } from "./kaplay";

export type Conductor = {
	time: number;
	bpm: number;
	beats: number;
	paused: boolean;
	readonly beatInterval: number;
	destroy(): void;
	onBeat(action: (beat: number, beatTime: number) => void): KEventController;
	onUpdate: GameObj["onUpdate"];
};

export function createConductor(bpm: number, startPaused: boolean = false): Conductor {
	const beatHitEv = new k.KEvent();
	let currentBeat = 0;
	let time = 0;
	let beatInterval = 60 / bpm;
	let paused = startPaused;
	const obj = k.add([]);

	obj.onUpdate(() => {
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
		get beats() {
			return Math.floor(currentBeat);
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
			obj.destroy();
			beatHitEv.clear();
		},
		onUpdate: (action) => obj.onUpdate(action),
	};
}
