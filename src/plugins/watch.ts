import { KAPLAYCtx } from "kaplay";

export default function watchPlugin(k: KAPLAYCtx) {
	/** An entry in the watch window */
	type WatchEntry = {
		/** The object being watched */
		obj: any;
		/** The property in the object that is being watched */
		prop: string | number | symbol;
		/** The custom name the property is being showed as */
		customName?: string;
		/** Wheter the watch will be dropped when the scene is changed */
		stay: boolean;
		/** The args that are passed when the prop is a function */
		args?: any[];
		/** Removes the watch from the watch window */
		remove(): void;
	};

	/** A quick entry in the watch window */
	type QuickWatchEntry = {
		/** The value that is being displayed */
		value: number | boolean | string;
		/** The name the value is being desplayed as */
		name: string;
		/** Wheter the watch should stay when the scene is switched */
		stay: boolean;
		/** Remove the watch from the watch window */
		remove(): void;
	};

	const watches: WatchEntry[] = [];
	const quickWatches: QuickWatchEntry[] = [];

	const createPlugin = (k: KAPLAYCtx) => {
		const manager = k.add([k.stay(), k.z(9999999)]);

		k.onSceneLeave(() => {
			watches.forEach((w) => !w.stay ? w.remove() : false);
			quickWatches.forEach((qw) => !qw.stay ? qw.remove() : false);
		});

		const pad = 8;

		manager.onDraw(() => {
			if (!k.debug.inspect || watches.length + quickWatches.length < 1) return;
			let watchesText: string = "";

			watches.forEach((watch, index) => {
				const title = watch.customName ? watch.customName : watch.prop.toString();
				const value = typeof watch.obj[watch.prop] == "function" ? watch.obj[watch.prop](...watch.args) : watch.obj[watch.prop];
				watchesText += `${title}: ${value}\n`;
			});

			quickWatches.forEach((watch) => {
				watchesText += `${watch.name}: ${watch.value}\n`;
			});

			const ftxt = k.formatText({
				text: watchesText,
				font: "monospace",
				size: 16,
				width: 300,
				pos: k.vec2(),
				align: "left",
				lineSpacing: 4,
				color: k.WHITE,
				fixed: true,
			});

			const bw = ftxt.width + pad * 2;
			const bh = ftxt.height + pad;

			k.drawRect({
				width: bw,
				height: bh,
				color: k.BLACK,
				radius: 4,
				pos: k.vec2(k.width() - bw - 15, 10),
				opacity: 0.8,
				fixed: true,
			});

			k.drawFormattedText({
				...ftxt,
				opt: {
					text: ftxt.opt.text,
					pos: k.vec2(pad).add(k.vec2(k.width() - bw - 15, 10)),
				},
			});
		});

		/** Additional options for the watch */
		type WatchOpts = {
			/** The custom name the property will be shown as */
			customName?: string;
			/** Wheter the watch should be dropped when the scene is changed */
			stay?: boolean;
		};

		return {
			/** Watch a `property` from an `obj`, this adds it to a list that can be accessed with the debug key
			 * @param obj The object to be watched
			 * @param prop The property of the object to watch
			 * @param opts Extra options to watch
			 * @param args The args to pass if the property is a method of the obj
			 * @example
			 * ```ts
			 * const bean = add([k.sprite("bean"), {
			 * 		eat(cals: number) {
			 * 			return "Ate " + cals + " calories.";
			 * 		}
			 * }])
			 *
			 * // Watches bean's frame, gets removed when the scene is changed and will appear as "beanFrame"
			 * k.watch(bean, "frame", { stay: false, customName: "beanFrame" });
			 *
			 * // Watches bean's eat method, gets removed when the scene is changed and appears as "caloriesEaten"
			 * // Will show the return of bean.eat(130);
			 * k.watch(bean, "eat", { stay: false, customName: "caloriesEaten" }, 130);
			 * ```
			 * @returns The {@link WatchEntry `WatchEntry`}
			 */
			watch<T extends any, R extends keyof T>(obj: T, prop: R, opts?: WatchOpts, ...args: T[R] extends (...args: infer P) => any ? P : []): WatchEntry {
				opts = opts ?? {};
				opts.stay = opts.stay ?? false;
				const watch = {
					obj,
					prop,
					args,
					stay: opts.stay,
					customName: opts.customName,
					remove() {
						watches.splice(watches.indexOf(this), 1);
					},
				} as WatchEntry;
				watches.push(watch);
				return watch;
			},
			/** Adds a `watch()` for `k.mousePos()`, will appear as "mousePos"
			 * @returns The {@link WatchEntry `WatchEntry`}
			 */
			watchMouse() {
				return this.watch(k, "mousePos", { stay: true, customName: "mousePos" });
			},
			/** Adds a watch that doesn't require the reference of an object, it should be called on update and can only be removed if you stop calling it
			 * @param name The name to display
			 * @param value The value to display
			 * @param stay Wheter the quickWatch should stay when the scene is changed
			 * @example
			 * ```ts
			 * let leftKeyDown = k.quickWatch("isLeftKeyDown", k.isKeyDown("left"))
			 * let keepWatch = true
			 * k.onUpdate(() => {
			 * 		if (keepWatch) {
			 * 			leftKeyDown = k.quickWatch("isLeftKeyDown", k.isKeyDown("left")) // This will update the watch
			 * 		}
			 *
			 * 		if (k.isKeyPressed("q")) {
			 * 			keepWatch = false // This will stop it from being updated
			 * 			leftKeyDown.remove() // This will remove it from the watch window
			 * 		}
			 * })
			 * ```
			 */
			quickWatch(name: string, value: number | boolean | string, stay: boolean = false) {
				const qw = {
					value,
					name,
					stay,
					remove() {
						quickWatches.splice(quickWatches.indexOf(qw), 1);
					},
				} as QuickWatchEntry;

				const names = quickWatches.map((qw) => qw.name);
				if (names.includes(name)) quickWatches.find((watch) => watch.name == name).value = value;
				else {
					quickWatches.push(qw);
				}
				return qw;
			},
		};
	};
	return createPlugin(k);
}
