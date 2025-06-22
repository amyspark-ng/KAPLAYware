import { Vec2 } from "kaplay";
import { Minigame } from "../../src/types/Minigame";

const uploadGame: Minigame = {
	name: "upload",
	author: "amyspark-ng",
	prompt: "UPLOAD!",
	rgb: (ctx) => ctx.mulfok.DARK_BLUE,
	duration: 4,
	input: "mouse",
	urlPrefix: "games/amyspark-ng/assets/",
	load(ctx) {
		ctx.loadSprite("os", "sprites/upload/os.png");
		ctx.loadSprite("window", "sprites/upload/window.png", { sliceX: 5, sliceY: 1 });
		ctx.loadSprite("drop", "sprites/upload/drop.png");
		ctx.loadSound("notification", "sounds/notification.mp3");
	},
	// TODO: Touch up file spawning
	start(ctx) {
		let dragThingOp = 0;
		let curDragging: any = null;

		ctx.add([ctx.sprite("os")]); // taskbar
		const window = ctx.add([
			ctx.sprite("window"),
			ctx.area(),
			ctx.anchor("center"),
			ctx.pos(565, 270),
			"ignorepoint",
		]);

		window.onDraw(() => {
			if (window.isHovering() && curDragging) dragThingOp = ctx.lerp(dragThingOp, 1, 0.5);
			else dragThingOp = ctx.lerp(dragThingOp, 0, 0.5);
			ctx.drawSprite({
				anchor: "center",
				sprite: "drop",
				opacity: dragThingOp,
			});
		});

		window.on("drop", (good) => {
			if (good) ctx.win();
			else ctx.lose();

			ctx.wait(1 / ctx.speed, () => {
				if (good) {
					window.frame = ctx.randi(2, 4);
					ctx.play("notification", { detune: ctx.rand(0, 50) });
				}
				else {
					window.frame = 1;
					ctx.play("notification", { detune: ctx.rand(-150, -50) });
				}

				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			});
		});

		function addFile(spriteName: string, good: boolean) {
			const file = ctx.add([
				ctx.sprite("@" + spriteName),
				ctx.anchor("center"),
				ctx.area(),
				ctx.pos(),
				ctx.z(1),
				"drag",
				{
					dragging: false,
				},
			]);

			let hoverDraw = ctx.add([ctx.z(0)]).onDraw(() => {
				if (file.isHovering()) {
					ctx.drawRect({
						width: 80,
						height: 80,
						pos: file.pos,
						anchor: "center",
						color: ctx.mulfok.BLUE,
						opacity: 0.5,
						outline: {
							width: 3,
							color: ctx.mulfok.BLUE,
						},
					});
				}
			});

			function setPos(pos: Vec2 = ctx.vec2(ctx.rand(0, ctx.width()), ctx.rand(0, ctx.height()))) {
				file.pos = pos;
				file.pos.x = ctx.clamp(file.pos.x, 50, (ctx.width() / 2) - 100);
				file.pos.y = ctx.clamp(file.pos.y, 50, ctx.height() - 150);
			}

			file.onMouseRelease(() => {
				if (!file.dragging) return;

				curDragging = null;
				file.dragging = false;

				if (window.isHovering()) {
					window.add([
						ctx.sprite("@" + spriteName),
						ctx.pos(-25, 0),
						ctx.scale(2),
						ctx.anchor("center"),
					]);
					window.trigger("drop", good);
				}
				else setPos(ctx.mousePos());
			});

			file.onDraw(() => {
				ctx.drawText({
					text: spriteName + ".png",
					size: 10,
					pos: ctx.vec2(0, file.height / 2 + 10),
					align: "center",
					anchor: "center",
				});

				if (file.dragging) {
					ctx.drawSprite({
						sprite: file.sprite,
						pos: file.fromWorld(ctx.mousePos()),
						anchor: "center",
						opacity: 0.5,
					});

					ctx.drawText({
						text: spriteName + ".png",
						size: 10,
						pos: file.fromWorld(ctx.mousePos()).add(ctx.vec2(0, file.height / 2 + 10)),
						align: "center",
						anchor: "center",
					});
				}
			});

			setPos();
		}

		addFile("kat", true);
		if (ctx.difficulty > 1) addFile("zombean", false);
		if (ctx.difficulty > 2) addFile("skuller", false);

		ctx.onButtonDown("click", () => {
			for (const obj of ctx.get("drag").reverse()) {
				if (obj.isHovering()) {
					obj.dragging = true;
					curDragging = obj;
					break;
				}
			}
		});

		ctx.onTimeout(() => {
			if (ctx.winState == undefined) {
				ctx.lose();
				ctx.wait(0.5 / ctx.speed, () => ctx.finish());
			}
		});
	},
};

export default uploadGame;
