import { k } from "../../kaplay";
import { Scenery } from "./core/scenery";
import { MicrogameController } from "./core/controller";
import { getGame } from "../../registry";
import { KEvent } from "kaplay";
import { runPrepTransition } from "./core/transitions/prep";
import { GameEvent, GameState, nextState } from "./state/state";
import { runWinTransition } from "./core/transitions/win";
import { runLoseTransition } from "./core/transitions/lose";
import { buildKHandled } from "./elements/khandled";
import { addBackground } from "./elements/background";
import { buildPausedScreen } from "./elements/paused";
import { addBomb } from "./elements/bomb";
import { SandboxInstance } from "./core/instance/instance";

let paused = false;
let pauseKEvent: KEvent = new k.KEvent();
export let setPaused = (newPause: boolean) => {
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

let khandled: ReturnType<typeof buildKHandled>;
export let getKHandled = () => {
	return khandled;
};

k.scene("game", () => {
	paused = false;
	zoomedIn = false;
	pauseKEvent.clear();

	// TODO: some wiggle shader for this because cool?
	const reality = k.add([k.sprite("reality")]);
	const background = addBackground();
	khandled = buildKHandled();
	const pauseScreen = buildPausedScreen(khandled.root);

	// has to be scaled to 320x240
	// scalingFactor = desiredWidth / originalWidth
	const scenery = new Scenery(khandled.root);
	scenery.scale = k.vec2(320 / k.width(), 240 / k.height());
	scenery.pos = k.vec2(-1, -217);

	const controller = new MicrogameController(scenery, []);

	/** Runs the code necessary on the states and events of the game scene */
	const dispatch = async (event: GameEvent) => {
		controller.state = nextState(controller.state, event, controller);

		switch (controller.state) {
			case GameState.Preparing:
				controller.timeoutKEvent.clear();
				controller.finishKEvent.clear();
				controller.finished = false;
				controller.currentInstance?.root.destroy();
				controller.currentBomb?.destroy();

				// get game
				controller.currentGame = getGame("amyspark-ng:get");

				runPrepTransition(scenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.Playing:
				const result = await controller.runGame(controller.currentGame);
				dispatch({ type: "MICROGAME_END", result });

				break;

			case GameState.TransitionWin:
				controller.currentInstance?.root.destroy();

				runWinTransition(scenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.TransitionLose:
				controller.currentInstance?.root.destroy();
				runLoseTransition(scenery, controller).then(() => {
					dispatch({ type: "TRANSITION_DONE" });
				});
				break;

			case GameState.SpeedUp:
				// runSpeedUpTransition().then(() => {
				// 	dispatch({ type: "TRANSITION_DONE" });
				// });
				// break;
			case GameState.GameOver:
				// runGameOver();
				break;
		}
	};

	const lerpValue = 0.35;
	k.onUpdate(() => {
		// if it's playing and it's not paused, zoom
		changeZoom(controller.state == GameState.Playing && !paused);

		if (paused) {
			pauseScreen.screen.opacity = k.lerp(pauseScreen.screen.opacity, 0.5, 0.25);
			khandled.root.pos = k.lerp(khandled.root.pos, k.vec2(khandled.root.pos.x, k.height() + 200), 0.25);
			background.opacity = k.lerp(background.opacity, 0, 0.1);

			if (controller.state == GameState.Playing && !paused) background.hidden = true;
			else background.hidden = false;
		}
		else {
			pauseScreen.screen.opacity = k.lerp(pauseScreen.screen.opacity, 0, 0.35);
			khandled.root.pos = k.lerp(khandled.root.pos, k.vec2(khandled.root.pos.x, k.height()), 0.5);
			background.opacity = k.lerp(background.opacity, 1, 0.5);
		}

		if (zoomedIn) {
			k.setCamPos(k.lerp(k.getCamPos(), k.center().add(-1, 83.5), lerpValue));
			const camScaleNew = k.vec2(k.width() / 320, k.height() / 240);
			k.setCamScale(k.lerp(k.getCamScale(), camScaleNew, lerpValue));
		}
		else {
			k.setCamPos(k.lerp(k.getCamPos(), k.center(), lerpValue));
			k.setCamScale(k.lerp(k.getCamScale(), k.vec2(1), 0.25));
		}

		pauseScreen.screen.pauseInputHandling();
	});

	onPauseChange((paused) => {
		if (paused) reality.frame = k.randi(0, 5);
	});

	pauseScreen.onExit(() => {
		// throw static here
		k.go("focus");
	});

	dispatch({ type: "START" });
});
