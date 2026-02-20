import { CONFIG } from "./config";
import { k } from "./kaplay";
import "./assets/load";

k.setVolume(0.1);

k.app.onGamepadStick("left", (v) => {
	if (v.x <= -0.9) k.pressButton("left");
	else k.releaseButton("left");

	if (v.x >= 0.9) k.pressButton("right");
	else k.releaseButton("right");

	if (v.y >= 0.9) k.pressButton("down");
	else k.releaseButton("down");

	if (v.y <= -0.9) k.pressButton("up");
	else k.releaseButton("up");
});

k.onLoad(() => {
	if (!k.isFocused()) k.go("focus");
	else {
		if (CONFIG.DEV_MICROGAME) {
			k.go("game");
		}
		else k.go(CONFIG.initialScene);
	}
});
