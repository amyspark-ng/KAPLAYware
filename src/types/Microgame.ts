import { Color } from "kaplay";
import { LoadCtx } from "../scenes/game/context/load";
import { MicrogameCtx } from "../scenes/game/context/types";
import { addTextPrompt } from "../scenes/game/objects/prompts";

interface BaseMicrogame {
	/** Prompt of the microgame!
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
	prompt: string | ((ctx: MicrogameCtx, prompt: ReturnType<typeof addTextPrompt>) => void);
	/** The author of the game */
	author: string;
	/** The name of the minigame, used for identification.  */
	name: string;
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
	rgb: [number, number, number] | Color | ((ctx: MicrogameCtx) => Color);
	/**
	 * Assets URL prefix.
	 */
	urlPrefix?: string;
	/** Wheter your game plays its own music or if it should play a random jingle from our selection of jingles */
	playsOwnMusic?: boolean;
	/** Wheter the microgame depends on colors to be played (crucial for accesability) */
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
	start: (ctx: MicrogameCtx) => void;
}

interface NormalMicrogame extends BaseMicrogame {
	/** The input the microgame uses, if both are empty will assume keys
	 *
	 * @cursor You can configure your game's cursor this way
	 * ```ts
	 * cursor: { hide: true } // you can use a custom cursor in your microgame
	 * ```
	 * ```ts
	 * cursor: true // will simply use kaplayware's cursor
	 * ```
	 * ```ts
	 * cursor: false // the game will not use cursor in any way
	 * ```
	 */
	input: "keys" | "mouse" | "mouse (hidden)";
	/** How long the microgame goes for (choose a reasonable number)
	 *
	 * You can also use a callback, to change it based on difficulty
	 * @example
	 * ```ts
	 * duration: (ctx) => ctx.difficulty == 3 ? 6 : 4
	 * ```
	 *
	 * You can also make this callback return undefined, which would make your microgame run indefinetely, and would only be stopped once you call the `ctx.finish()` function
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
	duration?: number | ((ctx: MicrogameCtx) => number);
	isBoss?: false;
}

interface BossMicrogame extends BaseMicrogame {
	/** BOSS DIFFICULTY, duration() and input() are disabled, as boss microgames are infinite and input is always mouse and keyboard  */
	isBoss: true;
	/** Wheter to hide the mouse for the BOSS microgame */
	hideMouse: boolean;
}

/**
 * A microgame is a little game that can be played on KAPLAYWare.
 */
export type Microgame = NormalMicrogame | BossMicrogame;
