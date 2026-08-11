import { addBomb, Bomb } from "../../objects/gameplay/bomb";
import { buildGameContext, MicrogameContext } from "../context/game";
import { MicrogameController } from "../controller";
import { Microgame } from "../microgame";
import { Scenery } from "../scenery";
import { Act, createAct } from "./act";

/**
 * Like {@link Act} but includes some things specific to a singular game (like the bomb/the game context)
 */
export interface GameAct extends Act {
	game: Microgame;
	ctx: MicrogameContext;
	bomb: Bomb;
	clear(): void;
}

export function createGameAct(scenery: Scenery, currentGame: Microgame, controller: MicrogameController): GameAct {
	const regularAct = createAct(scenery);
	const gameAct = {
		...regularAct,
		game: currentGame,
		bomb: null as Bomb,
		ctx: buildGameContext(regularAct, currentGame, controller),
		clear() {
			regularAct.destroy();
			this.game = null;
			this.ctx = null;
			this.bomb = null;
		},
	};

	gameAct.ctx.setResult = (result) => {
		controller.lastGameResult = result;
		// if bomb exists and you won extinguish it
		if (result == "win" && gameAct.bomb?.isLit) gameAct.bomb.extinguish();
	};

	return gameAct;
}
