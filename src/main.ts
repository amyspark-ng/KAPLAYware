import k from "./engine";
import "./loader";
import "./plugins/cursor";

import games from "./games";
import kaplayware from "./kaplayware";

k.setCursor("none");

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

k.scene("game", () => {
	const ware = kaplayware(games, { debug: true });
	ware.nextGame();
});

k.scene("gameover", () => {
	k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
	]);

	k.add([
		k.text("you lost :("),
		k.pos(k.center()),
		k.anchor("center"),
	]);

	k.onClick(() => k.go("game"));
	k.onKeyPress("space", () => k.go("game"));
});

k.onLoad(() => {
	if (k.isFocused()) k.go("game");
	else k.go("focus");
});
