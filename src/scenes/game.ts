import k from "../engine";
import games from "../games";
import kaplayware from "../kaplayware";
import { KAPLAYwareOpts } from "../types";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const ware = kaplayware(games, kaplaywareOpt);
	ware.nextGame();
});
