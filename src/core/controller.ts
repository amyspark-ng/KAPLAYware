import { Microgame } from "./microgame";
import { GameState } from "./state/state";
import { k } from "../kaplay";
import { addBomb, Bomb } from "../objects/gameplay/bomb";
import { Scenery } from "./scenery";
import { Act, createAct } from "./act/act";
import { getGameColor } from "./game_registry";
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

	timeoutKEvent = new k.KEvent();
	finishKEvent = new k.KEvent<["win" | "lose"]>();

	lastGameResult: "win" | "lose" = undefined;
	finished: boolean;
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

	/**
	 * @param passedGames Means the games that the controller was created with
	 */
	constructor(private passedGames: Microgame[] = []) {
		this.microgameHat = [...passedGames];
		this.lives = 4;
	}

	clearFromPrevious() {
		this.timeoutKEvent.clear();
		this.finishKEvent.clear();
		this.finished = false;
		this.lastGameResult = undefined;
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

	// TODO: hardcode according to CONFIG.DEV
	lose() {
		this.progress--;
		this.lives--;
	}

	win() {
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
}
