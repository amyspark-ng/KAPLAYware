import { k } from "../../../kaplay";
import { buildGameContext, MicrogameContext } from "../context/game";
import { Scenery } from "./scenery";
import { Microgame } from "./microgame";
import { SandboxInstance } from "./instance/instance";
import { onPauseChange } from "../game";
import { GameState } from "../state/state";

// in charge of the flow and loop of the microgames
export class MicrogameController {
	state: GameState = GameState.Idle;
	currentInstance: SandboxInstance = null;

	timeoutKEvent = new k.KEvent();
	finishKEvent = new k.KEvent<["win" | "lose"]>();

	gameResult: "win" | "lose";
	finished: boolean;
	currentGame: Microgame;
	score: number = 0;
	timeLeft: number;
	games: any[];
	speed: number = 1;
	lives: number = 4;
	isHard: boolean = false;

	get shouldSpeedUp() {
		return false;
	}

	constructor(private scenery: Scenery, games: any[]) {
		this.games = games;
		this.speed = 1;
		this.lives = 4;
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
			const ctx = buildGameContext(this.currentInstance, this);

			this.timeLeft = game.duration;
			let timeOver = false;

			ctx.add([]).onUpdate(() => {
				if (this.finished) return;

				if (this.timeLeft > 0) this.timeLeft -= k.dt();
				if (this.timeLeft <= 0 && !timeOver) {
					this.timeoutKEvent.trigger();
					timeOver = true;
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
