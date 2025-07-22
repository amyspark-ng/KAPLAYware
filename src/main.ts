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

import { filesystem, init } from "@neutralinojs/lib";

k.setVolume(0.1);
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

// Init Neutralino API, load mods (maybe you should move this to another place)
init();

const loadMods = async () => {
	try {
		let entries = await filesystem.readDirectory(window.NL_PATH + "/mods/microgames/");

		for (const entry of entries) {
			if (entry.type != "DIRECTORY") return;

			const customMicrogamesDirs = await filesystem.readDirectory(entry.path);

			for (const microgameFolder of customMicrogamesDirs) {
				const microgameMain = await filesystem.readFile(microgameFolder.path + "/main.js");
				const microgameData = await import(
					/* @vite-ignore */
					`data:text/javascript, ${microgameMain}`
				);
				window.microgames.push(microgameData.default);
			}
		}
	}
	catch (e) {
		console.error("Error loading mods", e);
	}
};

if (window.NL_OS) {
	loadMods();
}
