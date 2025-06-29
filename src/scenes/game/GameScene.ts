import k from "../../engine";
import { createGameInstance } from "./game";
import { getGameByID } from "./utils";

k.scene("game", () => {
	const instance = createGameInstance();

	instance.runMicroGame(getGameByID("amyspark-ng:avoid"));

	// every paused thing should be handled here

	// every transition thing should be handled here (the kaplayware instance)
	// could when running modify the speed and such (ctx.speed)
});
