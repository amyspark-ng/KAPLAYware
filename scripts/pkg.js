import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const [author, gamePrompt] = (process.argv[2] ?? "").split(":");
const speed = process.argv.find((arg) => arg.includes("speed"))?.split("=")[1];
const difficulty = process.argv.find((arg) => arg.includes("diff"))?.split("=")[1];
const microgameID = `${author}:${gamePrompt}`;
const isMicrogameSet = author && gamePrompt;

if (speed) {
	if (isNaN(speed)) throw new Error("SPEED NOT VALID");
	else process.env.DEV_SPEED = speed;
}

if (difficulty) {
	if (difficulty > 3 || difficulty < 1 || isNaN(difficulty)) throw new Error("DIFFICULTY NOT VALID");
	else process.env.DEV_DIFFICULTY = difficulty;
}

if (isMicrogameSet) {
	process.env.DEV_MICROGAME = `"${microgameID}"`;
	console.log(
		"\u{2728} \x1b[32m\x1b[1mRunning microgame\x1b[0m: \x1b[0m"
			+ microgameID,
	);
}

const customGamesPath = path.join(process.cwd(), "games");
const games = fs.readdirSync(customGamesPath).filter((v) => {
	const existsMain = fs.existsSync(path.join(customGamesPath, v, "main.js"));
	if (existsMain) return v;
});

process.env.CUSTOM_GAMES_PATH = customGamesPath;
process.env.CUSTOM_GAMES = games;

spawn(
	"vite",
	[...process.argv.slice(isMicrogameSet ? 3 : 2)],
	{ shell: true, stdio: "inherit" },
);
