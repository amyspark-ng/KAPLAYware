import k from "./engine";
import "./loader";
import "./plugins/cursor";

import "../src/scenes/focus";
import "../src/scenes/game";
import "../src/scenes/gameover";
import "../src/scenes/select";

k.setVolume(0.5);
k.setCursor("none");
k.loadRoot("./");

k.onLoad(() => {
	if (k.isFocused()) k.go("game", {});
	else k.go("focus");
});
