import { LoadContext } from "../assets/load_microgames";
import { MicrogameContext } from "./context/game";

/** The properties and the Microgame Interface */
export interface Microgame {
	pack: string;
	author: string;
	name: string;
	prompt: string;
	urlPrefix: string;
	duration: number;
	bgColor: [number, number, number] | string;
	boss: boolean;
	input: "arrowkeys" | "mouse" | "mouseclick" | "all";
	iconPath: string;

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
	load?: (ctx: LoadContext) => Promise<any>;
	start: (ctx: MicrogameContext) => void;
}
