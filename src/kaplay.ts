import kaplay from "kaplay";
import mulfokPlug from "./plugins/mulfok";
import posSetterPlug from "./plugins/posSetter";
import { confettiPlug } from "./plugins/confetti";
import dragCompPlugin from "./plugins/drag";
import { crew } from "@kaplayjs/crew";

export const k = kaplay({
	width: 800,
	height: 600,
	font: "happy-o",
	letterbox: true,
	maxFPS: 70,
	plugins: [crew, mulfokPlug, posSetterPlug, confettiPlug, dragCompPlugin],
	buttons: {
		"up": { "keyboard": ["up", "w"] },
		"left": { "keyboard": ["left", "a"] },
		"down": { "keyboard": ["down", "s"] },
		"right": { "keyboard": ["right", "d"] },
		"action": { "keyboard": "space", mouse: "left" },
		"return": { "keyboard": ["escape", "backspace"] },
	},
});
