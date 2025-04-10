import k from "../engine";
import { AudioPlay, GameObj, KEventController, PosComp, RotateComp, ScaleComp, TimerController } from "kaplay";
import cursor from "../plugins/cursor";
import { gameHidesMouse, getGameID, getGameInput } from "./utils";
import { runTransition, TransitionState } from "./transitions";
import { KAPLAYwareOpts, Minigame } from "./types";
import games from "./games";
import { createGameCtx, createPauseCtx, MinigameCtx, PauseCtx } from "./context";
import { WareBomb } from "../plugins/wareobjects";

export function createWareApp() {
	const wareApp = {
		/** Main object, if you want to pause every object, pause this */
		WareScene: k.add([]),
		/** The parent of the camera, gets its position offsetted for shakes */
		shakeCamera: null as GameObj<PosComp>,
		/** The camera object, modify its scale or angle to simulate camera */
		camera: null as GameObj<PosComp | ScaleComp | RotateComp | { shake: number; }>,
		/** The container for minigames, if you want to pause the minigame you should pause this */
		gameBox: null as GameObj<PosComp>,
		wareCtx: null as ReturnType<typeof kaplayware>,
		/** Wheter the current minigame should be running (will be false when the transition hasn't finished) */
		gameRunning: false,
		/** Wheter the user has paused */
		gamePaused: false,
		inputEnabled: false,
		// TODO: Don't pause draw events, always let them run but still store them so they can be cancelled when the minigame ends
		drawEvents: [] as KEventController[],
		generalEvents: [] as KEventController[],
		inputEvents: [] as KEventController[],
		timerEvents: [] as TimerController[],
		sounds: [] as AudioPlay[],
		queuedSounds: [] as AudioPlay[],
		/** When the game is paused, all the sounds currently not paused will be sent here */
		pausedSounds: [] as AudioPlay[],
		canPlaySounds: false,
		onTimeOutEvents: new k.KEvent(),
		currentColor: k.rgb(),
		currentScene: null as GameObj,
		pausableCtx: null as PauseCtx,
		pausableTimers: [] as TimerController[],
		pausableSounds: [] as AudioPlay[],
		currentContext: null as MinigameCtx,
		// bomb
		timeRunning: false, // will turn true when transition is over (not same as gameRunning)
		currentBomb: null as WareBomb,
		conductor: k.conductor(140),
		minigameHistory: [] as string[],
		winState: undefined as boolean | undefined,

		addGeneralEvent(ev: KEventController) {
			this.generalEvents.push(ev);
			return ev;
		},
		clearGeneralEvents() {
			for (let i = this.generalEvents.length - 1; i >= 0; i--) {
				this.generalEvents[i].cancel();
				this.generalEvents.pop();
			}
		},
		addDrawEvent(ev: KEventController) {
			this.drawEvents.push(ev);
			return ev;
		},
		clearDrawEvents() {
			for (let i = this.drawEvents.length - 1; i >= 0; i--) {
				this.drawEvents[i].cancel();
				this.drawEvents.pop();
			}
		},
		addInput(ev: KEventController) {
			this.inputEvents.push(ev);
			return ev;
		},
		clearInput() {
			for (let i = this.inputEvents.length - 1; i >= 0; i--) {
				this.inputEvents[i].cancel();
				this.inputEvents.pop();
			}
		},
		addTimer(ev: TimerController) {
			this.timerEvents.push(ev);
			return ev;
		},
		clearTimers() {
			for (let i = this.timerEvents.length - 1; i >= 0; i--) {
				this.timerEvents[i].cancel();
				this.timerEvents.pop();
			}
		},
		addSound(sound: AudioPlay) {
			this.sounds.push(sound);
			return sound;
		},
		clearSounds() {
			for (let i = this.sounds.length - 1; i >= 0; i--) {
				this.sounds[i].stop();
				this.sounds.pop();
			}

			for (let i = this.queuedSounds.length - 1; i >= 0; i--) {
				this.queuedSounds[i].stop();
				this.queuedSounds.pop();
			}

			for (let i = this.pausedSounds.length - 1; i >= 0; i--) {
				this.pausedSounds[i].stop();
				this.pausedSounds.pop();
			}
		},
	};

	wareApp.shakeCamera = wareApp.WareScene.add([k.pos()]);
	wareApp.camera = wareApp.shakeCamera.add([
		k.pos(k.center()),
		k.anchor("center"),
		k.scale(),
		k.rotate(),
		k.opacity(0),
		{
			shake: 0,
		},
	]);
	wareApp.gameBox = wareApp.camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);

	return wareApp;
}

/** Object that holds some a lot of managers for the KAPLAYware engine */
export type WareApp = ReturnType<typeof createWareApp>;

export default function kaplayware(opts: KAPLAYwareOpts = {}) {
	const DEFAULT_DURATION = 4;
	const SPEED_LIMIT = 1.64;

	opts = opts ?? {};
	opts.games = opts.games ?? games;
	opts.debug = opts.debug ?? false;
	opts.inOrder = opts.inOrder ?? false;

	const wareApp = createWareApp();
	wareApp.pausableCtx = createPauseCtx(wareApp);

	// debug variables
	let skipMinigame = false;
	let forceSpeed = false;
	let restartMinigame = false;
	let overrideDifficulty = null as 1 | 2 | 3;

	const shakeCamera = wareApp.shakeCamera;
	const camera = wareApp.camera;

	camera.onUpdate(() => {
		camera.shake = k.lerp(camera.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(camera.shake);
		shakeCamera.pos = k.vec2().add(posShake);
	});

	const gameBox = wareApp.gameBox;

	const wareCtx = {
		score: 1, // will transition from 0 to 1 on first prep
		lives: 4,
		difficulty: 1 as 1 | 2 | 3,
		speed: 1,
		time: 0,
		/** The amount of times the game has sped up */
		timesSpeed: 0,
		curGame: null as Minigame,
		set paused(val: boolean) {
			wareApp.gamePaused = val;
			if (val) {
				wareApp.sounds.forEach((sound) => {
					if (!sound.paused) wareApp.pausedSounds.push(sound);
				});
			}
			else {
				wareApp.pausedSounds.forEach((sound, index) => {
					wareApp.pausedSounds.splice(index, 1);
					sound.paused = false;
				});
			}
		},

		get paused() {
			return wareApp.gamePaused;
		},

		speedUp() {
			this.speed += this.speed * 0.07;
			this.speed = k.clamp(this.speed, 0, SPEED_LIMIT);
		},

		/** 1. Clears every previous object
		 * 2. Adds the minigame scene, and the new game objects
		 * 3. Starts counting the time
		 *
		 * Also manages the bomb and the unpausing the queued sounds,
		 */
		runGame(minigame: Minigame) {
			// OBJECT STUFF
			gameBox.removeAll();

			wareApp.currentContext = createGameCtx(wareApp, minigame);
			const gDuration = typeof minigame.duration == "number" ? minigame.duration : minigame.duration(wareApp.currentContext);
			const durationEnabled = gDuration != undefined;
			wareCtx.time = durationEnabled ? (gDuration / wareCtx.speed) : 1;
			wareApp.currentContext.timeLeft = wareCtx.time;
			wareApp.currentColor = typeof minigame.rgb == "function" ? minigame.rgb(wareApp.currentContext) : "r" in minigame.rgb ? minigame.rgb : k.Color.fromArray(minigame.rgb);
			wareApp.currentScene?.destroy();
			wareApp.currentScene = gameBox.add([k.rect(0, 0), k.area()]); // TODO: When area collisions are fixed remove this area()
			wareApp.gameRunning = false; // will be set to true onTransitionEnd (in nextGame())
			wareApp.timeRunning = false;
			wareApp.canPlaySounds = false;
			wareApp.currentBomb?.destroy();
			wareApp.currentBomb = null;
			wareCtx.curGame = minigame;
			minigame.start(wareApp.currentContext);

			gameBox.onUpdate(() => {
				if (!wareApp.gameRunning) return;

				if (!wareApp.canPlaySounds) {
					wareApp.canPlaySounds = true;
					wareApp.queuedSounds.forEach((sound) => sound.paused = false);
				}

				if (!wareApp.timeRunning) return;
				if (!durationEnabled) return;

				if (wareCtx.time > 0) wareCtx.time -= k.dt();
				wareCtx.time = k.clamp(wareCtx.time, 0, 20);
				wareApp.currentContext.timeLeft = wareCtx.time;
				if (wareCtx.time <= 0 && wareApp.timeRunning) {
					wareApp.timeRunning = false;
					wareApp.onTimeOutEvents.trigger();
					if (!wareApp.currentBomb.hasExploded) wareApp.currentBomb.explode();
				}

				/** When there's 4 beats left */
				if (wareCtx.time <= wareApp.conductor.beatInterval * 4 && !wareApp.currentBomb) {
					wareApp.currentBomb = k.addBomb(wareApp);
					wareApp.currentBomb.parent = gameBox;
					wareApp.currentBomb.lit(wareApp.conductor.bpm);
				}
			});

			wareApp.onTimeOutEvents.add(() => {
				wareApp.inputEnabled = false;
			});
		},
		/**
		 * 1. Manages the difficulty change and the speed up change
		 * 2. Gets an available minigame based on the input
		 * 3. Runs `runGame()`
		 *
		 * MOST IMPORTANTLY!! Manages the transitions and the prompt (and input prompt) adding
		 */
		nextGame() {
			if (wareCtx.score < 10) wareCtx.difficulty = 1;
			else if (wareCtx.score >= 10 && wareCtx.score < 20) wareCtx.difficulty = 2;
			else if (wareCtx.score >= 20) wareCtx.difficulty = 3;
			wareApp.gameRunning = false;

			let games = [...opts.games];

			if (overrideDifficulty) wareCtx.difficulty = overrideDifficulty;

			// TODO: Decide the difficulty based on games played, loop it back to 1 when games played is divisible by 30 (i think)
			// TODO: This also implies doing the boss system, make the boss minigame (the one with the giant squid)

			const shouldSpeedUp = () => {
				// There's a chance it might speed up on 3 or 6, else speed on 5
				// TODO: make this more random and fun
				return (forceSpeed || (wareCtx.score + 1) % 5 == 0) && wareCtx.speed <= SPEED_LIMIT;
			};

			const copyOfWinState = wareApp.winState; // when isGameOver() is called winState will be undefined because it was resetted, when the order of this is reversed, it will be fixed
			const isGameOver = () => copyOfWinState == false && wareCtx.lives == 0;

			// remove the ones that don't match the input
			games = games.filter((game) => {
				if (!opts.input) return true;
				else return getGameInput(game) == opts.input;
			});

			// remove the ones that don't match the difficulty
			games = games.filter((game) => {
				if (!game.difficulty) return true;
				else if (game.difficulty != wareCtx.difficulty) {
					return false;
				}
			});

			// now remove the previous one so we can get a new one
			games = games.filter((game) => {
				if (wareApp.minigameHistory.length == 0 || games.length == 1) return true;
				else if (restartMinigame && !skipMinigame) return game == wareCtx.curGame;
				else {
					const previousPreviousID = wareApp.minigameHistory[wareCtx.score - 3];
					const previousPreviousGame = games.find((game) => getGameID(game) == previousPreviousID);
					if (previousPreviousGame) return game != wareCtx.curGame && game != previousPreviousGame;
					else return game != wareCtx.curGame;
				}
			});

			const choosenGame = opts.inOrder ? games[wareCtx.score % games.length] : k.choose(games);

			let transitionStates: TransitionState[] = ["prep"];
			if (wareApp.winState != undefined) transitionStates.splice(0, 0, wareApp.winState == true ? "win" : "lose");
			if (shouldSpeedUp()) transitionStates.splice(1, 0, "speed");
			if (isGameOver()) transitionStates = ["lose"];

			wareApp.minigameHistory[wareCtx.score - 1] = getGameID(choosenGame);
			wareApp.winState = undefined;
			restartMinigame = false;
			skipMinigame = false;

			cursor.visible = !gameHidesMouse(choosenGame);

			// ### transition coolness ##
			// sends prep, if shouldSpeedUp is false and winState is undefinied, then it will only run prep
			const transition = runTransition(wareApp, transitionStates);
			let inputPrompt: ReturnType<typeof k.addInputPrompt> = null;
			let prompt: ReturnType<typeof k.addPrompt> = null;

			transition.onInputPromptTime(() => inputPrompt = k.addInputPrompt(wareApp, getGameInput(choosenGame)));

			transition.onPromptTime(() => {
				inputPrompt.end();
				if (typeof choosenGame.prompt == "string") prompt = k.addPrompt(wareApp, choosenGame.prompt);
				else {
					prompt = k.addPrompt(wareApp, "");
					choosenGame.prompt(wareApp.currentContext, prompt);
				}
				prompt.parent = wareApp.WareScene;

				wareApp.pausableCtx.wait(0.15 / wareCtx.speed, () => {
					cursor.visible = gameHidesMouse(choosenGame);
					prompt.end();
				});
			});

			transition.onStateStart((state) => {
				if (state == "prep") {
					wareCtx.runGame(choosenGame);
				}
				else if (state == "speed") {
					if (forceSpeed == true) forceSpeed = false;
					wareCtx.timesSpeed++;
					wareCtx.speedUp();
				}
			});

			transition.onStateEnd((state) => {
				if (state == "lose") {
					if (!isGameOver()) return;
					wareApp.pausableCtx.play("gameOverJingle").onEnd(() => {
						k.go("gameover", wareCtx.score);
					});
					k.addPrompt(wareApp, "GAME OVER");
				}
			});

			transition.onTransitionEnd(() => {
				if (!isGameOver()) transition.destroy(); // don't remove it on game over, serves as background
				wareApp.gameRunning = true;
				wareApp.timeRunning = true;
				wareApp.inputEnabled = true;
			});
		},
	};

	wareApp.wareCtx = wareCtx;

	k.watch(wareCtx, "time", "Time left");
	k.watch(wareCtx, "score", "Score");
	k.watch(wareCtx, "lives", "Lives");
	k.watch(wareCtx, "difficulty", "Difficulty");
	k.watch(wareCtx, "speed", "Speed");
	k.watch(wareApp, "inputEnabled", "Input enabled");

	for (const game of opts.games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.rgb = game.rgb ?? [255, 255, 255];
		game.input = game.input ?? "keys";
		if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
	}

	k.onUpdate(() => {
		wareApp.WareScene.paused = wareApp.gamePaused;
		cursor.canPoint = wareApp.gameRunning;
		wareApp.conductor.bpm = 140 * wareCtx.speed;
		wareApp.conductor.paused = wareApp.gamePaused;
		if (wareApp.currentScene) wareApp.currentScene.paused = !wareApp.gameRunning;

		wareApp.inputEvents.forEach((ev) => ev.paused = !wareApp.inputEnabled || !wareApp.gameRunning);
		wareApp.timerEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.generalEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.pausedSounds.forEach((sound) => sound.paused = true);
		wareApp.pausableSounds.forEach((sound) => sound.paused = wareApp.gamePaused);
		wareApp.pausableTimers.forEach((timer) => timer.paused = wareApp.gamePaused);

		if (opts.debug) {
			if (k.isKeyPressed("q")) {
				restartMinigame = true;
				if (k.isKeyDown("shift")) {
					skipMinigame = true;
					k.debug.log("SKIPPED: " + getGameID(wareCtx.curGame));
				}
				else k.debug.log("RESTARTED: " + getGameID(wareCtx.curGame));
			}

			if (k.isKeyDown("shift") && k.isKeyPressed("w")) {
				restartMinigame = true;
				forceSpeed = true;
				k.debug.log("RESTARTED + SPEED UP: " + getGameID(wareCtx.curGame));
			}

			if (k.isKeyPressed("1")) {
				overrideDifficulty = 1;
				restartMinigame = true;
				k.debug.log("NEW DIFFICULTY: " + overrideDifficulty);
			}
			else if (k.isKeyPressed("2")) {
				overrideDifficulty = 2;
				restartMinigame = true;
				k.debug.log("NEW DIFFICULTY: " + overrideDifficulty);
			}
			else if (k.isKeyPressed("3")) {
				overrideDifficulty = 3;
				restartMinigame = true;
				k.debug.log("NEW DIFFICULTY: " + overrideDifficulty);
			}
		}
	});

	wareApp.WareScene.onDraw(() => {
		// draws the background
		k.drawRect({
			width: k.width(),
			height: k.height(),
			fixed: true,
			color: wareApp.currentColor,
		});
	});

	return wareCtx;
}
