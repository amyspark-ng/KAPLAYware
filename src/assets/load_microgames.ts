import { assets } from "@kaplayjs/crew";
import { k } from "../kaplay";
import { CONFIG } from "../config";
import { getGameID } from "../core/game_registry";
import { Microgame } from "../core/microgame";
import { SpriteAtlasData } from "kaplay";

// type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
// type AtFriend = `@${Friend}`;
// type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

export const loadAPIs = [
	"loadCrew",
	"loadSprite",
	"loadSpriteAtlas",
	"loadAseprite",
	"loadJSON",
	"loadSound",
	"loadFont",
	"loadBitmapFont",
	"loadShader",
	"loadShaderURL",
	"load",
] as const;

/** The allowed load functions */
export type LoadContext = Pick<typeof k, typeof loadAPIs[number]> & {
	/** Used when pointing to the shared folder in the microgames folder
	 *
	 * @example
	 * ```ts
	 * k.loadSprite("crunch", ctx.shared("sounds/crunch.mp3"))
	 * ```
	 *
	 * microgames -> assets -> sounds -> crunch.mp3
	 */
	shared(url: string): string;
};

/** Creates the context exclusive for loading the assets of a microgame */
export function buildLoadContext(game: Microgame) {
	// load game assets
	const loadCtx = {};

	for (const api of loadAPIs) {
		loadCtx[api] = k[api];
	}

	// patch loadXXX() functions to scoped asset names
	const loaders = [
		"loadSprite",
		"loadCrew",
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
		if (loader == "loadSpriteAtlas") {
			loadCtx["loadSpriteAtlas"] = (path: string, data: SpriteAtlasData) => {
				Object.keys(data).forEach((key) => {
					delete Object.assign(data, { [`${getGameID(game)}-${key}`]: data[key] })[key]; // renames the keys
				});
				return k.loadSpriteAtlas(path, data);
			};
		}
		else if (loader == "loadCrew") {
			loadCtx["loadCrew"] = async (kind: string, crew: string, name: string) => {
				const asset = await k.getAsset(crew);
				if (asset) console.warn(`LoadCrew: Loading the crew ${crew} is already loaded, you can remove this line`);
				// @ts-ignore
				else k.loadCrew(kind, crew, name);
			};
		}
		else {
			loadCtx[loader] = (name: string, ...args: any) => {
				if (typeof name === "string") {
					if (!Object.keys(assets).includes(name)) {
						name = `${getGameID(game)}-${name}`;
					}
				}
				return k[loader](name, ...args);
			};
		}
	}

	return loadCtx as LoadContext;
}

// if not devving load all of the microgames
if (CONFIG.DEV_MICROGAME == undefined) {
	const modules = import.meta.glob("/microgames/**/main.ts");
	const loaders = Object.values(modules);

	const runGames = Promise.all(loaders.map(loader => loader())).then(() => {
		k.load(Promise.all(CONFIG.microgames.map((game) => {
			return new Promise(async (res) => {
				k.loadRoot(game.urlPrefix);
				k.loadSprite(`icon-${getGameID(game)}`, game.iconPath);
				await game.load(buildLoadContext(game));
				res(null);
			});
		})));
	});
}

// if devving only add them to the list so they exist but don't load their assets
if (CONFIG.DEV_MICROGAME != undefined) {
	const modules = import.meta.glob("/microgames/**/main.ts");
	const loaders = Object.values(modules);

	const runGames = Promise.all(loaders.map(loader => loader())).then(() => {
		k.load(Promise.all(CONFIG.microgames.map((game) => {
			return new Promise(async (res) => {
				k.loadRoot(game.urlPrefix);
				k.loadSprite(`icon-${getGameID(game)}`, game.iconPath);
				res(null);
			});
		})));
	});
}
