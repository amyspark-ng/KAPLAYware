import { createScenery } from "../core/scenery";
import { k } from "../kaplay";
import { MicrogameController } from "../core/controller";
import { CONFIG } from "../config";
import { GameEvent, GameState, nextState } from "../core/state/state";
import { prepTransition } from "../core/transitions/prep";
import { winTransition } from "../core/transitions/win";
import { loseTransition } from "../core/transitions/lose";
import { speedTransition } from "../core/transitions/speed";
import { GAME_CURSOR } from "../objects/cursor";
import { GameAct } from "../core/act/game_act";
import { addTimeSetup, prepGame } from "../core/game_actions";

k.scene("game", () => {
	// creates the scenerys
	const gameScenery = createScenery();
	const transScenery = createScenery();
	transScenery.gameBox.use(k.opacity());
	// @ts-ignore
	transScenery.gameBox.opacity = 0;

	const controller = new MicrogameController(CONFIG.microgames);
	let currentGameAct: GameAct = null;

	/** Runs the code necessary on the states and events of the game scene */
	const dispatch = async (event: GameEvent) => {
		controller.state = nextState(controller.state, event, controller);

		switch (controller.state) {
			case GameState.Preparing:
				GAME_CURSOR.grandparentCheck = transScenery.root;
				currentGameAct?.clear();
				currentGameAct = prepGame(gameScenery, controller, controller.getGameFromHat());

				prepTransition(transScenery, currentGameAct, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});

				break;

			case GameState.Playing:
				GAME_CURSOR.grandparentCheck = gameScenery.root;
				addTimeSetup(controller, currentGameAct);
				controller.onFinish((result) => {
					dispatch({ type: "MICROGAME_END", result });
				});

				break;

			case GameState.TransitionWin:
				GAME_CURSOR.grandparentCheck = transScenery.root;
				controller.win();
				currentGameAct.engine.pauseEverything(true);
				winTransition(transScenery, currentGameAct, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.TransitionLose:
				GAME_CURSOR.grandparentCheck = transScenery.root;
				controller.lose();
				currentGameAct.engine.pauseEverything(true);
				loseTransition(transScenery, currentGameAct, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.SpeedUp:
				GAME_CURSOR.grandparentCheck = transScenery.root;
				controller.speedUp();
				speedTransition(transScenery, currentGameAct, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;
			case GameState.GameOver:
				GAME_CURSOR.grandparentCheck = transScenery.root;
				// setCanPause(false);
				// runGameOver();
				break;
		}
	};

	dispatch({ type: "START" });
});
