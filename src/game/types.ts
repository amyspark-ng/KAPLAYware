import { Asset, Color, GameObj, KAPLAYCtx, KEventController, SpriteComp, SpriteCompOpt, SpriteData, TweenController, Vec2 } from "kaplay";
import k from "../engine";
import { ConfettiOpt } from "../plugins/wareobjects";
import { gameAPIs } from "./api";
import { LoadCtx, MinigameCtx } from "./context";
import { assets } from "@kaplayjs/crew";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

/**
 * A modified {@link sprite `sprite()`} component to fit KAPLAYware.
 *
 * @group Component Types
 */
interface WareSpriteComp extends Omit<SpriteComp, "sprite"> {
	/**
	 * Name of the sprite.
	 */
	sprite: CustomSprite<string>;
}

/** The type of input a minigame does */
export type MinigameInput = "mouse" | "keys" | "both";

/** A button */
export type InputButton =
	| "action"
	| "left"
	| "right"
	| "up"
	| "down"
	| "click";

/** The specific API for minigames */
export type MinigameAPI = {
	/**
	 * Register an event that runs once when a button is pressed.
	 */
	onInputButtonPress(btn: InputButton, action: () => void): KEventController;
	/**
	 * Register an event that runs once when a button is released.
	 */
	onInputButtonRelease(btn: InputButton, action: () => void): KEventController;
	/**
	 * Register an event that runs every frame when a button is held down.
	 */
	onInputButtonDown(btn: InputButton, action: () => void): KEventController;
	isInputButtonPressed(btn: InputButton): boolean;
	isInputButtonDown(btn: InputButton): boolean;
	isInputButtonReleased(btn: InputButton): boolean;

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
	flashCam(flashColor?: Color, time?: number, opacity?: number): TweenController;
	/** Gets the current RGB of the background of your minigame */
	getRGB(): Color;
	/** Sets the RGB to the background of your minigame */
	setRGB(val: Color): void;
	/** ### Custom sprite component for KAPLAYware that holds default assets
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
	sprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt): WareSpriteComp;
	/** Register an event that runs once when timer runs out. */
	onTimeout: (action: () => void) => KEventController;
	/** Run this when player succeeded in completing the game. */
	win: () => void;
	/** Run this when player failed. */
	lose: () => void;
	/** Run this when your minigame has 100% finished all win/lose animations etc */
	finish: () => void;
	/** The win/lose state of the current minigame
	 * If ctx.win() has been called, it will return true
	 *
	 * If ctx.lose() was called, it will return false
	 *
	 * If nor ctx.win() or ctx.lose() has been called, it will return undefined
	 */
	winState(): boolean | undefined;
	/** The current difficulty of the game */
	difficulty: 1 | 2 | 3;
	/** The speed multiplier */
	speed: number;
	/** The lives the player has left */
	lives: number;
	/** The time left for the minigame to finish */
	timeLeft: number;
};

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
	/** The RGB (color) code for the game's background
	 *
	 * You can use a regular array of numbers like so:
	 * @example
	 * ```ts
	 * rgb: [235, 38, 202]
	 * ```
	 *
	 * You can also use a regular kaplay color, you can get some from the mulfok32 palette, which is exported in the context
	 * @example
	 * ```ts
	 * rgb: (ctx) => ctx.mulfok.VOID_PURPLE
	 * ```
	 *
	 * And if you're feeling fancy, determine the color based on context parameters with a function, like this:
	 * @example
	 * ```ts
	 * rgb: (ctx) => ctx.difficulty == 3 ? ctx.Color.fromArray(237, 24, 63) : ctx.Color.fromArray(235, 38, 202)
	 * ```
	 */
	rgb?: [number, number, number] | Color | ((ctx: MinigameCtx) => Color);
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
	input?: "keys" | "mouse" | "mouse (hidden)";
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
	/** Wheter the minigame should appear on an specific difficulty */
	difficulty?: 1 | 2 | 3 | "BOSS";
	/** Wheter the minigame depends on colors to be played (crucial for accesability) */
	colorDependant?: boolean;
	/**
	 * The function that loads the game's custom assets
	 *
	 * @example
	 * ```js
	 * load(ctx) {
	 * 	ctx.loadSprite("hand", "sprites/hand.png")
	 * }
	 * ```
	 */
	load?: (ctx: LoadCtx) => void;
	/**
	 * Main entry of the game code.
	 *
	 * @example
	 * ```js
	 * start(ctx) {
	 * 		const bean = ctx.add([
	 * 			ctx.sprite("@bean"),
	 * 		])
	 * }
	 * ```
	 */
	start: (ctx: MinigameCtx) => void;
};

export type KAPLAYwareOpts = {
	games?: Minigame[];
	debug?: boolean;
	input?: MinigameInput;
	inOrder?: boolean;
};
