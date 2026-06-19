import { createScenery } from "../core/scenery";
import { k } from "../kaplay";
import { KEvent } from "kaplay";
import { MicrogameController } from "../core/controller";
import { CONFIG } from "../config";
import { GameEvent, GameState, nextState } from "../core/state/state";
import { prepTransition } from "../core/transitions/prep";
import { winTransition } from "../core/transitions/win";
import { loseTransition } from "../core/transitions/lose";
import { speedTransition } from "../core/transitions/speed";

let canPause = true;
let paused = false;
let pauseKEvent: KEvent = new k.KEvent();

export let setCanPause = (newCanPause: boolean) => {
	canPause = newCanPause;
};

export let setPaused = (newPause: boolean) => {
	if (!canPause) return;
	if (paused != newPause) pauseKEvent.trigger(newPause);
	paused = newPause;
};

export let onPauseChange = (action: (paused: boolean) => void) => {
	return pauseKEvent.add(action);
};

let zoomedIn: boolean = true;
export let changeZoom = (newZoom: boolean) => {
	zoomedIn = newZoom;
};

k.scene("game", () => {
	canPause = true;
	paused = false;
	zoomedIn = false;
	pauseKEvent.clear();

	const gameScenery = createScenery();
	const transScenery = createScenery();
	transScenery.gameBox.use(k.opacity());
	// @ts-ignore
	transScenery.gameBox.opacity = 0;

	const controller = new MicrogameController(gameScenery, CONFIG.microgames);
	if (CONFIG.DEV_MICROGAME) {
		controller.isHard = CONFIG.DEV_HARD;
		controller.speed = CONFIG.DEV_SPEED;
	}

	/** Runs the code necessary on the states and events of the game scene */
	const dispatch = async (event: GameEvent) => {
		controller.state = nextState(controller.state, event, controller);

		switch (controller.state) {
			case GameState.Preparing:
				setCanPause(false);
				controller.removePreviousGame();
				controller.currentGame = controller.getGameFromHat();
				controller.createCurrentAct();

				prepTransition(transScenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});

				break;

			case GameState.Playing:
				setCanPause(true);
				const result = await controller.runCurrentAct();
				dispatch({ type: "MICROGAME_END", result });

				break;

			case GameState.TransitionWin:
				setCanPause(false);
				controller.win();
				winTransition(transScenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.TransitionLose:
				setCanPause(false);
				controller.lose();
				loseTransition(transScenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.SpeedUp:
				controller.speedUp();
				speedTransition(transScenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;
			case GameState.GameOver:
				setCanPause(false);
				// runGameOver();
				break;
		}
	};

	const lerpValue = 0.35;
	k.onUpdate(() => {
		// cursor
		const shouldMouseBeVisible = controller.currentGame.input == "mouse" || controller.currentGame.input == "mouseclick";
		if (shouldMouseBeVisible) {
			// cursor.hidden = false;
		}
		else {
			// cursor.hidden = true;
		}
	});

	dispatch({ type: "START" });
});
