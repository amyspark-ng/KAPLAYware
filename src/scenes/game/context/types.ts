import { assets } from "@kaplayjs/crew";
import { Asset, Color, CompList, GameObj, GameObjRaw, KEventController, MergeComps, SpriteComp, SpriteCompOpt, SpriteData, TweenController, Vec2 } from "kaplay";
import { gameAPIs } from "../api";
import { ConfettiOpt } from "../objects/confetti";
import k from "../../../engine";

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

export type StartCtx = Pick<typeof k, typeof gameAPIs[number]> & {
	/**
	 * — Modified KAPLAYWARE sprite() component. Adds default assets
	 *
	 * Attach and render a sprite to a Game Object. yada yada
	 *
	 * @param spr - The sprite to render.
	 * @param opt - Options for the sprite component. See {@link SpriteCompOpt `SpriteCompOpt`}.
	 */
	sprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt): WareSpriteComp;
};

/** The type of input a microgame does */
export type MicrogameInput = "mouse" | "keys" | "both";

/** The specific API for microgames */
export type MicrogameAPI = {
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
	/** Gets the current RGB of the background of your microgame */
	getRGB(): Color;
	/** Sets the RGB to the background of your microgame */
	setRGB(val: Color): void;
	/** Register an event that runs once when timer runs out. */
	onTimeout: (action: () => void) => KEventController;
	/** Run this when player succeeded in completing the game. */
	win: () => void;
	/** Run this when player failed. */
	lose: () => void;
	/** Run this when your microgame has 100% finished all win/lose animations etc */
	finish: () => void;
	/** The win/lose state of the current microgame
	 * If ctx.win() has been called, it will return true
	 *
	 * If ctx.lose() was called, it will return false
	 *
	 * If nor ctx.win() or ctx.lose() has been called, it will return undefined
	 */
	readonly winState: boolean | undefined;
	/** The current difficulty of the game */
	readonly difficulty: 1 | 2 | 3;
	/** The speed multiplier */
	readonly speed: number;
	/** The lives the player has left */
	readonly lives: number;
	/** The time left for the microgame to finish */
	readonly timeLeft: number;
	/** The final duration of your microgame */
	readonly duration: number;
	/** The final prompt of  your microgame */
	readonly prompt: string;
};

/** The context for the allowed functions in a microgame */
export type MicrogameCtx = StartCtx & MicrogameAPI;
