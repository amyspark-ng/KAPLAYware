import { Color } from "kaplay";
import { buildLoadContext } from "../assets/load_microgames";
import { CONFIG } from "../config";
import { Act, createAct } from "../core/act/act";
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

k.scene("gametest", async () => {
	let zoomedOut = true;
	const orderedGames = CONFIG.microgames.toSorted((a, b) => getGameID(a).localeCompare(getGameID(b)));
	let gameIndex = orderedGames.findIndex((game) => getGameID(game) == CONFIG.DEV_MICROGAME);

	const loadedMicrogames: Microgame[] = [];
	const isGameLoaded = (game: Microgame) => loadedMicrogames.includes(game);

	// has to be created before so it's drawn before gameScenery
	const UI = k.add([]);

	// the scenery in which game and ending screen run
	const gameScenery = createScenery(k.getTreeRoot());
	gameScenery.scale = k.vec2(0.7);
	gameScenery.pos = gameScenery.pos.add(-90, 35);
	const pauseOverlay = gameScenery.scene.add([k.rect(800, 600), k.opacity(0.5), k.color(k.BLACK)]);

	const fakeController = new MicrogameController();
	let currentGameAct: GameAct = null;
	let overlayAct: Act = null;

	let isRunningGame = false;
	let loadingGame = false;

	orderedGames.forEach((game, i) => {
		const name = getGameID(game).split(":")[1];

		const gameIcon = UI.add([
			k.sprite(`icon-${getGameID(game)}`),
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

	function addActWithText(text: string, color: Color) {
		overlayAct?.destroy();
		overlayAct = createAct(gameScenery);
		const ctx = overlayAct.ctx;
		ctx.add([
			ctx.rect(ctx.width(), ctx.height()),
			ctx.color(color),
		]);
		ctx.add([
			ctx.text(text),
			ctx.pos(ctx.center()),
			ctx.anchor("center"),
		]);
	}

	function addStatic() {
		const tvstatic = gameScenery.scene.add([
			k.sprite("trans-static", { anim: "a" }),
			k.z(2),
			k.pos(k.center()),
			k.anchor("center"),
			k.scale(2),
			k.opacity(1),
		]);
		tvstatic.fadeOut(0.25, k.easings.easeOutQuint).onEnd(() => tvstatic.destroy());
	}

	async function loadGame(game: Microgame) {
		await new Promise(async (resolve) => {
			k.loadRoot(game.urlPrefix);
			await game.load(buildLoadContext(game));
			resolve(null);
		});
		loadedMicrogames.push(game);
		addStatic();
	}

	function addGame(game: Microgame) {
		overlayAct?.destroy();
		currentGameAct?.destroy();
		currentGameAct = createGameAct(gameScenery, game, fakeController);
		currentGameAct.root.use(k.layer("2"));

		currentGameAct.bomb.root.pos = currentGameAct.bomb.root.pos.add(0, 100);
		currentGameAct.root.color = getGameColor(currentGameAct.game.bgColor);

		if (fakeController.isHard && currentGameAct.game.hardModeOpt) {
			if (currentGameAct.game.hardModeOpt.bgColor) currentGameAct.root.color = getGameColor(currentGameAct.game.hardModeOpt.bgColor);
		}

		currentGameAct.game.start(currentGameAct.ctx);
		k.wait(0, () => currentGameAct.engine.pauseEverything(true));
	}

	function runGame() {
		isRunningGame = true;
		zoomedOut = false;
		k.wait(0, () => currentGameAct.engine.pauseEverything(false));
	}

	function endGame(result: "win" | "lose") {
		currentGameAct?.destroy();
		zoomedOut = true;
		isRunningGame = false;
		addActWithText(result == "win" ? "YOU WON" : "YOU LOST", result == "win" ? k.mulfok.GREEN : k.mulfok.RED);
	}

	function togglePause() {
		if (isRunningGame) zoomedOut = !zoomedOut;
		currentGameAct.engine.pauseEverything(zoomedOut);
	}

	const UINotLoaded = UI.add([]);
	const loadButton = UINotLoaded.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 510),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.color(k.mulfok.BEAN_GREEN),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("LOAD"),
					k.anchor("center"),
				]);
			},
		},
	]);

	loadButton.onButtonPress("click", async () => {
		if (!loadButton.isHovering()) return;
		if (loadingGame) return;
		loadingGame = true;
		loadButton.area.cursor = null;
		loadButton.opacity = 0.5;
		const selectedGame = orderedGames[gameIndex];
		await loadGame(selectedGame);
		loadButton.opacity = 1;
		loadButton.area.cursor = "";
		loadingGame = false;
		addGame(selectedGame);
	});

	const UINotRunning = UI.add([]);
	const playButton = UINotRunning.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 510),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.color(k.mulfok.GREEN),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("PLAY"),
					k.anchor("center"),
				]);
			},
		},
	]);

	playButton.onButtonPress("click", () => {
		if (!playButton.isHovering()) return;
		const currentGame = orderedGames[gameIndex];
		runGame();
	});

	const UIRunning = UI.add([]);
	const stopButton = UIRunning.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 430),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.color(k.mulfok.RED),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("STOP"),
					k.anchor("center"),
				]);
			},
		},
	]);

	const restartButton = UIRunning.add([
		k.rect(80, 70, { radius: 10 }),
		k.anchor("center"),
		k.pos(650, 510),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.color(k.mulfok.GREEN),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.sprite("test-restart"),
					k.anchor("center"),
					k.scale(0.6),
				]);
			},
		},
	]);

	const resumeButton = UIRunning.add([
		k.rect(80, 70, { radius: 10 }),
		k.anchor("center"),
		k.pos(750, 510),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.color(k.mulfok.BLUE),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.sprite("test-resume"),
					k.anchor("center"),
					k.scale(0.6),
				]);
			},
		},
	]);

	stopButton.onButtonPress("click", () => {
		if (!stopButton.isHovering()) return;
		currentGameAct?.destroy();
		isRunningGame = false;
		addGame(orderedGames[gameIndex]);
		addStatic();
	});

	restartButton.onButtonPress("click", () => {
		if (!restartButton.isHovering()) return;
		addGame(orderedGames[gameIndex]);
		addStatic();
	});

	resumeButton.onButtonPress("click", () => {
		if (!resumeButton.isHovering()) return;
		togglePause();
	});

	fakeController.onFinish((result) => endGame(result));

	k.onUpdate(() => {
		UI.paused = isRunningGame && !zoomedOut;

		const selectedGame = orderedGames[gameIndex];
		if (!isGameLoaded(selectedGame)) {
			UIRunning.hidden = true;
			UIRunning.paused = true;
			UINotRunning.hidden = true;
			UINotRunning.paused = true;

			UINotLoaded.hidden = false;
			UINotLoaded.paused = false;
			GAME_CURSOR.grandparentCheck = UINotLoaded;
		}
		else if (isGameLoaded(selectedGame) && zoomedOut) {
			UINotLoaded.hidden = true;
			UINotLoaded.paused = true;

			if (isRunningGame) {
				UINotRunning.hidden = true;
				UINotRunning.paused = true;
				UIRunning.hidden = false;
				UIRunning.paused = false;
				GAME_CURSOR.grandparentCheck = UIRunning;
			}
			else {
				UIRunning.hidden = true;
				UIRunning.paused = true;
				UINotRunning.hidden = false;
				UINotRunning.paused = false;
				GAME_CURSOR.grandparentCheck = UINotRunning;
			}
		}
		else GAME_CURSOR.grandparentCheck = gameScenery.root;

		// have to do it sepparately because isRunning game pauses UI
		if (k.isButtonPressed("return")) togglePause();
		if (zoomedOut && !isRunningGame) {
			if (k.isButtonPressed("left")) {
				gameIndex = scrollIndex(gameIndex, -1, orderedGames.length);
				if (isGameLoaded(orderedGames[gameIndex])) addGame(orderedGames[gameIndex]);
				else addActWithText("GAME NOT LOADED", k.mulfok.BLACK);
				addStatic();
			}
			else if (k.isButtonPressed("right")) {
				gameIndex = scrollIndex(gameIndex, 1, orderedGames.length);
				if (isGameLoaded(orderedGames[gameIndex])) addGame(orderedGames[gameIndex]);
				else addActWithText("GAME NOT LOADED", k.mulfok.BLACK);
				addStatic();
			}
		}

		if (zoomedOut) {
			gameScenery.scale = k.lerp(gameScenery.scale, k.vec2(0.7), 0.5);
			gameScenery.pos = k.lerp(gameScenery.pos, k.center().add(-90, 35), 0.5);
			pauseOverlay.opacity = k.lerp(pauseOverlay.opacity, 0.5, 0.5);
		}
		else if (isRunningGame) {
			gameScenery.scale = k.lerp(gameScenery.scale, k.vec2(1), 0.5);
			gameScenery.pos = k.lerp(gameScenery.pos, k.center(), 0.5);
			pauseOverlay.opacity = k.lerp(pauseOverlay.opacity, 0, 0.5);
		}
	});

	await loadGame(orderedGames[gameIndex]);
	addGame(orderedGames[gameIndex]);
	togglePause();
});
