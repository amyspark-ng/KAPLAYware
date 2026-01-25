import { k } from "../../../kaplay";
import { buildGameContext, MicrogameContext } from "../context/game";
import { Scenery } from "./scenery";
import { Microgame } from "./microgame";
import { SandboxInstance } from "./instance/instance";
import { onPauseChange } from "../game";
import { GameState } from "../state/state";
import { addBomb, Bomb } from "../elements/bomb";
import { getGameColor } from "../../../registry";

// in charge of the flow and loop of the microgames
export class MicrogameController {
	state: GameState = GameState.Idle;
	currentInstance: SandboxInstance = null;

	timeoutKEvent = new k.KEvent();
	finishKEvent = new k.KEvent<["win" | "lose"]>();

	gameResult: "win" | "lose" = undefined;
	finished: boolean;
	currentGame: Microgame;
	score: number = 0;
	timeLeft: number;
	speed: number = 1;
	lives: number = 4;
	isHard: boolean = true;
	microgameHat: Microgame[] = [];

	// TODO: fix bomb
	currentBomb: Bomb = null;

	get shouldSpeedUp() {
		return false;
	}

	/**
	 * @param passedGames Means the games that the controller was created with
	 */
	constructor(private scenery: Scenery, private passedGames: Microgame[] = []) {
		this.microgameHat = passedGames;
		this.speed = 1;
		this.lives = 4;
	}

	prepareForGame() {
		this.timeoutKEvent.clear();
		this.finishKEvent.clear();
		this.finished = false;
		this.currentInstance?.root.destroy();
		this.currentBomb?.destroy();
		this.gameResult = undefined;

		// get game
		this.currentGame = this.getGameFromHat();
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

	async runGame(game: Microgame): Promise<"win" | "lose"> {
		return new Promise((resolve) => {
			this.currentGame = game;
			this.currentInstance = new SandboxInstance(this.scenery);
			this.currentBomb = null;
			const ctx = buildGameContext(this.currentInstance, this);

			if (this.isHard) {
				if (this.currentGame.hardMode.bgColor) this.currentInstance.root.color = getGameColor(this.currentGame.hardMode.bgColor);
				else this.currentInstance.root.color = getGameColor(this.currentGame.bgColor);
			}
			else this.currentInstance.root.color = getGameColor(this.currentGame.bgColor);

			this.timeLeft = game.duration;
			let timeOver = false;

			ctx.add([]).onUpdate(() => {
				if (this.finished) return;

				if (this.timeLeft > 0) this.timeLeft -= k.dt();
				if (this.timeLeft <= 0 && !timeOver) {
					this.timeoutKEvent.trigger();
					timeOver = true;
					// if (!this.currentBomb?.hasExploded && !this.currentBomb.conductor.paused) {
					// TODO: is it weird the bomb has to be exploded separately to the lit function?
					// this.currentBomb.explode();
					// }
				}

				// TODO: figure out bomb workings
				const beatInterval = 60 / (140 * this.speed);
				if (this.timeLeft <= beatInterval * 4 && this.currentBomb == null) {
					if (this.gameResult == "win") return;
					this.currentBomb = addBomb(this.currentInstance);
					this.currentBomb.lit(140 * this.speed);
				}
			});

			onPauseChange((paused) => {
				if (this.state != GameState.Playing) return;
				this.currentInstance.soundsPaused = paused;
				this.currentInstance.root.paused = paused;
			});

			game.start(ctx, 1, 1);

			this.onFinish((result) => {
				resolve(result);
			});
		});
	}
}
