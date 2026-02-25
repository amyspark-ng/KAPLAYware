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
	maxFPS: 60,
	plugins: [crew, mulfokPlug, posSetterPlug, confettiPlug, dragCompPlugin],
	buttons: {
		"up": { "keyboard": ["up", "w"], gamepad: ["dpad-up"] },
		"left": { "keyboard": ["left", "a"], gamepad: ["dpad-left"] },
		"down": { "keyboard": ["down", "s"], gamepad: ["dpad-down"] },
		"right": { "keyboard": ["right", "d"], gamepad: ["dpad-right"] },
		"action": { "keyboard": "space", mouse: "left", gamepad: ["south"] },
		"return": { "keyboard": ["escape", "backspace"], gamepad: ["select", "start"] },
	},
});
