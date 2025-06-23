import k from "../../engine";
import { kaplayware, KAPLAYwareOpts } from "./kaplayware";

k.scene("game", (kaplaywareOpt: KAPLAYwareOpts) => {
	const wareEngine = kaplayware(kaplaywareOpt);
	wareEngine.nextGame();

	let transitionOpacity = 0;
	k.onUpdate(() => {
		if (k.isKeyPressed("escape")) wareEngine.paused = !wareEngine.paused;
		transitionOpacity = k.lerp(transitionOpacity, wareEngine.paused ? 1 : 0, 0.75);
	});

	k.onDraw(() => {
		if (wareEngine.paused) {
			k.drawRect({
				width: k.width(),
				height: k.height(),
				fixed: true,
				color: k.BLACK,
				opacity: 0.75 * transitionOpacity,
			});

			k.drawText({
				text: "PAUSED",
				pos: k.center(),
				anchor: "center",
				align: "center",
				opacity: transitionOpacity,
			});
		}
	});
});

const goGame = (opts?: KAPLAYwareOpts) => k.go("game", opts);
export default goGame;
