import { Minigame } from "./types";
import { getGameID } from "./utils";

const gameModules = import.meta.glob("../../games/*/*.ts", { eager: true });

const exclude = new Set(["amyspark-ng:flip"]);

const games = Object.values(gameModules)
	.map((module: any) => module.default)
	.filter((game) => !exclude.has(getGameID(game))) as Minigame[];

const onlyInclude = new Set([
	DEV_MINIGAME, // Passed arg from npm run dev {yourname}:{gamename}
	...(import.meta.env?.VITE_ONLY_MINIGAMES ?? "").trim().split("\n").map((s: string) => s.trim()),
].filter((id) => games.some((game) => getGameID(game) === id)));

export default onlyInclude.size
	? games.filter((game) => onlyInclude.has(getGameID(game)))
	: games;
