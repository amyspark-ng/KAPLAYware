import { GameObj, Vec2 } from "kaplay";
import { createMicrogame } from "../../../src/registry";

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
	load(ctx) {
		const list = ["bag", "money_bag", "bobo", "sukomi", "bean", "zombean", "kat", "marroc", "apple", "cake"] as const;
		list.forEach((a) => {
			ctx.loadCrew("sprite", a);
			// @ts-ignore
			ctx.loadCrew("sprite", a + "-o");
		});

		ctx.loadCrew("sprite", "trash-o");
		ctx.loadCrew("sprite", "egg_crack");
		ctx.loadSprite("badapple", "../../assets/sprites/badapple.png");
		ctx.loadSprite("badderapple", "../../assets/sprites/badderapple.png");

		ctx.loadSprite("bg", "sprites/background.png");
		ctx.loadSprite("machineback", "sprites/machineback.png");
		ctx.loadSprite("machinefront", "sprites/machinefront.png");
		ctx.loadSprite("conveyor", "sprites/conveyor.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("boxback", "sprites/boxback.png");
		ctx.loadSprite("boxfront", "sprites/boxfront.png");
		ctx.loadSprite("circle", "sprites/circle.png");
		ctx.loadSprite("circle-o", "sprites/circle-o.png");
		ctx.loadSprite("triangle", "sprites/triangle.png");
		ctx.loadSprite("triangle-o", "sprites/triangle-o.png");
		ctx.loadSprite("littleguy", "sprites/littleguy.png", { sliceX: 3, sliceY: 1 });
		ctx.loadSprite("daystext", "sprites/daystext.png", { sliceX: 3, sliceY: 1 });
		ctx.loadSound("conveyor", "sounds/conveyor.ogg");
		ctx.loadSound("box", "sounds/box.ogg");
		ctx.loadSound("buzzer", "../../assets/sounds/buzzer.mp3");
		ctx.loadSound("confetti", "../../assets/sounds/confetti.mp3");
		ctx.loadSound("music", "sounds/music.mp3");
	},
	start(ctx) {
		ctx.play("music", { speed: ctx.speed });
		const game = ctx.add([ctx.timer()]);
		ctx.add([ctx.sprite("bg"), ctx.z(0), ctx.pos(ctx.center()), ctx.anchor("center")]);
		let lost = false;

		const shapes = ["circle", "triangle"];
		const bags = ["bag", "money_bag"];
		const beans = ["bean", "zombean"];
		const pets = ["kat", "marroc"];
		const food = ["apple", "cake"];
		const trash = ["egg_crack", "badapple", "badderapple"];

		const chosenCategory = ctx.choose([shapes, bags, beans, pets, food]);
		const variant1Sprite = chosenCategory[0];
		const variant2Sprite = chosenCategory[1];

		const OffLight = ctx.mulfok.YELLOW.lerp(ctx.mulfok.VOID_PURPLE, 0.5);
		const OnLight = ctx.mulfok.YELLOW;

		let itemsLeftToSend = ctx.randi(2, ctx.isHardMode ? 7 : 5);
		let itemsLeftToSort = itemsLeftToSend;
		const FINAL_ITEM_POS = ctx.vec2(482, 372);
		const ITEM_INCREASE_POS = ctx.vec2(105, 10);
		const getItemPos = (index: number) => {
			return ctx.vec2(FINAL_ITEM_POS.x - ITEM_INCREASE_POS.x * index, FINAL_ITEM_POS.y - ITEM_INCREASE_POS.y * index);
		};

		const lastItemOnRight = () => {
			// descending, which means the largest comes first
			const itemsFromRightToLeft = ctx.get("item").sort((a, b) => b.pos.x - a.pos.x);
			if (!itemsFromRightToLeft[0]) return true;
			else return itemsFromRightToLeft[0].pos.x >= FINAL_ITEM_POS.x;
		};

		const getIndexRightToLeft = (item: GameObj) => {
			const itemsFromRightToLeft = ctx.get("item").sort((a, b) => b.pos.x - a.pos.x);
			return itemsFromRightToLeft.indexOf(item);
		};

		let machineScale = ctx.vec2(1);
		const floor = ctx.add([
			ctx.rect(ctx.width() * 2, 40, { fill: false }),
			ctx.pos(-ctx.width() / 2, ctx.height()),
			ctx.area({ isSensor: true }),
			ctx.body({ isStatic: true }),
		]);

		const light = ctx.add([ctx.rect(50, 50), ctx.z(0), ctx.color(OffLight), ctx.pos(217, 157)]);
		const machineback = ctx.add([ctx.sprite("machineback"), ctx.z(2), ctx.anchor("bot"), ctx.pos(140, 490), ctx.z(0), ctx.scale()]);
		const conveyor = ctx.add([ctx.sprite("conveyor"), ctx.pos(189, 314), ctx.z(1), { vroom: false }]);
		const machinefront = ctx.add([ctx.sprite("machinefront"), ctx.z(3), ctx.anchor("bot"), ctx.pos(machineback.pos), ctx.z(2), ctx.scale()]);

		const littleguy = ctx.add([ctx.sprite("littleguy"), ctx.pos(397, 389), ctx.z(conveyor.z - 1), ctx.anchor("bot")]);
		const daystext = ctx.add([ctx.sprite("daystext"), ctx.pos(518, 102), ctx.anchor("center"), ctx.scale()]);

		function finishctx(won: boolean) {
			if (ctx.getResult()) return;
			if (won) ctx.setResult("win");
			else ctx.setResult("lose");

			if (won) {
				ctx.addConfetti({ pos: ctx.vec2(ctx.center().x, ctx.height()) });
				ctx.play("confetti", { detune: ctx.rand(-50, 50) });
				littleguy.frame = 1;
				daystext.frame = 1;
				game.tween(light.color, ctx.mulfok.GREEN, 1 / ctx.speed, (p) => light.color = p, ctx.easings.easeOutQuint);
			}
			else {
				lost = true;
				littleguy.frame = 2;
				daystext.frame = 2;
				game.tween(light.color, ctx.mulfok.RED, 1 / ctx.speed, (p) => light.color = p, ctx.easings.easeOutQuint);
				function playSound() {
					ctx.shake();
					const flash = ctx.add([ctx.rect(ctx.width(), ctx.height()), ctx.color(ctx.RED), ctx.opacity(0.5), ctx.z(100)]);
					flash.fadeOut(0.5).onEnd(() => flash.destroy());
					const sound = ctx.play("buzzer");
					game.wait(sound.duration() / ctx.speed * 2, () => playSound());
				}

				game.onUpdate(() => {
					machineScale.y = ctx.lerp(machineScale.y, ctx.rand(0.9, 1.1), 0.1);
				});

				playSound();
			}

			game.wait(1.5 / ctx.speed, () => {
				ctx.finishGame();
			});
		}

		function addBox(stampSprite: string, pos: Vec2, spriteWhitelist: string[]) {
			const box = ctx.add([
				ctx.scale(),
				ctx.rect(150, 100, { fill: false }),
				ctx.pos(pos),
				ctx.area({ isSensor: true, offset: ctx.vec2(-25, 50) }),
				ctx.anchor("bot"),
				"box",
				{
					spriteWhitelist,
					addItem(item: GameObj) {
					},
				},
			]);

			const boxback = box.add([
				ctx.sprite("boxback"),
				ctx.anchor("top"),
				ctx.z(0),
				ctx.scale(1.01),
				ctx.pos(0, -box.height),
			]);

			const boxfront = boxback.add([
				ctx.sprite("boxfront"),
				ctx.anchor("top"),
				ctx.z(1),
				ctx.pos(0),
			]);

			const stamp = boxfront.add([
				ctx.sprite(stampSprite + "-o"),
				ctx.anchor("top"),
				ctx.pos(ctx.vec2(-25, 75).add(ctx.rand(2))),
				ctx.z(10),
				ctx.scale(0.95),
			]);

			box.addItem = (item: GameObj) => {
				itemsLeftToSort--;
				ctx.play("box", { detune: ctx.rand(-50, 50) });

				if (!box.spriteWhitelist.includes(item.sprite)) finishctx(false);
				if (itemsLeftToSort == 0 && !lost) finishctx(true);
				game.tween(0.6, 1, 0.35 / ctx.speed, (p) => box.scale.y = p, ctx.easings.easeOutQuint);

				const boxeditem = boxback.add([
					ctx.sprite(item.sprite),
					ctx.anchor("center"),
					ctx.rotate(ctx.rand(-20, 20)),
					ctx.pos(ctx.rand(-50, 50), ctx.rand(50, 55)),
				]);
			};

			return box;
		}

		function scrollConveyor() {
			ctx.play("conveyor", { detune: ctx.rand(-50, 50) });
			conveyor.vroom = true;
			game.tween(0.9, 1, 0.5 / ctx.speed, (p) => machineScale.y = p, ctx.easings.easeOutQuint);
			game.tween(OnLight, OffLight, 1 / ctx.speed, (p) => light.color = p, ctx.easings.easeOutQuint);

			const duration = 0.25;
			ctx.get("item").sort((a, b) => b.pos.x - a.pos.x).forEach((item, index, arr) => {
				if (item.pos == getItemPos(index)) return;
				game.tween(ctx.rand(30, 20), 0, duration / ctx.speed, (p) => item.angle = p, ctx.easings.easeOutBack);
				game.tween(item.pos, getItemPos(index), duration / ctx.speed, (p) => item.pos = p);
			});

			// there's still items left
			if (itemsLeftToSend > 0 && ctx.get("item").length < 3) {
				const item = addItem();
				const index = getIndexRightToLeft(item);
				item.pos = getItemPos(index + 1); // does + 1 so it goes more into the left
				game.tween(item.pos, getItemPos(index), duration / ctx.speed, (p) => item.pos = p);
				scrollConveyor();
				itemsLeftToSend--;
			}

			game.wait(0.5 / ctx.speed, () => {
				conveyor.vroom = false;
			});
		}

		function addItem() {
			let list = [variant1Sprite, variant2Sprite];
			if (ctx.isHardMode) list = list.concat(...trash);

			const item = ctx.add([
				ctx.sprite(ctx.choose(list)),
				ctx.pos(90, 340),
				ctx.anchor("bot"),
				ctx.z(1),
				ctx.area({ scale: ctx.vec2(1.5) }),
				ctx.rotate(),
				"item",
			]);

			item.onClick(() => {
				if (!item.exists() || lost) return;
				item.destroy();
				if (!lastItemOnRight() || itemsLeftToSend > 0) scrollConveyor();

				const draggedItem = ctx.add([
					ctx.sprite(item.sprite),
					ctx.pos(item.pos.sub(0, item.height / 2)),
					ctx.drag(),
					ctx.scale(),
					ctx.area({ collisionIgnore: ["dragitem"] }),
					ctx.anchor("center"),
					ctx.body(),
					ctx.rotate(0),
					ctx.z(5),
					"dragitem",
				]);

				let xAcceleration = 0;
				let yAcceleration = 0;
				let rotation = 0;
				draggedItem.pick();
				draggedItem.onClick(() => draggedItem.pick());

				let hasCollided = false;
				draggedItem.onCollideUpdate("box", (box: GameObj) => {
					if (draggedItem.dragging) return;
					if (hasCollided) return;
					hasCollided = true;
					draggedItem.destroy();
					box.addItem(item);
				});

				draggedItem.onUpdate(() => {
					if (draggedItem.dragging) {
						rotation = ctx.lerp(ctx.mouseDeltaPos().x / 1.25, 0, 0.5);
						draggedItem.angle = rotation;
					}

					xAcceleration = ctx.lerp(xAcceleration, 0, 0.25);
					draggedItem.pos.x += xAcceleration;

					if (draggedItem.dragging) draggedItem.scale = ctx.lerp(draggedItem.scale, ctx.vec2(1.5), 0.5);
					else draggedItem.scale = ctx.lerp(draggedItem.scale, ctx.vec2(1), 0.5);
					if (!draggedItem.dragging) {
						if (draggedItem.isColliding(floor)) yAcceleration = 0;
						else yAcceleration = ctx.lerp(yAcceleration, 20, 0.1);
						draggedItem.pos.y += yAcceleration;
					}

					if (ctx.isButtonReleased("action")) {
						xAcceleration = ctx.mouseDeltaPos().x / 2;
						draggedItem.drop();
					}
				});
			});

			return item;
		}

		game.onUpdate(() => {
			if (conveyor.vroom) conveyor.frame = Math.floor((ctx.time() * 5 * ctx.speed) % 2);
			machinefront.scale = machineScale;
			machineback.scale = machineScale;
		});

		ctx.onTimeout(() => {
			if (itemsLeftToSort > 0 && !lost) finishctx(false);
		});

		const initialItemsLength = ctx.clamp(itemsLeftToSend, 0, 3);
		for (let i = 0; i < initialItemsLength; i++) {
			const item = addItem();
			item.pos = getItemPos(i);
			itemsLeftToSend--;
		}

		addBox(variant1Sprite, ctx.vec2(540, 520), [variant1Sprite]);
		addBox(variant2Sprite, ctx.vec2(720, 520), [variant2Sprite]);

		if (ctx.isHardMode) {
			addBox("trash", ctx.vec2(300, 540), trash);
		}
	},
});
