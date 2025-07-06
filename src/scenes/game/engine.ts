import { Microgame } from "../../types/Microgame";
import { createGameContainer, GameContainer } from "./container";
import { createEventManager, EventManager } from "./eventmanager";

export type WareEngine = EventManager & {
	readonly container: GameContainer;
	runMicroGame(game: Microgame): void;
};

export function executeWareEngine(): WareEngine {
	const container = createGameContainer();

	// when creating the kCtx do add(comps) => container.add(comps)

	return {
		...createEventManager(),

		get container() {
			return container;
		},

		runMicroGame(this: WareEngine, game: Microgame) {
		},
	};
}
