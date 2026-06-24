import { k } from "./kaplay";
import { CONFIG } from "./config";
import "./assets/load_ingscreen";
import "./assets/load_assets";
import "./assets/load_microgames";
import "./objects/cursor";

k.setVolume(0.4);
k.setCursor("none");

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
		if (CONFIG.DEV_MICROGAME != undefined) k.go("gametest");
		else k.go(CONFIG.initialScene);
	}
});
