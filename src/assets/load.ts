import { k } from "../kaplay";
import { MicrogameRegistry } from "../registry";
import { buildLoadContext } from "./context";

// scenes
import "../focus";
import "../scenes/game/game";

// Starts the loading process of minigames
k.loadRoot("");

import.meta.glob("../../**/main.ts", {
	eager: true,
});

Object.values(MicrogameRegistry).forEach(pack => {
	pack.forEach(game => {
		if (!game.load) return;
		k.loadRoot(game.urlPrefix);
		game.load(buildLoadContext(game));
	});
});

// Starts the loading process of regular assets
k.loadRoot("./"); // A good idea for Itch.io publishing later

k.loadCrew("beant");
k.loadBean();

k.loadSprite("reality", "sprites/reality.png");

// khandled
k.loadSprite("static", "sprites/static.png", { sliceX: 2, sliceY: 1, anims: { "a": { from: 0, to: 1, loop: true, speed: 15, pingpong: true } } });
k.loadSprite("consolebody", "sprites/khandled/body.png");
k.loadSprite("consoledot", "sprites/khandled/dot.png");
k.loadSprite("consoleantenna", "sprites/khandled/antenna.png");
k.loadSprite("consolebrokenantenna", "sprites/khandled/brokenantenna.png");
k.loadSprite("reality", "sprites/realitysheet.png", {
	sliceX: 6,
	sliceY: 1,
	anims: {
		"yes": {
			from: 0,
			to: 5,
		},
	},
});

// bomb
k.loadSprite("bomb", "sprites/bomb/bomb.png");
k.loadSprite("bomb-cord-start", "sprites/bomb/cord-start.png");
k.loadSprite("bomb-cord", "sprites/bomb/cord.png");
k.loadSprite("bomb-cord-tip", "sprites/bomb/cord-tip.png");
k.loadSprite("bomb-fuse", "sprites/bomb/fuse.png");

// sounds
k.loadSound("jingle-prep", "sounds/jingles/prep.ogg");
k.loadSound("jingle-win", "sounds/jingles/win.ogg");
k.loadSound("jingle-lose", "sounds/jingles/lose.ogg");

k.loadSound("bomb-tick", "sounds/bomb/tick.mp3");
k.loadSound("bomb-explosion", "sounds/bomb/explosion.mp3");

// fonts
k.loadBitmapFont("happy", "fonts/happy.png", 28, 37);
k.loadBitmapFont("happy-o", "fonts/happy-o.png", 36, 45);
