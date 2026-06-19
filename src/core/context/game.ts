import { k } from "../../kaplay";
import { mergeWithRef } from "../../utils";
import { MicrogameController } from "../controller";
import { getGameID } from "../game_registry";
import { assets } from "@kaplayjs/crew";
import { gameAPIs } from "./api";
import { GameAct } from "../act/game_act";

/** The KAPLAYCtx modified for the context of Microgame developing */
export type MicrogameContext = Pick<typeof k, typeof gameAPIs[number]> & {
	readonly timeLeft: number;
	readonly speed: number;
	readonly isHardMode: boolean;

	setResult(result: "win" | "lose"): void;
	getResult(): "win" | "lose" | undefined;
	finishGame(): void;
	onTimeout: MicrogameController["onTimeout"];
};

/** Creates a {@link MicrogameContext} */
export function buildGameContext(act: GameAct, controller: MicrogameController): MicrogameContext {
	const id = getGameID(controller.currentGame);

	return {
		...act.ctx,
		sprite: (spr, opt) => {
			const keys = Object.keys(assets).concat(Object.keys(assets).map((a) => a + "-o"));
			if (typeof spr == "string" && !keys.includes(spr)) {
				spr = `${id}-${spr}`;
			}

			const spriteComp = k.sprite(spr, opt);

			return mergeWithRef(spriteComp, {
				get sprite() {
					return spriteComp.sprite.replace(id + "-", "");
				},
				set sprite(val: string) {
					if (!keys.includes(val)) spriteComp.sprite = `${id}-${val}`;
					spriteComp.sprite = val;
				},
			});
		},

		getSprite: (name) => k.getSprite(`${id}-${name}`),

		play: (src, options) => {
			src = typeof src == "string" ? (src.startsWith("@") ? src : `${id}-${src}`) : src;
			const sound = act.engine.play(src, options);
			return sound;
		},

		/**
		 * Microgame specific functions here
		 *
		 * These would not be on the KAPLAYCtx
		 */
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
			if (result == "win" && controller.currentBomb && 4 - controller.currentBomb.conductor.beats > 1) controller.currentBomb.extinguish();
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
