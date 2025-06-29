import { Microgame } from "../../types/Microgame";
import { createGameContainer } from "./container";

export function createGameInstance() {
	const container = createGameContainer();

	// when creating the kCtx do add(comps) => container.add(comps)

	return {
		runMicroGame(game: Microgame) {
		},
	};
}
