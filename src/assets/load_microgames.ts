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
		loadCtx[loader] = (name: string, ...args: any) => {
			if (typeof name === "string") {
				if (!Object.keys(assets).includes(name)) {
					name = `${getGameID(game)}-${name}`;
				}
			}
			return k[loader](name, ...args);
		};

		if (loader == "loadSpriteAtlas") {
			loadCtx[loader] = (path: string, data: SpriteAtlasData) => {
				Object.keys(data).forEach((key) => {
					delete Object.assign(data, { [`${getGameID(game)}-${key}`]: data[key] })[key]; // renames the keys
				});
				return k.loadSpriteAtlas(path, data);
			};
		}
	}

	return loadCtx as LoadContext;
}

// if not devving load all of the microgames
if (CONFIG.DEV_MICROGAME == undefined) {
	const modules = import.meta.glob("/microgames/**/main.ts");
	const loaders = Object.values(modules);

	// this runs their content so they're added to the list
	Promise.all(loaders.map(loader => loader()));

	// creates a promise to load all microgame assets
	const t = Promise.all(
		CONFIG.microgames.filter(game => game.load).map((game) =>
			new Promise(async (resolve) => {
				k.loadRoot(game.urlPrefix);
				await game.load(buildLoadContext(game));
				resolve(null);
			})
		),
	);
	// sends it so the game waits for it
	k.load(t);
}

// if devving only add them to the list so they exist but don't load their assets
if (CONFIG.DEV_MICROGAME != undefined) {
	const modules = import.meta.glob("/microgames/**/main.ts");
	const loaders = Object.values(modules);

	// this runs their content so they're added to the list
	Promise.all(loaders.map(loader => loader())).then(() => {
		const t = Promise.all(
			CONFIG.microgames.map((game) =>
				new Promise(async (resolve) => {
					k.loadRoot(game.urlPrefix);
					await k.loadSprite(`icon-${getGameID(game)}`, game.iconPath);
					resolve(null);
				})
			),
		);
		// sends it so the game waits for it
		k.load(t);
	});
}
