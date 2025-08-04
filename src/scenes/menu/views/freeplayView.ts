import type { GameObj } from "kaplay";
import k from "../../../engine";
import goGame from "../../game/GameScene";
import { createView, goView } from "../MenuScene";
import { Microgame } from "../../../types/Microgame";
import { createWareApp } from "../../game/app";
import { createWareEngine } from "../../game/ware";
import { createGameCtx } from "../../game/context/gameContext";
import { getGameColor } from "../../game/utils";

function addCartridge(game: Microgame, parent: GameObj) {
	const obj = parent.add([
		k.sprite("cartridge", { anim: "blur" }),
		k.anchor("center"),
		k.pos(k.center().x, 150),
		k.scale(),
		k.opacity(),
		k.rotate(),
		k.area(),
		"game",
		{
			game: game,
			intendedX: k.center().x,
		},
	]);

	obj.onDraw(() => {
		k.drawText({
			text: game.name,
			anchor: "center",
			size: 20,
			pos: k.vec2(0, 20),
		});
	});

	return obj;
}

type CartridgeObject = ReturnType<typeof addCartridge>;

const FREEPLAY_POS = k.vec2(-800, 0);

export const addFreeplayView = () => {
	const p = createView<CartridgeObject>(FREEPLAY_POS, "freeplay");
	p.selectorPaused = true;

	const kaboy = p.add([
		k.sprite("kaboy"),
		k.pos(k.center().x, 900),
		k.anchor("center"),
	]);

	// add small engine
	const app = createWareApp(kaboy);
	app.boxObj.pos = k.vec2(0, -116);
	app.boxObj.scaleToSize(k.vec2(246, 148));
	const ware = createWareEngine({ availableGames: window.microgames });

	// side buttons
	const leftBtn = p.add([
		k.sprite("btn_arrow", { flipX: true }),
		k.anchor("center"),
		k.area(),
		k.scale(),
		k.pos(54, 196),
		"button",
		{
			press: () => {},
			action: () => k.pressButton("left"),
		},
	]);

	const rightBtn = p.add([
		k.sprite("btn_arrow"),
		k.anchor("center"),
		k.pos(746, 196),
		k.scale(),
		k.area(),
		"button",
		{
			press: () => {},
			action: () => k.pressButton("right"),
		},
	]);

	const backButton = p.add([
		k.sprite("btn_back"),
		k.anchor("center"),
		k.pos(leftBtn.pos.x, 540),
		k.area(),
		k.scale(),
		"button",
		{
			press: () => {},
			action: () => k.pressButton("return"),
		},
	]);

	p.get("button").forEach((button: typeof backButton) => {
		button.onHover(() => button.play("focus"));
		button.onHoverEnd(() => button.play("blur"));
		button.press = () => {
			const randVec = k.vec2(k.rand(0.95, 1.215), k.rand(0.95, 1.215));
			p.tween(randVec, k.vec2(1), 0.35, (p) => button.scale = p, k.easings.easeOutQuint);
		};

		button.onClick(() => {
			button.action();
			button.press();
		});
	});

	window.microgames.forEach((game) => {
		const gameObj = addCartridge(game, p);
		gameObj.onClick(() => p.getSelected() == gameObj ? k.pressButton("action") : false);
	});

	p.menuItems = p.get("game");
	p.menuBack = "left";
	p.menuNext = "right";
	p.menuSelect = "action";

	p.onUpdate(() => {
		if (k.isButtonPressed("left")) leftBtn.press();
		else if (k.isButtonPressed("right")) rightBtn.press();

		const packs = p.get("game") as CartridgeObject[];
		packs.forEach((gameObj, index) => {
			if (index == p.index) {
				gameObj.intendedX = k.center().x;
				if (gameObj.tags.includes("ignorepoint")) gameObj.untag("ignorepoint");

				if (p.selectorPaused) {
					gameObj.angle = k.lerp(gameObj.angle, 0, 0.5);
					return;
				}

				gameObj.scale = k.lerp(gameObj.scale, k.vec2(1), 0.5);
				gameObj.opacity = k.lerp(gameObj.opacity, 1, 0.5);
				const wavingY = k.wave(150, 155, k.time());
				const wavingAngle = k.wave(-2.5, 2.5, k.time());
				gameObj.pos.y = k.lerp(gameObj.pos.y, wavingY, 0.5);
				gameObj.angle = k.lerp(gameObj.angle, wavingAngle, 0.5);
			}
			else {
				if (!gameObj.tags.includes("ignorepoint")) gameObj.tag("ignorepoint");
				gameObj.intendedX = k.center().x + gameObj.width * 1.5 * (index - p.index);
				gameObj.scale = k.lerp(gameObj.scale, k.vec2(0.85), 0.5);
				gameObj.opacity = k.lerp(gameObj.opacity, 0.85, 0.5);
				const wavingY = k.wave(150, 155, k.time() / 2);
				gameObj.pos.y = k.lerp(gameObj.pos.y, wavingY, 0.5);
				gameObj.angle = k.lerp(gameObj.angle, 0, 0.5);
			}

			gameObj.pos.x = k.lerp(gameObj.pos.x, gameObj.intendedX, 0.5);
		});
	});

	p.onChange((newSelect, oldSelect) => {
		oldSelect?.play("blur");
		newSelect.play("focus");

		app.clearAll();
		app.resetCamera();
		app.sceneObj.removeAll();
		ware.onTimeOutEvents.clear();
		k.setGravity(0);
		const ctx = createGameCtx(newSelect.game, app, ware);
		app.boxObj.color = getGameColor(newSelect.game, ctx);
		newSelect.game.start(ctx);
	});

	p.onSelect(() => {
		if (p.selectorPaused) return;
		p.selectorPaused = true;
		const selectGame = p.getSelected();
		p.tween(k.vec2(1.25), k.vec2(1), 0.25, (p) => selectGame.scale = p, k.easings.easeOutQuint);
		p.wait(0.25, () => {
			p.tween(selectGame.pos.y, 380, 0.5, (p) => selectGame.pos.y = p, k.easings.easeOutQuint);
			p.wait(0.5, () => {
				const theGames = window.microgames.filter((game) => game == selectGame.game);
				goGame({ availableGames: theGames });
			});
		});
	});

	p.onButtonPress("return", () => {
		p.selectorPaused = true;
		p.get("game").forEach((game) => game.hidden = true);
		backButton.press();
		goView("main");
		k.tween(kaboy.pos.y, 900, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
	});

	p.setSelected(p.menuItems[0]);
	p.resetState = () => {
		p.get("game").forEach((game) => game.hidden = false);
		p.selectorPaused = true;

		p.wait(0.25, () => {
			p.selectorPaused = false;
			k.tween(kaboy.pos.y, 600, 0.5, (p) => kaboy.pos.y = p, k.easings.easeOutQuint);
		});
	};
};
