import { CONFIG } from "../config";
import { k } from "../kaplay";

// Starts the loading process of regular assets
k.loadRoot("./"); // A good idea for Itch.io publishing later

k.loadSprite("cursor", "sprites/cursor.png", {
	sliceX: 4,
	sliceY: 1,
});

k.loadCrew("sprite", "heart");
k.loadCrew("sprite", "beant");
k.loadBean();

// transition
k.loadSprite("trans-background", "sprites/transition/background.png");
k.loadSprite("trans-clock", "sprites/transition/clock.png");
k.loadSprite("trans-static", "sprites/transition/static.png", {
	sliceX: 2,
	sliceY: 1,
	anims: {
		"a": {
			from: 0,
			to: 1,
			loop: true,
			pingpong: true,
		},
	},
});

// bomb
k.loadSprite("bomb", "sprites/bomb/bomb.png");
k.loadSprite("bomb-cord-start", "sprites/bomb/cord-start.png");
k.loadSprite("bomb-cord", "sprites/bomb/cord.png");
k.loadSprite("bomb-cord-tip", "sprites/bomb/cord-tip.png");
k.loadSprite("bomb-fuse", "sprites/bomb/fuse.png");

// test
if (CONFIG.DEV_MICROGAME != undefined) {
	k.loadSprite("test-resume", "sprites/test/resume.png");
	k.loadSprite("test-restart", "sprites/test/restart.png");
}

// sounds
k.loadSound("jingle-prep", "sounds/jingles/prep.ogg");
k.loadSound("jingle-win", "sounds/jingles/win.ogg");
k.loadSound("jingle-lose", "sounds/jingles/loss.ogg");
k.loadSound("jingle-speed", "sounds/jingles/speedUp.ogg");

k.loadSound("bomb-tick", "sounds/bomb/tick.mp3");
k.loadSound("bomb-explosion", "sounds/bomb/explosion.mp3");

// fonts
k.loadBitmapFont("happy", "fonts/happy.png", 28, 37);
k.loadBitmapFont("happy-o", "fonts/happy-o.png", 36, 45);

// scenes
import "../scenes/focus";
import "../scenes/game";
import "../scenes/gametest";
