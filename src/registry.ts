import { k } from "./kaplay";
import { Microgame } from "./scenes/game/core/microgame";

export const MicrogameRegistry: Record<string, Microgame[]> = {};

export function createMicrogame(game: Microgame): void {
	if (!MicrogameRegistry[game.pack]) MicrogameRegistry[game.pack] = [];
	MicrogameRegistry[game.pack].push(game);
	console.log(`Pushed microgame "${getGameID(game)}" to the registry`);
}

export function getGameID(game: Microgame) {
	return `${game.author}:${game.name}`;
}

export function getGame(id: string) {
	let game: Microgame = null;
	Object.keys(MicrogameRegistry).forEach((pack) => {
		MicrogameRegistry[pack].forEach((g) => getGameID(g) == id ? game = g : undefined);
	});
	return game;
}
