import { addBomb, Bomb } from "../../objects/gameplay/bomb";
import { mergeWithRef } from "../../utils";
import { buildGameContext, MicrogameContext } from "../context/game";
import { MicrogameController } from "../controller";
import { Microgame } from "../microgame";
import { Scenery } from "../scenery";
import { Act, createAct } from "./act";

/**
 * Like {@link Act} but includes some things specific to a singular game (like the bomb the game context)
 */
export interface GameAct extends Act {
	game: Microgame;
	ctx: MicrogameContext;
	bomb: Bomb;
	clear(): void;
}

export function createGameAct(scenery: Scenery, currentGame: Microgame, controller: MicrogameController): GameAct {
	const regularAct = createAct(scenery);
	return {
		...regularAct,
		game: currentGame,
		ctx: buildGameContext(regularAct, currentGame, controller),
		bomb: addBomb(regularAct),
		clear() {
			regularAct.destroy();
			this.game = null;
			this.ctx = null;
			this.bomb = null;
		},
	};
}
