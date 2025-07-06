import { Asset, LoadSpriteOpt, LoadSpriteSrc, SpriteData } from "kaplay";
import k from "../../../kaplay";

export function loadMinigameSprite(id: string, name: string, path: LoadSpriteSrc | LoadSpriteSrc[], opt?: LoadSpriteOpt) {
	return k.loadSprite(`${id}-${name}`, path, opt);
}
