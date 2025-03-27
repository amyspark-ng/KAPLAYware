import games from "./games";
import { Minigame } from "./types";

export const coolPrompt = (prompt: string) => prompt.toUpperCase() + (prompt[prompt.length - 1] == "!" ? "" : "!");
export const getGameID = (g: Minigame) => {
	const modules = import.meta.glob("../../games/*/*.ts", { eager: true });
	const gamePath = Object.keys(modules).find((pathKey: string) => (modules[pathKey] as any).default == g);
	const filename = gamePath.split("/")[gamePath.split("/").length - 1].replace(".ts", "");
	return `${g.author}:${filename}`;
};
export const getGameByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);

export const gameUsesMouse = (g: Minigame) => {
	if (!g.input.cursor) return false;
	else return typeof g.input.cursor == "boolean" ? g.input.cursor : g.input.cursor != undefined;
};
export const gameHidesCursor = (g: Minigame) => {
	if (!g.input.cursor || g.input.keys) return true;
	else return typeof g.input.cursor == "boolean" ? g.input.cursor : g.input.cursor.hide;
};

export const getGameInput = (g: Minigame) => {
	const usesMouse = gameUsesMouse(g);

	if (usesMouse && g.input.keys) return "keysandmouse";
	else if (usesMouse && !g.input.keys) return "mouse";
	else if (!usesMouse && g.input.keys) return "keys";
	else return "idk";
};
