import { MicrogameController } from "../core/controller";

/** All the states the game scene goes through: It answers "What state is the game in?" */
export enum GameState {
	Idle,
	Preparing,
	Playing,
	TransitionWin,
	TransitionLose,
	SpeedUp,
	GameOver,
}

/** All the events that can happen on the game scene and some params: It answers "What just happened?" */
export type GameEvent =
	| { type: "START"; }
	| { type: "MICROGAME_END"; result: "win" | "lose"; }
	| { type: "TRANSITION_DONE"; };

/** Gets what should be next state considering the current state and the event */
export function nextState(
	state: GameState,
	event: GameEvent,
	controller: MicrogameController,
): GameState {
	switch (state) {
		case GameState.Idle:
			if (event.type === "START") {
				return GameState.Preparing;
			}
			break;

		case GameState.Preparing:
			if (event.type === "TRANSITION_DONE") {
				return GameState.Playing;
			}
			break;

		case GameState.Playing:
			if (event.type === "MICROGAME_END") {
				return event.result === "win"
					? GameState.TransitionWin
					: GameState.TransitionLose;
			}
			break;

		case GameState.TransitionWin:
			if (event.type === "TRANSITION_DONE") {
				return controller.shouldSpeedUp
					? GameState.SpeedUp
					: GameState.Preparing;
			}
			break;

		case GameState.SpeedUp:
			if (event.type === "TRANSITION_DONE") {
				return GameState.Preparing;
			}
			break;

		case GameState.TransitionLose:
			if (event.type === "TRANSITION_DONE") {
				return controller.lives <= 0
					? GameState.GameOver
					: GameState.Preparing;
			}
			break;
	}

	return state;
}
