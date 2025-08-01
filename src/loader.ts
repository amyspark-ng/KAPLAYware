import { assets } from "@kaplayjs/crew";
import k from "./engine";
import games from "./scenes/game/games";
import { createLoadCtx } from "./scenes/game/context/load";

k.loadSprite("logo", "sprites/logo.png");

k.loadSprite("kaboy", "sprites/menu/kaboy.png");
k.loadSprite("ui_arrow", "sprites/menu/ui_arrow.png");
k.loadSprite("ui_button", "sprites/menu/ui_button.png", {
	sliceX: 2,
	sliceY: 1,
	anims: {
		"focus": 1,
		"blur": 0,
	},
});

k.loadSprite("kaboy_art_storymode", "sprites/menu/kaboy_art_storymode.png", {
	sliceX: 3,
	sliceY: 1,
	anims: {
		"idle": { from: 0, to: 1, speed: 2, loop: true },
		"select": 2,
	},
});

k.loadBitmapFont("happy", "fonts/happy.png", 31, 39);
k.loadBitmapFont("happy-o", "fonts/happy-o.png", 31, 39);

// transition 1
k.loadSprite("trans1-bg", "sprites/transition/pack1/bg.png");
k.loadSprite("trans1-computer", "sprites/transition/pack1/computer.png");
k.loadSprite("trans1-screen", "sprites/transition/pack1/screen.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("trans1-calendar", "sprites/transition/pack1/calendar.png");
k.loadSprite("trans1-page", "sprites/transition/pack1/page.png");
k.loadSprite("trans1-chillguy", "sprites/transition/pack1/chillguy.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("trans1-chillcat", "sprites/transition/pack1/chillcat.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("trans1-chillbutterfly", "sprites/transition/pack1/chillbutterfly.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("trans1-table", "sprites/transition/pack1/table.png");
k.loadSprite("trans1-grass", "sprites/transition/pack1/grass.png");
k.loadSprite("trans1-coffee", "sprites/transition/pack1/coffee.png", { sliceX: 7, sliceY: 1, anims: { "hot": { from: 0, to: 6 } } });
k.loadSprite("trans1-flowerpot", "sprites/transition/pack1/flowerpot.png");
k.loadSprite("trans1-flower", "sprites/transition/pack1/flowers.png", { sliceX: 3, sliceY: 1 });
k.loadSprite("trans1-heart", "sprites/transition/pack1/heart.png");

// input
k.loadSprite("input-circle", "sprites/transition/input/circle.png");
k.loadSprite("input-keys", "sprites/transition/input/keys.png");
k.loadSprite("input-mouse", "sprites/transition/input/mouse.png");
k.loadSprite("input-both", "sprites/transition/input/both.png");

k.loadSound("prepJingle", "sounds/prepJingle.ogg");
k.loadSound("winJingle", "sounds/winJingle.ogg");
k.loadSound("loseJingle", "sounds/loseJingle.ogg");
k.loadSound("speedJingle", "sounds/speedJingle.ogg");
k.loadSound("gameOverJingle", "sounds/gameOverJingle.ogg");
k.loadSound("bossJingle", "sounds/bossJingle.ogg");
k.loadSound("bossWinJingle", "sounds/bossWinJingle.ogg");
k.loadSound("tick", "sounds/bombtick.mp3");
k.loadSound("explosion", "sounds/explosion.mp3");

// bomb
k.loadSprite("bomb", "sprites/game/bomb.png");
k.loadSprite("bomb-cord-start", "sprites/game/cord-start.png");
k.loadSprite("bomb-cord", "sprites/game/cord.png");
k.loadSprite("bomb-cord-tip", "sprites/game/cord-tip.png");
k.loadSprite("bomb-fuse", "sprites/game/fuse.png");

k.loadSpriteAtlas("sprites/cursor.png", {
	"cursor": {
		width: 28,
		height: 32,
		x: 0,
		y: 0,
	},
	"cursor-point": {
		width: 28,
		height: 32,
		x: 28,
		y: 0,
	},
	"cursor-like": {
		width: 28,
		height: 32,
		x: 28 * 2,
		y: 0,
	},
	"cursor-knock": {
		width: 28,
		height: 32,
		x: 28 * 3,
		y: 0,
	},
});

games.forEach((game) => {
	if (!game.load) return;
	const loadCtx = createLoadCtx(game);
	// DON'T change the order of this
	game.load(loadCtx);
	loadCtx["loadRoot"] = k.loadRoot;
});

// const load crew
Object.keys(assets).forEach((key) => {
	const asset = assets[key];
	k.loadSprite(`@${key}`, asset.sprite);
	k.loadSprite(`@${key}-o`, asset.outlined);
});
