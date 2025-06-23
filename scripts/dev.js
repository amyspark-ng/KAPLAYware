import { spawn } from "child_process";

const [author, gamePrompt] = (process.argv[2] ?? "").split(":");
const microgameID = `${author}:${gamePrompt}`;
const isMicrogameSet = author && gamePrompt;

if (isMicrogameSet) {
	process.env.DEV_MICROGAME = `"${microgameID}"`;
	console.log(
		"\u{2728} \x1b[32m\x1b[1mRunning microgame\x1b[0m: \x1b[0m"
			+ microgameID,
	);
}

spawn(
	"vite",
	[...process.argv.slice(isMicrogameSet ? 3 : 2)],
	{ shell: true, stdio: "inherit" },
);
