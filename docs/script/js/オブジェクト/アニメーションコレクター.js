import { searchAnimation } from "./オブジェクトで共通の処理.js";
import { KeyframeBlock } from "../キーフレーム.js";
import { createID, managerForDOMs } from "../UI/制御.js";
import { changeParameter } from "../UI/utility.js";
import { app } from "../app.js";

class Editor {
    constructor(animationManager) {
        this.animationManager = animationManager;
    }
}

export class AnimationCollector {
    constructor(name, id) {
        this.id = id ? id : createID();
        this.type = "アニメーションコレクター";
        this.name = name;
        this.weight = 0;
        this.containedAnimations = [];
        this.isChange = false;
        this.keyframe = new KeyframeBlock(this);
        this.editor = new Editor();
    }

    // gc対象にしてメモリ解放
    destroy() {
        this.name = null;
        this.weight = null;
        this.containedAnimations = null;
    }

    setWeight(weight) {
        changeParameter(this, "weight", weight);
        managerForDOMs.update(this, "ウェイト");
    }

    update() {
        for (const animation of this.containedAnimations) {
            changeParameter(animation, "weight", this.weight);
        }
    }

    init(data) {
        this.keyframe.setKeyframe(data.keyframe.keys);
        for (const [id, animationName] of data.containedAnimations) {
            const object = app.scene.searchObjectFromID(id);
            const animation = searchAnimation(object, animationName);
            if (animation) {
                this.containedAnimations.push(animation);
                animation.belongAnimationCollector = this;
            } else {
                console.log(object, animationName)
            }
        }
    }

    getSaveData() {
        return {
            type: this.type,
            id: this.id,
            name: this.name,
            keyframe: this.keyframe.getSaveData(),
            containedAnimations : this.containedAnimations.map(x => {
                return [x.belongObject.id, x.name];
            }),
        };
    }
}
