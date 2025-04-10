import k from "../../engine";
import games from "../../game/games";
import { Minigame } from "../../game/types";
import { getGameByID, getGameID } from "../../game/utils";
import goGame from "../game";

k.scene("select", () => {
	k.addPlainBackground(k.BLUE.lighten(100));

	let index = 0;
	let movingToGames = false;
	let pressedEnter = false;

	// TODO: Figure out cool UI to do filter by input, to select all, etc

	// const ROWS = Math.floor(games.length / 3);
	const COLUMNS = 3;

	for (let i = 0; i < games.length; i++) {
		if (!games[i]) return;

		const cartridgeRow = Math.floor(i / 3);
		const cartridgeColumn = i % 3;

		const cartridge = k.add([
			k.sprite("cartridge"),
			k.pos(),
			k.anchor("center"),
			k.rotate(),
			k.opacity(),
			k.scale(),
			"cartridge",
			{
				selected: true,
				gameId: getGameID(games[i]),
			},
		]);

		const check = cartridge.add([
			k.sprite("check"),
			k.pos(cartridge.width / 2, -cartridge.height / 2),
			k.anchor("center"),
			k.opacity(0),
		]);

		const initialPos = k.vec2(100, 200);
		const sizeWithSpacig = k.vec2(cartridge.width).scale(1.25);
		cartridge.pos = initialPos.add(k.vec2(sizeWithSpacig.x * cartridgeColumn, sizeWithSpacig.y * cartridgeRow));

		const textBackground = k.add([
			k.rect(0, 50),
			k.color(k.BLACK),
			k.anchor("center"),
			k.pos(cartridge.pos.add(0, cartridge.height / 2)),
			k.scale(0.5),
		]);

		const text = textBackground.add([
			k.text(getGameID(games[i]), { font: "happy" }),
			k.anchor("center"),
			k.color(),
			k.pos(),
		]);

		textBackground.width = Math.max(text.width, cartridge.width);

		cartridge.onUpdate(() => {
			const hovered = index == i;

			if (hovered) cartridge.opacity = k.lerp(cartridge.opacity, 1, 0.5);
			else cartridge.opacity = k.lerp(cartridge.opacity, 0.5, 0.5);

			if (hovered) textBackground.color = k.lerp(textBackground.color, k.WHITE, 0.5);
			else textBackground.color = k.lerp(textBackground.color, k.BLACK, 0.5);
			text.color = textBackground.color.invert();

			if (cartridge.selected) cartridge.scale = k.lerp(cartridge.scale, k.vec2(1.25), 0.5);
			else cartridge.scale = k.lerp(cartridge.scale, k.vec2(1), 0.5);

			if (cartridge.selected) check.opacity = k.lerp(check.opacity, cartridge.opacity, 0.5);
			else check.opacity = k.lerp(check.opacity, 0, 0.5);

			if (k.isKeyPressed("space") && hovered) {
				if (cartridge.selected == false) {
					cartridge.selected = true;
					k.tween(cartridge.angle, cartridge.angle + 360, 0.15, (p) => cartridge.angle = p, k.easings.easeOutQuint);
				}
				else if (cartridge.selected == true) {
					cartridge.selected = false;
				}
			}
		});
	}

	k.onUpdate(() => {
		if (k.isKeyPressed("enter") && index < 3 && !pressedEnter) {
			pressedEnter = true;
			// only get the selected cartridges
			const selectedCartridges = k.get("cartridge").filter((cartridge) => cartridge.selected);
			const selectedGames = selectedCartridges.map((cartridge) => getGameByID(cartridge.gameId));
			k.debug.log("selected: " + selectedGames.length);

			selectedCartridges.forEach((cartridge) => {
				const newPos = k.center().add(k.width(), 0).add(k.rand(0, 40));
				k.tween(cartridge.pos, newPos, 0.5, (p) => cartridge.pos = p, k.easings.easeOutQuint).onEnd(() => {
					k.wait(0.1, () => {
						k.tween(cartridge.pos, cartridge.pos.add(0, k.height()), 0.5, (p) => cartridge.pos = p, k.easings.easeOutQuint);
					});
				});
			});

			k.wait(0.5, () => {
				movingToGames = true;
				k.wait(0.1, () => {
					k.camFade(0.5).onEnd(() => {
						goGame({ games: selectedGames });
					});
				});
			});
		}

		// games stuff
		if (k.isKeyPressed("right")) index++;
		else if (k.isKeyPressed("left")) index--;
		else if (k.isKeyPressed("down")) {
			if (index + COLUMNS < games.length) index += COLUMNS;
		}
		else if (k.isKeyPressed("up")) {
			if (index - COLUMNS >= 0) index -= COLUMNS;
		}

		const indexRow = Math.floor(index / 3);
		const indexColumn = index % 3;
		if (indexRow > games.length) index = indexColumn;

		const camPos = k.vec2(k.center().x + (movingToGames ? k.width() : 0), k.center().y + 250 * indexRow);
		const lerpedCamPos = k.lerp(k.getCamPos(), camPos, 0.5);
		k.setCamPos(lerpedCamPos);
	});

	k.onKeyPress("escape", () => {
		k.go("menu");
	});
});
