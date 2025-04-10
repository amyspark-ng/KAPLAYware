import { Color } from "kaplay";
import k from "../engine";

function addPlainBackground(color: Color) {
	return k.add([
		k.rect(k.width(), k.height()),
		k.color(color),
		k.opacity(),
		k.fixed(),
	]);
}

function camFade(time: number, color: Color = k.BLACK, easeFunc = k.easings.linear) {
	const obj = k.add([
		k.rect(k.width(), k.height()),
		k.color(color),
		k.opacity(),
		k.fixed(),
	]);

	return obj.fadeOut(time, easeFunc);
}

// TODO: ?
export default function plainBackgroundPlug() {
	return {
		addPlainBackground,
		camFade,
	};
}
