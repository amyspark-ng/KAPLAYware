import k from "../engine";
import { assets } from "@kaplayjs/crew";
import { Asset, AudioPlay, AudioPlayOpt, Color, DrawSpriteOpt, GameObj, KEventController, Key, SpriteCompOpt, SpriteData, TimerController, Uniform, Vec2 } from "kaplay";
import cursor from "../plugins/cursor";
import { coolPrompt, gameHidesCursor, gameUsesMouse, getGameID, getGameInput } from "./utils";
import { gameAPIs } from "./api";
import { makeTransition } from "./transitions";
import { Button, KAPLAYwareOpts, Minigame, MinigameAPI, MinigameCtx } from "./types";
import { addBomb } from "../plugins/wareobjects";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
export type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

export function createWareApp() {
	return {
		/** Main object, if you want to pause every object, pause this */
		WareScene: k.add([]),
		wareCtx: null as ReturnType<typeof kaplayware>,
		/** Wheter the current minigame should be running (will be false when the transition hasn't finished) */
		gameRunning: false,
		/** Wheter the user has paused */
		gamePaused: false,
		inputEnabled: false,
		drawEvents: [] as KEventController[],
		updateEvents: [] as KEventController[],
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
		currentContext: null as MinigameCtx,
		// bomb
		timeRunning: false, // will turn true when transition is over (not same as gameRunning)
		currentBomb: null as ReturnType<typeof addBomb> | null,
		conductor: k.conductor(140),
		minigameHistory: [] as string[],
		winState: undefined as boolean | undefined,
		addEvent(ev: KEventController) {
			this.events.push(ev);
			return ev;
		},
		clearEvents() {
			for (let i = this.events.length - 1; i >= 0; i--) {
				this.events[i].cancel();
				this.events.pop();
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
		},
	};
}

export default function kaplayware(games: Minigame[] = [], opts: KAPLAYwareOpts = {}) {
	const DEFAULT_DURATION = 4;

	opts = opts ?? {};
	opts.debug ?? false;
	opts.inOrder ?? false;
	opts.onlyMouse ?? false;

	const wareApp = createWareApp();

	// debug variables
	let skipMinigame = false;
	let forceSpeed = false;
	let restartMinigame = false;
	let overrideDifficulty = null as 1 | 2 | 3;

	const shakeCamera = wareApp.WareScene.add([k.pos()]);
	const camera = shakeCamera.add([
		k.pos(k.center()),
		k.anchor("center"),
		k.scale(),
		k.rotate(),
		k.opacity(0),
		{
			shake: 0,
		},
	]);

	camera.onUpdate(() => {
		camera.shake = k.lerp(camera.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(camera.shake);
		shakeCamera.pos = k.vec2().add(posShake);
	});

	/** The container for minigames, if you want to pause the minigame you should pause this */
	const gameBox = camera.add([k.pos(-k.width() / 2, -k.height() / 2)]);

	function createGameContext(minigame: Minigame): MinigameCtx {
		const gameCtx = {};
		for (const api of gameAPIs) {
			gameCtx[api] = k[api];

			if (api == "add") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.currentScene.add(...args);
				};
			}
			else if (api == "onUpdate") {
				gameCtx[api] = (...args: any[]) => {
					const ev = k.onUpdate(...args as [any]);
					wareApp.updateEvents.push(ev);
					return ev;
				};
			}
			else if (api == "onDraw") {
				gameCtx[api] = (...args: any[]) => {
					const ev = wareApp.currentScene.onDraw(...args as [any]);
					wareApp.drawEvents.push(ev);
					return ev;
				};
			}
			else if (api == "get") {
				gameCtx[api] = (...args: any[]) => {
					return wareApp.currentScene.get(...args as [any]);
				};
			}

			if (api == "onClick") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const ev = k.onClick(...args);
					wareApp.inputEvents.push(ev);
					return ev;
				};
			}
			else if (api == "area") {
				// override area onClick too!!
				gameCtx[api] = (...args: any[]) => {
					const areaComp = k.area(...args);
					return {
						...areaComp,
						onClick(action: () => void) {
							const ev = k.onMousePress("left", () => this.isHovering() ? action() : false);
							wareApp.inputEvents.push(ev); // doesn't return because onClick returns void here
						},
					};
				};
			}
			else if (api == "wait") {
				gameCtx[api] = (...args: any[]) => {
					const ev = k.wait(args[0], args[1]);
					wareApp.addTimer(ev);
					return ev;
				};
			}
			else if (api == "loop") {
				gameCtx[api] = (...args: any[]) => {
					const ev = k.loop(args[0], args[1]);
					wareApp.addTimer(ev);
					return ev;
				};
			}
			else if (api == "tween") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const ev = k.tween(...args);
					wareApp.addTimer(ev);
					return ev;
				};
			}
			else if (api == "addLevel") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const level = k.addLevel(...args);
					level.parent = wareApp.currentScene;
					return level;
				};
			}
			else if (api == "play") {
				gameCtx[api] = (soundName: any, opts: AudioPlayOpt) => {
					// if sound name is string, check for @, else just send it
					const sound = k.play(typeof soundName == "string" ? (soundName.startsWith("@") ? soundName : `${getGameID(minigame)}-${soundName}`) : soundName, opts);

					const newSound = {
						...sound,
						set paused(param: boolean) {
							if (wareApp.canPlaySounds) {
								sound.paused = param;
								return;
							}

							// ALL OF THIS HAPPENS IF YOU CAN'T PLAY SOUNDS (queue stuff)
							sound.paused = true;

							// this means that it was queued to play but the user paused it
							if (wareApp.queuedSounds.includes(sound) && param == true) {
								wareApp.queuedSounds.splice(wareApp.queuedSounds.indexOf(sound), 1);
							}

							// this means the user removed it from queue but wants to add it again probably
							if (!wareApp.queuedSounds.includes(sound) && param == false) {
								wareApp.queuedSounds.push(sound);
							}
						},
						get paused() {
							return sound.paused;
						},
					};

					// if can't play sounds and the user intended to play it at start, pause it
					if (!wareApp.canPlaySounds) {
						if (!sound.paused) {
							wareApp.queuedSounds.push(sound);
							sound.paused = true;
						}
					}

					wareApp.addSound(newSound);
					return newSound;
				};
			}
			else if (api == "burp") {
				gameCtx[api] = (opts: AudioPlayOpt) => {
					return gameCtx["play"](k._k.audio.burpSnd, opts);
				};
			}
			else if (api == "drawSprite") {
				gameCtx[api] = (opts: DrawSpriteOpt) => {
					opts.sprite = `${getGameID(minigame)}-${opts.sprite}`;
					return k.drawSprite(opts);
				};
			}
			else if (api == "getSprite") {
				gameCtx[api] = (name: string) => {
					return k.getSprite(`${getGameID(minigame)}-${name}`);
				};
			}
			else if (api == "shader") {
				gameCtx[api] = (name: string, uniform: Uniform | (() => Uniform)) => {
					return k.shader(`${getGameID(minigame)}-${name}`, uniform);
				};
			}
			// TODO: Make fixed component work with the minigame camera api
			else if (api == "fixed") {
				gameCtx[api] = () => {
					let fixed = true;

					return {
						id: "fixed",
						set fixed(val: boolean) {
							fixed = val;
							if (fixed == true) this.parent = wareApp.WareScene;
							else this.parent = wareApp.currentScene;
						},
						get fixed() {
							return fixed;
						},
					};
				};
			}
		}
		function dirToKeys(button: Button): Key[] {
			if (button == "left") return ["left", "a"];
			else if (button == "down") return ["down", "s"];
			else if (button == "up") return ["up", "w"];
			else if (button == "right") return ["right", "d"];
			else if (button == "action") return ["space"];
		}

		const gameAPI: MinigameAPI = {
			getCamAngle: () => camera.angle,
			setCamAngle: (val: number) => camera.angle = val,
			getCamPos: () => camera.pos,
			setCamPos: (val: Vec2) => camera.pos = val,
			getCamScale: () => camera.scale,
			setCamScale: (val: Vec2) => camera.scale = val,
			shakeCam: (val: number = 12) => camera.shake += val,
			flashCam: (flashColor: Color = k.WHITE, timeOut: number = 1, opacity: number) => {
				const r = shakeCamera.add([
					k.pos(k.center()),
					k.rect(k.width() * 2, k.height() * 2),
					k.color(flashColor),
					k.anchor("center"),
					k.opacity(opacity),
					k.fixed(),
					k.z(999), // HACK: make sure is at front of everyone :skull: //
					"flash",
				]);
				const f = r.fadeOut(timeOut);
				f.onEnd(() => k.destroy(r));
				return f;
			},
			getRGB: () => wareApp.currentColor,
			setRGB: (val) => wareApp.currentColor = val,

			onButtonPress: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMousePress("left", action);
				else ev = gameBox.onKeyPress(dirToKeys(btn), action);
				wareApp.addInput(ev);
				return ev;
			},
			onButtonDown: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMouseDown("left", action);
				else ev = gameBox.onKeyDown(dirToKeys(btn), action);
				wareApp.addInput(ev);
				return ev;
			},
			onButtonRelease: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMouseRelease("left", action);
				else ev = gameBox.onKeyRelease(dirToKeys(btn), action);
				wareApp.addInput(ev);
				return ev;
			},
			isButtonPressed: (btn) => {
				if (btn == "click") return k.isMousePressed("left");
				else return k.isKeyPressed(dirToKeys(btn));
			},
			isButtonDown: (btn) => {
				if (btn == "click") return k.isMouseDown("left");
				else return k.isKeyDown(dirToKeys(btn));
			},
			isButtonReleased: (btn) => {
				if (btn == "click") return k.isMouseReleased("left");
				else return k.isKeyDown(dirToKeys(btn));
			},
			onMouseMove(action) {
				const ev = k.onMouseMove(action);
				wareApp.inputEvents.push(ev);
				return ev;
			},
			onMouseRelease(action) {
				const ev = k.onMouseRelease(action);
				wareApp.inputEvents.push(ev);
				return ev;
			},
			onTimeout: (action) => wareApp.onTimeOutEvents.add(action),
			win() {
				wareCtx.score++;
				wareApp.timeRunning = false;
				wareApp.winState = true;
				wareApp.currentBomb?.turnOff();
			},
			lose() {
				wareCtx.lives--;
				wareApp.timeRunning = false;
				wareApp.winState = false;
			},
			finish() {
				if (wareApp.winState == undefined) {
					throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
				}
				wareApp.clearSounds();
				wareApp.clearTimers();
				wareApp.clearInput();
				wareApp.onTimeOutEvents.clear();
				wareApp.gameRunning = false;
				wareApp.canPlaySounds = false;
				wareApp.currentBomb?.destroy();
				// removes the scene
				k.wait(0.2 / wareCtx.speed, () => {
					wareApp.currentScene.destroy();
					// removes fixed objects too (they aren't attached to the gamebox)
					wareApp.WareScene.get("fixed").forEach((obj) => obj.destroy());
					// reset camera
					this.setCamPos(k.center());
					this.setCamAngle(0);
					this.setCamScale(k.vec2(1));
					camera.get("flash").forEach((f) => f.destroy());
					camera.shake = 0;
				});
				wareCtx.nextGame();
			},
			sprite: (spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
				const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
				const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(minigame)}-${t}`;
				const spriteComp = k.sprite(getSpriteThing(spr), opts);

				return {
					...spriteComp,
					set sprite(val: CustomSprite<string>) {
						spriteComp.sprite = getSpriteThing(val);
					},

					get sprite() {
						if (spriteComp.sprite.startsWith(getGameID(minigame))) return spriteComp.sprite.replace(`${getGameID(minigame)}-`, "");
						else return spriteComp.sprite;
					},
				};
			},
			winState: () => wareApp.winState,
			addConfetti(opts) {
				return wareApp.currentScene.add(k.makeConfetti(opts));
			},
			difficulty: wareCtx.difficulty,
			lives: wareCtx.lives,
			speed: wareCtx.speed,
			timeLeft: wareCtx.time,
		};

		return {
			...gameCtx,
			...gameAPI,
		} as unknown as MinigameCtx;
	}

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
		},

		runGame(minigame: Minigame) {
			// OBJECT STUFF
			gameBox.removeAll();

			wareApp.currentContext = createGameContext(minigame) as MinigameCtx;
			const gDuration = typeof minigame.duration == "number" ? minigame.duration : minigame.duration(wareApp.currentContext);
			const durationEnabled = gDuration != undefined;
			wareCtx.time = durationEnabled ? gDuration / wareCtx.speed : 1;
			wareApp.currentContext.timeLeft = wareCtx.time;
			wareApp.currentColor = "r" in minigame.rgb ? minigame.rgb : k.Color.fromArray(minigame.rgb);
			wareApp.currentScene?.destroy();
			wareApp.currentScene = gameBox.add([]);
			wareApp.gameRunning = false;
			wareApp.timeRunning = false;
			wareApp.canPlaySounds = false;
			wareApp.currentBomb?.destroy();
			wareApp.currentBomb = null;
			wareCtx.curGame = minigame;
			minigame.start(wareApp.currentContext);

			let hasStartedRunning = false;
			const totalBeats = wareCtx.time / wareApp.conductor.beatInterval;

			// wareApp.currentBomb = addBomb();
			// wareApp.conductor.onBeat(() => {
			// 	wareApp.currentBomb.tick();
			// });

			const gameBoxUpdate = gameBox.onUpdate(() => {
				if (!wareApp.gameRunning) return;

				if (!hasStartedRunning) {
					hasStartedRunning = true;
					if (!wareApp.canPlaySounds) {
						wareApp.canPlaySounds = true;
						wareApp.queuedSounds.forEach((sound) => sound.paused = false);
					}

					const bombConductor = k.conductor(140 * wareCtx.speed);
					bombConductor.onBeat((beat, beatTime) => {
						if (beatTime >= totalBeats) {
							bombConductor.destroy();
							wareApp.onTimeOutEvents.trigger();
						}

						if (beat >= totalBeats - 4) {
							if (!wareApp.currentBomb) wareApp.currentBomb = addBomb();
							wareApp.currentBomb.tick();
						}
					});
				}

				if (!wareApp.timeRunning) return;
				if (!durationEnabled) return;

				if (wareCtx.time > 0) wareCtx.time -= k.dt();
				wareCtx.time = k.clamp(wareCtx.time, 0, 20);
				wareApp.currentContext.timeLeft = wareCtx.time;
				if (wareCtx.time <= 0 && wareApp.timeRunning) {
					wareApp.timeRunning = false;
				}

				// const beatsLeft = wareCtx.time / wareApp.conductor.beatInterval;
				// if (beatsLeft <= 4 && !wareApp.currentBomb) {
				// wareApp.currentBomb = addBomb();
				// const onBeat = wareApp.conductor.onBeat((beat) => {
				// 	wareApp.currentBomb.tick();
				// 	if (wareApp.currentBomb.hasExploded) {
				// 		wareApp.currentBomb.tick(); // missing tick to explode
				// 		onBeat.cancel();
				// 		k.debug.log("ok time to go");
				// 	}
				// });
				// }

				// TODO: Figure out why the clock is broken (sometimes time will go negative without calling timeOut)
				// if (wareCtx.time >= 0) wareCtx.time -= k.dt();
				// wareCtx.time = k.clamp(wareCtx.time, 0, 20);
				// wareApp.currentContext.timeLeft = wareCtx.time;
				// if (wareCtx.time <= 0 && wareApp.timeRunning) {
				// 	wareApp.timeRunning = false;
				// }

				// // if there's 3 beats left, add the bomb
				// if (wareCtx.time / wareCtx.speed <= wareApp.conductor.beatInterval * 3 && !wareApp.currentBomb) {
				// 	wareApp.currentBomb = addBomb();
				// 	wareApp.currentBomb.bomb.parent = wareApp.WareScene;
				// 	const beatEv = wareApp.conductor.onBeat(() => {
				// 		wareApp.currentBomb.tick();
				// 		if (wareApp.currentBomb.hasExploded) {
				// 			beatEv.cancel();
				// 			wareApp.currentBomb.tick(); // missing tick for the bomb to explode
				// 			wareApp.onTimeOutEvents.trigger();
				// 		}
				// 	});
				// }
			});

			wareApp.onTimeOutEvents.add(() => {
				wareApp.inputEnabled = false;
				gameBoxUpdate.cancel();
			});
		},
		nextGame() {
			if (wareCtx.score < 10) wareCtx.difficulty = 1;
			else if (wareCtx.score >= 10 && wareCtx.score < 20) wareCtx.difficulty = 2;
			else if (wareCtx.score >= 20) wareCtx.difficulty = 3;
			wareApp.gameRunning = false;

			if (overrideDifficulty) wareCtx.difficulty = overrideDifficulty;
			if (opts.onlyMouse) games = games.filter((game) => gameUsesMouse(game) && !game.input.keys);

			const availableGames = games.filter((game) => {
				if (wareApp.minigameHistory.length == 0 || games.length == 1) return true;
				else if (restartMinigame && !skipMinigame) return game == wareCtx.curGame;
				else {
					const previousPreviousID = wareApp.minigameHistory[wareCtx.score - 3];
					const previousPreviousGame = games.find((game) => getGameID(game) == previousPreviousID);
					if (previousPreviousGame) return game != wareCtx.curGame && game != previousPreviousGame;
					else return game != wareCtx.curGame;
				}
			});

			const nextGame = opts.inOrder ? availableGames[wareCtx.score % availableGames.length] : k.choose(availableGames);

			function prep() {
				wareCtx.runGame(nextGame);
				wareApp.minigameHistory[wareCtx.score - 1] = getGameID(nextGame);
				wareApp.winState = undefined;

				restartMinigame = false;
				skipMinigame = false;

				const gameinput = getGameInput(nextGame);
				cursor.visible = !gameHidesCursor(nextGame);

				let inputPrompt: ReturnType<typeof k.addInputPrompt> = null;
				let prompt: ReturnType<typeof k.addPrompt> = null;

				const prepTrans = makeTransition(wareApp, "prep");
				const transCtx = prepTrans.transitionCtx;

				prepTrans.onInputPromptTime(() => {
					inputPrompt = k.addInputPrompt(gameinput);
					inputPrompt.parent = wareApp.WareScene;
					transCtx.tween(k.vec2(0), k.vec2(1), 0.15 / wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);
				});

				prepTrans.onPromptTime(() => {
					transCtx.tween(inputPrompt.scale, k.vec2(0), 0.15 / wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutQuint).onEnd(() => inputPrompt.destroy());
					if (typeof nextGame.prompt == "string") prompt = k.addPrompt(coolPrompt(nextGame.prompt));
					else {
						prompt = k.addPrompt("");
						nextGame.prompt(wareApp.currentContext, prompt);
					}
					prompt.parent = wareApp.WareScene;

					transCtx.wait(0.15 / wareCtx.speed, () => {
						cursor.visible = !gameHidesCursor(nextGame);
						prompt.fadeOut(0.15 / wareCtx.speed).onEnd(() => prompt.destroy());
					});
				});

				prepTrans.onEnd(() => {
					prepTrans.destroy();
					wareApp.gameRunning = true;
					wareApp.timeRunning = true;
					wareApp.inputEnabled = true;
				});
			}

			if (wareApp.winState != undefined) {
				let transition: ReturnType<typeof makeTransition> = null;
				if (wareApp.winState) transition = makeTransition(wareApp, "win");
				else transition = makeTransition(wareApp, "lose");
				const transCtx = transition.transitionCtx;

				if (gameUsesMouse(nextGame)) cursor.visible = true;
				transition.onEnd(() => {
					if (wareApp.winState == false && wareCtx.lives == 0) {
						transCtx.play("@gameOverJingle").onEnd(() => {
							k.go("gameover", wareCtx.score);
						});
						k.addPrompt("GAME OVER");
						return;
					}
					else transition.destroy();

					const timeToSpeedUP = forceSpeed || wareCtx.score % 5 == 0;
					if (timeToSpeedUP) {
						if (forceSpeed == true) forceSpeed = false;
						wareCtx.timesSpeed++;
						wareCtx.speedUp();
						const speedTrans = makeTransition(wareApp, "speed");
						speedTrans.onEnd(() => {
							speedTrans.destroy();
							prep();
						});
					}
					else prep();
				});
			}
			else prep();
		},
	};

	wareApp.wareCtx = wareCtx;

	k.watch(wareCtx, "time", "Time left", (t) => t.toFixed(2));
	k.watch(wareCtx, "score", "Score");
	k.watch(wareCtx, "lives", "Lives");
	k.watch(wareCtx, "difficulty", "Difficulty");
	k.watch(wareCtx, "speed", "Speed");
	k.watch(wareApp, "inputEnabled", "Input enabled");

	for (const game of games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.rgb = game.rgb ?? [0, 0, 0];
		game.input = game.input ?? { keys: { use: true } };
		if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
	}

	k.onUpdate(() => {
		wareApp.WareScene.paused = wareApp.gamePaused;
		wareApp.currentScene.paused = !wareApp.gameRunning;
		cursor.canPoint = wareApp.gameRunning;
		wareApp.conductor.bpm = 140 * wareCtx.speed;
		wareApp.conductor.paused = wareApp.gamePaused;

		wareApp.inputEvents.forEach((ev) => ev.paused = !wareApp.inputEnabled || !wareApp.gameRunning);
		wareApp.timerEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.updateEvents.forEach((ev) => ev.paused = !wareApp.gameRunning || wareApp.gamePaused);
		wareApp.pausedSounds.forEach((sound) => sound.paused = true);

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

	camera.onDraw(() => {
		// draws the background
		k.drawRect({
			width: k.width() * 2,
			height: k.height() * 2,
			anchor: "center",
			pos: k.center().add(shakeCamera.pos),
			color: wareApp.currentColor,
		});
	});

	return wareCtx;
}
