import Minigame from "./minigameType";
import { getGameID } from "./utils";

export const modules = import.meta.glob("../../../games/*/*.ts", { eager: true });

const exclude = new Set([]);

/** The imported games */
const games = Object.values(modules)
	.map((module: any) => module.default)
	.filter((game) => !exclude.has(getGameID(game))) as Minigame[];

const onlyInclude = new Set([
	DEV_MINIGAME, // Passed arg from npm run dev {yourname}:{gamename}
	...(import.meta.env?.VITE_ONLY_MINIGAMES ?? "").trim().split("\n").map((s: string) => s.trim()),
].filter((id) => games.some((game) => getGameID(game) === id)));

const fetchGames = [
	"example-microgame"
]

// @ts-ignore
const exampleMicrogame = await import("/assets/example-microgame/example-microgame.js");

const fetchedGames = [exampleMicrogame.default]

console.log("Fetched games:", fetchedGames);

export default fetchedGames


// export default onlyInclude.size
// 	? games.filter((game) => onlyInclude.has(getGameID(game)))
// 	: games;
