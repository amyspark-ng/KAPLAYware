import { Vec2 } from "kaplay";
import k from "../../engine";

/** Creates a cute little object that contains a buncha game objects that can hold, a ware instance
 * @returns An object with a lot of objects
 */
export function createGameContainer() {
	const root = k.add([]);

	const gameBox = root.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLUE.lighten(100)),
		k.scale(1),
		k.pos(k.center()),
		k.anchor("center"),
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
