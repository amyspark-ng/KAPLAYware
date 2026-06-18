import { GameObj, PosComp, RectComp, RotateComp, ScaleComp, Vec2 } from "kaplay";
import { k } from "../kaplay";

/** Is the stage where the structure of the objects simply stand
 *
 * One single SCENERY exists per kaplay-scene
 *
 * An ACT simply creates a mini-engine that manages things like
 *
 * -> Events, timers and sounds (these are created by the code inside the microgames)
 *
 * An ACT would be created when a microgame or transition starts running and destroyed when it ends
 */
export interface GameScenery {
	/** The scenery will always have a certain width, you can just change the scale */
	scale: Vec2;
	pos: Vec2;
	root: GameObj;
	camera: GameObj<PosComp | ScaleComp | RotateComp | RectComp | { shake: number; }>;
	scene: GameObj<PosComp>;
}

/**
 * Creates a {@link GameScenery}
 * @param parent
 */
export function createScenery(parent = k.getTreeRoot()) {
	const scenery: GameScenery = {
		pos: k.center(),
		scale: k.vec2(1),
		root: k.add([]),
		scene: null,
		camera: null,
	};

	const gameBox = scenery.root.add([
		k.rect(k.width(), k.height()),
		k.color(k.BLUE.lighten(100)),
		k.scale(1),
		k.pos(scenery.pos),
		k.anchor("center"),
	]);

	const maskObj = gameBox.add([
		k.rect(k.width(), k.height()),
		k.pos(-k.width() / 2, -k.height() / 2),
		k.mask("intersect"),
		k.color(k.RED),
	]);

	const shakeCameraObject = maskObj.add([
		k.pos(),
	]);

	scenery.camera = shakeCameraObject.add([
		k.rect(k.width(), k.height(), { fill: false }),
		k.pos(k.width() / 2, k.height() / 2),
		k.rotate(0),
		k.anchor("center"),
		k.scale(1),
		k.color(k.GREEN),
		{
			shake: 0,
		},
	]);

	scenery.scene = scenery.camera.add([
		k.pos(-scenery.camera.width / 2, -scenery.camera.height / 2),
	]);

	scenery.root.onUpdate(() => {
		// gamebox stuff
		gameBox.pos = scenery.pos;
		gameBox.scale = scenery.scale;

		// mask obj stuff
		maskObj.width = k.width();
		maskObj.height = k.height();
		maskObj.pos = k.vec2(-k.width() / 2, -k.height() / 2);

		// camera obj stuff
		scenery.camera.width = k.width();
		scenery.camera.height = k.height();
		scenery.camera.pos = k.vec2(k.width() / 2, k.height() / 2);
		scenery.camera.shake = k.lerp(scenery.camera.shake, 0, 5 * k.dt());
		let posShake = k.Vec2.fromAngle(k.rand(0, 360)).scale(scenery.camera.shake);
		shakeCameraObject.pos = k.vec2().add(posShake);

		// scene stuff
		scenery.scene.pos = k.vec2(-scenery.camera.width / 2, -scenery.camera.height / 2);
	});

	return scenery;
}
