import { Comp, GameObj, KAPLAYCtx } from "kaplay";
import k from "../engine";

// Keep track of the current draggin item
export let curDraggin: GameObj<DragComp> = null;

export function setCurDragging(value: any) {
	curDraggin = value;
}

export interface DragComp extends Comp {
	dragging: boolean;
	pick(): void;
	drop(): void;
	onDrag(action: () => void): void;
	onDragUpdate(action: () => void): void;
	onDragEnd(action: () => void): void;
}

// A custom component for handling drag & drop behavior
function drag(): DragComp {
	// The displacement between object pos and mouse pos
	let offset = k.vec2(0);

	return {
		// Name of the component
		id: "drag",
		// This component requires the "pos" and "area" component to work
		require: ["pos", "area"],
		get dragging() {
			return curDraggin == this;
		},
		drop() {
			curDraggin = null;
			this.trigger("dragEnd");
		},
		pick() {
			// Set the current global dragged object to this
			curDraggin = this;
			offset = k.mousePos().sub(this.pos);
			this.trigger("drag");
		},
		// "update" is a lifecycle method gets called every frame the obj is in scene
		update() {
			if (curDraggin === this) {
				this.pos = k.mousePos().sub(offset);
				this.trigger("dragUpdate");
			}
		},
		onDrag(action) {
			return this.on("drag", action);
		},
		onDragUpdate(action) {
			return this.on("dragUpdate", action);
		},
		onDragEnd(action) {
			return this.on("dragEnd", action);
		},
	};
}

export default function dragCompPlugin() {
	return {
		drag,
	};
}
