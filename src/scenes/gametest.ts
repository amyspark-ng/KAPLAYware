import { buildLoadContext } from "../assets/load_microgames";
import { CONFIG } from "../config";
import { createGameAct, GameAct } from "../core/act/game_act";
import { MicrogameController } from "../core/controller";
import { getGameColor, getGameID } from "../core/game_registry";
import { Microgame } from "../core/microgame";
import { createScenery } from "../core/scenery";
import { k } from "../kaplay";
import { GAME_CURSOR } from "../objects/cursor";

function scrollIndex(index: number, change: number, totalAmount: number) {
	if (totalAmount == 0) throw new Error("Something must be wrong with your code, scrollIndex amount is 0");
	// why was this so hard to figure out??
	if (change > 0) {
		if (index + change > totalAmount - 1) index = 0;
		else index += change;
	}
	else if (change < 0) {
		if (index - Math.abs(change) < 0) index = totalAmount - 1;
		else index -= Math.abs(change);
	}

	return index;
}

k.scene("gametest", () => {
	let ingame = false;
	let gameIndex = 0;

	const loadedMicrogames: Microgame[] = [];
	const isGameLoaded = (game: Microgame) => loadedMicrogames.includes(game);

	const fakeController = new MicrogameController();
	let currentGameAct: GameAct = null;

	const testUI = k.add([]);

	const gameScenery = createScenery(k.getTreeRoot());
	gameScenery.scale = k.vec2(0.6);
	const overlay = gameScenery.scene.add([
		k.layer("1"),
		k.rect(800, 600),
		k.opacity(0),
		k.color(k.BLACK),
	]);

	CONFIG.microgames.forEach((game, i) => {
		const name = getGameID(game).split(":")[1];

		const gameIcon = testUI.add([
			k.sprite("bean"),
			k.pos(k.vec2(50).add(100 * i, 0)),
			k.anchor("center"),
			k.opacity(),
			k.color(),
		]);

		gameIcon.add([
			k.text(name),
			k.pos(0, 40),
			k.scale(0.6),
			k.anchor("center"),
		]);

		gameIcon.onUpdate(() => {
			if (i != gameIndex) {
				gameIcon.opacity = 0.5;
			}
			else {
				gameIcon.opacity = 1;
			}

			if (!isGameLoaded(game)) gameIcon.color = k.BLACK;
			else gameIcon.color = k.WHITE;
		});
	});

	k.onUpdate(async () => {
		if (k.isButtonPressed("return")) ingame = !ingame;
		currentGameAct?.engine.pauseEverything(!ingame);

		if (!ingame) {
			overlay.opacity = 0.5;
			GAME_CURSOR.grandparentCheck = testUI;

			if (k.isButtonPressed("right")) gameIndex = scrollIndex(gameIndex, 1, CONFIG.microgames.length);
			else if (k.isButtonPressed("left")) gameIndex = scrollIndex(gameIndex, -1, CONFIG.microgames.length);
			// load microgame assets
			if (k.isButtonPressed("click")) {
				// run the game
				if (loadedMicrogames.includes(CONFIG.microgames[gameIndex])) {
					const game = CONFIG.microgames[gameIndex];

					currentGameAct?.destroy();
					currentGameAct = createGameAct(gameScenery, game, fakeController);
					currentGameAct.root.use(k.layer("2"));

					currentGameAct.bomb.root.pos = currentGameAct.bomb.root.pos.add(0, 100);
					currentGameAct.root.color = getGameColor(currentGameAct.game.bgColor);

					if (fakeController.isHard && currentGameAct.game.hardModeOpt) {
						if (currentGameAct.game.hardModeOpt.bgColor) currentGameAct.root.color = getGameColor(currentGameAct.game.hardModeOpt.bgColor);
					}

					currentGameAct.game.start(currentGameAct.ctx);
					currentGameAct.root.wait(0, () => currentGameAct.engine.pauseEverything(true));
				}
				// load the game assets
				else {
					const game = CONFIG.microgames[gameIndex];
					await new Promise(async (resolve) => {
						k.loadRoot(game.urlPrefix);
						await game.load(buildLoadContext(game));
						resolve(null);
					});
					loadedMicrogames.push(game);
				}
			}
		}
		else {
			overlay.opacity = 0;
			GAME_CURSOR.grandparentCheck = gameScenery.root;
		}
	});
});
