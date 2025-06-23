import k from "../engine";

// TODO: make this better, it sucks!

let opacity = 0;
let canPoint = true;

/** The cursor object :) */
const cursor = k.add([
	k.sprite("@cursor"),
	k.pos(Infinity),
	k.anchor("topleft"),
	k.scale(2),
	k.opacity(),
	k.z(999),
	k.fixed(),
	k.color(),
	k.stay(),
	k.timer(),
	{
		set fadeAway(param: boolean) {
			opacity = param == true ? 0 : 1;
		},

		set canPoint(param: boolean) {
			canPoint = param;
		},

		get canPoint() {
			return canPoint;
		},
	},
]);

cursor.onUpdate(() => {
	cursor.opacity = k.lerp(cursor.opacity, opacity, 0.5);

	if (opacity == 0) return;
	const hovered = k.get("area", { recursive: true }).filter((obj) => obj.isHovering() && canPoint && !obj.is("ignorepoint")).length > 0;
	if (k.isMouseDown("left")) cursor.sprite = "cursor-knock";
	if (hovered && !k.isMouseDown("left")) cursor.sprite = "cursor-point";
	else if (!hovered && !k.isMouseDown("left")) cursor.sprite = "cursor";
});

cursor.onMouseMove(() => {
	cursor.pos = k.mousePos();
});

export default cursor;
