import { CONFIG } from "../config";
import { k } from "../kaplay";

// Starts the loading process of regular assets
k.loadRoot("./"); // A good idea for Itch.io publishing later

k.loadCrew("sprite", "cursor-o", "cursor");
k.loadCrew("sprite", "pointer-o", "pointer");
k.loadCrew("sprite", "knock-o", "knock");

k.loadCrew("sprite", "bean");
k.loadCrew("sprite", "beant");
k.loadCrew("sprite", "heart");

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
k.loadSprite("bomb-fuse", "sprites/bomb/fuse.png");
k.loadSprite("bomb-cord-tip", "sprites/bomb/cord-tip.png", {
	sliceX: 7,
	sliceY: 1,
	anims: {
		"a": {
			from: 0,
			to: 6,
			speed: 25,
		},
	},
});

// test
if (CONFIG.DEV_MICROGAME != undefined) {
	k.loadSprite("test-resume", "sprites/test/resume.png");
	k.loadSprite("test-restart", "sprites/test/restart.png");
	k.loadSprite("test-arrow", "sprites/test/arrow.png");
	k.loadSprite("test-background", "sprites/test/background.png");
	k.loadSprite("test-checkmark", "sprites/test/checkmark.png");
	k.loadSprite("test-iconcursor", "sprites/test/iconcursor.png");
}

// sounds
k.loadSound("jingle-prep", "sounds/jingles/prep.ogg");
k.loadSound("jingle-win", "sounds/jingles/win.ogg");
k.loadSound("jingle-lose", "sounds/jingles/loss.ogg");
k.loadSound("jingle-speed", "sounds/jingles/speedUp.ogg");

k.loadSound("bomb-tick", "sounds/bomb/tick.ogg");
k.loadSound("bomb-explosion", "sounds/bomb/explosion.ogg");
k.loadSound("bomb-extinguish", "sounds/bomb/extinguish.ogg");
k.loadSound("bomb-flower", "sounds/bomb/flower.ogg");
k.loadSound("bomb-sizzling", "sounds/bomb/sizzling.ogg");

// fonts
k.loadBitmapFont("happy", "fonts/happy.png", 28, 37);
k.loadBitmapFont("happy-o", "fonts/happy-o.png", 36, 45);
k.loadBitmapFont("seven-segment", "fonts/seven-segment.png", 15, 30);

// scenes
import "../scenes/focus";
import "../scenes/game";
import "../scenes/gametest";
