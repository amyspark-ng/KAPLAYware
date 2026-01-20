import { AudioPlay, GameObj, KAPLAYCtx, TimerComp, ZComp } from "kaplay";
import { Scenery } from "../scenery";
import { k } from "../../../../kaplay";
import { buildInstanceContext, InstanceContext } from "./context";

export class SandboxInstance {
	/** Rooot of this specific instance of sandbox, children of scene
	 * k.root -> scenery.scene -> instance.root (k.root is the grandfather of instance.root)
	 */
	root: GameObj<TimerComp>;
	context: InstanceContext;

	get paused() {
		return this.soundsPaused && this.root.paused;
	}

	set paused(val: boolean) {
		this.root.paused = true;
		this.soundsPaused = val;
	}

	sounds: AudioPlay[] = [];
	disabledSounds: AudioPlay[] = [];
	private _soundsPaused: boolean = false;

	get soundsPaused() {
		return this._soundsPaused;
	}

	set soundsPaused(val: boolean) {
		this._soundsPaused = val;

		if (this._soundsPaused == true) {
			this.sounds.forEach((sound) => {
				if (sound.paused) return;
				// sound is intended to play but sounds were disabled
				this.disabledSounds.push(sound);
				sound.paused = true;
			});
		}
		else if (this.soundsPaused == false) {
			this.disabledSounds.forEach((sound) => {
				// re enable the good sounds
				sound.paused = false;
				this.disabledSounds.splice(this.disabledSounds.indexOf(sound), 1);
			});
		}
	}

	play: KAPLAYCtx["play"] = (src, options) => {
		const sound = k.play(src, options);
		// options.paused is undefined, don't use it for checks

		if (this.soundsPaused && sound.paused == false) {
			sound.paused = true;
			this.disabledSounds.push(sound);
		}

		this.sounds.push(sound);

		sound.onEnd(() => {
			this.sounds.splice(this.sounds.indexOf(sound), 1);
			if (this.disabledSounds.includes(sound)) this.disabledSounds.splice(this.disabledSounds.indexOf(sound), 1);
		});

		return sound;
	};

	constructor(private scenery: Scenery) {
		this.root = this.scenery.scene.add([k.timer()]);
		buildInstanceContext(this);
	}
}
