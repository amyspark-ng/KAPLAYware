import { Asset, AudioPlayOpt, Color, DrawSpriteOpt, EaseFunc, KAPLAYCtx, KEventController, Key, SpriteAtlasData, SpriteCompOpt, SpriteData, Uniform, Vec2 } from "kaplay";
import k from "../engine";
import { InputButton, Minigame, MinigameAPI } from "./types";
import { getGameID, isDefaultAsset } from "./utils";
import { gameAPIs, generalEventControllers, loadAPIs, pauseAPIs } from "./api";
import { WareApp } from "./kaplayware";

/** The allowed load functions */
export type LoadCtx = Pick<KAPLAYCtx, typeof loadAPIs[number]>;

/** Creates the context exclusive for loading the assets of a minigame */
export function createLoadCtx(game: Minigame) {
	// load game assets
	const loadCtx = {};

	for (const api of loadAPIs) {
		loadCtx[api] = k[api];
	}

	// patch loadXXX() functions to scoped asset names
	const loaders = [
		"loadSprite",
		"loadSpriteAtlas",
		"loadAseprite",
		"loadPedit",
		"loadJSON",
		"loadSound",
		"loadFont",
		"loadBitmapFont",
		"loadShader",
		"loadShaderURL",
	];

	for (const loader of loaders) {
		loadCtx[loader] = (name: string, ...args: any) => {
			if (typeof name === "string") {
				name = `${getGameID(game)}-${name}`;
			}
			return k[loader](name, ...args);
		};

		if (loader == "loadSpriteAtlas") {
			loadCtx[loader] = (path: string, data: SpriteAtlasData) => {
				Object.keys(data).forEach((key) => {
					delete Object.assign(data, { [`${getGameID(game)}-${key}`]: data[key] })[key]; // renames the keys
				});
				return k.loadSpriteAtlas(path, data);
			};
		}
	}

	// patch loadRoot() to consider g.urlPrefix
	if (game.urlPrefix != undefined) {
		loadCtx["loadRoot"] = (p: string) => {
			if (p) k.loadRoot(game.urlPrefix + p);
			return k.loadRoot().slice(game.urlPrefix.length);
		};
		k.loadRoot(game.urlPrefix);
	}
	else {
		k.loadRoot("");
	}

	return loadCtx as LoadCtx;
}

/** The functions that can be paused with WareApp.gamePaused */
export type PauseCtx = Pick<typeof k, typeof pauseAPIs[number]> & { resetContext(): void; };

/** Creates a small context that includes tween, wait, loop and play, these will be paused if the WareApp is paused */
export function createPauseCtx(wareApp: WareApp) {
	const ctx = {} as PauseCtx;

	for (const api of pauseAPIs) {
		if (api == "play") {
			ctx[api] = (...args: any[]) => {
				const sound = k.play(...args as unknown as [any]);
				wareApp.pausableSounds.push(sound);
				return sound;
			};
		}
		else {
			ctx[api] = (...args: any[]) => {
				// @ts-ignore
				const timer = k[api](...args as unknown as [any]);
				wareApp.pausableTimers.push(timer);
				return timer as any;
			};
		}
	}

	ctx.resetContext = () => {
		for (let i = wareApp.pausableTimers.length - 1; i >= 0; i--) {
			wareApp.pausableTimers[i].cancel();
			wareApp.pausableTimers.pop();
		}

		for (let i = wareApp.pausableSounds.length - 1; i >= 0; i--) {
			wareApp.pausableSounds[i].stop();
			wareApp.pausableSounds.pop();
		}
	};

	return ctx;
}

/** The context for the allowed functions in a minigame */
export type MinigameCtx = Pick<typeof k, typeof gameAPIs[number]> & MinigameAPI;

/** Creates the context minigames use to add objects and buncha other stuff */
export function createGameCtx(wareApp: WareApp, game: Minigame) {
	const gameCtx = {};
	for (const api of gameAPIs) {
		gameCtx[api] = k[api];

		if (api == "add") {
			gameCtx[api] = (...args: any[]) => {
				return wareApp.currentScene.add(...args);
			};
		}
		// @ts-ignore
		else if (generalEventControllers.includes(api)) {
			gameCtx[api] = (...args: any[]) => {
				// @ts-ignore
				return wareApp.addGeneralEvent(k[api](...args as unknown as [any]));
			};
		}
		else if (api == "onDraw") {
			gameCtx[api] = (...args: any[]) => {
				return wareApp.addDrawEvent(wareApp.currentScene.onDraw(...args as [any]));
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
				return wareApp.addInput(k.onClick(...args));
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
				return wareApp.addTimer(k.wait(args[0], args[1]));
			};
		}
		else if (api == "loop") {
			gameCtx[api] = (...args: any[]) => {
				return wareApp.addTimer(k.loop(args[0], args[1]));
			};
		}
		else if (api == "tween") {
			gameCtx[api] = (...args: any[]) => {
				// @ts-ignore
				return wareApp.addTimer(k.tween(...args));
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
				const sound = k.play(typeof soundName == "string" ? (soundName.startsWith("@") ? soundName : `${getGameID(game)}-${soundName}`) : soundName, opts);

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
				if (!isDefaultAsset(opts.sprite)) opts.sprite = `${getGameID(game)}-${opts.sprite}`;
				return k.drawSprite(opts);
			};
		}
		else if (api == "getSprite") {
			gameCtx[api] = (name: string) => {
				return k.getSprite(`${getGameID(game)}-${name}`);
			};
		}
		else if (api == "shader") {
			gameCtx[api] = (name: string, uniform: Uniform | (() => Uniform)) => {
				return k.shader(`${getGameID(game)}-${name}`, uniform);
			};
		}
		else if (api == "fixed") {
			gameCtx[api] = () => {
				let fixed = true;

				return {
					id: "fixed",
					add() {
						this.parent = wareApp.WareScene;
					},
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
		else if (api == "opacity") {
			gameCtx[api] = (opacity: number) => {
				const comp = k.opacity(opacity);
				return {
					...comp,
					fadeOut(time: number, easeFunc: EaseFunc = k.easings.linear) {
						return wareApp.pausableCtx.tween(
							this.opacity,
							0,
							time,
							(a) => this.opacity = a,
							easeFunc,
						);
					},
					fadeIn(time: number, easeFunc: EaseFunc = k.easings.linear) {
						return wareApp.pausableCtx.tween(
							this.opacity,
							0,
							time,
							(a) => this.opacity = a,
							easeFunc,
						);
					},
				};
			};
		}
	}

	function dirToKeys(button: InputButton): Key[] {
		if (button == "left") return ["left", "a"];
		else if (button == "down") return ["down", "s"];
		else if (button == "up") return ["up", "w"];
		else if (button == "right") return ["right", "d"];
		else if (button == "action") return ["space"];
	}

	const gameAPI: MinigameAPI = {
		getCamAngle: () => wareApp.camera.angle,
		setCamAngle: (val: number) => wareApp.camera.angle = val,
		getCamPos: () => wareApp.camera.pos,
		setCamPos: (val: Vec2) => wareApp.camera.pos = val,
		getCamScale: () => wareApp.camera.scale,
		setCamScale: (val: Vec2) => wareApp.camera.scale = val,
		shakeCam: (val: number = 12) => wareApp.camera.shake += val,
		flashCam: (flashColor: Color = k.WHITE, timeOut: number = 1, opacity: number) => {
			const r = wareApp.shakeCamera.add([
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

		onInputButtonPress: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMousePress("left", action);
			else ev = k.onKeyPress(dirToKeys(btn), action);
			wareApp.addInput(ev);
			return ev;
		},
		onInputButtonDown: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMouseDown("left", action);
			else ev = k.onKeyDown(dirToKeys(btn), action);
			wareApp.addInput(ev);
			return ev;
		},
		onInputButtonRelease: (btn, action) => {
			let ev: KEventController = null;
			if (btn == "click") ev = k.onMouseRelease("left", action);
			else ev = k.onKeyRelease(dirToKeys(btn), action);
			wareApp.addInput(ev);
			return ev;
		},
		isInputButtonPressed: (btn) => {
			if (btn == "click") return k.isMousePressed("left");
			else return k.isKeyPressed(dirToKeys(btn));
		},
		isInputButtonDown: (btn) => {
			if (btn == "click") return k.isMouseDown("left");
			else return k.isKeyDown(dirToKeys(btn));
		},
		isInputButtonReleased: (btn) => {
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
			wareApp.wareCtx.score++;
			wareApp.timeRunning = false;
			wareApp.winState = true;
			wareApp.currentBomb?.turnOff();
		},
		lose() {
			wareApp.wareCtx.lives--;
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
			wareApp.clearGeneralEvents();
			wareApp.onTimeOutEvents.clear();
			wareApp.gameRunning = false;
			wareApp.canPlaySounds = false;
			wareApp.currentBomb?.destroy();
			wareApp.gameBox.clearEvents(); // this clears the time running update, not the onUpdate events of the minigame
			// removes the scene
			k.wait(0.2 / wareApp.wareCtx.speed, () => {
				wareApp.clearDrawEvents(); // clears them after you can't see them anymore
				wareApp.currentScene.destroy();
				// removes fixed objects too (they aren't attached to the gamebox)
				wareApp.WareScene.get("fixed").forEach((obj) => obj.destroy());
				// reset camera
				this.setCamPos(k.center());
				this.setCamAngle(0);
				this.setCamScale(k.vec2(1));
				wareApp.camera.get("flash").forEach((f) => f.destroy());
				wareApp.camera.shake = 0;
			});
			wareApp.wareCtx.nextGame();
		},
		sprite: (spr: string | SpriteData | Asset<SpriteData>, opts?: SpriteCompOpt) => {
			const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
			const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(game)}-${t}`;
			const spriteComp = k.sprite(getSpriteThing(spr), opts);

			return {
				...spriteComp,
				set sprite(val: string) {
					spriteComp.sprite = getSpriteThing(val);
				},

				get sprite() {
					if (spriteComp.sprite.startsWith(getGameID(game))) return spriteComp.sprite.replace(`${getGameID(game)}-`, "");
					else return spriteComp.sprite;
				},
			};
		},
		winState: () => wareApp.winState,
		addConfetti(opts) {
			const confetti = k.addConfetti(opts);
			confetti.parent = wareApp.gameBox;
			return confetti;
		},
		difficulty: wareApp.wareCtx.difficulty,
		lives: wareApp.wareCtx.lives,
		speed: wareApp.wareCtx.speed,
		timeLeft: wareApp.wareCtx.time,
	};

	return {
		...gameCtx,
		...gameAPI,
	} as unknown as MinigameCtx;
}
