import k from "../engine";
import games from "../game/games";
import kaplayware from "../game/kaplayware";
import { KAPLAYwareOpts } from "../game/types";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const ware = kaplayware(games, kaplaywareOpt);
	ware.nextGame();

	let transitionOpacity = 0;
	k.onUpdate(() => {
		if (k.isKeyPressed("escape")) ware.paused = !ware.paused;
		transitionOpacity = k.lerp(transitionOpacity, ware.paused ? 1 : 0, 0.75);
	});

	k.onDraw(() => {
		if (ware.paused) {
			k.drawRect({
				width: k.width(),
				height: k.height(),
				fixed: true,
				color: k.BLACK,
				opacity: 0.75 * transitionOpacity,
			});

			k.drawText({
				text: "PAUSED\nPress ESC again to unpause",
				pos: k.center(),
				anchor: "center",
				align: "center",
				opacity: transitionOpacity,
			});
		}
	});
});
