import { k } from "../kaplay";
import { GameObj } from "kaplay";

export let GAME_CURSOR: GameObj<{
	/** Wheter the frame of animation should be override by any other */
	overrideAnim: "cursor" | "pointer" | "knock";
	/** The parent object on which to check hovers */
	grandparentCheck: GameObj;
	hide: boolean;
}> = null;

k.onLoad(() => {
	let cursor = k.add([
		k.sprite("cursor"),
		k.pos(k.mousePos()),
		k.anchor("center"),
		k.stay(),
		k.z(999999),
		k.scale(1.5),
		k.opacity(),
		k.fixed(),
		{
			hide: false,
			overrideAnim: null,
			grandparentCheck: k.getTreeRoot(),
		},
	]);

	cursor.onUpdate(() => {
		cursor.pos = k.mousePos().add(cursor.width / 2, cursor.height / 2);
		cursor.opacity = k.lerp(cursor.opacity, cursor.hide ? 0 : 1, 0.5);

		if (cursor.overrideAnim != null) {
			cursor.sprite = cursor.overrideAnim;
		}
		else {
			const hoverObjects = cursor.grandparentCheck.get("area", { only: "comps", recursive: true }).filter((obj) => obj.area.cursor != undefined);
			const isThereHoveredObject = hoverObjects.some((obj) => obj.isHovering());

			if (k.isMouseDown("left")) cursor.sprite = "knock";
			else if (isThereHoveredObject) cursor.sprite = "pointer";
			else cursor.sprite = "cursor";
		}
	});

	GAME_CURSOR = cursor;
});
