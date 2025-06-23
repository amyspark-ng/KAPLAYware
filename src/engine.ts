import kaplay from "kaplay";
import dragCompPlugin from "./plugins/drag";
import posSetterPlug from "./plugins/setter";
import watchPlugin from "./plugins/watch";
import plainBackgroundPlug from "./plugins/plainbackground";
import mulfokPalettePlug from "./plugins/colors";

export const k = kaplay({
	width: 800,
	height: 600,
	letterbox: true,
	background: [0, 0, 0],
	font: "happy-o",
	focus: false,
	debug: true,
	maxFPS: 120,
	buttons: {
		"up": { "keyboard": ["up", "w"] },
		"left": { "keyboard": ["left", "a"] },
		"down": { "keyboard": ["down", "s"] },
		"right": { "keyboard": ["right", "d"] },
		"action": { "keyboard": "space" },
		"click": { "mouse": "left" },
	},
	plugins: [
		dragCompPlugin,
		watchPlugin,
		posSetterPlug,
		plainBackgroundPlug,
		mulfokPalettePlug,
	],
});
console.log("KAPLAY RAN");

export default k;
