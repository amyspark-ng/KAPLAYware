import k from "../engine";

k.scene("menu", () => {
	k.addPlainBackground(k.BLUE.lighten(100));

	let index = 0;

	function addButton(frame: number, action: () => void) {
		const btnIndex = k.get("button").length;

		const initialPos = k.vec2(0);
		const button = k.add([
			k.pos(),
			k.sprite("buttons"),
			k.area(),
			"button",
			"ui",
			{
				focused: false,
				action,
			},
		]);

		button.pos = initialPos.add(0, 50 * btnIndex);

		button.onUpdate(() => {
			if (k.getLastInputDeviceType() == "mouse") button.focused = button.isHovering();
			else if (k.getLastInputDeviceType() == "keyboard") button.focused = btnIndex == index;

			if (button.focused && k.isKeyPressed("space") || k.isKeyPressed("enter") || k.isMousePressed("left")) button.action();
			if (button.focused) button.frame = frame + 1;
			else button.frame = frame;
		});

		return button;
	}

	const storyButton = addButton(0, () => k.go("game"));
	const freeplayButton = addButton(2, () => {
		k.go("select");
	});
	const extraButton = addButton(4, () => {
	});

	k.onUpdate(() => {
		if (k.isKeyPressed("down")) index = (index + 1) % 3;
		else if (k.isKeyPressed("up")) index = (index - 1) % 3;
		if (index < 0) index = 2;
	});
});
