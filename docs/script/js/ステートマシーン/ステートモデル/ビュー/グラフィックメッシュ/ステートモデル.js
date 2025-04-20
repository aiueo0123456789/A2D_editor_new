import { app } from "../../../../app.js";
import { managerForDOMs, updateDataForUI } from "../../../../UI/制御.js";
import { createNextStateData } from "../../../状態遷移.js";
import { updateForHoverObjects } from "../ユーティリティ/関数.js";

export class StateModel_GraphicMesh {
    constructor() {
        this.名前 = "グラフィックメッシュ";
        this.options = [];
        this.ツールバー = "&all";
        this.シェリフ = [
            {
                name: "選択グラフィックメッシュ",
                targetObject: this.options,
                argumentArray: [
                    {name: "自動", type: {type: "ボタン", eventFn: {}}},
                    {name: "頂点追加", type: {type: "スイッチ", option: {look: "button-checkbox"}}},
                    {name: "頂点削除", type: {type: "スイッチ", option: {look: "button-checkbox"}}},
                ]
            }
        ];
        this.データ構造 = {
            activeObject: "&-",
            selectObjects: "&-",
            hoverObjects: {isInclude: "&-", not: []},
            selectAnimation: {isInclude: "&-", not: null},
        };
        this.遷移ステート = [
            createNextStateData([["/m"]], "グラフィックメッシュ_メッシュ編集"),
            createNextStateData([["/a"]], "グラフィックメッシュ_アニメーション編集"),
            createNextStateData([["/w"]], "グラフィックメッシュ_ウェイト編集"),
            createNextStateData([["クリック"],["input-ヒエラルキーのオブジェクト選択"]], "$-1", null, true),
        ]
    }

    init(stateData) {
        managerForDOMs.update(app.hierarchy);
        updateDataForUI["インスペクタ"] = true;
    }

    // ホバーオブジェクトを更新
    async update(stateData) {
        await updateForHoverObjects(stateData);
    }

    finish(stateData) {
        managerForDOMs.update("ヒエラルキー")
        updateDataForUI["インスペクタ"] = true;
    }
}