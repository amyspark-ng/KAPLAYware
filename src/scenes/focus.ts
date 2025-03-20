import k from "../engine";

k.scene("focus", () => {
	k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
	]);

	k.add([
		k.text("CLICK TO FOCUS", { font: "happy" }),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	k.onClick(() => k.go("game"));
});
