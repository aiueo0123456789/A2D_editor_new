import { FaileIOManager } from "./app/FaileIOManager.js";
import { Scene } from "./app/Scene.js";
import { AutoGrid } from "./UI/grid.js";
import { createIcon, createID, createTag, managerForDOMs } from "./UI/制御.js";
import { Hierarchy } from "./app/Hierarchy.js";
import { Operator } from "./機能/オペレーター/オペレーター.js";
import { Area_Viewer } from "./area/Viewer/area_Viewer.js";
import { Area_Hierarchy } from "./area/Hierarchy/area_Hierarchy.js";
import { Area_Inspector } from "./area/Inspector/area_Inspector.js";
import { Area_Preview } from "./area/Preview/area_Preview.js";
import { Area_Timeline } from "./area/Timeline/area_Timeline.js";
import { ViewerSpaceData } from "./area/Viewer/area_ViewerApaceData.js";
import { TimelineSpaceData } from "./area/Timeline/area_TimelineSpaceData.js";
import { InputManager } from "./app/InputManager.js";
import { createSelect } from "./area/補助/UIの自動生成.js";
import { changeParameter, createArrayFromHashKeys } from "./utility.js";
import { SelectTag } from "./area/補助/カスタムタグ.js";

// モードごとに使えるツールの管理
class WorkSpaceTool {
    constructor() {
        this.toolRegistry = {
            object: ["move", "scale", "rotate"],
            vertexEdit: ["move", "scale", "rotate"],
        }
    }

    getAvailableTools(mode) {
        return this.toolRegistry[mode] || [];
    }
}

// アプリの設定
class AppConfig {
    constructor() {
        this.workSpaceTool = new WorkSpaceTool();

        this.MAX_GRAPHICMESH = 100; // グラフィックメッシュの最大数
        this.MAX_VERTICES_PER_GRAPHICMESH = 500; // グラフィックメッシュあたりの最大頂点数
        this.MAX_MESHES_PER_GRAPHICMESH = 700; // グラフィックメッシュあたりの最大頂メッシュ数
        this.MAX_ANIMATIONS_PER_GRAPHICMESH = 10; // グラフィックメッシュあたりの最大アニメーション数

        this.MAX_BONEMODIFIER = 10; // ボーンモディファイアの最大数
        this.MAX_VERTICES_PER_BONEMODIFIER = 100; // ボーンモディファイアあたりの最大頂点数
        this.MAX_ANIMATIONS_PER_BONEMODIFIER = 10; // ボーンモディファイアあたりの最大アニメーション数

        this.areasConfig = {};
        for (const keyName in useClassFromAreaType) {
            this.areasConfig[keyName] = new useClassFromAreaType[keyName]["areaConfig"]();
        }
    }
}

export class Application { // 全てをまとめる
    constructor(/** @type {HTMLElement} **/ dom) {
        this.dom = dom; // エディターが作られるdom

        this.appConfig = new AppConfig();

        this.areas = [];
        this.activeArea = null;
        this.scene = new Scene(this);
        this.animationPlayer = new AnimationPlayer(this);
        this.hierarchy = new Hierarchy(this);
        this.fileIO = new FaileIOManager(this);
        this.input = new InputManager(this);
        this.operator = new Operator(this);
    }

    async getSaveData() {
        const result = {};
        result.hierarchy = this.hierarchy.getSaveData();
        result.scene = await this.scene.getSaveData();
        return result;
    }

    createArea(axis, target = this.dom) { // エリアの作成
        const area = new AutoGrid(createID(), target, axis, 50);
        return area;
    }

    setAreaType(area, type) {
        const area_dom = document.createElement("div");
        area_dom.style.width = "100%";
        area_dom.style.height = "100%";
        this.areas.push(new Area(type,area_dom));
        area.append(area_dom);
    }

    deleteArea(/** @type {Area} */area) {
        const tag = area.target.parentElement;
        const b = tag.parentElement.children[2];
        tag.parentElement.parentElement.parentElement.append(b);
    }

    async update() {
        for (const area of this.areas) {
            if ("inputUpdate" in area.uiModel) {
                area.uiModel.inputUpdate();
            }
        }
        // await stateMachine.stateUpdate();
        // 表示順番の再計算
        this.scene.updateRenderingOrder(100);
        if (true) {
            this.scene.updateAnimation(this.scene.frame_current);
        }
        this.scene.updateAnimationCollectors();
        // this.hierarchy.runHierarchy();
        this.scene.update();
        for (const object of this.scene.allObject) {
            object.isChange = false;
        }
        // this.animationPlayer.update(1 / 60);
        this.animationPlayer.update(0.2);
        // ビューの更新
        this.areas.forEach((area) => {
            area.update();
        })
        // renderingParameters.updateKeyfarameCount();
        this.operator.update();
    }
}

const useClassFromAreaType = {
    "Viewer": {area: Area_Viewer, areaConfig: ViewerSpaceData},
    "Hierarchy": {area: Area_Hierarchy, areaConfig: ViewerSpaceData},
    "Inspector": {area: Area_Inspector, areaConfig: ViewerSpaceData},
    "Preview": {area: Area_Preview, areaConfig: ViewerSpaceData},
    "Timeline": {area: Area_Timeline, areaConfig: TimelineSpaceData},
};

// UIのエリア管理
class Area {
    constructor(type, /** @type {HTMLElement} */ dom) {
        this.target = dom;
        this.target.classList.add("area");

        this.header = document.createElement("div");
        this.header.classList.add("header");
        const select = new SelectTag(this.header, createArrayFromHashKeys(useClassFromAreaType));
        /** @type {HTMLElement} */
        const deleteButton = createTag(this.header, "span", {className: "square_btn"}); // バツボタン
        deleteButton.addEventListener("click", () => {
            app.deleteArea(this);
        })
        createIcon(this.header, "グラフィックメッシュ"); // アイコン
        this.title = createTag(this.header, "div", {textContent: type}); // タイトル

        this.main = document.createElement("div");
        this.main.classList.add("main");
        this.target.append(this.header, this.main);

        this.setType(type);

        select.input.addEventListener("change", () => {
            this.setType(select.input.value);
        })

        this.main.addEventListener("mouseover", () => {
            app.activeArea = this;
        });
    }

    setType(type) {
        this.uiModel?.creator?.delete();
        this.title.textContent = type; // タイトル
        this.type = type;
        if (type in useClassFromAreaType) {
            this.uiModel = new useClassFromAreaType[type]["area"](this.main);
        } else {
            this.uiModel = {type: "エラー"};
            console.warn("設定されていないエリアを表示しようとしました",type)
        }
    }

    update() {
        if (this.type == "Viewer" || this.type == "Preview") {
            this.uiModel.update();
        }
    }
}

// アニメーションのコントローラー
class AnimationPlayer {
    constructor(/** @type {Application} */app) {
        this.app = app;
        this.isPlaying = true;
        this.speed = 1.0;
    }

    update(dt) {
        if (this.isPlaying) {
            this.app.scene.frame_current += dt * this.speed;
            managerForDOMs.update("タイムライン-canvas");
        }
        changeParameter(this.app.scene, "frame_current", this.app.scene.frame_start + (this.app.scene.frame_current - this.app.scene.frame_start) % (this.app.scene.frame_end - this.app.scene.frame_start)); // フレームスタートを下回ったらエンドに戻す
    }
}

export const app = new Application(document.getElementById("app"));

const area1 = app.createArea("w");
const area1_h = app.createArea("h", area1.child1);
const area2 = app.createArea("w", area1.child2);
const area3 = app.createArea("h", area2.child2);
const area4 = app.createArea("w", area3.child1);
app.setAreaType(area1_h.child1,"Viewer");
app.setAreaType(area2.child1,"Hierarchy");
app.setAreaType(area4.child1,"Hierarchy");
// app.setAreaType(area4.child1,"Preview");
app.setAreaType(area3.child2,"Inspector");
app.setAreaType(area1_h.child2,"Timeline");
app.setAreaType(area4.child2,"Timeline");
app.setAreaType(area4.child2,"Property");

function appUpdate() {
    app.update();
    requestAnimationFrame(appUpdate);
}

appUpdate();