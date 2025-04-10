import kaplay, { DrawTextOpt, GameObj, KAPLAYCtx, KEventController } from "kaplay";
import k from "../engine";

let watchedObjects: { obj: any; propName: string | number | symbol; customName?: string; }[] = [];

let manager: GameObj = null;

function watch<T extends unknown>(obj: T, propName: keyof T, customName?: string) {
	if (!manager) {
		manager = k.add([k.stay(), k.z(100)]);
		manager.onUpdate(() => {
		});

		k.onSceneLeave(() => {
			watchedObjects = [];
		});

		manager.onDraw(() => {
			if (!k.debug.inspect) return;
			let watchesText: string = "";

			watchedObjects.forEach((watch, index) => {
				watchesText += `${watch.customName ? watch.customName : watch.propName.toString()}: ${watch.obj[watch.propName]}\n`;
			});

			const textOpts = {
				text: watchesText,
				size: 16,
				anchor: "left",
				align: "left",
				font: "",
				fixed: true,
			} as DrawTextOpt;

			const formattedText = k.formatText(textOpts);

			const padding = 20;
			let textPos = k.vec2(padding, padding);
			const squarePos = k.vec2(k.width() - padding / 2, padding / 2);
			let squareWidth = formattedText.width + padding;
			let squareHeight = formattedText.height + padding;

			k.drawRect({
				width: squareWidth,
				height: squareHeight,
				color: k.BLACK,
				anchor: "topright",
				pos: squarePos,
				opacity: 0.8,
				radius: 4,
				fixed: true,
			});

			textPos.x = squarePos.x - squareWidth + 10;
			textPos.y = squarePos.y + squareHeight / 2;
			textOpts.pos = textPos;
			k.drawText(textOpts);
		});
	}

	watchedObjects.push({ obj, propName, customName });
}

export default function watchPlugin() {
	return {
		watch,
	};
}
