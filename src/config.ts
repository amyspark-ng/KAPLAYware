import { Microgame } from "./core/microgame";

export const CONFIG = {
	initialScene: "game",
	microgames: [] as Microgame[],
	...__GAME_CONFIG__,
};
