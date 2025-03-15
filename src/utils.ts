import games from "./games";
import { Minigame } from "./types";

export const coolPrompt = (prompt: string) => prompt.toUpperCase() + (prompt[prompt.length - 1] == "!" ? "" : "!");
export const getGameID = (g: Minigame) => {
	const modules = import.meta.glob("../games/*/*.ts", { eager: true });
	const gamePath = Object.keys(modules).find((pathKey: string) => (modules[pathKey] as any).default == g);
	const filename = gamePath.split("/")[gamePath.split("/").length - 1].replace(".ts", "");
	return `${g.author}:${filename}`;
};
export const getByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);
