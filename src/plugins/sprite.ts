import { assets } from "@kaplayjs/crew";
import { Asset, SpriteCompOpt, SpriteData } from "kaplay";
import k from "../engine";
import { getGameID } from "../utils";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;

type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

export function wareSprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt) {
	return k.sprite(spr, opt);
}

export function spriteCompPlugin() {
	return {
		wareSprite,
	};
}
