import { createGameAct, GameAct } from "./act/game_act";
import { MicrogameController } from "./controller";
import { getGameColor } from "./game_registry";
import { Microgame } from "./microgame";
import { Scenery } from "./scenery";

/** Does the thing where it clears the previous controller and creates a new game act for an incoming game */
export function prepGame(scenery: Scenery, controller: MicrogameController, game: Microgame) {
	controller.clearFromPrevious();
	const gameAct = createGameAct(scenery, game, controller);
	gameAct.root.use(gameAct.ctx.layer("2"));
	gameAct.root.color = getGameColor(gameAct.game.bgColor);
	gameAct.bomb.root.pos = gameAct.ctx.vec2(0, 70);

	if (controller.isHard && gameAct.game.hardModeOpt) {
		if (gameAct.game.hardModeOpt.bgColor) gameAct.root.color = getGameColor(gameAct.game.hardModeOpt.bgColor);
	}

	gameAct.game.start(gameAct.ctx);
	gameAct.root.wait(0, () => gameAct.engine.pauseEverything(true));
	return gameAct;
}

/** Adds the timeLeft stuff and the bomb to an existing gameAct */
export function addTimeSetup(controller: MicrogameController, gameAct: GameAct) {
	let timeOver = false;
	let hasBombLit = false;
	let hasBombAppeared = false;

	controller.timeLeft = gameAct.game.duration / controller.speed;
	if (controller.isHard && gameAct.game.hardModeOpt) {
		if (gameAct.game.hardModeOpt.duration) controller.timeLeft = gameAct.game.hardModeOpt.duration / controller.speed;
	}

	gameAct.ctx.add([]).onUpdate(() => {
		if (controller.finished) return;

		if (controller.timeLeft > 0) {
			controller.timeLeft -= gameAct.ctx.dt();
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
				const ctx = gameAct.ctx;
				gameAct.root.tween(
					gameAct.bomb.root.pos,
					ctx.vec2(0, -10),
					beatInterval,
					(p) => gameAct.bomb.root.pos = p,
					ctx.easings.easeOutQuint,
				);
			}

			if (controller.timeLeft <= beatInterval * 4 && !hasBombLit) {
				hasBombLit = true;
				gameAct.bomb.lit(140 * controller.speed);
			}
		}
	});
}
