import { assets } from "@kaplayjs/crew";
import { Asset, AudioPlay, AudioPlayOpt, Color, DrawSpriteOpt, GameObj, KAPLAYCtx, KAPLAYOpt, KEventController, Key, SoundData, SpriteCompOpt, SpriteData, Vec2 } from "kaplay";
import k from "../engine";
import cursor from "../plugins/cursor";
import { gameAPIs } from "./api";
import { makeTransition } from "./transitions";
import { Button, KaplayWareCtx, KAPLAYwareOpts, LoadCtx, Minigame, MinigameAPI, MinigameCtx } from "./types";
import { coolPrompt, gameHidesCursor, gameUsesMouse, getByID, getGameID, getGameInput } from "./utils";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
export type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

export default function kaplayware(games: Minigame[] = [], opts: KAPLAYwareOpts = {}): KaplayWareCtx {
	const DEFAULT_DURATION = 4;

	opts = opts ?? {};
	opts.debug ?? false;
	opts.inOrder ?? false;
	opts.onlyMouse ?? false;

	let wonLastGame: boolean = null;
	let minigameHistory: string[] = []; // this is so you can't get X minigame, Y minigame, then X minigame again

	const onTimeoutEvent = new k.KEvent();
	const conductor = k.conductor(140);
	let gameboxUpdate: KEventController = null;
	let timerEvents: KEventController[] = [];
	let inputEvents: KEventController[] = [];
	let canPlaySounds = false;
	let queuedSounds: AudioPlay[] = [];
	let sounds: AudioPlay[] = [];
	let rgbColor: Color = k.WHITE;
	let addedBomb = false;
	let currentBomb: ReturnType<typeof k.addBomb> = null;
	let clockRunning = true;
	let currentMinigameScene: GameObj = null;
	let currentMinigameCtx: MinigameCtx = null;

	// debug variables
	let skipMinigame = false;
	let forceSpeed = false;
	let restartMinigame = false;
	let overrideDifficulty = null as 1 | 2 | 3;

	/** Main object, if you want to pause everything, pause this */
	const WareScene = k.add([]);

	const shakeCamera = WareScene.add([k.pos()]);
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

	function clearInput() {
		for (let i = inputEvents.length - 1; i >= 0; i--) {
			inputEvents[i].cancel();
			inputEvents.pop();
		}
	}

	function clearTimers() {
		for (let i = timerEvents.length - 1; i >= 0; i--) {
			timerEvents[i].cancel();
			timerEvents.pop();
		}
	}

	function clearSounds() {
		for (let i = sounds.length - 1; i >= 0; i--) {
			sounds[i].stop();
			sounds.pop();
		}

		for (let i = queuedSounds.length - 1; i >= 0; i--) {
			queuedSounds[i].stop();
			queuedSounds.pop();
		}
	}

	function getGameContext(g: Minigame) {
		const gameCtx = {};
		for (const api of gameAPIs) {
			gameCtx[api] = k[api];

			if (api == "make") {
				gameCtx[api] = (...args: any) => {
					return k.make(...args);
				};
			}
			else if (api == "onClick") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const ev = k.onClick(...args);
					inputEvents.push(ev);
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
							inputEvents.push(ev); // doesn't return because onClick returns void here
						},
					};
				};
			}
			else if (api == "wait") {
				gameCtx[api] = (...args: any[]) => {
					const ev = k.wait(args[0], args[1]);
					timerEvents.push(ev);
					return ev;
				};
			}
			else if (api == "loop") {
				gameCtx[api] = (...args: any[]) => {
					const ev = k.loop(args[0], args[1]);
					timerEvents.push(ev);
					return ev;
				};
			}
			else if (api == "tween") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const ev = k.tween(...args);
					timerEvents.push(ev);
					return ev;
				};
			}
			else if (api == "addLevel") {
				gameCtx[api] = (...args: any[]) => {
					// @ts-ignore
					const level = k.addLevel(...args);
					level.onUpdate(() => level.paused = !wareCtx.gameRunning);
					return level;
				};
			}
			else if (api == "play") {
				gameCtx[api] = (soundName: any, opts: AudioPlayOpt) => {
					// if sound name is string, check for @, else just send it
					const sound = k.play(typeof soundName == "string" ? (soundName.startsWith("@") ? soundName : `${getGameID(g)}-${soundName}`) : soundName, opts);

					const newSound = {
						...sound,
						set paused(param: boolean) {
							if (canPlaySounds) {
								sound.paused = param;
								return;
							}

							// ALL OF THIS HAPPENS IF YOU CAN'T PLAY SOUNDS (queue stuff)
							sound.paused = true;

							// this means that it was queued to play but the user paused it
							if (queuedSounds.includes(sound) && param == true) {
								queuedSounds.splice(queuedSounds.indexOf(sound), 1);
							}

							// this means the user removed it from queue but wants to add it again probably
							if (!queuedSounds.includes(sound) && param == false) {
								queuedSounds.push(sound);
							}
						},
						get paused() {
							return sound.paused;
						},
					};

					// if can't play sounds and the user intended to play it at start, pause it
					if (!canPlaySounds) {
						if (!sound.paused) {
							queuedSounds.push(sound);
							sound.paused = true;
						}
					}

					sounds.push(newSound);
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
					opts.sprite = `${getGameID(g)}-${opts.sprite}`;
					return k.drawSprite(opts);
				};
			}
			else if (api == "getSprite") {
				gameCtx[api] = (name: string) => {
					return k.getSprite(`${getGameID(g)}-${name}`);
				};
			}
			else if (api == "shader") {
				gameCtx[api] = (name, uniform) => {
					return k.shader(`${getGameID(g)}-${name}`, uniform);
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
						},
						get fixed() {
							return fixed;
						},
						update() {
							this.pos = this.toScreen(this.pos);
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
			getRGB: () => rgbColor,
			setRGB: (val) => rgbColor = val,

			onButtonPress: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMousePress("left", action);
				else ev = gameBox.onKeyPress(dirToKeys(btn), action);
				inputEvents.push(ev);
				return ev;
			},
			onButtonDown: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMouseDown("left", action);
				else ev = gameBox.onKeyDown(dirToKeys(btn), action);
				inputEvents.push(ev);
				return ev;
			},
			onButtonRelease: (btn, action) => {
				let ev: KEventController = null;
				if (btn == "click") ev = gameBox.onMouseRelease("left", action);
				else ev = gameBox.onKeyRelease(dirToKeys(btn), action);
				inputEvents.push(ev);
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
				inputEvents.push(ev);
				return ev;
			},
			onMouseRelease(action) {
				const ev = k.onMouseRelease(action);
				inputEvents.push(ev);
				return ev;
			},
			onTimeout: (action) => onTimeoutEvent.add(action),
			win() {
				wareCtx.score++;
				clockRunning = false;
				wonLastGame = true;
				if (currentBomb) currentBomb.turnOff();
			},
			lose() {
				wareCtx.lives--;
				clockRunning = false;
				wonLastGame = false;
			},
			finish() {
				if (wonLastGame == null) {
					throw new Error("Finished minigame without setting the win condition!! Please call ctx.win() or ctx.lose() before calling ctx.finish()");
				}
				clearSounds();
				clearTimers();
				clearInput();
				onTimeoutEvent.clear();
				gameboxUpdate?.cancel();
				k.wait(0.2, () => {
					currentMinigameScene?.destroy();
					WareScene.get("fixed").forEach((obj) => obj.destroy());
					// reset camera
					this.setCamPos(k.center());
					this.setCamAngle(0);
					this.setCamScale(k.vec2(1));
					camera.get("flash").forEach((f) => f.destroy());
					camera.shake = 0;
				});
				wareCtx.nextGame();
				canPlaySounds = false;
				if (currentBomb) currentBomb.destroy();
			},
			sprite: (spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
				const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
				const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(g)}-${t}`;
				const spriteComp = k.sprite(getSpriteThing(spr), opts);

				return {
					...spriteComp,
					set sprite(val: string) {
						spriteComp.sprite = getSpriteThing(val);
					},

					get sprite() {
						if (spriteComp.sprite.startsWith(getGameID(g))) return spriteComp.sprite.replace(`${getGameID(g)}-`, "");
						else return spriteComp.sprite;
					},
				};
			},
			hasWon: () => wonLastGame == true,
			addConfetti(opts) {
				return gameBox.add(k.makeConfetti(opts));
			},
			difficulty: wareCtx.difficulty,
			lives: wareCtx.lives,
			speed: wareCtx.speed,
			timeLeft: wareCtx.time,
		};

		return {
			...gameCtx,
			...gameAPI,
		};
	}

	k.onUpdate(() => {
		gameBox.paused = !wareCtx.gameRunning;
		cursor.canPoint = wareCtx.gameRunning;
		conductor.bpm = 140 * wareCtx.speed;

		inputEvents.forEach((ev) => ev.paused = !wareCtx.inputEnabled || !wareCtx.gameRunning);
		timerEvents.forEach((ev) => ev.paused = !wareCtx.gameRunning);
		// sounds are managed in a different way so they're not here

		if (opts.debug) {
			if (k.isKeyPressed("q")) {
				restartMinigame = true;
				if (k.isKeyDown("shift")) {
					skipMinigame = true;
					k.debug.log("SKIPPED: " + getGameID(wareCtx.curGame()));
				}
				else k.debug.log("RESTARTED: " + getGameID(wareCtx.curGame()));
			}

			if (k.isKeyDown("shift") && k.isKeyPressed("w")) {
				restartMinigame = true;
				forceSpeed = true;
				k.debug.log("RESTARTED + SPEED UP: " + getGameID(wareCtx.curGame()));
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

	const wareCtx: KaplayWareCtx = {
		inputEnabled: false,
		gameRunning: false,
		time: 0,
		lives: 4,
		speed: 1,
		difficulty: 1,
		gameIdx: k.randi(0, games.length - 1),
		timesSpeed: 0,
		score: 1, // transition will show 0 to 1
		curGame: () => games[wareCtx.gameIdx],
		speedUp() {
			this.speed += this.speed * 0.07;
		},

		runGame(g) {
			// OBJECT STUFF
			gameBox.removeAll();

			currentMinigameCtx = getGameContext(g) as MinigameCtx;
			const gDuration = typeof g.duration == "number" ? g.duration : g.duration(currentMinigameCtx);
			wareCtx.time = gDuration / wareCtx.speed;
			rgbColor = "r" in g.rgb ? g.rgb : k.rgb(g.rgb[0], g.rgb[1], g.rgb[2]);
			const minigameScene = gameBox.add(g.start(currentMinigameCtx));
			clockRunning = true;
			addedBomb = false;

			onTimeoutEvent.add(() => {
				wareCtx.inputEnabled = false;
			});

			gameboxUpdate?.cancel();
			gameboxUpdate = k.onUpdate(() => {
				if (restartMinigame) {
					currentMinigameCtx?.win();
					currentMinigameCtx?.finish();
				}

				if (!wareCtx.gameRunning) return;
				if (clockRunning) {
					if (!canPlaySounds) {
						canPlaySounds = true;
						queuedSounds.forEach((sound) => sound.paused = false);
					}

					if (wareCtx.time >= 0) wareCtx.time -= k.dt();
					wareCtx.time = k.clamp(wareCtx.time, 0, 999);
					currentMinigameCtx.timeLeft = wareCtx.time;
					if (wareCtx.time <= 0 && clockRunning) {
						clockRunning = false;
					}

					// if there's 3 beats left, add the bomb
					if (wareCtx.time / wareCtx.speed <= conductor.beatInterval * 3 && !addedBomb) {
						addedBomb = true;
						currentBomb = k.addBomb();
						const beatEv = conductor.onBeat(() => {
							if (currentBomb.hasExploded || !clockRunning) beatEv.cancel();
							if (currentBomb.hasExploded) {
								onTimeoutEvent.trigger();
								currentBomb.tick(); // missing tick for the bomb to explode
							}
							if (clockRunning) currentBomb.tick();
						});
					}
				}
			});

			return minigameScene;
		},
		nextGame() {
			if (wareCtx.score < 10) wareCtx.difficulty = 1;
			else if (wareCtx.score >= 10 && wareCtx.score < 20) wareCtx.difficulty = 2;
			else if (wareCtx.score >= 20) wareCtx.difficulty = 3;
			wareCtx.gameRunning = false;

			if (overrideDifficulty) wareCtx.difficulty = overrideDifficulty;
			if (opts.onlyMouse) games = games.filter((game) => gameUsesMouse(game) && !game.input.keys);

			const availableGames = games.filter((game) => {
				if (minigameHistory.length == 0 || games.length == 1) return true;
				else if (restartMinigame && !skipMinigame) return game == wareCtx.curGame();
				else {
					const previousPreviousID = minigameHistory[wareCtx.score - 3];
					const previousPreviousGame = games.find((game) => getGameID(game) == previousPreviousID);
					if (previousPreviousGame) return game != wareCtx.curGame() && game != previousPreviousGame;
					else return game != wareCtx.curGame();
				}
			});

			const nextGame = opts.inOrder ? availableGames[wareCtx.score % availableGames.length] : k.choose(availableGames);

			function prep() {
				wareCtx.gameIdx = games.indexOf(nextGame);
				clearSounds(); // hit minigame has an issue with causes queuedSounds to stay
				wareCtx.runGame(nextGame);
				minigameHistory[wareCtx.score - 1] = getGameID(nextGame);
				wonLastGame = null;

				restartMinigame = false;
				skipMinigame = false;

				const gameinput = getGameInput(nextGame);
				cursor.visible = !gameHidesCursor(nextGame);

				let inputPrompt: ReturnType<typeof k.addInputPrompt> = null;
				let prompt: ReturnType<typeof k.addPrompt> = null;

				const prepTrans = makeTransition(WareScene, wareCtx, "prep");

				prepTrans.onInputPromptTime(() => {
					inputPrompt = k.addInputPrompt(gameinput);
					k.tween(k.vec2(0), k.vec2(1), 0.15 / wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutElastic);
				});

				prepTrans.onPromptTime(() => {
					k.tween(inputPrompt.scale, k.vec2(0), 0.15 / wareCtx.speed, (p) => inputPrompt.scale = p, k.easings.easeOutQuint).onEnd(() => inputPrompt.destroy());
					if (typeof nextGame.prompt == "string") prompt = k.addPrompt(coolPrompt(nextGame.prompt));
					else {
						prompt = k.addPrompt("");
						nextGame.prompt(currentMinigameCtx as unknown as MinigameCtx, prompt);
					}

					k.wait(0.15 / wareCtx.speed, () => {
						cursor.visible = !gameHidesCursor(nextGame);
						prompt.fadeOut(0.15 / wareCtx.speed).onEnd(() => prompt.destroy());
					});
				});

				prepTrans.onEnd(() => {
					prepTrans.destroy();
					wareCtx.gameRunning = true;
					wareCtx.inputEnabled = true;
				});
			}

			if (wonLastGame != null) {
				let transition: ReturnType<typeof makeTransition> = null;
				if (wonLastGame) transition = makeTransition(WareScene, wareCtx, "win");
				else transition = makeTransition(WareScene, wareCtx, "lose");
				if (gameUsesMouse(nextGame)) cursor.visible = true;

				transition.onEnd(() => {
					if (wonLastGame == false && wareCtx.lives == 0) {
						k.play("@gameOverJingle").onEnd(() => {
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
						const speedTrans = makeTransition(WareScene, wareCtx, "speed");
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

	k.watch(wareCtx, "score", "Score");
	k.watch(wareCtx, "lives", "Lives");
	k.watch(wareCtx, "difficulty", "Difficulty");
	k.watch(wareCtx, "speed", "Speed");
	k.watch(wareCtx, "inputEnabled", "Input enabled");

	for (const game of games) {
		game.urlPrefix = game.urlPrefix ?? "";
		game.duration = game.duration ?? DEFAULT_DURATION;
		game.rgb = game.rgb ?? [0, 0, 0];
		game.input = game.input ?? { keys: { use: true } };
		if ("r" in game.rgb) game.rgb = [game.rgb.r, game.rgb.g, game.rgb.b];
	}

	gameBox.onDraw(() => {
		k.drawRect({
			width: k.width(),
			height: k.height(),
			anchor: "center",
			pos: k.center().add(shakeCamera.pos),
			color: rgbColor,
		});
	});

	return wareCtx;
}
