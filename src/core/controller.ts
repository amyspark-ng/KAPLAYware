import { Microgame } from "./microgame";
import { GameState } from "./state/state";
import { k } from "../kaplay";
import { addBomb, Bomb } from "../objects/gameplay/bomb";
import { GameScenery } from "./scenery";
import { createAct, GameAct } from "./act/game_act";
import { getGameColor } from "./game_registry";
import { onPauseChange } from "../scenes/game";
import { buildGameContext } from "./context/game";

/**
 * In charge of the gameplay aspect of the game
 *
 * Keeps track of things outside of the game
 *
 * MicrogameContext depends on this, so games also depend on it
 */
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
	/** The next time you'll speed up */
	nextSpeedUpScore: number = k.randi(5, 7);

	currentBomb: Bomb = null;

	/**
	 * @param passedGames Means the games that the controller was created with
	 */
	constructor(private scenery: GameScenery, private passedGames: Microgame[] = []) {
		this.microgameHat = [...passedGames];
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
		if (this.microgameHat.length == 0) this.microgameHat = [...this.passedGames];
		const game = k.choose(this.microgameHat);
		this.microgameHat.splice(this.microgameHat.indexOf(game), 1);
		return game;
	}

	onTimeout(action: () => void) {
		return this.timeoutKEvent.add(action);
	}

	onFinish(action: (result: "win" | "lose") => void) {
		return this.finishKEvent.add(action);
	}

	lose() {
		this.currentAct?.destroy();
		this.progress--;
		this.lives--;
	}

	win() {
		this.currentAct.engine.pauseEverything(true);
		this.score++;
		this.progress++;
	}

	speedUp() {
		this.nextSpeedUpScore += 2;
		if (this.speed < 1.3) {
			this.speed += k.rand(0.015, 0.02);
		}
		else {
			this.speed += k.rand(0.0025, 0.005);
		}
	}

	/** Only creates the act where the game is gonna run and pauses it for future running */
	createCurrentAct(game: Microgame = this.currentGame): GameAct {
		this.currentGame = game;
		this.currentAct = createAct(this.scenery);
		this.currentAct.root.use(k.layer("2"));
		// TODO: the moon problem in DONT is back, check how to fix this
		// Everything from the game must be ran first and then paused
		// runs one single frame so objects and stuff from updates can be set into place
		this.currentAct.engine.pauseEverything(true);
		this.currentAct.root.wait(0, () => this.currentAct.engine.pauseEverything(false));
		this.currentAct.engine.pauseEverything(true);

		// the other stuff
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
			this.currentAct.engine.pauseEverything(paused);
		});

		this.currentGame.start(gameCtx);

		return this.currentAct;
	}

	/** Runs the current act and returns the promise for the win/lose result */
	async runCurrentAct(): Promise<"win" | "lose"> {
		return new Promise((resolve) => {
			this.currentAct.engine.pauseEverything(false);
			this.onFinish((result) => {
				resolve(result);
			});
		});
	}
}
