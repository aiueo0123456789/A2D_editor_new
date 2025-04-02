import { device,GPU } from "../webGPU.js";
import { Children } from "../子要素.js";
import { AnimationBlock, RotateAnimation } from "../アニメーション.js";
import { createID } from "../UI/制御.js";
import { sharedDestroy } from "./オブジェクトで共通の処理.js";

class Editor {
    constructor(rotateModifier) {
        this.baseEdges = [];
        this.baseVertices = [];
        this.BBox = {min: [0,0], max: [0,0], width: 0, height: 0, center: [0,0]};
        this.rotateModifier = rotateModifier;
        this.imageBBox = {min: [0,0], max: [0,0]};
    }

    destroy() {
        this.rotateModifier = null;
    }
}

export class RotateModifier {
    constructor(name, id) {
        this.id = id ? id : createID();
        this.name = name;
        this.isInit = false;
        this.isChange = false;

        this.type = "回転モディファイア";
        this.rotateData = [0,0,1,0];
        this.baseData = [0,0,1,0];
        this.animationBlock = new AnimationBlock(this, RotateAnimation);
        this.baseDataBuffer = GPU.createUniformBuffer((2 + 1 + 1) * 4, undefined, ["f32"]);
        GPU.writeBuffer(this.baseDataBuffer, new Float32Array(this.baseData));
        this.rotateDataBuffer = GPU.createUniformBuffer((2 + 1 + 1) * 4, undefined, ["f32"]);
        this.modifierTransformDataGroup = GPU.createGroup(GPU.getGroupLayout("Cu_Cu"), [{item: this.baseDataBuffer, type: "b"},{item: this.rotateDataBuffer, type: "b"}]);

        this.BBoxRenderGroup = GPU.createGroup(GPU.getGroupLayout("Vu"), [{item: this.rotateDataBuffer, type: "b"}]);

        this.BBox = [this.rotateData[0],this.rotateData[1],this.rotateData[0],this.rotateData[1]];
        this.baseBBox = [this.baseData[0],this.baseData[1],this.baseData[0],this.baseData[1]];

        this.children = new Children();
        this.editor = new Editor(this);

        this.parent = "";

        this.init({baseData: [0,0,1,0], animationKeyDatas: []});
    }

    // gc対象にしてメモリ解放
    destroy() {
        sharedDestroy(this);
        this.name = null;
        this.type = null;
        this.angle = null;
        this.scale = null;
        this.movement = null;
        this.renderData = null; // [x,y,angle]
        this.renderBBoxData = null;
        this.animationBlock = null;
        this.rotateDataBuffer = null;
        this.modifierTransformDataGroup = null;

        this.children = null;

        this.parent = "";
    }

    init(data) {
        this.updateBaseData(data.baseData);
        this.animationBlock.setSaveData(data.animationKeyDatas);

        this.isInit = true;
        this.isChange = true;
    }

    updateBaseData(newData) {
        this.baseData = newData;
        this.baseBBox = [this.baseData[0],this.baseData[1],this.baseData[0],this.baseData[1]];
        GPU.writeBuffer(this.baseDataBuffer, new Float32Array(newData));
    }

    async getSaveData() {
        const animationKeyDatas = await this.animationBlock.getSaveData();
        return {
            name: this.name,
            id: this.id,
            type: this.type,
            baseData: this.baseData,
            animationKeyDatas: animationKeyDatas,
        };
    }
}