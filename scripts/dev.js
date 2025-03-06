import { exec } from "child_process";
import * as fs from "fs/promises";

import { games } from "../src/games.ts";

console.log(games);

// let devMinigame = true;
// const [author, gamePrompt] = (process.argv[2] ?? "").split(":");

// if (!author || !gamePrompt) {
// 	devMinigame = false;
// }
// else {
// 	devMinigame = true;
// 	// const gameToRun = games.find((minigame) => getGameID(minigame) == `${author}:${gamePrompt}`);
// 	// if (!gameToRun) console.error("WE COULDN'T FIND THAT ONE MINIGAME");
// 	// else {
// 	// 	games = games.filter((game) => game == gameToRun);
// 	// 	console.log("Running: " + getGameID(gameToRun));
// 	// }
// }
