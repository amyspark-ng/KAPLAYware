import k from "./engine";
import "./loader";
import "./plugins/cursor";

import "./scenes/FocusScene";
import "./scenes/TitleScene";
import "./scenes/MenuScene";
import "./scenes/SelectScene";
import "../src/scenes/game/GameScene";
import "./scenes/game/GameoverScene";

import goGame from "../src/scenes/game/GameScene";

k.setVolume(0.5);
k.setCursor("none");
k.loadRoot("./");

const INITIAL_SCENE = () => {
	if (window.DEV_MICROGAME) goGame();
	else goGame();
};

k.onLoad(() => {
	if (k.isFocused()) INITIAL_SCENE();
	else k.go("focus", INITIAL_SCENE);
});
