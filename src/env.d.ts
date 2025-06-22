import type { Microgame } from "./types/Microgame.ts";

declare global {
	interface Window {
		DEV_MICROGAME: string;
		/** All the micro-games loaded inside KAPLAYWare/ */
		microgames: Microgame[];
	}
}
