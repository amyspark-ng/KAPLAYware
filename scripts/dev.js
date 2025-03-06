import { spawn } from "child_process";

const [author, gamePrompt] = (process.argv[2] ?? "").split(":");
const minigameID = `${author}:${gamePrompt}`;
const minigameSet = author && gamePrompt;

if (minigameSet) {
  process.env.DEV_MINIGAME = `"${minigameID}"`;
  console.log(
    "\u{2728} \x1b[32m\x1b[1mRunning minigame\x1b[0m: \x1b[0m"
    + minigameID
  );
}

spawn(
  'vite',
  [...process.argv.slice(minigameSet ? 3 : 2)],
  { shell: true, stdio: 'inherit' }
);
