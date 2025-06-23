import { KEvent, KEventController } from "kaplay";
import { createWareApp } from "./app";
import { createGameCtx } from "./context/game";
import games from "./games";
import { gameHidesMouse, getGameByID, getGameColor, getGameDuration, getGameID, getGameInput } from "./utils";
import { MicrogameCtx, MicrogameInput } from "./context/types";
import { addBomb, WareBomb } from "./objects/bomb";
import k from "../../engine";
import cursor from "../../plugins/cursor";
import { Microgame } from "../../types/Microgame";
import { addInputPrompt, addTextPrompt } from "./objects/prompts";
import { createTransition, Transition, TransitionStage } from "./transitions/makeTransition";
import chillTransition from "./transitions/chill";

/** Certain options to instantiate kaplayware (ware-engine) */
export type KAPLAYwareOpts = {
	/** What games will be available generally */
	games?: Microgame[];
	/** What input should be determined? */
	inputFilter?: MicrogameInput | "any";
	// mods here
};

export type Kaplayware = {
	lives: number;
	score: number;
	timeLeft: number;
	speed: number;
	difficulty: 1 | 2 | 3;
	curGame: Microgame;
	curContext: MicrogameCtx;
	readonly curPrompt: string;
	readonly curDuration: number;
	timePaused: boolean;
	scenePaused: boolean;
	microgameHistory: string[];
	queuedSounds: KEventController[];
	onTimeOutEvents: KEvent;
	winState: boolean | undefined;
	paused: boolean;
	clearPrevious(): void;
	winGame(): void;
	loseGame(): void;
	finishGame(): void;
	nextGame(): void;
};

/** Instantiates and runs KAPLAYWARE (aka ware-engine), to start it, run nextGame() */
export function kaplayware(opt: KAPLAYwareOpts = { games: games, inputFilter: "any" }): Kaplayware {
	const HOW_FREQUENT_BOSS = 10;
	const MAX_SPEED = 1.6;

	if (opt.inputFilter == "both") opt.games = opt.games.filter((g) => g.isBoss);
	else if (opt.inputFilter == "keys" || opt.inputFilter == "mouse") opt.games = opt.games.filter((g) => getGameInput(g) == opt.inputFilter || g.isBoss);

	for (const game of opt.games) {
		game.isBoss = game.isBoss ?? false;
	}

	let currentBomb: WareBomb = null;
	let previousGame: Microgame = null;
	let transition = null as Transition;
	let microgameHat = [...opt.games];

	/** Basically there's this microgame hat, when you pick a microgame, that microgame gets taken out of the hat, when there's no more microgames just add more again to the hat */
	const getRandomGame = () => {
		let randomGame: Microgame = null;

		const regularHat = microgameHat.filter((g) => !g.isBoss);
		const bossHat = microgameHat.filter((g) => g.isBoss);

		// first check if there's items available in the hat, if not, push to the arrays above
		if (shouldBoss() && bossHat.length == 0) bossHat.push(...opt.games.filter((g) => g.isBoss));
		else if (!shouldBoss() && regularHat.length == 0) regularHat.push(...opt.games.filter((g) => !g.isBoss));
		microgameHat = regularHat.concat(bossHat);

		// now choose a random microgame based on if should boss or not
		randomGame = k.choose(shouldBoss() ? bossHat : regularHat);
		microgameHat.splice(microgameHat.indexOf(randomGame), 1); // remove it from hat

		return randomGame;
	};

	const calculateDifficulty = (score = wareEngine.score): 1 | 2 | 3 => {
		return Math.max(1, (Math.floor(score / 10) + 1) % 4) as 1 | 2 | 3;
	};

	const shouldSpeedUp = () => {
		const realScore = wareEngine.score + 1;
		const number = k.randi(4, 6);
		const division = () => {
			if (realScore % number == 0) return true;
			else if (k.chance(0.1) && realScore % 5 == 0) return true;
			else return false;
		};
		if (division() && wareEngine.speed <= MAX_SPEED && !shouldBoss()) {
			if (previousGame && previousGame.isBoss) return false;
			else return true;
		}
		else return false;
	};

	const isGameOver = (winState = wareEngine.winState) => {
		return winState == false && wareEngine.lives == 0;
	};

	const shouldBoss = () => {
		const scoreEqualsBoss = () => wareEngine.score % HOW_FREQUENT_BOSS == 0;
		const onlyBoss = () => opt.games.length == 1 && opt.games[0].isBoss == true;
		return scoreEqualsBoss() || onlyBoss();
	};

	const getTransitionStages = (winState: boolean | undefined = wareEngine.winState): TransitionStage[] => {
		let transitionStages: TransitionStage[] = ["prep"];

		const winThing: TransitionStage = previousGame?.isBoss ? (winState == true ? "bossWin" : "bossLose") : winState == true ? "win" : "lose";
		if (winState != undefined) transitionStages.splice(0, 0, winThing);
		if (shouldSpeedUp()) transitionStages.splice(1, 0, "speed");
		if (isGameOver(winState)) transitionStages = ["lose"];
		if (shouldBoss()) transitionStages.splice(1, 0, "bossPrep"); // this would be before the prep, so it does BOSS! then regular prep

		return transitionStages;
	};

	let warePaused = false;
	const wareApp = createWareApp();

	const wareEngine: Kaplayware = {
		timeLeft: 4,
		lives: 4,
		score: 0,
		speed: 1,
		difficulty: 1,
		timePaused: false,
		microgameHistory: [],
		queuedSounds: [],
		winState: undefined,
		curGame: undefined,
		curContext: undefined,
		onTimeOutEvents: new k.KEvent(),
		get scenePaused() {
			return wareApp.sceneObj.paused;
		},
		set scenePaused(val) {
			wareApp.sceneObj.paused = val;
		},
		get paused() {
			return warePaused;
		},
		set paused(val: boolean) {
			warePaused = val;

			// if scene is unpaused, wareApp should pause absolutely everything
			// else, if pausing pause everything
			// and if unpausing, keep events paused but unpause the transCtx and the rootObj
			// if draws are paused then draws are not shown
			if (!wareEngine.scenePaused) {
				wareApp.paused = warePaused;
				wareApp.draws.paused = false;
			}
			else {
				if (warePaused) {
					wareApp.paused = true;
					wareApp.draws.paused = false;
				}
				else {
					wareApp.paused = true;
					wareApp.transCtx.paused = false;
					wareApp.rootObj.paused = false;
					wareApp.draws.paused = false;
				}
			}
		},
		get curDuration() {
			return getGameDuration(this.curGame, this.curContext);
		},
		get curPrompt() {
			return typeof wareEngine.curGame.prompt == "string" ? wareEngine.curGame.prompt : "";
		},
		clearPrevious() {
			wareApp.clearAll();
			wareApp.resetCamera();
			wareApp.sceneObj.removeAll();
			// fixed objs are added to root so they're not affected by camera (parent of sceneObj)
			wareApp.rootObj.get("fixed").forEach((obj) => obj.destroy());
			currentBomb?.destroy();
			k.setGravity(0);
		},
		winGame() {
			wareEngine.timePaused = true;
			wareEngine.winState = true;
			currentBomb?.extinguish();
		},
		loseGame() {
			wareEngine.lives--;
			wareEngine.timePaused = true;
			wareEngine.winState = false;
			currentBomb?.explode();
		},
		finishGame() {
			if (wareEngine.winState == undefined) {
				throw new Error("Finished microgame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
			}

			wareEngine.nextGame();
		},
		nextGame() {
			wareEngine.score++;

			// pauses the current one and the next one
			wareEngine.timePaused = true;
			wareEngine.scenePaused = true;
			wareApp.paused = true;
			wareApp.transCtx.paused = false;
			wareApp.rootObj.paused = false;
			wareApp.draws.paused = false;

			cursor.canPoint = false;
			previousGame = wareEngine.curGame;
			wareEngine.onTimeOutEvents.clear();
			if (!transition) transition = createTransition(chillTransition, wareApp, wareEngine);

			// runs on prep so the previous game isn't seen anymore
			// thus can be cleared and the new one can be prepped
			transition.onStageStart("prep", () => {
				wareEngine.clearPrevious();
				wareEngine.curGame = getRandomGame();
				wareEngine.curContext = createGameCtx(wareEngine.curGame, wareApp, wareEngine);

				wareEngine.curContext.setRGB(getGameColor(wareEngine.curGame, wareEngine.curContext));
				cursor.fadeAway = gameHidesMouse(wareEngine.curGame);
				wareEngine.microgameHistory[wareEngine.score - 1] = getGameID(wareEngine.curGame);
				wareEngine.curGame.start(wareEngine.curContext);
				wareEngine.timeLeft = wareEngine.curDuration != undefined ? wareEngine.curDuration / wareEngine.speed : undefined;
				wareEngine.difficulty = calculateDifficulty();
				currentBomb = null;

				// behaviour that manages microgame
				wareEngine.curContext.onUpdate(() => {
					if (!wareEngine.timeLeft) return;
					if (wareEngine.timePaused) return;
					// bomb and such is not necessary bcause time is undefined
					if (wareEngine.timeLeft == undefined) return;
					if (wareEngine.timeLeft > 0) wareEngine.timeLeft -= k.dt();
					wareEngine.timeLeft = k.clamp(wareEngine.timeLeft, 0, 20);

					// When there's 4 beats left
					const beatInterval = 60 / (140 * wareEngine.speed);
					if (wareEngine.timeLeft <= beatInterval * 4 && currentBomb == null) {
						currentBomb = addBomb(wareApp);
						currentBomb.lit(140 * wareEngine.speed);
					}

					if (wareEngine.timeLeft <= 0 && !wareEngine.timePaused) {
						wareEngine.timePaused = true;
						wareEngine.onTimeOutEvents.trigger();
						if (!currentBomb.hasExploded) currentBomb.explode();
					}
				});
			});

			// if this runs is because shouldSpeed() is true, so it's fine to increase speed here don't worry
			transition.onStageStart("speed", () => {
				wareEngine.speed = k.clamp(wareEngine.speed + wareEngine.speed * 0.07, 0, MAX_SPEED);
			});

			// these run but prep doesn't
			transition.onInputPromptTime(() => {
				addInputPrompt(wareApp, getGameInput(wareEngine.curGame));
			});

			transition.onPromptTime(() => {
				const promptObj = addTextPrompt(wareApp, wareEngine.curPrompt, wareEngine.speed);
				if (typeof wareEngine.curGame.prompt == "function") wareEngine.curGame.prompt(wareEngine.curContext, promptObj);
			});

			transition.onTransitionEnd(() => {
				wareEngine.timePaused = false;
				wareEngine.scenePaused = false;
				wareApp.paused = false;
				wareApp.transCtx.cancel(); // clear the transCtx
				cursor.canPoint = true;
				cursor.fadeAway = gameHidesMouse(wareEngine.curGame);
			});

			// trigger transition
			transition.trigger(getTransitionStages());

			wareEngine.winState = undefined; // reset it after transition so it does the win and lose

			wareEngine.onTimeOutEvents.add(() => {
				wareApp.inputs.paused = true;
			});
		},
	};

	wareApp.rootObj.onUpdate(() => {
		k.quickWatch("GAME.paused", wareEngine.paused);
		wareApp.handleQuickWatch();

		k.quickWatch("ware.scenePaused", wareEngine.scenePaused);
		k.quickWatch("ware.objects", wareApp.sceneObj.get("*", { recursive: true }).length);
		k.quickWatch("ware.score", wareEngine.score);
		k.quickWatch("ware.time", wareEngine.timeLeft?.toFixed(2));
		k.quickWatch("ware.speed", wareEngine.speed.toFixed(2));
		k.quickWatch("ware.gamehat", microgameHat.length);
		k.quickWatch("k.objects", k.debug.numObjects());
	});

	return wareEngine;
}
