import { spawn } from "child_process";

const args = process.argv.slice(2);

const dev = args[0] ?? null;

process.env.DEV_MICROGAME = dev;

spawn("vite", [], {
	shell: true,
	stdio: "inherit",
});
