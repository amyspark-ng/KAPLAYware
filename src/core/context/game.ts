import { k } from "../../kaplay";
import { mergeWithRef } from "../../utils";
import { MicrogameController } from "../controller";
import { getGameID } from "../game_registry";
import { assets } from "@kaplayjs/crew";
import { gameAPIs } from "./api";
import { Act } from "../act/act";
import { Microgame } from "../microgame";

/** The KAPLAYCtx modified for the context of Microgame developing */
export type MicrogameContext = Pick<typeof k, typeof gameAPIs[number]> & {
	readonly speed: number;
	readonly isHardMode: boolean;
	readonly lives: number;
	/** Has to be done like this because it wouldn't update otherwise */
	timeLeft(): number;

	setResult(result: "win" | "lose"): void;
	getResult(): "win" | "lose" | undefined;
	finishGame(): void;
	onTimeout: MicrogameController["onTimeout"];
};

/** Creates a {@link MicrogameContext} */
export function buildGameContext(act: Act, game: Microgame, controller: MicrogameController): MicrogameContext {
	const id = getGameID(game);

	return {
		...act.ctx,
		sprite: (spr, opt) => {
			const crewKeys = Object.keys(assets).concat(Object.keys(assets).map((a) => a + "-o"));

			// if not crew and doesnt start with @
			if (typeof spr == "string" && !crewKeys.includes(spr) && !spr.startsWith("@")) {
				spr = `${id}-${spr}`;
			}

			const spriteComp = k.sprite(spr, opt);

			return mergeWithRef(spriteComp, {
				get sprite() {
					return spriteComp.sprite.replace(id + "-", "");
				},
				set sprite(val: string) {
					if (!crewKeys.includes(val)) spriteComp.sprite = `${id}-${val}`;
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

		// # Microgame specific functions here
		// These would not be on the KAPLAYCtx

		get speed() {
			return controller.speed;
		},

		timeLeft() {
			return controller.timeLeft;
		},

		get isHardMode() {
			return controller.isHard;
		},

		get lives() {
			return controller.lives;
		},

		setResult(result) {
			controller.lastGameResult = result;
		},

		getResult() {
			return controller.lastGameResult;
		},

		onTimeout(action) {
			return controller.onTimeout(action);
		},

		finishGame() {
			controller.finished = true;
			controller.finishKEvent.trigger(controller.lastGameResult);
		},
	};
}
