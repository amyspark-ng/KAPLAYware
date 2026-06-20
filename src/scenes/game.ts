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
import { getGameColor } from "../core/game_registry";
import { createGameAct, GameAct } from "../core/act/game_act";

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
				controller.clearFromPrevious();
				currentGameAct?.clear();
				currentGameAct = createGameAct(gameScenery, controller.getGameFromHat(), controller);
				currentGameAct.root.use(k.layer("2"));
				currentGameAct.root.color = getGameColor(currentGameAct.game.bgColor);
				currentGameAct.bomb.root.pos = currentGameAct.ctx.vec2(0, 70);

				if (controller.isHard && currentGameAct.game.hardModeOpt) {
					if (currentGameAct.game.hardModeOpt.bgColor) currentGameAct.root.color = getGameColor(currentGameAct.game.hardModeOpt.bgColor);
				}

				currentGameAct.game.start(currentGameAct.ctx);
				currentGameAct.root.wait(0, () => currentGameAct.engine.pauseEverything(true));

				prepTransition(transScenery, currentGameAct, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});

				break;

			case GameState.Playing:
				GAME_CURSOR.grandparentCheck = gameScenery.root;
				let timeOver = false;
				let hasBombLit = false;
				let hasBombAppeared = false;

				controller.timeLeft = currentGameAct.game.duration / controller.speed;
				if (controller.isHard && currentGameAct.game.hardModeOpt) {
					if (currentGameAct.game.hardModeOpt.duration) controller.timeLeft = currentGameAct.game.hardModeOpt.duration / controller.speed;
				}

				currentGameAct.ctx.add([]).onUpdate(() => {
					if (controller.finished) return;

					if (controller.timeLeft > 0) {
						controller.timeLeft -= k.dt();
					}

					if (controller.timeLeft <= 0 && !timeOver) {
						controller.timeoutKEvent.trigger();
						timeOver = true;
					}

					// if already won don't add the bomb
					if (controller.lastGameResult != "win") {
						// 140 IT'S THE HARDCODED BPM
						// TODO: make it more consistent with the timing of the game
						const beatInterval = 60 / (140 * controller.speed);

						if (controller.timeLeft <= beatInterval * 5 && !hasBombAppeared) {
							hasBombAppeared = true;
							const ctx = currentGameAct.ctx;
							currentGameAct.root.tween(
								currentGameAct.bomb.root.pos,
								ctx.vec2(0, -10),
								beatInterval,
								(p) => currentGameAct.bomb.root.pos = p,
								ctx.easings.easeOutQuint,
							);
						}

						if (controller.timeLeft <= beatInterval * 4 && !hasBombLit) {
							hasBombLit = true;
							currentGameAct.bomb.lit(140 * controller.speed);
						}
					}
				});

				currentGameAct.engine.pauseEverything(false);
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
