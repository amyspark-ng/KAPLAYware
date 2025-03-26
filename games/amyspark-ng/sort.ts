import { GameObj, Vec2 } from "kaplay";
import { Minigame } from "../../src/game/types.ts";
import mulfokColors from "../../src/plugins/colors.ts";

// almost 300 lines of pure unadultered pain that took me a whole day to write
const sortGame: Minigame = {
	prompt: "sort",
	author: "amyspark-ng",
	// duration: (ctx) => ctx.difficulty == 3 ? 7 : 6,
	rgb: [166, 133, 159],
	duration: 9999,
	input: { cursor: { hide: false } },
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("bg", "sprites/sort/background.png");
		ctx.loadSprite("machineback", "sprites/sort/machineback.png");
		ctx.loadSprite("machinefront", "sprites/sort/machinefront.png");
		ctx.loadSprite("conveyor", "sprites/sort/conveyor.png", { sliceX: 2, sliceY: 1 });
		ctx.loadSprite("boxback", "sprites/sort/boxback.png");
		ctx.loadSprite("boxfront", "sprites/sort/boxfront.png");
		ctx.loadSprite("circle", "sprites/sort/circle.png");
		ctx.loadSprite("circle-o", "sprites/sort/circle-o.png");
		ctx.loadSprite("triangle", "sprites/sort/triangle.png");
		ctx.loadSprite("triangle-o", "sprites/sort/triangle-o.png");
		ctx.loadSprite("littleguy", "sprites/sort/littleguy.png", { sliceX: 3, sliceY: 1 });
		ctx.loadSprite("daystext", "sprites/sort/daystext.png", { sliceX: 3, sliceY: 1 });
		ctx.loadSound("buzzer", "sounds/buzzer.mp3");
		ctx.loadSound("conveyor", "sounds/conveyor.ogg");
		ctx.loadSound("box", "sounds/box.ogg");
		ctx.loadSound("confetti", "sounds/confetti.mp3");
	},
	start(ctx) {
		const game = ctx.make();
		game.add([ctx.sprite("bg"), ctx.z(-5), ctx.pos(ctx.center()), ctx.anchor("center")]);
		let lost = false;

		const getItemCategory = () => {
			if (ctx.chance(0.15)) return "shapes";
			else return ctx.choose(["bag", "fish", "beans", "pets", "food"]);
		};
		const getVariants = (category: string) => {
			if (category == "bag") return ["@bag", "@money_bag"];
			else if (category == "fish") return ["@bobo", "@sukomi"];
			else if (category == "beans") return ["@bean", "@zombean"];
			else if (category == "pets") return ["@kat", "@marroc"];
			else if (category == "food") return ["@apple", "@cake"];
			else return ["circle", "triangle"];
		};

		const ITEM_CATEGORY = getItemCategory();
		const variant1Sprite = getVariants(ITEM_CATEGORY)[0];
		const variant2Sprite = getVariants(ITEM_CATEGORY)[1];

		const OffLight = mulfokColors.YELLOW.lerp(mulfokColors.VOID_PURPLE, 0.5);
		const OnLight = mulfokColors.YELLOW;

		let itemsLeftToSend = ctx.difficulty * 2;
		let itemsLeftToSort = itemsLeftToSend;
		const FINAL_ITEM_POS = ctx.vec2(482, 372);
		const ITEM_INCREASE_POS = ctx.vec2(105, 10);
		const getItemPos = (index: number) => {
			return ctx.vec2(FINAL_ITEM_POS.x - ITEM_INCREASE_POS.x * index, FINAL_ITEM_POS.y - ITEM_INCREASE_POS.y * index);
		};

		const lastItemOnRight = () => {
			// descending, which means the largest comes first
			const itemsFromRightToLeft = game.get("item").sort((a, b) => b.pos.x - a.pos.x);
			if (!itemsFromRightToLeft[0]) return true;
			else return itemsFromRightToLeft[0].pos.x >= FINAL_ITEM_POS.x;
		};

		const getIndexRightToLeft = (item: GameObj) => {
			const itemsFromRightToLeft = game.get("item").sort((a, b) => b.pos.x - a.pos.x);
			return itemsFromRightToLeft.indexOf(item);
		};

		let machineScale = ctx.vec2(1);
		const ground = game.add([ctx.rect(ctx.width(), 40, { fill: false }), ctx.pos(0, ctx.height()), ctx.area(), ctx.body({ isStatic: true })]);
		const light = game.add([ctx.rect(50, 50), ctx.color(OffLight), ctx.pos(217, 157)]);
		const machineback = game.add([ctx.sprite("machineback"), ctx.anchor("bot"), ctx.pos(140, 490), ctx.z(0), ctx.scale()]);
		const conveyor = game.add([ctx.sprite("conveyor"), ctx.pos(189, 314), ctx.z(0), { vroom: false }]);
		const machinefront = game.add([ctx.sprite("machinefront"), ctx.anchor("bot"), ctx.pos(machineback.pos), ctx.z(2), ctx.scale()]);

		const littleguy = game.add([ctx.sprite("littleguy"), ctx.pos(397, 389), ctx.z(conveyor.z - 1), ctx.anchor("bot")]);
		const daystext = game.add([ctx.sprite("daystext"), ctx.pos(518, 102), ctx.anchor("center"), ctx.scale()]);

		function finishGame(won: boolean) {
			if (won) ctx.win();
			else ctx.lose();

			if (won) {
				ctx.addConfetti({ pos: ctx.vec2(ctx.center().x, ctx.height()) });
				ctx.play("confetti", { detune: ctx.rand(-50, 50) });
				littleguy.frame = 1;
				daystext.frame = 1;
				ctx.tween(light.color, mulfokColors.GREEN, 1 / ctx.speed, (p) => light.color = p, ctx.easings.easeOutQuint);
			}
			else {
				lost = true;
				littleguy.frame = 2;
				daystext.frame = 2;
				ctx.tween(light.color, mulfokColors.RED, 1 / ctx.speed, (p) => light.color = p, ctx.easings.easeOutQuint);
				function playSound() {
					ctx.shakeCam();
					ctx.flashCam(ctx.RED, 0.15, 0.5);
					const sound = ctx.play("buzzer");
					ctx.wait(sound.duration() / ctx.speed * 2, () => playSound());
				}

				game.onUpdate(() => {
					machineScale.y = ctx.lerp(machineScale.y, ctx.rand(0.9, 1.1), 0.1);
				});

				playSound();
			}

			ctx.wait(1.5 / ctx.speed, () => {
				ctx.finish();
			});
		}

		function addBox(spriteID: string, pos: Vec2) {
			const box = game.add([
				ctx.scale(),
				ctx.rect(150, 100, { fill: false }),
				ctx.pos(pos),
				ctx.area({ offset: ctx.vec2(-25, 50) }),
				ctx.anchor("bot"),
				"box",
				{
					spriteID,
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
				ctx.sprite(spriteID + "-o"),
				ctx.anchor("top"),
				ctx.pos(-25, 75),
			]);

			box.addItem = (item: GameObj) => {
				itemsLeftToSort--;
				ctx.play("box", { detune: ctx.rand(-50, 50) });

				if (item.sprite != box.spriteID) finishGame(false);
				if (itemsLeftToSort == 0 && !lost) finishGame(true);
				ctx.tween(0.6, 1, 0.35 / ctx.speed, (p) => box.scale.y = p, ctx.easings.easeOutQuint);

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
			ctx.tween(0.9, 1, 0.5 / ctx.speed, (p) => machineScale.y = p, ctx.easings.easeOutQuint);
			ctx.tween(OnLight, OffLight, 1 / ctx.speed, (p) => light.color = p, ctx.easings.easeOutQuint);

			const duration = 0.25;
			game.get("item").sort((a, b) => b.pos.x - a.pos.x).forEach((item, index, arr) => {
				if (item.pos == getItemPos(index)) return;
				ctx.tween(ctx.rand(30, 20), 0, duration / ctx.speed, (p) => item.angle = p, ctx.easings.easeOutBack);
				ctx.tween(item.pos, getItemPos(index), duration / ctx.speed, (p) => item.pos = p);
			});

			// there's still items left
			if (itemsLeftToSend > 0 && game.get("item").length < 3) {
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
			const item = game.add([
				ctx.sprite(ctx.choose([variant1Sprite, variant2Sprite])),
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

				const draggedItem = game.add([
					ctx.sprite(item.sprite),
					ctx.pos(item.pos.sub(0, item.height / 2)),
					ctx.drag(),
					ctx.scale(),
					ctx.area({ collisionIgnore: ["dragitem"] }),
					ctx.anchor("center"),
					ctx.body(),
					ctx.z(5),
					"dragitem",
				]);

				let acceleration = 0;
				draggedItem.pick();
				draggedItem.onClick(() => draggedItem.pick());

				let hasCollided = false;
				// @ts-ignore apparently i have to return a KEventController in action what??
				draggedItem.onCollideUpdate("box", (box: GameObj) => {
					if (draggedItem.dragging) return;
					if (hasCollided) return;
					hasCollided = true;
					draggedItem.destroy();
					box.addItem(item);
				});

				draggedItem.onUpdate(() => {
					if (draggedItem.dragging) draggedItem.scale = ctx.lerp(draggedItem.scale, ctx.vec2(1.5), 0.5);
					else draggedItem.scale = ctx.lerp(draggedItem.scale, ctx.vec2(1), 0.5);
					if (!draggedItem.dragging) {
						acceleration = ctx.lerp(acceleration, 20, 0.1);
						draggedItem.pos.y += acceleration;
					}

					if (ctx.isButtonReleased("click")) {
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
			if (itemsLeftToSort > 0 && !lost) finishGame(false);
		});

		const initialItemsLength = ctx.clamp(itemsLeftToSend, 0, 3);
		for (let i = 0; i < initialItemsLength; i++) {
			const item = addItem();
			item.pos = getItemPos(i);
			itemsLeftToSend--;
		}

		addBox(variant1Sprite, ctx.vec2(560, 520));
		addBox(variant2Sprite, ctx.vec2(720, 520));

		return game;
	},
};

export default sortGame;
