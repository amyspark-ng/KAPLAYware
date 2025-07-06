import k from "./kaplay";
import "./loader";
import "./plugins/cursor";

import "./scenes/FocusScene";
import "./scenes/game/GameScene";

k.setVolume(0.5);
k.setCursor("none");
k.loadRoot("./");

const INITIAL_SCENE = () => {
	k.go("game");
	// if (window.DEV_MICROGAME) goGame();
	// else goGame();
};

k.onLoad(() => {
	if (k.isFocused()) INITIAL_SCENE();
	else k.go("focus", INITIAL_SCENE);
});
