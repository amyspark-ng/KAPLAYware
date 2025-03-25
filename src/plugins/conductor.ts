import { AudioPlay, KAPLAYCtx } from "kaplay";

export function conductorPlug(k: KAPLAYCtx) {
	return {
		/** Small conductor class for managing beat hit behaviour
		 * @param bpm The BPM (beats per minute) to use
		 * @param sound The sound to use
		 *
		 * @example
		 * ```ts
		 * const conductor = k.conductor(140, k.play("music"))
		 * conductor.onBeat(() => {
		 * 	// bops the bean
		 * 	k.tween(k.vec2(1.25), k.vec2(1), 0.15, (p) => bean.scale = p)
		 * })
		 * ```
		 */
		conductor(bpm: number, startPaused: boolean = false, sound?: AudioPlay) {
			const beatHitEv = new k.KEvent();
			let currentBeat = 0;
			let time = 0;
			let beatInterval = 60 / bpm;
			let paused = startPaused;

			const update = k.onUpdate(() => {
				if (paused) return;
				beatInterval = 60 / bpm;
				if (sound) time = sound.time();
				else time = (time + k.dt()) % 60;

				const beatTime = time / beatInterval;
				const oldBeat = Math.floor(currentBeat);
				currentBeat = Math.floor(beatTime);
				if (currentBeat != oldBeat) {
					beatHitEv.trigger(currentBeat);
				}
			});

			function destroy() {
				update.cancel();
				beatHitEv.clear();
			}

			if (sound) {
				sound.onEnd(() => destroy());
			}

			return {
				/** Will run every beat of your conductor */
				onBeat(action: (beat: number) => void) {
					return beatHitEv.add(action);
				},
				/** Destroys the current instance (won't work anymore) */
				destroy,
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
				get time() {
					return time;
				},
				/** Will set the time of the sound if one was passed */
				set time(val: number) {
					time = val;
					if (sound) sound.seek(time);
				},
			};
		},
	};
}

export default conductorPlug;
