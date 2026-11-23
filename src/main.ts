import CONFIG from "./config.ts";
import k from "./kaplay.ts";
import "./loader.ts";
// import createMicroScene from "../microgames/functions/core/micro_scene.ts";

k.onLoad(() => {
	const authors = k.getAsset("authors_metadata")?.data;
	k.debug.log(authors);
	k.debug.log(CONFIG.microgames[0]);
	// const microScene = createMicroScene(k, 800, 600);
});
