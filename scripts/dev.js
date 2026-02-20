import { spawn } from "child_process";

const args = process.argv.slice(2);

const id = args[0] ?? null;
const speed = args[1] ?? "1";
const hard = args[2] ?? "false";

process.env.DEV_MICROGAME = id;
process.env.DEV_SPEED = String(speed);
process.env.DEV_HARD = String(hard);

spawn("vite", [], {
	shell: true,
	stdio: "inherit",
});
