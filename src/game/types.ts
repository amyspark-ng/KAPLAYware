import { Asset, AudioPlay, AudioPlayOpt, Color, GameObj, KAPLAYCtx, KEvent, KEventController, SpriteComp, SpriteCompOpt, SpriteData, TimerComp, Vec2 } from "kaplay";
import k from "../engine";
import { ConfettiOpt } from "../plugins/wareobjects";
import { gameAPIs, loadAPIs } from "./api";
import { CustomSprite } from "./kaplayware";

/** A button */
export type Button =
	| "action"
	| "left"
	| "right"
	| "up"
	| "down"
	| "click";

type CursorInput = { cursor: { hide: boolean; }; keys?: never; };
type KeyInput = { keys: { use: boolean; }; cursor?: never; };

/** The allowed load functions */
export type LoadCtx = Pick<KAPLAYCtx, typeof loadAPIs[number]>;

/** The specific API for minigames */
export type MinigameAPI = {
	/**
	 * Register an event that runs once when a button is pressed.
	 */
	onButtonPress(btn: Button, action: () => void): KEventController;
	/**
	 * Register an event that runs once when a button is released.
	 */
	onButtonRelease(btn: Button, action: () => void): KEventController;
	/**
	 * Register an event that runs every frame when a button is held down.
	 */
	onButtonDown(btn: Button, action: () => void): KEventController;
	isButtonPressed(btn: Button): boolean;
	isButtonDown(btn: Button): boolean;
	isButtonReleased(btn: Button): boolean;

	onMouseMove(action: (pos: Vec2, delta: Vec2) => void): KEventController;
	onMouseRelease(action: () => void): KEventController;

	/** Adds a buncha confetti!!! */
	addConfetti(opts?: ConfettiOpt): void;

	setCamScale(val: Vec2): Vec2;
	getCamScale(): Vec2;
	setCamAngle(val: number): number;
	getCamAngle(): number;
	setCamPos(val: Vec2): Vec2;
	getCamPos(): Vec2;
	shakeCam(val?: number): void;
	/** Flashes the screen
	 * @param flashColor The color the flash will be
	 * @param time How long the flash will be on screen
	 */
	flashCam(flashColor?: Color, time?: number, opacity?: number): KEventController;
	/** Gets the current RGB of the background of your minigame */
	getRGB(): Color;
	/** Sets the RGB to the background of your minigame */
	setRGB(val: Color): void;
	/** ### Custom sprite component for kaplayware that holds default assets
	 *
	 * Attach and render a sprite to a Game Object.
	 *
	 * @param spr - The sprite to render.
	 * @param opt - Options for the sprite component. See {@link SpriteCompOpt `SpriteCompOpt`}.
	 *
	 * @example
	 * ```js
	 * // minimal setup
	 * add([
	 *     sprite("bean"),
	 * ])
	 *
	 * // with options
	 * const bean = add([
	 *     sprite("bean", {
	 *         // start with animation "idle"
	 *         anim: "idle",
	 *     }),
	 * ])
	 *
	 * // play / stop an anim
	 * bean.play("jump")
	 * bean.stop()
	 *
	 * // manually setting a frame
	 * bean.frame = 3
	 * ```
	 *
	 * @returns The sprite comp.
	 * @since v2000.0
	 * @group Components
	 */
	sprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt): SpriteComp;
	/** Register an event that runs once when timer runs out. */
	onTimeout: (action: () => void) => KEventController;
	/** Run this when player succeeded in completing the game. */
	win: () => void;
	/** Run this when player failed. */
	lose: () => void;
	/** Run this when your minigame has 100% finished all win/lose animations etc */
	finish: () => void;
	/** Wheter ctx.win() has been called */
	hasWon(): boolean;
	/** The current difficulty of the game */
	difficulty: 1 | 2 | 3;
	/** The speed multiplier */
	speed: number;
	/** The lives the player has left */
	lives: number;
	/** The time left for the minigame to finish */
	timeLeft: number;
};

/** The context for the allowed functions in a minigame */
export type MinigameCtx = Pick<typeof k, typeof gameAPIs[number]> & MinigameAPI;

/** The type for a minigame */
export type Minigame = {
	/** Prompt of the mini game!
	 *
	 * You can also change it depending on difficulty and certain game conditions
	 * @example
	 * ```ts
	 * prompt: (ctx) => `GET ${ctx.difficulty} APPLES!`
	 * ```
	 *
	 * Or if you're feeling fancy, modify the prompt object itself (NOT WORKING RIGHT NOW)
	 * @example
	 * ```ts
	 * prompt: (ctx, promptObj) => {
	 * 		promptObj.textStyles = {
	 * 			"red": {
	 * 				color: ctx.RED
	 * 			}
	 * 		}
	 * 		promptObj.text = `GET [red]${ctx.difficulty}[/red] APPLES!`
	 * }
	 * ```
	 *
	 * Please keep the prompt text in the cool format (All uppercase, single exclamation mark at the end)
	 */
	prompt: string | ((ctx: MinigameCtx, prompt: ReturnType<typeof k.addPrompt>) => void);
	/** The author of the game */
	author: string;
	/** The RGB code for the game's background
	 *
	 * You can also use a regular kaplay color, you can get some from the mulfok32 palette
	 * @example
	 * ```ts
	 * import mulfokColors from "../../src/plugins/colors";
	 * rgb: mulfokColors.VOID_PURPLE
	 * ```
	 */
	rgb?: [number, number, number] | Color;
	/** The input the minigame uses, if both are empty will assume keys
	 *
	 * @cursor You can configure your game's cursor this way
	 * ```ts
	 * cursor: { hide: true } // you can use a custom cursor in your minigame
	 * ```
	 * ```ts
	 * cursor: true // will simply use kaplayware's cursor
	 * ```
	 * ```ts
	 * cursor: false // the game will not use cursor in any way
	 * ```
	 */
	input?: KeyInput | CursorInput;
	/** How long the minigames goes for (choose a reasonable number)
	 *
	 * You can also use a callback, to change it based on difficulty
	 * @example
	 * ```ts
	 * duration: (ctx) => ctx.difficulty == 3 ? 6 : 4
	 * ```
	 *
	 * You can also make this callback return undefined, which would make your minigame run indefinetely, and would only be stopped once you call the `ctx.finish()` function
	 * @example
	 * ```ts
	 * duration: () => undefined
	 * start(ctx) {
	 * 		ctx.wait(3, () => {
	 * 			ctx.win();
	 * 			ctx.finish();
	 * 		})
	 * }
	 * ```
	 */
	duration?: number | ((ctx: MinigameCtx) => number | undefined);
	/**
	 * Assets URL prefix.
	 */
	urlPrefix?: string;
	/** Wheter your game plays its own music or if it should play a random jingle from our selection of jingles */
	playsOwnMusic?: boolean;
	/**
	 * The function that loads the game's custom assets
	 *
	 * @example
	 * ```js
	 * load(ctx) {
	 * 	ctx.loadSprite("bean", "sprites/bean.png")
	 * }
	 * ```
	 */
	load?: (ctx: LoadCtx) => void;
	/**
	 * Main entry of the game code. Should return a game object made by `k.make()` that contains the whole game.
	 *
	 * @example
	 * ```js
	 * start(ctx) {
	 * 	const game = ctx.make();
	 * 	// (Your game code will be here...)
	 * 	return game;
	 * }
	 * ```
	 */
	start: (ctx: MinigameCtx) => GameObj;
};

export type KAPLAYwareOpts = {
	debug?: boolean;
	onlyMouse?: boolean;
	inOrder?: boolean;
};

export type KaplayWareCtx = {
	/** Wheter input is enabled */
	inputEnabled: boolean;
	/** Wheter the current game is running */
	gameRunning: boolean;
	/** The speed of the game */
	speed: number;
	/** The difficulty */
	difficulty: 1 | 2 | 3;
	/** The time left for a minigame to finish */
	time: number;
	/** The current score for the player */
	score: number;
	/** The lives left */
	lives: number;
	/** The index of the game in the games array */
	gameIdx: number;
	/** The amount of times the game has sped up */
	timesSpeed: number;
	/** Transition to the next game */
	nextGame: () => void;
	/** Returns the current minigame */
	curGame: () => Minigame;
	/** Runs a minigame */
	runGame: (g: Minigame) => GameObj;
	/** Speeds up the game */
	speedUp: () => void;
};
