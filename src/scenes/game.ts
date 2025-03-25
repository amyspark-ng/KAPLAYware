import k from "../engine";
import games from "../game/games";
import kaplayware from "../game/kaplayware";
import { KAPLAYwareOpts } from "../game/types";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const ware = kaplayware(games, kaplaywareOpt);
	ware.nextGame();
});
