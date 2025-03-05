import { assets } from "@kaplayjs/crew";
import k from "./engine";
import games from "./games";
import { loadAPIs } from "./kaplayware";
import { LoadCtx } from "./types";
import { getGameID } from "./utils";

k.loadBitmapFont("happy", "fonts/happy.png", 31, 39);
k.loadBitmapFont("happy-o", "fonts/happy-o.png", 31, 39);

k.loadSound("@prepJingle", "sounds/prepJingle.ogg");
k.loadSound("@winJingle", "sounds/winJingle.ogg");
k.loadSound("@loseJingle", "sounds/loseJingle.ogg");
k.loadSound("@speedJingle", "sounds/speedJingle.ogg");
k.loadSound("@tick", "sounds/bombtick.mp3");
k.loadSound("@explosion", "sounds/explosion.mp3");
k.loadSound("@burp", "sounds/burp.mp3");

k.loadSprite("@bomb", "sprites/bomb.png");
k.loadSprite("@bomb_cord", "sprites/bomb_cord.png");
k.loadSprite("@bomb_cord1", "sprites/bomb_cord1.png");
k.loadSprite("@bomb_fuse", "sprites/bomb_fuse.png");

k.loadSprite("@grass_tile", "sprites/grass.png");
k.loadSprite("@trophy", "sprites/trophy.png");
k.loadSpriteAtlas("sprites/cursor.png", {
	"@cursor": {
		width: 28,
		height: 32,
		x: 0,
		y: 0,
	},
	"@cursor_point": {
		width: 28,
		height: 32,
		x: 28,
		y: 0,
	},
	"@cursor_like": {
		width: 28,
		height: 32,
		x: 28 * 2,
		y: 0,
	},
	"@cursor_knock": {
		width: 28,
		height: 32,
		x: 28 * 3,
		y: 0,
	},
});

// load game assets
const loadCtx = {};

for (const api of loadAPIs) {
	loadCtx[api] = k[api];
}

games.forEach((game) => {
	if (!game.load) return;

	// patch loadXXX() functions to scoped asset names
	const loaders = [
		"loadSprite",
		"loadSpriteAtlas",
		"loadAseprite",
		"loadPedit",
		"loadJSON",
		"loadSound",
		"loadFont",
		"loadBitmapFont",
		"loadShader",
		"loadShaderURL",
	];

	for (const loader of loaders) {
		loadCtx[loader] = (name: string, ...args: any) => {
			if (typeof name === "string") {
				name = `${getGameID(game)}-${name}`;
			}
			return k[loader](name, ...args);
		};
	}

	// patch loadRoot() to consider g.urlPrefix
	if (game.urlPrefix != undefined) {
		loadCtx["loadRoot"] = (p: string) => {
			if (p) k.loadRoot(game.urlPrefix + p);
			return k.loadRoot().slice(game.urlPrefix.length);
		};
		k.loadRoot(game.urlPrefix);
	}
	else {
		k.loadRoot("");
	}

	game.load(loadCtx as LoadCtx);
	loadCtx["loadRoot"] = k.loadRoot;
});

// const load crew
Object.keys(assets).forEach((key) => {
	const asset = assets[key];
	k.loadSprite(`@${key}`, asset.sprite);
	k.loadSprite(`@${key}-o`, asset.outlined);
});
