import { k } from "../kaplay";
import { AreaComp, GameObj } from "kaplay";

export let GAME_CURSOR: GameObj<{
	/** Wheter the frame of animation should be override by any other */
	overrideFrame: number;
	/** The parent object on which to check hovers */
	grandparentCheck: GameObj;
}> = null;
k.onLoad(() => {
	let cursor = k.add([
		k.sprite("cursor"),
		k.pos(k.mousePos()),
		k.anchor("center"),
		k.stay(),
		k.z(999999),
		k.scale(1.5),
		k.fixed(),
		{
			overrideFrame: null,
			grandparentCheck: k.getTreeRoot(),
		},
	]);

	cursor.onUpdate(() => {
		cursor.pos = k.mousePos().add(25);

		if (cursor.overrideFrame != null) {
			cursor.frame = cursor.overrideFrame;
		}
		else {
			const hoverObjects = cursor.grandparentCheck.get("area", { only: "comps", recursive: true }).filter((obj) => obj.area.cursor != undefined);
			const isThereHoveredObject = hoverObjects.some((obj) => obj.isHovering());

			if (k.isMouseDown("left")) cursor.frame = 3;
			else if (isThereHoveredObject) cursor.frame = 1;
			else cursor.frame = 0;
		}
	});

	GAME_CURSOR = cursor;
});
