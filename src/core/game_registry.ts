import { CONFIG } from "../config";
import { k } from "../kaplay";
import { Microgame } from "./microgame";

export function createMicrogame(game: Microgame): void {
	CONFIG.microgames.push(game);
	console.log(`Pushed microgame "${getGameID(game)}" to the registry`);
}

export function getGameID(game: Microgame) {
	return `${game.author}:${game.name}`;
}

export function getGame(id: string) {
	const game = CONFIG.microgames.find((game) => getGameID(game) == id);
	if (!game) throw new Error("No game found by " + id);
	else return game;
}

export function getGameColor(param: [number, number, number] | string) {
	return typeof param == "string" ? k.Color.fromHex(param) : k.rgb(...param);
}
