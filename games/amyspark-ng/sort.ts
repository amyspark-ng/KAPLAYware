import { curDraggin, setCurDragging } from "../../src/plugins/drag.ts";
import { Minigame } from "../../src/types.ts";

const newGame: Minigame = {
	prompt: "sort",
	author: "amyspark-ng",
	duration: 5,
	rgb: [212, 110, 179],
	mouse: { hidden: false },
	urlPrefix: "games/amyspark-ng/assets",
	load(ctx) {
	},
	start(ctx) {
		const game = ctx.make();

		const FISH_OR_BAG: "fish" | "bag" = ctx.choose(["fish", "bag"]);
		const AMOUNT_TO_ADD = ctx.difficulty == 1 || ctx.difficulty == 2 ? 3 : ctx.difficulty == 3 ? 4 : 0;
		const options = FISH_OR_BAG == "bag" ? ["@bag", "@money_bag"] : ["@bobo", "@sukomi"];

		let box1Options = [];
		let box2Options = [];

		function addOptionObject() {
			const obj = game.add([
				ctx.sprite(ctx.choose(options)),
				ctx.pos(),
				ctx.rotate(),
				ctx.area(),
				ctx.scale(1.5),
				ctx.anchor("center"),
				ctx.drag(ctx),
				"option",
			]);

			obj.onUpdate(() => {
				if (obj.dragging) obj.angle = ctx.lerp(obj.angle, ctx.mouseDeltaPos().x, 0.5);
				obj.angle = ctx.lerp(obj.angle, 0, 0.5);
			});

			return obj;
		}

		function addObjects() {
			for (let i = 0; i < AMOUNT_TO_ADD; i++) {
				const obj = addOptionObject();
				obj.pos = ctx.center().add(obj.width * 1.2 * i, 0);
			}
		}

		function addBox(optionIndex: 0 | 1) {
			const box = game.add([
				ctx.rect(120, 100, { radius: 5 }),
				ctx.outline(5, ctx.BLACK),
				ctx.color(145, 71, 80),
				ctx.anchor("bot"),
				ctx.pos(),
				ctx.scale(1.5),
				ctx.area(),
				ctx.z(0),
				`${optionIndex}`,
			]);

			box.pos = ctx.center().add(optionIndex == 0 ? -220 : 220, 200);

			box.add([
				ctx.sprite(options[optionIndex] + "-o"),
				ctx.anchor("center"),
				ctx.pos(0, -box.height / 2),
			]);

			return box;
		}

		const leftBox = addBox(0);
		const rightBox = addBox(1);
		addObjects();

		ctx.onClick(() => {
			if (curDraggin) {
				return;
			}

			// Loop all "bean"s in reverse, so we pick the one that is on top
			for (const obj of game.get("drag").reverse()) {
				// If mouse is pressed and mouse position is inside, we pick
				if (obj.isHovering()) {
					obj.pick();
					break;
				}
			}
		});

		// Drop whatever is dragged on mouse release
		ctx.onButtonRelease("click", () => {
			if (curDraggin) {
				curDraggin.trigger("dragEnd");
				let hoveredOption = curDraggin as ReturnType<typeof addOptionObject>;
				setCurDragging(null);

				function acceptOption(boxObject: ReturnType<typeof addBox>, optionObj: ReturnType<typeof addOptionObject>) {
					optionObj.destroy();

					const dummy = game.add([
						ctx.sprite(optionObj.sprite),
						ctx.pos(boxObject.pos.x, boxObject.pos.y - boxObject.height - 20),
						ctx.rotate(ctx.rand(-10, 10)),
						ctx.anchor("bot"),
						ctx.scale(1.5),
						ctx.z(boxObject.z - 1),
					]);

					const boxIndex = parseInt(boxObject.tags[1]);
					let dummyIndexInBox = 0;

					if (boxIndex == 0) {
						box1Options.push(dummy);
						dummyIndexInBox = box1Options.indexOf(dummy);
					}
					else if (boxIndex == 1) {
						box2Options.push(dummy);
						dummyIndexInBox = box2Options.indexOf(dummy);
					}

					dummy.pos.x = (boxObject.pos.x - boxObject.width / 2) + (dummy.width * dummyIndexInBox + 1);
					ctx.tween(boxObject.scale.y / 2, boxObject.scale.y, 0.25 / ctx.speed, (p) => boxObject.scale.y = p, ctx.easings.easeOutQuint);
					ctx.tween(dummy.scale.y / 2, dummy.scale.y, 0.25 / ctx.speed, (p) => dummy.scale.y = p, ctx.easings.easeOutQuint);
				}

				if (hoveredOption.sprite == options[0] && leftBox.isHovering()) acceptOption(leftBox, hoveredOption);
				else if (hoveredOption.sprite == options[1] && rightBox.isHovering()) acceptOption(rightBox, hoveredOption);
			}

			if (box1Options.length + box2Options.length >= AMOUNT_TO_ADD) {
				ctx.win();
				ctx.wait(0.5, () => ctx.finish());
			}
		});

		ctx.onTimeout(() => {
			if (game.get("option").length > 0) {
				ctx.wait(0.5, () => ctx.finish());
				ctx.lose();
			}
		});

		return game;
	},
};

export default newGame;
