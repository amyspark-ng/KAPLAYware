import { Microgame } from "../../types/Microgame";
import { getGameID } from "./utils";

export const modules = import.meta.glob("../../../games/*/*.ts", { eager: true });

const exclude = new Set([]);

/** The imported games */
const games = Object.values(modules)
	.map((module: any) => module.default)
	.filter((game) => !exclude.has(getGameID(game))) as Microgame[];

const onlyInclude = new Set([
	DEV_MICROGAME, // Passed arg from npm run dev {yourname}:{gamename}
	...(import.meta.env?.VITE_ONLY_MICROGAME ?? "").trim().split("\n").map((s: string) => s.trim()),
].filter((id) => games.some((game) => getGameID(game) === id)));

if (onlyInclude.size == 0 && DEV_MICROGAME) {
	throw new Error(`Tried to run dev ${DEV_MICROGAME}, but that microgame doesn't exist!`);
}

export default onlyInclude.size
	? games.filter((game) => onlyInclude.has(getGameID(game)))
	: games;
