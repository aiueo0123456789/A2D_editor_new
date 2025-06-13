import { KeyframeBlock } from "../キーフレーム.js";

export class KeyframeBlockManager {
    constructor(object,struct) {
        this.type = "キーフレームブロックマネージャー";
        this.object = object;
        this.struct = struct;
        this.blocks = struct.map(targetValue => new KeyframeBlock(object, targetValue));
        this.blocksMap = {};
        for (let i = 0; i < struct.length; i ++) {
            this.blocksMap[struct[i]] = this.blocks[i];
        }
    }

    setSaveData(keyframeBlocks) {
        for (const keyframeBlockData of keyframeBlocks) {
            this.blocksMap[keyframeBlockData.targetValue].setKeyframe(keyframeBlockData.keys);
        }
    }
}