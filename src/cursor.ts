import { k } from "./kaplay";

function createCursor() {
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
		const hoverObjects = k.get("cursor-hover", { recursive: true });
		const isThereHoveredObject = hoverObjects.some((obj) => obj.isHovering());
		cursor.pos = k.mousePos();

		if (k.isMouseDown("left")) cursor.sprite = "cursor-knock";
		else if (isThereHoveredObject) cursor.sprite = "cursor-point";
		else cursor.sprite = "cursor";
	});

	return cursor;
}

export let cursor: ReturnType<typeof createCursor> = null;

export function addCursor() {
	cursor = createCursor();
}
