import CONFIG from "./config.ts";
import k from "./kaplay.ts";
import Microgame from "../microgames/src/core/types/microgame.ts";

k.loadRoot("./"); // A good idea for Itch.io publishing later
k.loadSprite("bean", "sprites/bean.png");
k.loadJSON("authors_metadata", "../microgames/authors_metadata.json");

// get all the microgames
const modules = import.meta.glob<{ default: Microgame; }>(
	"../microgames/authors/**/**/main.js",
	{ eager: true },
);

k.load(Promise.all(
	Object.values(modules).map((m) => {
		const microgame = m.default;
		// microgame.load()
		CONFIG.microgames.push(microgame);
	}),
));
