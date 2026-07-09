import { GameObj, Vec2 } from "kaplay";
import { createMicrogame } from "../../../src/core/game_registry";

createMicrogame({
	pack: "chill",
	author: "amyspark-ng",
	name: "sort",
	prompt: "SORT!",
	duration: 7,
	hardModeOpt: {
		duration: 8,
	},
	bgColor: "a6859f",
	urlPrefix: "microgames/chill/sort/",
	iconPath: "sprites/icon.png",
	input: "mouseclick",
	boss: false,
	hideCursor: false,
	async load(ctx) {
		return Promise.all([
			...["bag", "money_bag", "bobo", "sukomi", "bean", "zombean", "kat", "marroc", "apple", "cake"].flatMap((a) => [
				// @ts-ignore
				ctx.loadCrew("sprite", a),
				// @ts-ignore
				ctx.loadCrew("sprite", `${a}-o`),
			]),

			ctx.loadCrew("sprite", "trash-o"),
			ctx.loadCrew("sprite", "egg_crack"),

			ctx.loadSprite("badapple", "../../assets/sprites/badapple.png"),
			ctx.loadSprite("badderapple", "../../assets/sprites/badderapple.png"),

			ctx.loadSpriteAtlas("sprites/shapes.png", {
				"triangle": {
					width: 58,
					height: 59,
					x: 0,
					y: 0,
				},
				"square": {
					width: 58,
					height: 59,
					x: 58 * 1,
					y: 0,
				},
				"circle": {
					width: 58,
					height: 59,
					x: 58 * 2,
					y: 0,
				},
				"triangle-o": {
					width: 58,
					height: 59,
					x: 58 * 3,
					y: 0,
				},
				"square-o": {
					width: 57,
					height: 59,
					x: 58 * 4 + 4,
					y: 0,
				},
				"circle-o": {
					width: 58,
					height: 59,
					x: 58 * 5,
					y: 0,
				},
			}),

			// TODO: the sprite was bigger than the screen because when shaking the sides are empty OF COURSEE
			ctx.loadSprite("bg", "sprites/background.png"),
			ctx.loadSprite("bg2", "sprites/background2.png"),
			ctx.loadSprite("alarm", "sprites/alarm.png"),
			ctx.loadSprite("alarmlight", "sprites/alarmlight.png"),
			ctx.loadSprite("machineback", "sprites/machineback.png"),
			ctx.loadSprite("machinefront", "sprites/machinefront.png"),
			ctx.loadSprite("conveyor", "sprites/conveyor.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSprite("boxback", "sprites/boxback.png"),
			ctx.loadSprite("boxfront", "sprites/boxfront.png"),
			ctx.loadSprite("littleguy", "sprites/littleguy.png", { sliceX: 4, sliceY: 1 }),
			ctx.loadSprite("daystext", "sprites/daystext.png", { sliceX: 3, sliceY: 1 }),
			ctx.loadSprite("flaps", "sprites/flaps.png", { sliceX: 2, sliceY: 1 }),
			ctx.loadSound("conveyor", "sounds/conveyor.ogg"),
			ctx.loadSound("box", "sounds/box.ogg"),
			ctx.loadSound("buzzer", "../../assets/sounds/buzzer.mp3"),
			ctx.loadSound("confetti", "../../assets/sounds/confetti.mp3"),
			ctx.loadSound("marker", "sounds/marker.mp3"),
			ctx.loadSound("music", "sounds/music.mp3"),
		]);
	},
	start(ctx) {
		ctx.play("music", { speed: ctx.speed });
		ctx.add([ctx.sprite(ctx.isHardMode ? "bg2" : "bg"), ctx.z(0), ctx.pos(ctx.center()), ctx.anchor("center")]);
		let lost = false;

		const shapes = ["circle", "triangle"];
		const bags = ["bag", "money_bag"];
		const beans = ["bean", "zombean"];
		const pets = ["kat", "marroc"];
		const food = ["apple", "cake"];
		const trash = ["egg_crack", "badapple", "badderapple"];

		const chosenCategory = ctx.choose([shapes, bags, beans, pets, food]);
		const isShapes = JSON.stringify(chosenCategory) == JSON.stringify(shapes);
		const A = ctx.randi();
		const variantASprite = chosenCategory[A];
		const variantBSprite = chosenCategory[A == 1 ? 0 : 1];

		const OffLight = ctx.mulfok.YELLOW.lerp(ctx.mulfok.VOID_PURPLE, 0.5);
		const OnLight = ctx.mulfok.YELLOW;

		let itemsLeftToSend = ctx.isHardMode ? ctx.randi(4, 8) : ctx.randi(2, 5);
		let itemsLeftToSort = itemsLeftToSend;
		const FINAL_ITEM_POS = ctx.vec2(482, 372);
		const ITEM_INCREASE_POS = ctx.vec2(105, 10);
		const getItemPos = (index: number) => {
			return ctx.vec2(FINAL_ITEM_POS.x - ITEM_INCREASE_POS.x * index, FINAL_ITEM_POS.y - ITEM_INCREASE_POS.y * index);
		};

		const lastItemOnRight = () => {
			// descending, which means the largest comes first
			const itemsFromRightToLeft = ctx.get("notpicked").sort((a, b) => b.pos.x - a.pos.x);
			if (!itemsFromRightToLeft[0]) return true;
			else return itemsFromRightToLeft[0].pos.x >= FINAL_ITEM_POS.x;
		};

		const getIndexRightToLeft = (item: GameObj) => {
			const itemsFromRightToLeft = ctx.get("notpicked").sort((a, b) => b.pos.x - a.pos.x);
			return itemsFromRightToLeft.indexOf(item);
		};

		let machineScale = ctx.vec2(1);
		const floor = ctx.add([
			ctx.rect(ctx.width() * 2, 40, { fill: false }),
			ctx.pos(-ctx.width() / 2, ctx.height()),
			ctx.area({ isSensor: true }),
			ctx.body({ isStatic: true }),
		]);

		const machinelight = ctx.add([ctx.rect(50, 50), ctx.z(0), ctx.color(OffLight), ctx.pos(217, 157)]);
		const machineback = ctx.add([ctx.sprite("machineback"), ctx.z(0), ctx.anchor("bot"), ctx.pos(140, 490), ctx.z(0), ctx.scale()]);
		const conveyor = ctx.add([ctx.sprite("conveyor"), ctx.pos(189, 314), ctx.z(1), { vroom: false }]);
		const conveyorfloor = ctx.add([ctx.rect(350, 10, { fill: false }), ctx.pos(220, 370), ctx.z(1), ctx.area(), ctx.body({ gravityScale: 0, isStatic: true }), "floor"]);
		const machinefront = ctx.add([ctx.sprite("machinefront"), ctx.z(1), ctx.anchor("bot"), ctx.pos(machineback.pos), ctx.z(2), ctx.scale()]);

		const daystext = ctx.add([ctx.sprite("daystext"), ctx.pos(530, 200), ctx.anchor("center"), ctx.scale()]);
		const alarmlight = ctx.add([ctx.sprite("alarmlight"), ctx.z(0), ctx.pos(500, 29), ctx.anchor("center"), ctx.color(ctx.mulfok.YELLOW)]);
		ctx.add([ctx.sprite("alarm"), ctx.z(0), ctx.pos(500, 29), ctx.anchor("center")]);
		const littleguy = ctx.add([ctx.sprite("littleguy"), ctx.scale(), ctx.pos(397, 389), ctx.z(conveyor.z - 1), ctx.anchor("bot")]);

		function finishGame(won: boolean) {
			if (ctx.getResult()) return;
			if (won) ctx.setResult("win");
			else ctx.setResult("lose");

			if (won) {
				littleguy.frame = 1;
				ctx.play("marker");

				ctx.wait(0.35 / ctx.speed, () => {
					daystext.frame = 1;
					littleguy.frame = 0;
					ctx.wait(0.35 / ctx.speed, () => {
						littleguy.frame = 2;
						ctx.addConfetti({ pos: ctx.vec2(ctx.center().x, ctx.height()) });
						ctx.play("confetti", { detune: ctx.rand(-50, 50) });
					});
				});
				const flash = ctx.add([ctx.rect(ctx.width(), ctx.height()), ctx.color(ctx.mulfok.GREEN), ctx.opacity(0.5), ctx.z(100)]);
				flash.fadeOut(0.5).onEnd(() => flash.destroy());
				ctx.tween(machinelight.color, ctx.mulfok.GREEN, 1 / ctx.speed, (p) => machinelight.color = p, ctx.easings.easeOutQuint);
				ctx.tween(alarmlight.color, ctx.mulfok.GREEN, 1 / ctx.speed, (p) => alarmlight.color = p, ctx.easings.easeOutQuint);
			}
			else {
				lost = true;
				littleguy.frame = 1;
				ctx.play("marker");
				ctx.wait(0.35 / ctx.speed, () => {
					littleguy.frame = 0;
					daystext.frame = 2;

					ctx.wait(0.35 / ctx.speed, () => {
						littleguy.frame = 3;
						littleguy.onUpdate(() => {
							littleguy.scale.y = ctx.lerp(littleguy.scale.y, ctx.rand(0.8, 1.2), 0.1);
						});
					});
				});

				function playSound() {
					ctx.shake();
					const flash = ctx.add([ctx.rect(ctx.width(), ctx.height()), ctx.color(ctx.RED), ctx.opacity(0.5), ctx.z(100)]);
					flash.fadeOut(0.5).onEnd(() => flash.destroy());
					ctx.tween(ctx.mulfok.RED, ctx.mulfok.YELLOW, 1 / ctx.speed, (p) => machinelight.color = p, ctx.easings.easeOutQuint);
					ctx.tween(ctx.mulfok.RED, ctx.mulfok.YELLOW, 1 / ctx.speed, (p) => alarmlight.color = p, ctx.easings.easeOutQuint);
					const sound = ctx.play("buzzer");
					ctx.wait(sound.duration() / ctx.speed * 2, () => playSound());
				}

				machineback.onUpdate(() => {
					machineScale.y = ctx.lerp(machineScale.y, ctx.rand(0.9, 1.1), 0.1);
				});

				playSound();
			}

			ctx.wait(1.5 / ctx.speed, () => {
				ctx.finishGame();
			});
		}

		function addBox(stampSprite: string, pos: Vec2, spriteWhitelist: string[]) {
			const box = ctx.add([
				ctx.scale(),
				ctx.rect(150, 100, { fill: false }),
				ctx.pos(pos),
				ctx.area({ isSensor: true, offset: ctx.vec2(-25, 50), scale: ctx.vec2(0.8) }),
				ctx.anchor("bot"),
				"box",
				{
					// if there are no more items that include the box.spriteWhiteList
					// IN GENERAL not only in screen, might have to make like a list or something to accurately know
					// or just check if no more items to send chajaj

					get closed() {
						return ctx.get("item").concat(...ctx.get("dragitem")).filter((obj) => spriteWhitelist.includes(obj.sprite)).length == 0 && itemsLeftToSend == 0;
					},
					spriteWhitelist,
					addItem(item: GameObj) {
					},
				},
			]);

			const boxback = box.add([
				ctx.sprite("boxback"),
				ctx.anchor("top"),
				ctx.z(2),
				ctx.scale(1.01),
				ctx.pos(2, -box.height + 1),
			]);

			const boxfront = boxback.add([
				ctx.sprite("boxfront"),
				ctx.anchor("top"),
				ctx.z(3),
				ctx.pos(2),
			]);

			const flaps = box.add([
				ctx.sprite("flaps"),
				ctx.anchor("top"),
				ctx.pos(5, -115),
				ctx.z(4),
			]);

			const stamp = boxfront.add([
				ctx.sprite(stampSprite + "-o"),
				ctx.anchor("top"),
				ctx.pos(ctx.vec2(-20, 85).add(ctx.rand(4))),
				ctx.z(5),
				ctx.scale(0.95),
			]);

			box.addItem = (item: GameObj) => {
				itemsLeftToSort--;
				ctx.play("box", { detune: ctx.rand(-50, 50) });

				if (!box.spriteWhitelist.includes(item.sprite)) finishGame(false);
				if (itemsLeftToSort == 0 && !lost) finishGame(true);
				ctx.tween(0.6, 1, 0.35 / ctx.speed, (p) => box.scale.y = p, ctx.easings.easeOutQuint);

				const boxeditem = boxback.add([
					ctx.sprite(item.sprite),
					ctx.anchor("center"),
					ctx.rotate(ctx.rand(-20, 20)),
					ctx.pos(ctx.rand(-50, 50), ctx.rand(50, 55)),
					ctx.z(2),
				]);

				if (box.closed) flaps.frame = 1;
			};

			return box;
		}

		function scrollConveyor() {
			ctx.play("conveyor", { detune: ctx.rand(-50, 50) });
			conveyor.vroom = true;
			ctx.tween(0.9, 1, 0.5 / ctx.speed, (p) => machineScale.y = p, ctx.easings.easeOutQuint);
			ctx.tween(OnLight, OffLight, 1 / ctx.speed, (p) => machinelight.color = p, ctx.easings.easeOutQuint);

			const duration = 0.25;
			ctx.get("notpicked").sort((a, b) => b.pos.x - a.pos.x).forEach((item, index, arr) => {
				if (item.pos == getItemPos(index)) return;
				ctx.tween(ctx.rand(30, 20), 0, duration / ctx.speed, (p) => item.angle = p, ctx.easings.easeOutBack);
				ctx.tween(item.pos, getItemPos(index), duration / ctx.speed, (p) => item.pos = p);
			});

			// there's still items left
			if (itemsLeftToSend > 0 && ctx.get("notpicked").length < 3) {
				const item = addItem();
				const index = getIndexRightToLeft(item);
				item.pos = getItemPos(index + 1); // does + 1 so it goes more into the left
				ctx.tween(item.pos, getItemPos(index), duration / ctx.speed, (p) => item.pos = p);
				scrollConveyor();
				itemsLeftToSend--;
			}

			ctx.wait(0.5 / ctx.speed, () => {
				conveyor.vroom = false;
			});
		}

		function addItem() {
			let list = [variantASprite, variantBSprite];
			if (ctx.isHardMode) list = isShapes ? list.concat("square") : list.concat(...trash);

			const item = ctx.add([
				ctx.sprite(ctx.choose(list)),
				ctx.pos(90, 340),
				ctx.anchor("bot"),
				ctx.z(1),
				ctx.area({ scale: ctx.vec2(1.5), cursor: "" }),
				ctx.rotate(),
				"item",
				"notpicked",
			]);

			item.onClick(() => {
				if (!item.exists() || lost) return;
				item.destroy();
				if (!lastItemOnRight() || itemsLeftToSend > 0) scrollConveyor();

				const draggedItem = ctx.add([
					ctx.sprite(item.sprite),
					ctx.pos(item.pos.sub(0, item.height / 2)),
					ctx.scale(),
					ctx.area({ collisionIgnore: ["dragitem"] }),
					ctx.drag(),
					ctx.anchor("center"),
					ctx.body(),
					ctx.rotate(0),
					ctx.z(5),
					"dragitem",
					"item",
				]);

				let xAcceleration = 0;
				let yAcceleration = 0;
				let rotation = 0;

				// starts picked
				draggedItem.pick();

				// this is when you let it fall down and repick it up
				draggedItem.onButtonPress(() => {
					if (!draggedItem.isHovering()) return;
					if (lost) return;
					draggedItem.pick();
				});

				let hasCollided = false;
				draggedItem.onCollideUpdate("box", (box: GameObj) => {
					// if get items from that sprite on the box stamp is 0 (which means is closed)
					if (hasCollided || box.closed) return;
					hasCollided = true;
					draggedItem.destroy();
					box.addItem(item);
				});

				draggedItem.onUpdate(() => {
					if (draggedItem.dragging) {
						rotation = ctx.lerp(ctx.mouseDeltaPos().x / 1.25, 0, 0.5);
						draggedItem.angle = rotation;
					}

					draggedItem.pos.x = ctx.clamp(draggedItem.pos.x, 30, ctx.width() - 30);

					if (lost) draggedItem.area.cursor = null;

					xAcceleration = ctx.lerp(xAcceleration, 0, 0.25);
					draggedItem.pos.x += xAcceleration;

					if (draggedItem.dragging) {
						draggedItem.scale = ctx.lerp(draggedItem.scale, ctx.vec2(1.5), 0.5);
					}
					else {
						draggedItem.scale = ctx.lerp(draggedItem.scale, ctx.vec2(1), 0.5);
					}

					if (draggedItem.dragging) {
						draggedItem.collisionIgnore = ["floor"];
						draggedItem.area.scale = ctx.vec2(0.5);
					}
					else {
						draggedItem.collisionIgnore = ["dragitem"];
						draggedItem.area.scale = ctx.vec2(1);
					}

					if (!draggedItem.dragging) {
						if (draggedItem.isColliding(floor) || draggedItem.isColliding(conveyorfloor)) yAcceleration = 0;
						else yAcceleration = ctx.lerp(yAcceleration, 25, 0.05);
						draggedItem.pos.y += yAcceleration;
					}

					if (ctx.isButtonReleased("click")) {
						xAcceleration = ctx.mouseDeltaPos().x / 2;
						draggedItem.drop();
					}
				});
			});

			return item;
		}

		ctx.add([]).onUpdate(() => {
			if (conveyor.vroom) conveyor.frame = Math.floor((ctx.time() * 5 * ctx.speed) % 2);
			machinefront.scale = machineScale;
			machineback.scale = machineScale;
		});

		ctx.onTimeout(() => {
			if (itemsLeftToSort > 0 && !lost) finishGame(false);
		});

		const initialItemsLength = ctx.clamp(itemsLeftToSend, 0, 3);
		for (let i = 0; i < initialItemsLength; i++) {
			const item = addItem();
			item.pos = getItemPos(i);
			itemsLeftToSend--;
		}

		addBox(variantASprite, ctx.vec2(120, 520), [variantASprite]);
		addBox(variantBSprite, ctx.vec2(670, 520), [variantBSprite]);

		if (ctx.isHardMode) {
			if (isShapes) addBox("square", ctx.vec2(400, 530), ["square"]);
			else addBox("trash", ctx.vec2(400, 530), trash);
		}
	},
});
