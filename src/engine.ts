import kaplay from "kaplay";
import conductorPlug from "./plugins/conductor";
import dragCompPlugin from "./plugins/drag";
import { setterPlug } from "./plugins/setter";
import wareObjectsPlugin from "./plugins/wareobjects";
import watchPlugin from "./plugins/watch";

export const k = kaplay({
	width: 800,
	height: 600,
	letterbox: true,
	background: [0, 0, 0],
	font: "happy-o",
	focus: false,
	plugins: [dragCompPlugin, watchPlugin, conductorPlug, wareObjectsPlugin, setterPlug],
	debug: true,
	maxFPS: 120,
});
console.log("KAPLAY RAN");

export default k;
