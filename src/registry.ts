import { CONFIG } from "./config";
import { k } from "./kaplay";
import { Microgame } from "./scenes/game/core/microgame";

export function createMicrogame(game: Microgame): void {
	CONFIG.microgames.push(game);
	console.log(`Pushed microgame "${getGameID(game)}" to the registry`);
}

export function getGameID(game: Microgame) {
	return `${game.author}:${game.name}`;
}

export function getGame(id: string) {
	return CONFIG.microgames.find((game) => getGameID(game) == id);
}

export function getGameColor(param: [number, number, number] | string) {
	return typeof param == "string" ? k.Color.fromHex(param) : k.rgb(...param);
}
