import { Microgame } from "./microgame";
import { GameState } from "./state/state";
import { k } from "../kaplay";
import { addBomb, Bomb } from "../objects/gameplay/bomb";
import { GameScenery } from "./scenery";
import { createAct, GameAct } from "./act/game_act";
import { getGameColor } from "./game_registry";
import { buildGameContext } from "./context/context";
import { onPauseChange } from "../scenes/game";

// in charge of the flow and loop of the microgames
export class MicrogameController {
	state: GameState = GameState.Idle;
	currentAct: GameAct = null;

	timeoutKEvent = new k.KEvent();
	finishKEvent = new k.KEvent<["win" | "lose"]>();

	gameResult: "win" | "lose" = undefined;
	finished: boolean;
	currentGame: Microgame;
	/** How many times have the hearts turned, doesn't get reduced when you lose unlike progress */
	heartTurns: number = 0;
	/** How many times have you progressed UP until boss */
	progress: number = 0;
	score: number = 0;
	timeLeft: number;
	speed: number = 1;
	lives: number = 4;
	isHard: boolean = false;
	microgameHat: Microgame[] = [];
	turnsWithoutLosing: number = 0;

	currentBomb: Bomb = null;

	get shouldSpeedUp() {
		return false; // MAX 1.3
	}

	/**
	 * @param passedGames Means the games that the controller was created with
	 */
	constructor(private scenery: GameScenery, private passedGames: Microgame[] = []) {
		this.microgameHat = passedGames;
		this.lives = 4;
	}

	removePreviousGame() {
		this.timeoutKEvent.clear();
		this.finishKEvent.clear();
		this.finished = false;
		this.currentAct?.destroy();
		this.currentBomb?.destroy();
		this.gameResult = undefined;
	}

	getGameFromHat() {
		if (this.microgameHat.length == 0) this.microgameHat = this.passedGames;
		const game = k.choose(this.microgameHat);
		// TODO: figure out why not working
		// this.microgameHat.splice(this.microgameHat.indexOf(game), 1);
		return game;
	}

	onTimeout(action: () => void) {
		return this.timeoutKEvent.add(action);
	}

	onFinish(action: (result: "win" | "lose") => void) {
		return this.finishKEvent.add(action);
	}

	/** Only creates the act where the game is gonna run and pauses it for future running */
	createCurrentAct(game: Microgame = this.currentGame): GameAct {
		this.currentGame = game;
		this.currentAct = createAct(this.scenery);
		this.currentAct.root.use(k.layer("2"));
		this.currentAct.engine.pauseEverything(true);
		this.currentBomb = null;
		const gameCtx = buildGameContext(this.currentAct, this);

		this.currentAct.root.color = getGameColor(this.currentGame.bgColor);
		this.timeLeft = this.currentGame.duration / this.speed;

		if (this.isHard && this.currentGame.hardModeOpt) {
			if (this.currentGame.hardModeOpt.bgColor) this.currentAct.root.color = getGameColor(this.currentGame.hardModeOpt.bgColor);
			if (this.currentGame.hardModeOpt.duration) this.timeLeft = this.currentGame.hardModeOpt.duration / gameCtx.speed;
			// Prompt not because that's created at PREP and not here
		}

		let timeOver = false;

		gameCtx.add([]).onUpdate(() => {
			if (this.finished) return;

			if (this.timeLeft > 0) {
				this.timeLeft -= k.dt();
			}

			if (this.timeLeft <= 0 && !timeOver) {
				this.timeoutKEvent.trigger();
				timeOver = true;
			}

			// if already won don't add the bomb
			if (this.gameResult != "win") {
				// 140 IT'S THE HARDCODED BPM
				// TODO: make it more consistent with the timing of the game
				const beatInterval = 60 / (140 * this.speed);
				if (this.timeLeft <= beatInterval * 4 && this.currentBomb == null) {
					this.currentBomb = addBomb(this.currentAct);
					this.currentBomb.lit(140 * this.speed);
				}
			}
		});

		onPauseChange((paused) => {
			if (this.state != GameState.Playing) return;
			this.currentAct.engine.setSoundsPaused(paused);
			this.currentAct.root.paused = paused;
		});

		this.currentGame.start(gameCtx);

		return this.currentAct;
	}

	/** Runs the current act and returns the promised win/lose result */
	async runCurrentAct(): Promise<"win" | "lose"> {
		return new Promise((resolve) => {
			this.currentAct.engine.pauseEverything(false);
			this.onFinish((result) => {
				resolve(result);
			});
		});
	}
}
