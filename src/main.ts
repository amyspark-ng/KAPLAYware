import k from "./engine";
import "./loader";
import "./plugins/cursor";

import "../src/scenes/focus";
import "../src/scenes/game";
import "../src/scenes/gameover";
import "../src/scenes/select";
import { KAPLAYwareOpts } from "./types";

k.setVolume(0.5);
k.setCursor("none");
k.loadRoot("./");

k.onLoad(() => {
	if (k.isFocused()) k.go("game", { debug: true } as KAPLAYwareOpts);
	else k.go("focus");
});
