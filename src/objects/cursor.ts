import { k } from "../kaplay";
import { AreaComp, GameObj } from "kaplay";

export let GAME_CURSOR: GameObj = null;
k.onLoad(() => {
	let cursor = k.add([
		k.sprite("cursor"),
		k.pos(k.mousePos()),
		k.anchor("center"),
		k.stay(),
		k.z(999999),
		k.scale(1.5),
		k.fixed(),
	]);

	cursor.onUpdate(() => {
		const hoverObjects = k.get("area", { recursive: true }).filter((obj: GameObj<AreaComp>) => obj.area.cursor);
		const isThereHoveredObject = hoverObjects.some((obj) => obj.isHovering());
		cursor.pos = k.mousePos().add(25);

		if (k.isMouseDown("left")) cursor.frame = 3;
		else if (isThereHoveredObject) cursor.frame = 1;
		else cursor.frame = 0;
	});
});
