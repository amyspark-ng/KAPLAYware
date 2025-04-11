import games from "./games";
import { Minigame, MinigameInput } from "./types";

export const getGameID = (g: Minigame) => {
	const modules = import.meta.glob("../../games/*/*.ts", { eager: true });
	const gamePath = Object.keys(modules).find((pathKey: string) => (modules[pathKey] as any).default == g);
	const filename = gamePath.split("/")[gamePath.split("/").length - 1].replace(".ts", "");
	return `${g.author}:${filename}`;
};
export const getGameByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);

export const gameUsesMouse = (g: Minigame) => {
	return g.difficulty == "BOSS" || g.input == "mouse (hidden)" || g.input == "mouse";
};

export function getGameInput(g: Minigame): MinigameInput {
	if (g.difficulty == "BOSS") return "both";
	if (gameUsesMouse(g)) return "mouse";
	else return "keys";
}

export const gameHidesMouse = (g: Minigame) => {
	return gameUsesMouse(g) && g.input == "mouse (hidden)";
};

export const isDefaultAsset = (assetName: any) => typeof assetName == "string" && assetName.includes("@");
