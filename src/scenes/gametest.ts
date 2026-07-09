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

k.scene("gametest", async () => {
	/** Wheter it's zoomed out */
	let zoomedOut = true;
	/** Wheter there's a game added and running (regardless if paused) */
	let isPlaying = false;
	/** Wheter it's loading a game */
	let isLoadingGame = false;

	k.randSeed(Date.now());
	let currentSeed = k.randSeed();

	/** All the microgames sordered in alphabetical order by name */
	const orderedGames = CONFIG.microgames.toSorted((a, b) => a.name.localeCompare(b.name));
	const selectedGame = () => orderedGames[gameIndex];

	/** The index of the currently selected microgame */
	let gameIndex = orderedGames.findIndex((game) => getGameID(game) == CONFIG.DEV_MICROGAME);

	/** All the games loaded right now */
	const loadedMicrogames: Microgame[] = [];
	const isGameLoaded = (game: Microgame) => loadedMicrogames.includes(game);

	/** The controller for the microgames */
	const controller = new MicrogameController();

	// background
	k.add([k.sprite("test-background")]);
	// The root object where uis is added to, has to be created before so it's drawn before gameScenery
	const UI = k.add([]);

	// GAME SCREEN
	/** The gameScenery where the game is added to */
	const gameScenery = createScenery(k.getTreeRoot());
	gameScenery.scale = k.vec2(0.7);
	gameScenery.pos = gameScenery.pos.add(-90, 0);
	gameScenery.gameBox.use(k.outline(20, k.mulfok.VOID_VIOLET));

	/** The act for the game */
	let currentGameAct: GameAct = null;
	const setActPause = (val: boolean) => currentGameAct?.engine?.pauseEverything(val);

	/** Changes the selected game */
	function scrollGames(side: -1 | 1) {
		k.randSeed(currentSeed);
		gameIndex = scrollIndex(gameIndex, side, orderedGames.length);
		if (isGameLoaded(selectedGame())) testGame(selectedGame());
		else currentGameAct?.clear();
		addStatic();
	}

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
			currentGameAct.engine.pauseEverything(true);
		});
	}

	/** Function that runs when you tap "return", toggles pause */
	function togglePause() {
		if (isPlaying) zoomedOut = !zoomedOut;
		setActPause(zoomedOut);
	}

	// #region TOP ICONS
	// masked thing
	const maskedBackground = UI.add([
		k.rect(630, 60, { radius: 10 }),
		k.pos(95, 10),
		k.mask("intersect"),
		{
			arrowOpacity: 1,
		},
	]);

	const opaqueBackground = maskedBackground.add([
		k.rect(630, 60, { radius: 10 }),
		k.color(k.BLACK),
		k.opacity(0.5),
	]);

	const iconCursor = UI.add([
		k.sprite("test-iconcursor"),
		k.pos(),
		k.anchor("center"),
		k.scale(1.1),
	]);

	let indexOfScroll = 0;
	UI.onUpdate(() => {
		indexOfScroll = Math.max(
			0,
			Math.min(gameIndex - 6 + 1, orderedGames.length - 6),
		);

		iconCursor.pos = k.lerp(iconCursor.pos, k.vec2(145 + (gameIndex - indexOfScroll) * 100, 40), 0.5);
	});

	orderedGames.forEach((game, i) => {
		const name = getGameID(game).split(":")[1];

		const gameIcon = maskedBackground.add([
			k.sprite(`icon-${getGameID(game)}`),
			k.pos(k.vec2(50, 30)),
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
			const newPos = k.vec2(k.vec2(50 + (i - indexOfScroll) * 100, 30));
			gameIcon.pos = k.lerp(gameIcon.pos, newPos, 0.5);

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

	for (let i = 0; i < 2; i++) {
		const iconScrollButton = UI.add([
			k.sprite("test-arrow"),
			k.area({ cursor: "" }),
			k.anchor("center"),
			k.pos(50, 40),
			k.scale(),
			k.color(k.mulfok.YELLOW),
		]);

		iconScrollButton.onButtonPress("click", () => {
			if (!iconScrollButton.isHovering()) return;
			k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => iconScrollButton.scale = p, k.easings.easeOutQuint);
			scrollGames(i == 0 ? -1 : 1);
			nameScreen.changeName(selectedGame().name);
		});

		if (i == 1) {
			iconScrollButton.pos = k.vec2(760, 40);
			iconScrollButton.flipX = true;
		}
	}
	// #endregion

	// #region GENERAL UI
	const nameScreen = UI.add([
		k.rect(180, 60, { radius: 5 }),
		k.anchor("center"),
		k.pos(700, 120),
		k.opacity(),
		k.color(k.mulfok.VOID_PURPLE),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			text: "GET",
			_changeId: 0,

			changeName(name: string) {
				const id = ++this._changeId;
				const oldText = this.text;

				oldText.split("").forEach((_, index) => {
					k.wait(0.05 * index, () => {
						if (id !== this._changeId) return;

						this.text = this.text.slice(0, -1);
					});
				});

				k.wait(0.05 * oldText.length, () => {
					if (id !== this._changeId) return;

					name.split("").forEach((char, index) => {
						k.wait(0.05 * index, () => {
							if (id !== this._changeId) return;

							this.text += char;
						});
					});
				});
			},
			add() {
				const text = this.add([
					k.text("", { font: "seven-segment" }),
					k.color(k.mulfok.GREEN),
					k.anchor("center"),
					k.scale(1.75),
				]);

				text.onUpdate(() => {
					text.text = this.text;
				});
			},
		},
	]);

	const speedScreen = UI.add([
		k.rect(180, 50, { radius: 5 }),
		k.anchor("center"),
		k.pos(700, 190),
		k.opacity(),
		k.color(k.mulfok.VOID_PURPLE),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				const text = this.add([
					k.text("STOP", { font: "seven-segment" }),
					k.color(k.mulfok.GREEN),
					k.anchor("center"),
					k.scale(1.1),
				]);

				text.onUpdate(() => {
					text.text = "x" + controller.speed.toFixed(1).toString();
				});
			},
		},
	]);

	for (let i = 0; i < 2; i++) {
		const speedButton = UI.add([
			k.rect(85, 40, { radius: 5 }),
			k.anchor("center"),
			k.pos(650, 250),
			k.opacity(),
			k.area({ cursor: "" }),
			k.scale(),
			k.color(k.mulfok.BLUE),
			k.outline(5, k.mulfok.VOID_VIOLET),
			{
				add() {
					this.add([
						k.sprite("test-arrow", { flipX: i == 1 }),
						k.anchor("center"),
						k.scale(0.6),
					]);
				},
			},
		]);

		if (i == 1) {
			speedButton.pos = k.vec2(745, 250);
		}

		speedButton.onButtonPress("click", () => {
			if (!speedButton.isHovering()) return;
			let oldSpeed = controller.speed;
			if (i == 1) controller.speed = k.clamp(controller.speed + 0.1, 1, 3);
			else controller.speed = k.clamp(controller.speed - 0.1, 1, 3);
			let newSpeed = controller.speed;
			k.randSeed(currentSeed);
			if (newSpeed != oldSpeed) testGame(selectedGame());
			k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => speedButton.scale = p, k.easings.easeOutQuint);
		});
	}

	const hardButton = UI.add([
		k.rect(180, 60, { radius: 5 }),
		k.anchor("center"),
		k.pos(700, 320),
		k.area({ cursor: "" }),
		k.opacity(),
		k.scale(),
		k.color(k.mulfok.RED),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				const text = this.add([
					k.text("HARD?"),
					k.anchor("center"),
					k.scale(0.8, 0.9),
					k.pos(25, 0),
				]);

				this.onDraw(() => {
					k.drawRect({
						pos: k.vec2(-60, 0),
						width: 40,
						height: 40,
						color: k.mulfok.DARK_RED,
						anchor: "center",
						outline: {
							width: 5,
							color: k.mulfok.VOID_VIOLET,
						},
					});

					if (controller.isHard) {
						k.drawSprite({
							pos: k.vec2(-60, 0),
							sprite: "test-checkmark",
							anchor: "center",
							scale: k.vec2(1.1),
						});
					}
				});
			},
		},
	]);
	hardButton.onButtonPress("click", () => {
		if (!hardButton.isHovering()) return;
		controller.isHard = !controller.isHard;
		// k.debug.log("SHOULD START THE SAME GAME WITHOUT CHANGING ANYTHING");
		k.randSeed(currentSeed);
		testGame(selectedGame());
		k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => hardButton.scale = p, k.easings.easeOutQuint);
	});

	// #endregion

	// #region UI NOT LOADED
	const UINotLoaded = UI.add([]);
	const loadButton = UINotLoaded.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 480),
		k.area({ cursor: "" }),
		k.opacity(),
		k.scale(),
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
		k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => loadButton.scale = p, k.easings.easeOutQuint);
		isLoadingGame = true;
		loadButton.area.cursor = null;
		loadButton.opacity = 0.5;
		await loadGame(selectedGame());
		loadButton.opacity = 1;
		loadButton.area.cursor = "";
		isLoadingGame = false;
		testGame(selectedGame());
	});
	// #endregion

	// #region UI NOT PLAYING
	const UINotPlaying = UI.add([]);
	const newButton = UINotPlaying.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 400),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.scale(),
		k.color(k.mulfok.BEAN_GREEN),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("NEW"),
					k.anchor("center"),
					k.scale(0.9, 0.9),
					k.pos(20, 0),
				]);

				this.onDraw(() => {
					k.drawSprite({
						pos: k.vec2(-60, 0),
						sprite: "test-restart",
						anchor: "center",
						scale: k.vec2(0.6),
					});
				});
			},
		},
	]);
	newButton.onButtonPress("click", () => {
		if (!newButton.isHovering()) return;
		// restart should restart the game with the same seed
		currentSeed = k.randSeed(Date.now());
		testGame(selectedGame());
		addStatic();
		k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => newButton.scale = p, k.easings.easeOutQuint);
	});

	const startButton = UINotPlaying.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 480),
		k.area({ cursor: "" }),
		k.opacity(),
		k.outline(),
		k.scale(),
		k.color(k.mulfok.BLUE),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("START"),
					k.anchor("center"),
					k.scale(0.8, 0.9),
					k.pos(25, 0),
				]);

				this.onUpdate(() => {
					if (controller.lastGameResult != undefined) {
						this.opacity = 0.5;
						this.area.cursor = null;
					}
					else {
						this.opacity = 1;
						this.area.cursor = "";
					}
				});

				this.onDraw(() => {
					k.drawSprite({
						pos: k.vec2(-60, 0),
						sprite: "test-arrow",
						anchor: "center",
						scale: k.vec2(0.8),
						flipX: true,
					});
				});
			},
		},
	]);
	startButton.onButtonPress("click", () => {
		if (!startButton.isHovering()) return;
		if (controller.lastGameResult == undefined) {
			setActPause(false);
			zoomedOut = false;
			isPlaying = true;
		}
		k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => startButton.scale = p, k.easings.easeOutQuint);
	});
	// #endregion

	// #region UI PLAYING
	const UIPlaying = UI.add([]);
	const stopButton = UIPlaying.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 400),
		k.area({ cursor: "" }),
		k.opacity(),
		k.scale(),
		k.outline(),
		k.color(k.mulfok.RED),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("STOP"),
					k.anchor("center"),
					k.scale(0.9, 0.9),
					k.pos(20, 0),
				]);

				this.onDraw(() => {
					k.drawRect({
						pos: k.vec2(-60, 0),
						width: 40,
						height: 40,
						outline: { width: 5, color: k.mulfok.VOID_VIOLET },
						anchor: "center",
						scale: k.vec2(0.8),
					});
				});
			},
		},
	]);
	stopButton.onButtonPress("click", () => {
		if (!stopButton.isHovering()) return;
		k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => stopButton.scale = p, k.easings.easeOutQuint);

		currentGameAct?.destroy();
		isPlaying = false;
		testGame(selectedGame());
		addStatic();
	});

	const resumeButton = UIPlaying.add([
		k.rect(180, 60, { radius: 10 }),
		k.anchor("center"),
		k.pos(700, 480),
		k.area({ cursor: "" }),
		k.opacity(),
		k.scale(),
		k.outline(),
		k.color(k.mulfok.BLUE),
		k.outline(5, k.mulfok.VOID_VIOLET),
		{
			add() {
				this.add([
					k.text("RESUME"),
					k.anchor("center"),
					k.scale(0.675, 0.8),
					k.pos(25, 0),
				]);

				this.onDraw(() => {
					k.drawSprite({
						pos: k.vec2(-55, 0),

						sprite: "test-resume",
						anchor: "center",
						scale: k.vec2(0.65),
					});
				});
			},
		},
	]);
	resumeButton.onButtonPress("click", () => {
		if (!resumeButton.isHovering()) return;
		k.tween(k.vec2(0.9), k.vec2(1), 0.35, (p) => resumeButton.scale = p, k.easings.easeOutQuint);
		togglePause();
	});
	// #endregion

	// the wicked
	// #region WICK
	const leftTip = UI.add([
		k.sprite("bomb-cord-tip", { flipX: true }),
		k.pos(0, 510),
	]);

	const rightTip = UI.add([
		k.sprite("bomb-cord-tip"),
		k.pos(740, 510),
		k.color(k.WHITE),
	]);

	const cord = UI.add([
		k.sprite("bomb-cord", { tiled: true, width: 676 }),
		k.pos(leftTip.width, 510),
	]);

	const darkWick = UI.add([
		k.sprite("bomb-cord", { tiled: true, width: 0 }),
		k.pos(rightTip.pos.x + 30, 510),
		k.anchor("topright"),
		k.color(k.mulfok.VOID_VIOLET),
	]);

	const fuse = UI.add([
		k.sprite("bomb-fuse"),
		k.pos(740, 520),
	]);

	const fullTime = UI.add([
		k.text("", { align: "right" }),
		k.pos(675, 525),
		k.scale(0.75),
		k.opacity(0.5),
	]);

	const fuseTime = fuse.add([
		k.text("", { align: "right" }),
		k.pos(-65, 0),
		k.scale(0.75),
	]);

	fuse.onUpdate(() => {
		darkWick.width = 742 - fuse.pos.x;
		let duration = 0;
		let timeLeft = 0;

		if (controller.isHard && selectedGame().hardModeOpt?.duration != undefined) duration = selectedGame().hardModeOpt.duration / controller.speed;
		else duration = selectedGame().duration / controller.speed;

		if (controller.timeLeft) timeLeft = controller.timeLeft;
		else timeLeft = duration;

		fullTime.text = duration.toFixed(1);
		fuseTime.text = timeLeft.toFixed(1);

		fuse.pos = k.lerp(fuse.pos, k.vec2(k.map(timeLeft, 0, duration, 0, 740) + 2, 525), 0.75);
		if (timeLeft / duration < 0.9) rightTip.color = k.mulfok.VOID_VIOLET;
	});

	// #endregion

	// #region GENERAL
	gameScenery.scene.onDraw(() => {
		if (!zoomedOut) return;

		if (!isGameLoaded(selectedGame())) {
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
				text = "LOST";
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
				opacity: 0.5,
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
		GAME_CURSOR.hide = !zoomedOut && selectedGame().hideCursor;

		if (UI.paused) GAME_CURSOR.grandparentCheck = gameScenery.root;
		else GAME_CURSOR.grandparentCheck = UI;

		if (!isGameLoaded(selectedGame())) {
			UIPlaying.hidden = true;
			UIPlaying.paused = true;
			UINotPlaying.hidden = true;
			UINotPlaying.paused = true;

			UINotLoaded.hidden = false;
			UINotLoaded.paused = false;
		}
		else if (isGameLoaded(selectedGame()) && zoomedOut) {
			UINotLoaded.hidden = true;
			UINotLoaded.paused = true;

			if (isPlaying) {
				UINotPlaying.hidden = true;
				UINotPlaying.paused = true;
				UIPlaying.hidden = false;
				UIPlaying.paused = false;
			}
			else {
				UIPlaying.hidden = true;
				UIPlaying.paused = true;
				UINotPlaying.hidden = false;
				UINotPlaying.paused = false;
			}
		}

		// have to do it sepparately because isRunning game pauses UI
		if (k.isButtonPressed("return") && !controller.lastGameResult) togglePause();
		if (zoomedOut && !isPlaying) {
			if (k.isButtonPressed("left")) {
				scrollGames(-1);
				nameScreen.changeName(selectedGame().name);
			}
			else if (k.isButtonPressed("right")) {
				scrollGames(1);
				nameScreen.changeName(selectedGame().name);
			}
		}

		if (zoomedOut) {
			gameScenery.scale = k.lerp(gameScenery.scale, k.vec2(0.7), 0.5);
			gameScenery.pos = k.lerp(gameScenery.pos, k.center().add(-90, 0), 0.5);
		}
		else if (isPlaying) {
			gameScenery.scale = k.lerp(gameScenery.scale, k.vec2(1), 0.5);
			gameScenery.pos = k.lerp(gameScenery.pos, k.center(), 0.5);
		}
	});
	// #endregion

	await loadGame(selectedGame());
	testGame(selectedGame());
	nameScreen.changeName(selectedGame().name);
});
