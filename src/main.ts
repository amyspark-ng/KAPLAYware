import k from "./engine";
import "./loader";
import "./plugins/cursor";

import "../src/scenes/focus";
import "../src/scenes/title";
import "./scenes/menu/menu";
import "./scenes/menu/select";
import "../src/scenes/game";
import "../src/scenes/gameover";
import goGame from "../src/scenes/game";

k.setVolume(0.5);
k.setCursor("none");
k.loadRoot("./");

const INITIAL_SCENE = () => {
	if (DEV_MINIGAME) goGame();
	else goGame();
};

k.onLoad(() => {
	if (k.isFocused()) INITIAL_SCENE();
	else k.go("focus", INITIAL_SCENE);
});
