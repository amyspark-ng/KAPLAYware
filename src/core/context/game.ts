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

		// If spr starts with "@" the ID rule will be ignored
		sprite: (spr, opt) => {
			if (typeof spr == "string" && !spr.startsWith("@")) {
				spr = `${id}-${spr}`;
			}
			else if (typeof spr == "string" && spr.startsWith("@")) spr = spr.slice(1);

			const spriteComp = k.sprite(spr, opt);

			// TODO: MAKE THIS WORK PROPERLY AND MODIFY ALL SPRITE CODE SETTING THINGS I GUESS TS PMOING ME OFF
			return mergeWithRef(spriteComp, {
				get sprite() {
					if (typeof spr != "string") return spriteComp.sprite;
					else if (spr.startsWith("@")) return spr.slice(1);
					else if (spr.startsWith(id)) return spr.replace(`${id}-`, "");
				},
				set sprite(val: string) {
					if (val.startsWith("@")) spriteComp.sprite = val.slice(1);
					else spriteComp.sprite = `${id}-${val}`;
				},
			});
		},

		getSprite: (name) => k.getSprite(`${id}-${name}`),

		drawSprite: (opt) => {
			return k.drawSprite({
				...opt,
				sprite: typeof opt.sprite == "string" ? (opt.sprite.startsWith("@") ? opt.sprite.slice(1) : `${id}-${opt.sprite}`) : opt.sprite,
			});
		},

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
