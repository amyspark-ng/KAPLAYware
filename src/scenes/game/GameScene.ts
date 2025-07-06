import k from "../../kaplay";
import { createGameContainer } from "./container";
import { executeWareEngine } from "./engine";
import { getGameByID } from "./utils";

k.scene("game", () => {
	const engine = executeWareEngine();

	engine.runMicroGame(getGameByID("amyspark-ng:avoid"));

	engine.events.onButtonPress("left", () => {
		k.debug.log();
	});

	engine.events.onKeyPress("r", () => {
		engine.clearEvents();
	});

	// every paused thing should be handled here

	// every transition thing should be handled here (the kaplayware instance)
	// could when running modify the speed and such (ctx.speed)
});
