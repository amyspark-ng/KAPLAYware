import { AudioPlay, Color, KEventController, TimerController, TweenController, Vec2, wareModsConfig } from "kaplay";
import k from "../../engine";

/** Creates a cute little object that contains a buncha game objects that can hold, a ware instance
 * @param rootParent Wheter the root should have a parent
 * @returns An object with a lot of objects
 */
export function createGameContainer(rootParent = k.getTreeRoot()) {
	const root = rootParent.add();
	wareModsConfig.wareRoot = root;

	const gameBox = root.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLUE.lighten(100)),
		k.scale(1),
		k.pos(k.center()),
		k.anchor("center"),
		{
			scaleToSize(size: Vec2) {
				this.scale.x = size.x / k.width();
				this.scale.y = size.y / k.height();
			},
		},
	]);

	const maskObj = gameBox.add([
		k.rect(gameBox.width, gameBox.height),
		k.pos(-gameBox.width / 2, -gameBox.height / 2),
		k.mask("intersect"),
	]);

	const shakeCameraObject = maskObj.add([
		k.pos(),
	]);

	const cameraObject = shakeCameraObject.add([
		k.rect(k.width(), k.height(), { fill: false }),
		k.pos(k.center()),
		k.rotate(0),
		k.anchor("center"),
		k.scale(1),
		{
			shake: 0,
		},
	]);

	const sceneObject = cameraObject.add([
		k.pos(-cameraObject.width / 2, -cameraObject.height / 2),
		k.timer(),
	]);

	cameraObject.onUpdate(() => {
		cameraObject.shake = k.lerp(cameraObject.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(cameraObject.shake);
		shakeCameraObject.pos = k.vec2().add(posShake);
	});

	return {
		/** The root of all evil */
		root: root,
		/** Is the background and "window" of everything */
		box: gameBox,
		/** Masking object so things inside don't go out */
		mask: maskObj,
		/** Is the offset for the camera shaking */
		shakeCam: shakeCameraObject,
		/** Is the camera */
		camera: cameraObject,
		/** Is the real scene where micorgame objects can be added with no problem, should have 0 children */
		scene: sceneObject,
		set scale(val: Vec2) {
			gameBox.scale = val;
		},
		get scale() {
			return gameBox.scale;
		},
		set pos(val: Vec2) {
			gameBox.pos = val;
		},
		get pos() {
			return gameBox.pos;
		},
	};
}

/** The ReturnType of {@link createGameContainer `createGameContainer()`} */
type GameContainer = ReturnType<typeof createGameContainer>;

// NOTE: When adding an event to the app use the most-possible root version of it
// so the pauses are handled by the app itself and not if the object happened to be paused

/** Object that contains all the properties that a bare-bones instance should have */
export type WareApp = {
	readonly rootObj: GameContainer["root"];
	/** Is attached to treeRoot */
	readonly boxObj: GameContainer["box"];
	/** Is attached to wareRoot (serves for fixed) */
	readonly maskObj: GameContainer["mask"];
	/** Is attached to mask */
	readonly cameraObj: GameContainer["camera"];
	/** Is attached to camera */
	readonly sceneObj: GameContainer["scene"];

	draws: {
		paused: boolean;
		readonly length: number;
		add(ev: KEventController): KEventController;
		cancel(): void;
	};

	events: {
		paused: boolean;
		readonly length: number;
		add(ev: KEventController): KEventController;
		cancel(): void;
	};

	inputs: {
		paused: boolean;
		readonly length: number;
		add(ev: KEventController): KEventController;
		cancel(): void;
	};

	sounds: {
		play: typeof k["play"];
		paused: boolean;
		readonly length: number;
		cancel(): void;
	};

	timers: {
		paused: boolean;
		readonly length: number;
		add<T extends TimerController | TweenController>(ev: T): T;
		cancel(): void;
	};

	backgroundColor: Color;
	/** Wheter all the events, inputs, sounds in the app should be paused */
	paused: boolean;

	clearAll(): void;
	resetCamera(): void;
	handleQuickWatch(): void;
};

/** Function that creates an instance of {@link WareApp `WareApp`}
 * @param rootParent Wheter to pass a parent to the createGameContainer() function
 */
export function createWareApp(rootParent = k.getTreeRoot()): WareApp {
	const gameContainer = createGameContainer(rootParent);

	/** Wheter the app should be paused */
	let appPaused = false;

	let events: KEventController[] = [];
	let eventsPaused = false;

	let draws: KEventController[] = [];
	let drawsPaused = false;

	let timers: (TimerController | TweenController)[] = [];
	let timersPaused = false;

	let sounds: AudioPlay[] = [];
	let soundsPaused = false;
	let disabledSounds: AudioPlay[] = []; // sounds that were disabled by sounds.paused

	let inputs: KEventController[] = [];
	let inputsPaused = false;

	const app = {
		get rootObj() {
			return gameContainer.root;
		},
		get boxObj() {
			return gameContainer.box;
		},
		get maskObj() {
			return gameContainer.mask;
		},
		get sceneObj() {
			return gameContainer.scene;
		},
		get cameraObj() {
			return gameContainer.camera;
		},

		draws: {
			get length() {
				return draws.length;
			},
			set paused(val: boolean) {
				drawsPaused = val;
				draws.forEach((d) => d.paused = drawsPaused);
			},
			get paused() {
				return drawsPaused;
			},
			add(ev) {
				draws.push(ev);
				ev.paused = this.paused;
				return ev;
			},
			cancel() {
				draws.forEach((i) => i.cancel());
				draws = [];
			},
		},

		events: {
			get length() {
				return events.length;
			},
			set paused(val: boolean) {
				eventsPaused = val;
				events.forEach((i) => i.paused = val);
			},
			get paused() {
				return eventsPaused;
			},
			add(ev) {
				events.push(ev);
				ev.paused = this.paused;
				return ev;
			},
			cancel() {
				events.forEach((i) => i.cancel());
				events = [];
			},
		},

		inputs: {
			get length() {
				return inputs.length;
			},
			set paused(val: boolean) {
				inputsPaused = val;
				inputs.forEach((i) => i.paused = val);
			},
			get paused() {
				return inputsPaused;
			},
			add(ev) {
				inputs.push(ev);
				ev.paused = this.paused;
				return ev;
			},
			cancel() {
				inputs.forEach((i) => i.cancel());
				inputs = [];
			},
		},

		timers: {
			get paused() {
				return timersPaused;
			},
			set paused(val: boolean) {
				timersPaused = val;
				timers.forEach((timer) => timer.paused = timersPaused);
			},
			get length() {
				return timers.length;
			},
			add(ev) {
				timers.push(ev);
				ev.paused = this.paused;
				return ev;
			},
			cancel() {
				timers.forEach((t) => t.cancel());
				timers = [];
			},
		},

		sounds: {
			get length() {
				return sounds.length;
			},
			get paused() {
				return soundsPaused;
			},
			set paused(val: boolean) {
				soundsPaused = val;

				if (soundsPaused == true) {
					sounds.forEach((sound) => {
						if (sound.paused) return;
						// sound is intended to play but sounds were disabled
						disabledSounds.push(sound);
						sound.paused = true;
					});
				}
				else if (soundsPaused == false) {
					disabledSounds.forEach((sound) => {
						// re enable the good sounds
						sound.paused = false;
						disabledSounds.splice(disabledSounds.indexOf(sound), 1);
					});
				}
			},
			play(src, options) {
				const sound = k.play(src, options);

				if (soundsPaused && sound.paused == false) {
					sound.paused = true;
					disabledSounds.push(sound);
				}

				sounds.push(sound);

				sound.onEnd(() => {
					sounds.splice(sounds.indexOf(sound), 1);
					if (disabledSounds.includes(sound)) disabledSounds.splice(disabledSounds.indexOf(sound), 1);
				});

				return sound;
			},
			cancel() {
				sounds.forEach((sound) => sound.stop());
				sounds = [];
			},
		},

		backgroundColor: k.rgb(),
		get paused() {
			return appPaused;
		},
		set paused(val: boolean) {
			appPaused = val;
			(this as WareApp).events.paused = appPaused;
			(this as WareApp).draws.paused = appPaused;
			(this as WareApp).timers.paused = appPaused;
			(this as WareApp).inputs.paused = appPaused;
			(this as WareApp).sounds.paused = appPaused;
			(this as WareApp).rootObj.paused = appPaused;
		},
		clearAll(this: WareApp) {
			this.events.cancel();
			this.draws.cancel();
			this.inputs.cancel();
			this.timers.cancel();
			this.sounds.cancel();
			disabledSounds.forEach((s) => s.stop());
			disabledSounds = [];
		},
		resetCamera(this: WareApp) {
			this.cameraObj.pos = k.center();
			this.cameraObj.scale = k.vec2(1);
			this.cameraObj.angle = 0;
			this.cameraObj.shake = 0;
		},
		handleQuickWatch(this: WareApp) {
			k.quickWatch("app.paused", `${this.paused}`);
			k.quickWatch("app.events", `${this.events.length} (paused: ${this.events.paused})`);
			k.quickWatch("app.draws", `${this.draws.length} (paused: ${this.draws.paused})`);
			k.quickWatch("app.sound", `${this.sounds.length} (paused: ${this.sounds.paused})`);
			k.quickWatch("app.input", `${this.inputs.length} (paused: ${this.inputs.paused})`);
			k.quickWatch("app.timers", `${this.timers.length} (paused: ${this.timers.paused})`);
		},
	} satisfies WareApp;

	gameContainer.root.onUpdate(() => {
		gameContainer.box.color = app.backgroundColor;
	});

	return app;
}
