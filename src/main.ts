import kaplay from "kaplay";

import Microgame from "../microgames/types/microgame.ts";
import MicrogamesMetadata from "../microgames/types/metadata.ts";

const k = kaplay();

k.loadRoot("./");
k.loadSprite("bean", "sprites/bean.png");
k.loadJSON("microgames_metadata", "../microgames/metadata.json");

k.onLoad(() => {
});
