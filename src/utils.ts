import games from "./games";
import { Minigame } from "./types";

export const coolPrompt = (prompt: string) => prompt.toUpperCase() + (prompt[prompt.length - 1] == "!" ? "" : "!");
export const getGameID = (g: Minigame) => `${g.author}:${g.prompt}`;
export const getByID = (id: string) => games.find((minigame) => `${minigame.author}:${minigame.prompt}` == id);
