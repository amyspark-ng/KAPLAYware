import kaplay from "kaplay";

const k = kaplay();

k.loadRoot("./");
k.loadSprite("bean", "sprites/bean.png");

k.add([k.pos(120, 80), k.sprite("bean")]);

k.onMousePress(() => k.addKaboom(k.mousePos()));