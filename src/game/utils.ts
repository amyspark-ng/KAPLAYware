import games from "./games";
import { WareApp } from "./kaplayware";
import { Minigame, MinigameInput } from "./types";

export const getGameID = (g: Minigame) => {
	const modules = import.meta.glob("../../games/*/*.ts", { eager: true });
	const gamePath = Object.keys(modules).find((pathKey: string) => (modules[pathKey] as any).default == g);
	const filename = gamePath.split("/")[gamePath.split("/").length - 1].replace(".ts", "");
	return `${g.author}:${filename}`;
};
export const getGameByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);

export const getElectibleGame = () => {
};

export const getInputMessage = (g: Minigame) => {
	const input = getGameInput(g);
	let message = "";

	if (input == "both") {
		message = "both";
		if (gameHidesMouse(g)) message += " (mouse hidden)";
		return message;
	}
	else if (input == "mouse") {
		message = "mouse";
		if (gameHidesMouse(g)) message += " (hidden)";
		return message;
	}
	else if (input == "keys") return input;
};

export function getGameInput(g: Minigame): MinigameInput {
	if (g.isBoss) return "both";
	if (g.isBoss == true || g.input == "mouse (hidden)" || g.input == "mouse") return "mouse";
	else return "keys";
}

export const getGameDuration = (g: Minigame, wareApp: WareApp) => {
	if (g.isBoss == true) return undefined;
	else if (g.isBoss == false) {
		let duration = 0;
		if (typeof g.duration == "function") duration = g.duration(wareApp.currentContext);
		else if (typeof g.duration == "number") duration = g.duration;
		return duration;
	}
};

export const gameHidesMouse = (g: Minigame) => {
	if (g.isBoss) return g.hideMouse;
	else if (g.isBoss == false) return g.input == "mouse (hidden)" || g.input == "keys";
};

export const isDefaultAsset = (assetName: any) => typeof assetName == "string" && assetName.includes("@");
