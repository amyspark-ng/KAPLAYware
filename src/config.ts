import { Microgame } from "./scenes/game/core/microgame";

export const CONFIG = {
	initialScene: "game",
	microgames: [] as Microgame[],
	...__GAME_CONFIG__,
};
