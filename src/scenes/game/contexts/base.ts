import { Asset, GameObj, KEventController, SpriteComp, SpriteCompOpt, SpriteData, Tag } from "kaplay";
import k from "../../../kaplay";
import { gameAPIs } from "../api";
import { assets } from "@kaplayjs/crew";
import { Microgame } from "../../../types/Microgame";
import { WareEngine } from "../engine";
import { forAllCurrentAndFuture, getGameID, isDefaultAsset, overload2, pickKeysInObj } from "../utils";

type Friend = keyof typeof assets | `${keyof typeof assets}-o`;
type AtFriend = `@${Friend}`;
type CustomSprite<T extends string> = T extends AtFriend | string & {} ? AtFriend | string & {} : string;

/**
 * A modified {@link sprite `sprite()`} component to fit KAPLAYware.
 *
 * @group Component Types
 */
interface WareSpriteComp extends Omit<SpriteComp, "sprite"> {
	/**
	 * Name of the sprite.
	 */
	sprite: CustomSprite<string>;
}

export type StartCtx = Pick<typeof k, typeof gameAPIs[number]> & {
	/**
	 * — Modified KAPLAYWARE sprite() component. Adds default assets
	 *
	 * Attach and render a sprite to a Game Object. yada yada
	 *
	 * @param spr - The sprite to render.
	 * @param opt - Options for the sprite component. See {@link SpriteCompOpt `SpriteCompOpt`}.
	 */
	sprite(spr: CustomSprite<string> | SpriteData | Asset<SpriteData>, opt?: SpriteCompOpt): WareSpriteComp;
};

/** Create the basic context, is a modified kaplay context
 * @param game Needs game for things like sprite() and play()
 * @param engine Needs wareEngine to access hierarchy and props
 */
export function createBaseCtx(game: Microgame, engine: WareEngine): StartCtx {
	const gameId = getGameID(game);

	const startCtx: StartCtx = {
		...pickKeysInObj(k, [...gameAPIs]),
		add: (comps) => engine.container.scene.add(comps),
		sprite(spr, opt) {
			const hasAt = (t: any) => typeof t == "string" && t.startsWith("@");
			const getSpriteThing = (t: any) => hasAt(t) ? t : `${gameId}-${t}`;
			const spriteComp = k.sprite(getSpriteThing(spr), opt);

			return {
				...spriteComp,
				set sprite(val: string) {
					spriteComp.sprite = getSpriteThing(val);
				},

				get sprite() {
					if (spriteComp.sprite.startsWith(gameId)) return spriteComp.sprite.replace(`${gameId}-`, "");
					else return spriteComp.sprite;
				},
			};
		},
		play(src, options) {
			// if sound name is string, check for @, else just send it
			src = typeof src == "string" ? (src.startsWith("@") ? src : `${gameId}-${src}`) : src;
			return k.play(src, options);
		},
		area(opt) {
			return {
				...k.area(opt),
				onClick(f, btn) {
					return engine.inputs.onMousePress("left", () => {
						if (this.isHovering()) f();
					});
				},
			};
		},
		addLevel(map, opt) {
			const level = k.addLevel(map, opt);
			level.parent = engine.container.scene;
			return level;
		},
		burp(options) {
			return startCtx["play"](k._k.audio.burpSnd, options);
		},
		drawSprite(opt) {
			if (!isDefaultAsset(opt.sprite)) opt.sprite = `${gameId}-${opt.sprite}`;
			return k.drawSprite(opt);
		},
		getSprite(name) {
			return k.getSprite(`${gameId}-${name}`);
		},
		getSound(name) {
			return k.getSound(`${gameId}-${name}`);
		},
		shader(id, uniform) {
			return k.shader(`${gameId}-${id}`, uniform);
		},
		get(tag, opts) {
			return engine.container.scene.get(tag, opts);
		},
		fixed() {
			let fixed = true;

			return {
				id: "fixed",
				add() {
					this.parent = engine.container.root;
				},
				set fixed(val: boolean) {
					fixed = val;
					if (fixed == true) this.parent = engine.container.root;
					else this.parent = engine.container.root;
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
					return engine.timers.tween(
						this.opacity,
						0,
						time,
						(a) => this.opacity = a,
						easeFunc,
					);
				},
				fadeIn(time: number, easeFunc = k.easings.linear) {
					return engine.timers.tween(
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
			return engine.inputs.onMouseMove(action);
		},
		// timer controllers
		tween(from, to, duration, setValue, easeFunc) {
			return engine.timers.tween(from, to, duration, setValue, easeFunc);
		},
		wait(n, action) {
			return engine.timers.wait(n, action);
		},
		loop(t, action, maxLoops, waitFirst) {
			return engine.timers.loop(t, action, maxLoops, waitFirst);
		},
		// general event controllers
		onCollide(t1, t2, action) {
			return engine.events.add(k.onCollide(t1, t2, action));
		},
		onCollideUpdate(t1, t2, action) {
			return engine.events.add(k.onCollideUpdate(t1, t2, action));
		},
		onCollideEnd(t1, t2, action) {
			return engine.events.add(k.onCollideEnd(t1, t2, action));
		},
		trigger(event, tag, ...args) {
			engine.container.scene.get(tag).forEach((child) => {
				if (child.is(tag)) child.trigger(event, ...args);
			});
		},
		on(event, tag, action) {
			let paused = false;
			const events: KEventController[] = [];
			engine.container.scene.get(tag).forEach((children) => {
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
			ka.parent = engine.container.scene;
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
		const obj = engine.container.scene.add([{ update: action }]);
		const ev: KEventController = {
			get paused() {
				return obj.paused;
			},
			set paused(p) {
				obj.paused = p;
			},
			cancel: () => obj.destroy(),
		};
		engine.events.add(ev);
		return ev;
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		return engine.events.add(k.on("update", tag, action));
	});

	startCtx["onDraw"] = overload2((action: () => void): KEventController => {
		const obj = engine.container.scene.add([{ draw: action }]);
		const ev: KEventController = {
			get paused() {
				return obj.hidden;
			},
			set paused(p) {
				obj.hidden = p;
			},
			cancel: () => obj.destroy(),
		};
		return engine.draws.add(ev);
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		let paused = false;
		const evs: KEventController[] = [];
		const listener = forAllCurrentAndFuture(engine.container.scene, tag, (obj) => {
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

		return engine.draws.add(ev);
	});

	startCtx["onClick"] = overload2((action: () => void) => {
		return engine.inputs.onMousePress(action);
	}, (tag: Tag, action: (obj: GameObj) => void) => {
		const events: KEventController[] = [];
		let paused: boolean = false;

		const listener = forAllCurrentAndFuture(engine.container.scene, tag, (obj) => {
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
		return engine.inputs.add(ev);
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
	const startCtx = createBaseCtx(game, wareApp);
	const api = createMicrogameAPI(wareApp, wareEngine);
	return mergeWithRef(startCtx, api);
}
