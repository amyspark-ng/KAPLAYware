import { Color, GameObj, KEventController, Key, Tag } from "kaplay";
import { gameAPIs } from "../api";
import { forAllCurrentAndFuture, getGameID, isDefaultAsset, mergeWithRef, overload2, pickKeysInObj } from "../utils";
import { WareApp } from "../app";
import { Kaplayware } from "../kaplayware";
import { MicrogameAPI, MicrogameCtx, StartCtx } from "./types";
import { addConfetti } from "../objects/confetti";
import k from "../../../engine";
import { Microgame } from "../../../types/Microgame";

/** Create the basic context, is a modified kaplay context
 * @param game Needs game for things like sprite() and play()
 * @param wareApp Needs wareApp to access hierarchy and props
 */
export function createStartCtx(game: Microgame, wareApp: WareApp): StartCtx {
	const pickedCtx = pickKeysInObj(k, [...gameAPIs]);

	const startCtx: StartCtx = {
		...pickedCtx,
		add: (comps) => wareApp.sceneObj.add(comps),
		sprite(spr, opt) {
			const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
			const getSpriteThing = (t: any) => hasAt(t) ? t : `${getGameID(game)}-${t}`;
			const spriteComp = k.sprite(getSpriteThing(spr), opt);

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
		play(src, options) {
			// if sound name is string, check for @, else just send it
			src = typeof src == "string" ? (src.startsWith("@") ? src : `${getGameID(game)}-${src}`) : src;
			return wareApp.sounds.play(src, options);
		},
		area(opt) {
			return {
				...k.area(opt),
				onClick(f, btn) {
					return wareApp.inputs.add(k.onMousePress("left", () => {
						if (this.isHovering()) f();
					}));
				},
			};
		},
		addLevel(map, opt) {
			const level = k.addLevel(map, opt);
			level.parent = wareApp.sceneObj;
			return level;
		},
		burp(options) {
			return startCtx["play"](k._k.audio.burpSnd, options);
		},
		drawSprite(opt) {
			if (!isDefaultAsset(opt.sprite)) opt.sprite = `${getGameID(game)}-${opt.sprite}`;
			return k.drawSprite(opt);
		},
		getSprite(name) {
			return k.getSprite(`${getGameID(game)}-${name}`);
		},
		getSound(name) {
			return k.getSound(`${getGameID(game)}-${name}`);
		},
		shader(id, uniform) {
			return k.shader(`${getGameID(game)}-${id}`, uniform);
		},
		get(tag, opts) {
			return wareApp.sceneObj.get(tag, opts);
		},
		fixed() {
			let fixed = true;

			return {
				id: "fixed",
				add() {
					this.parent = wareApp.rootObj;
				},
				set fixed(val: boolean) {
					fixed = val;
					if (fixed == true) this.parent = wareApp.rootObj;
					else this.parent = wareApp.sceneObj;
				},
				get fixed() {
					return fixed;
				},
			};
		},
		opacity(o) {
			const comp = k.opacity(o);
			return {
				...comp,
				fadeOut(time: number, easeFunc = k.easings.linear) {
					return wareApp.timers.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return wareApp.timers.tween(
						0,
						this.opacity,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
			};
		},
		onMouseMove(action) {
			// TODO: figure out important stuff like
			// should ctx.width() return width of gamebox?
			// what about mousepos?
			// stuff like that
			return wareApp.inputs.add(k.onMouseMove(action));
		},
		// timer controllers
		tween(from, to, duration, setValue, easeFunc) {
			return wareApp.timers.tween(from, to, duration, setValue, easeFunc);
		},
		wait(n, action) {
			return wareApp.timers.wait(n, action);
		},
		loop(t, action, maxLoops, waitFirst) {
			return wareApp.timers.loop(t, action, maxLoops, waitFirst);
		},
		// general event controllers
		onCollide(t1, t2, action) {
			return wareApp.events.add(k.onCollide(t1, t2, action));
		},
		onCollideUpdate(t1, t2, action) {
			return wareApp.events.add(k.onCollideUpdate(t1, t2, action));
		},
		onCollideEnd(t1, t2, action) {
			return wareApp.events.add(k.onCollideEnd(t1, t2, action));
		},
		trigger(event, tag, ...args) {
			wareApp.sceneObj.get(tag).forEach((child) => {
				if (child.is(tag)) child.trigger(event, ...args);
			});
		},
		on(event, tag, action) {
			let paused = false;
			const events: KEventController[] = [];
			wareApp.sceneObj.get(tag).forEach((children) => {
				const ev = children.on(event, action);
				events.push(ev);
			});
			return {
				get paused() {
					return paused;
				},
				set paused(val: boolean) {
					paused = val;
					events.forEach((ev) => ev.paused = val);
				},
				cancel() {
					events.forEach((ev) => ev.cancel());
				},
			};
		},
		addKaboom(pos, opt) {
			const ka = k.addKaboom(pos, opt);
			ka.parent = wareApp.sceneObj;
			return ka;
		},
		// TODO: find a way to do something that keeps this from keeping t o increasing
		time() {
			return k.time();
		},
		// TODO: this probably causes problems with app, maybe make an app timer comp and add it to sceneObj, so it's th same??
		timer(maxLoopsPerFrame) {
			return k.timer(maxLoopsPerFrame);
		},
	};

	startCtx["onUpdate"] = overload2((action: () => void): KEventController => {
		const obj = wareApp.sceneObj.add([{ update: action }]);
		const ev: KEventController = {
			get paused() {
				return obj.paused;
			},
			set paused(p) {
				obj.paused = p;
			},
			cancel: () => obj.destroy(),
		};
		wareApp.events.add(ev);
		return ev;
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		return wareApp.events.add(k.on("update", tag, action));
	});

	startCtx["onDraw"] = overload2((action: () => void): KEventController => {
		const obj = wareApp.sceneObj.add([{ draw: action }]);
		const ev: KEventController = {
			get paused() {
				return obj.hidden;
			},
			set paused(p) {
				obj.hidden = p;
			},
			cancel: () => obj.destroy(),
		};
		return wareApp.draws.add(ev);
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		let paused = false;
		const evs: KEventController[] = [];
		const listener = forAllCurrentAndFuture(wareApp.sceneObj, tag, (obj) => {
			const drawEv = obj.on("draw", () => action(obj));
			evs.push(drawEv);
		});

		const ev: KEventController = {
			get paused() {
				return paused;
			},
			set paused(val: boolean) {
				paused = val;
				listener.paused = paused;
			},
			cancel() {
				listener.cancel();
				evs.forEach((ev) => ev.cancel());
			},
		};

		return wareApp.draws.add(ev);
	});

	startCtx["onClick"] = overload2((action: () => void) => {
		const ev = wareApp.sceneObj.onMousePress(action);
		return wareApp.inputs.add(ev);
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		const events: KEventController[] = [];
		let paused: boolean = false;

		const listener = forAllCurrentAndFuture(wareApp.sceneObj, tag, (obj) => {
			if (!obj.area) {
				throw new Error(
					"onClick() requires the object to have area() component",
				);
			}
			events.push(obj.onClick(() => action(obj)));
		});
		const ev: KEventController = {
			get paused() {
				return paused;
			},
			set paused(val: boolean) {
				paused = val;
				listener.paused = paused;
			},
			cancel() {
				events.forEach((ev) => ev.cancel());
				listener.cancel();
			},
		};
		return wareApp.inputs.add(ev);
	});

	return startCtx;
}

/** Create the microgame API, microgame exclusive functions
 * @param wareApp Needs wareApp to access the object hierarchy
 * @param wareEngine Is optional for "preview" mode, if not wareEngine will skip win() lose() and finish() calls
 */
export function createMicrogameAPI(wareApp: WareApp, wareEngine?: Kaplayware): MicrogameAPI {
	return {
		getCamAngle: () => wareApp.cameraObj.angle,
		setCamAngle: (val: number) => wareApp.cameraObj.angle = val,
		getCamPos: () => wareApp.cameraObj.pos,
		setCamPos: (val) => wareApp.cameraObj.pos = val,
		getCamScale: () => wareApp.cameraObj.scale,
		setCamScale: (val) => wareApp.cameraObj.scale = val,
		shakeCam: (val: number = 12) => wareApp.cameraObj.shake += val,
		flashCam: (flashColor: Color = k.WHITE, timeOut: number = 1, opacity: number) => {
			const r = wareApp.boxObj.add([
				k.pos(k.center()),
				k.rect(k.width() * 2, k.height() * 2),
				k.color(flashColor),
				k.anchor("center"),
				k.opacity(opacity),
				k.fixed(),
			]);
			const f = r.fadeOut(timeOut);
			f.onEnd(() => k.destroy(r));
			return f;
		},
		getRGB: () => wareApp.backgroundColor,
		setRGB: (val) => wareApp.backgroundColor = val,

		// TODO: Make this in a way that nothing happens if runs on wareEngine
		onTimeout: (action) => {
			return wareEngine.onTimeOutEvents.add(action);
		},
		win() {
			if (!wareEngine) return;
			wareEngine.winGame();
		},
		lose() {
			if (!wareEngine) return;
			wareEngine.loseGame();
		},
		finish() {
			if (!wareEngine) return;
			wareEngine.finishGame();
		},
		addConfetti(opts) {
			const confetti = addConfetti(opts);
			confetti.parent = wareApp.sceneObj;
			return confetti;
		},
		get winState() {
			return wareEngine.winState ?? undefined;
		},
		get difficulty() {
			return wareEngine.difficulty ?? 1;
		},
		get lives() {
			return wareEngine.lives ?? 3;
		},
		get speed() {
			return wareEngine.speed ?? 1;
		},
		get timeLeft() {
			return wareEngine.timeLeft ?? 20;
		},
		get duration() {
			return wareEngine.curDuration;
		},
		get prompt() {
			return wareEngine.curPrompt;
		},
	};
}

/** Creates the final, merged and usable context for a microgame
 * @param game The microgame to create the context for
 * @param wareApp The ware-app
 * @param wareEngine The ware engine, is optional for "preview" mode
 */
export function createGameCtx(game: Microgame, wareApp: WareApp, wareEngine?: Kaplayware): MicrogameCtx {
	const startCtx = createStartCtx(game, wareApp);
	const api = createMicrogameAPI(wareApp, wareEngine);
	return mergeWithRef(startCtx, api);
}
