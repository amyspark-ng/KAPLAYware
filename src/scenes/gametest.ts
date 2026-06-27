import { buildLoadContext } from "../assets/load_microgames";
import { CONFIG } from "../config";
import { GameAct } from "../core/act/game_act";
import { MicrogameController } from "../core/controller";
import { getGameID } from "../core/game_registry";
import { Microgame } from "../core/microgame";
import { createScenery } from "../core/scenery";
import { k } from "../kaplay";
import { GAME_CURSOR } from "../objects/cursor";
import { scrollIndex } from "../utils";
import { addTimeSetup, prepGame } from "../core/game_actions";

// TODO: when there's more microgames add a way to scroll through them
// TODO: add game speed thing
// TODO: add hard mode gamecheck
// make nicer to look at

k.scene("gametest", async () => {
	/** Wheter it's zoomed out */
	let zoomedOut = true;
	/** Wheter there's a game added and running (regardless if paused) */
	let isPlaying = false;
	/** Wheter it's loading a game */
	let isLoadingGame = false;

	/** All the microgames sordered in alphabetical order by name */
	const orderedGames = CONFIG.microgames.toSorted((a, b) => a.name.localeCompare(b.name));
	const currentGame = () => orderedGames[gameIndex];

	/** The index of the currently selected microgame */
	let gameIndex = orderedGames.findIndex((game) => getGameID(game) == CONFIG.DEV_MICROGAME);

	/** All the games loaded right now */
	const loadedMicrogames: Microgame[] = [];
	const isGameLoaded = (game: Microgame) => loadedMicrogames.includes(game);

	/** The controller for the microgames */
	const controller = new MicrogameController();

	// The root object where uis is added to, has to be created before so it's drawn before gameScenery
	const UI = k.add([]);

	// GAME SCREEN
	/** The gameScenery where the game is added to */
	const gameScenery = createScenery(k.getTreeRoot());
	gameScenery.scale = k.vec2(0.7);
	gameScenery.pos = gameScenery.pos.add(-90, 35);

	/** The act for the game */
	let currentGameAct: GameAct = null;
	const setActPause = (val: boolean) => currentGameAct?.engine?.pauseEverything(val);

	/** Adds a simple static effect to the gameScenery */
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
		return tvstatic;
	}

	/** Loads a microgame */
	async function loadGame(game: Microgame) {
		await new Promise(async (resolve) => {
			k.loadRoot(game.urlPrefix);
			await game.load(buildLoadContext(game));
			resolve(null);
		});
		loadedMicrogames.push(game);
		addStatic();
	}

	function testGame(game: Microgame) {
		isPlaying = false;
		addStatic();
		currentGameAct?.clear();
		currentGameAct = prepGame(gameScenery, controller, game);
		addTimeSetup(controller, currentGameAct);
		controller.onFinish(() => {
			zoomedOut = true;
			isPlaying = false;
			// have to do this because prepGame clears it and i need it
			let oldWinLoseState = controller.lastGameResult;
			// can't call testGame because recursive reasons for some reason
			addStatic();
			currentGameAct.clear();
			currentGameAct = prepGame(gameScenery, controller, game);
			addTimeSetup(controller, currentGameAct);
			controller.lastGameResult = oldWinLoseState;
		});
	}

	/** Function that runs when you tap "return", toggles pause */
	function togglePause() {
		if (isPlaying) zoomedOut = !zoomedOut;
		setActPause(zoomedOut);
	}

	// #region TOP ICONS
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
	// #endregion

	// #region UI NOT LOADED
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
		if (isLoadingGame) return;
		isLoadingGame = true;
		loadButton.area.cursor = null;
		loadButton.opacity = 0.5;
		await loadGame(currentGame());
		loadButton.opacity = 1;
		loadButton.area.cursor = "";
		isLoadingGame = false;
		testGame(currentGame());
	});
	// #endregion

	// #region UI NOT PLAYING
	const UINotPlaying = UI.add([]);
	const playButton = UINotPlaying.add([
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
		setActPause(false);
		zoomedOut = false;
		isPlaying = true;
	});
	// #endregion

	// #region UI PLAYING
	const UIPlaying = UI.add([]);
	const stopButton = UIPlaying.add([
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

	const restartButton = UIPlaying.add([
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

	const resumeButton = UIPlaying.add([
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
		isPlaying = false;
		testGame(currentGame());
		addStatic();
	});

	restartButton.onButtonPress("click", () => {
		if (!restartButton.isHovering()) return;
		testGame(currentGame());
		addStatic();
		isPlaying = true;
	});

	resumeButton.onButtonPress("click", () => {
		if (!resumeButton.isHovering()) return;
		togglePause();
	});
	// #endregion

	gameScenery.scene.onDraw(() => {
		if (!zoomedOut) return;

		if (!isGameLoaded(currentGame())) {
			k.drawRect({
				width: k.width(),
				height: k.height(),
				color: k.BLACK,
			});

			k.drawText({
				text: "GAME NOT LOADED",
				pos: k.center(),
				anchor: "center",
			});
		}
		else {
			let bgColor = k.rgb();
			let text = "";
			if (controller.lastGameResult == "win") {
				bgColor = k.mulfok.GREEN;
				text = "WON";
			}
			else if (controller.lastGameResult == "lose") {
				bgColor = k.mulfok.RED;
				text = "LOSE";
			}
			else {
				bgColor = k.BLACK;
				if (isPlaying) text = "PAUSED";
				else text = "READY";
			}

			k.drawRect({
				width: k.width(),
				height: k.height(),
				color: bgColor,
				opacity: controller.lastGameResult ? 1 : 0.5,
			});

			k.drawText({
				text: text,
				pos: k.center(),
				anchor: "center",
			});
		}
	});

	k.onUpdate(() => {
		UI.paused = isPlaying && !zoomedOut;

		if (!isGameLoaded(currentGame())) {
			UIPlaying.hidden = true;
			UIPlaying.paused = true;
			UINotPlaying.hidden = true;
			UINotPlaying.paused = true;

			UINotLoaded.hidden = false;
			UINotLoaded.paused = false;
			GAME_CURSOR.grandparentCheck = UINotLoaded;
		}
		else if (isGameLoaded(currentGame()) && zoomedOut) {
			UINotLoaded.hidden = true;
			UINotLoaded.paused = true;

			if (isPlaying) {
				UINotPlaying.hidden = true;
				UINotPlaying.paused = true;
				UIPlaying.hidden = false;
				UIPlaying.paused = false;
				GAME_CURSOR.grandparentCheck = UIPlaying;
			}
			else {
				UIPlaying.hidden = true;
				UIPlaying.paused = true;
				UINotPlaying.hidden = false;
				UINotPlaying.paused = false;
				GAME_CURSOR.grandparentCheck = UINotPlaying;
			}
		}
		else GAME_CURSOR.grandparentCheck = gameScenery.root;

		// have to do it sepparately because isRunning game pauses UI
		if (k.isButtonPressed("return")) togglePause();
		if (zoomedOut && !isPlaying) {
			if (k.isButtonPressed("left")) {
				gameIndex = scrollIndex(gameIndex, -1, orderedGames.length);
				if (isGameLoaded(currentGame())) testGame(currentGame());
				else currentGameAct?.clear();
				addStatic();
			}
			else if (k.isButtonPressed("right")) {
				gameIndex = scrollIndex(gameIndex, 1, orderedGames.length);
				if (isGameLoaded(currentGame())) testGame(currentGame());
				else currentGameAct?.clear();
				addStatic();
			}
		}

		if (zoomedOut) {
			gameScenery.scale = k.lerp(gameScenery.scale, k.vec2(0.7), 0.5);
			gameScenery.pos = k.lerp(gameScenery.pos, k.center().add(-90, 35), 0.5);
		}
		else if (isPlaying) {
			gameScenery.scale = k.lerp(gameScenery.scale, k.vec2(1), 0.5);
			gameScenery.pos = k.lerp(gameScenery.pos, k.center(), 0.5);
		}
	});

	await loadGame(currentGame());
	testGame(currentGame());
});
