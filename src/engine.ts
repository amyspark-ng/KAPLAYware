import kaplay from "kaplay";
import { dragCompPlugin } from "./plugins/drag";
import { spriteCompPlugin } from "./plugins/sprite";

export const k = kaplay({
	width: 800,
	height: 600,
	letterbox: true,
	background: [0, 0, 0],
	font: "happy-o",
	focus: false,
	plugins: [dragCompPlugin, spriteCompPlugin],
});

console.log("KAPLAY RAN");

export default k;
