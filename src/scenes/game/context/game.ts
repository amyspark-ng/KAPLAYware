import { gameAPIs } from "./api";
import { k } from "../../../kaplay";
import { MicrogameController } from "../core/controller";
import { getGameID } from "../../../registry";
import { assets } from "@kaplayjs/crew";
import { SandboxInstance } from "../core/instance/instance";

export type MicrogameContext = Pick<typeof k, typeof gameAPIs[number]> & {
	readonly timeLeft: number;
	readonly speed: number;
	readonly isHardMode: boolean;

	setResult(result: "win" | "lose"): void;
	getResult(): "win" | "lose" | undefined;
	finishGame(): void;
	onTimeout: MicrogameController["onTimeout"];
};

export function buildGameContext(instance: SandboxInstance, controller: MicrogameController): MicrogameContext {
	const id = getGameID(controller.currentGame);

	return {
		...instance.context,
		sprite: (spr, opt) => {
			if (typeof spr == "string" && !Object.keys(assets).includes(spr)) {
				spr = `${id}-${spr}`;
			}

			return k.sprite(spr, opt);
		},

		play: (src, options) => {
			src = typeof src == "string" ? (src.startsWith("@") ? src : `${id}-${src}`) : src;

			const sound = k.play(src, options);
			// options.paused is undefined, don't use it for checks

			if (instance.soundsPaused && sound.paused == false) {
				sound.paused = true;
				instance.disabledSounds.push(sound);
			}

			instance.sounds.push(sound);

			sound.onEnd(() => {
				instance.sounds.splice(instance.sounds.indexOf(sound), 1);
				if (instance.disabledSounds.includes(sound)) instance.disabledSounds.splice(instance.disabledSounds.indexOf(sound), 1);
			});

			return sound;
		},

		get speed() {
			return controller.speed;
		},

		get timeLeft() {
			return controller.timeLeft;
		},

		get isHardMode() {
			return controller.isHard;
		},

		setResult(result) {
			controller.gameResult = result;
			if (result == "win" && controller.currentBomb) controller.currentBomb.extinguish();
		},

		getResult() {
			return controller.gameResult;
		},

		onTimeout(action) {
			return controller.onTimeout(action);
		},

		finishGame() {
			controller.finished = true;
			controller.finishKEvent.trigger(controller.gameResult);
		},
	};
}
