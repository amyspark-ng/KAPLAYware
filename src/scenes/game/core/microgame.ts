import { MicrogameContext } from "../context/game";
import { LoadContext } from "../../../assets/context";

export interface Microgame {
	pack: string;
	author: string;
	name: string;
	prompt: string;
	urlPrefix: string;
	duration: number;
	bgColor: [number, number, number] | string;
	/** Additional options for the HARD MODE version of the microgame
	 *
	 * if the values inside are left undefined they will be the same as the ones defined before */
	hardModeOpt?: {
		duration?: number;
		prompt?: string;
		bgColor?: [number, number, number] | string;
	};
	/**
	 * The function where your asset specific games are loaded
	 *
	 * By default, it uses the assets folder, so if you wanted to load circle.png you'd simply do:
	 * ```ts
	 * ctx.loadSprite("circle", "circle.png")
	 * ```
	 */
	load?: (ctx: LoadContext) => void;
	start: (ctx: MicrogameContext, speed: number, difficulty: number) => void;
}
