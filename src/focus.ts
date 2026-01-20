import { CONFIG } from "./config";
import { k } from "./kaplay";

k.scene("focus", () => {
	k.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLACK),
	]);

	k.add([
		k.text("FOCUS"),
		k.color(k.WHITE),
	]);

	k.onClick(() => k.go(CONFIG.initialScene));
});
