import { GameObj } from "kaplay";
import { k } from "../../../kaplay";
import { setPaused } from "../game";

export function buildPausedScreen(parent: GameObj) {
	let exitColor = k.WHITE;
	let exited = false;

	let paused = false;
	let progress = 0;

	let canExit = false;

	const pausedScreen = parent.add([
		k.rect(320, 240),
		k.color(k.BLACK),
		k.opacity(0),
		k.z(999),
		k.pos(-161, -337),
		{
			pauseInputHandling() {
				// if unpaused and release return then pause
				if (k.isButtonReleased("return") && !paused) {
					setPaused(true);
					paused = true;
					canExit = false;
				}
				// if release and paused and progress is little unpause
				else if (k.isButtonReleased("return") && paused && progress < 0.1) {
					setPaused(false);
					paused = false;
					canExit = false;
				}

				// if press and paused then can exit
				if (k.isButtonPressed("return") && paused) {
					canExit = true;
				}

				// start increasing progress
				if (k.isButtonDown("return") && paused && canExit) {
					progress += k.dt() / 1.5;
					if (progress >= 1 && !exited) {
						exited = true;
						k.go("focus");
					}
				}

				if (!k.isButtonDown("return")) progress -= k.dt();
				progress = k.clamp(progress, 0, 1);
			},

			draw() {
				k.drawCircle({
					pos: k.vec2(45, 40),
					radius: 15,
					fill: false,
					opacity: progress,
					outline: {
						width: 3,
					},
				});

				k.drawCircle({
					pos: k.vec2(45, 40),
					radius: 10,
					end: 360 * progress + 1,
					opacity: progress,
				});

				k.drawRect({
					width: 280,
					height: 175,
					color: k.BLACK,
					anchor: "center",
					pos: k.vec2(320 / 2, 100),
					opacity: this.opacity * 1,
					radius: 15,
				});

				k.drawText({
					font: "happy",
					text: "PAUSED",
					size: 40,
					anchor: "center",
					pos: k.vec2(320 / 2, 50),
					opacity: this.opacity * 2,
					color: progress > 0.05 ? exitColor : k.WHITE,
					transform: (idx, ch) => ({
						pos: k.vec2(0, k.wave(-4, 4, k.time() + idx * 0.5)),
						scale: k.wave(1, 1.2, k.time() + idx),
					}),
				});

				k.drawText({
					font: "happy",
					text: "Hold RETURN to [c]exit[/c]\nPress again to resume",
					size: 15,
					align: "center",
					anchor: "center",
					pos: k.vec2(320 / 2, 100),
					opacity: this.opacity * 2,
					styles: {
						"c": {
							color: k.lerp(k.WHITE, k.RED, progress),
						},
					},
				});
			},
		},
	]);

	return {
		screen: pausedScreen,
		onExit(action: () => void) {
			return pausedScreen.on("exit", action);
		},
	};
}
