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
import { ViewerSpaceData } from "./area/Viewer/area_ViewerSpaceData.js";
import { TimelineSpaceData } from "./area/Timeline/area_TimelineSpaceData.js";
import { InputManager } from "./app/InputManager.js";
import { changeParameter, createArrayFromHashKeys, indexOfSplice, loadFile } from "./utility.js";
import { SelectTag } from "./area/補助/カスタムタグ.js";
import { ContextmenuOperator } from "./app/ContextmenuOperator.js";
import { HierarchySpaceData } from "./area/Hierarchy/area_HierarchySpaceData.js";
import { Area_Property } from "./area/Property/area_Property.js";
import { GraphicMesh } from "./オブジェクト/グラフィックメッシュ.js";
import { GPU } from "./webGPU.js";
import { CreateObjectCommand, DeleteObjectCommand } from "./機能/オペレーター/オブジェクト/オブジェクト.js";

const calculateParentWeightForBone = GPU.createComputePipeline([GPU.getGroupLayout("Csrw_Csr_Cu_Csr_Cu")], await loadFile("./script/js/app/shader/ボーン/重み設定.wgsl"));
const calculateParentWeightForBezier = GPU.createComputePipeline([GPU.getGroupLayout("Csrw_Csr_Cu_Csr_Cu")], await loadFile("./script/js/app/shader/bezier/重み設定.wgsl"));

class AppOptions {
    constructor(/** @type {Application} */app) {
        this.app = app;
        this.primitives = {
            "boneModifer": {
                "normal": {
                    type: "アーマチュア",
                    boneNum: 1,
                    bones: [{
                        index: 0,
                        childrenBone: [],
                        baseHead: [0,0],
                        baseTail: [0,100],
                        animations: {blocks: []},
                    }],
                    editor: {
                        boneColor: [0,0,0,1]
                    }
                },
                "body": {
                    type: "アーマチュア",
                    boneNum: 2,
                    bones: [{
                        index: 0,
                        childrenBone: [
                            {
                                index: 1,
                                childrenBone: [],
                                baseHead: [0,110],
                                baseTail: [0,210],
                                animations: [],
                            }
                        ],
                        baseHead: [0,-100],
                        baseTail: [0,100],
                        animations: {blocks: []},
                    }],
                    editor: {
                        boneColor: [0,0,0,1]
                    }
                }
            },
            "bezierModifier": {
                "normal": {
                    type: "ベジェモディファイア",
                    points: [
                        {point: {co: [-100,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}}, leftControlPoint: {co: [-150,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}}, rightControlPoint: {co: [-50,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}}},
                        {point: {co: [100,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}}, leftControlPoint: {co: [50,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}}, rightControlPoint: {co: [150,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}}},
                    ],
                    animationKeyDatas: [],
                }
            },
            "graphicMesh": {
                "normal": {
                    zIndex: 0,
                    imageBBox: {
                        min: [0, 0],
                        max: [100, 100]
                    },
                    vertices: [
                        {base: [0,0], uv: [0,1], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}},
                        {base: [100,0], uv: [1,1], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}},
                        {base: [100,100], uv: [1,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}},
                        {base: [0,100], uv: [0,0], parentWeight: {indexs: [0,0,0,0], weights: [0,0,0,0]}},
                    ],
                    meshes: [
                        {indexs: [0,1,2]},
                        {indexs: [2,3,0]},
                    ],
                    renderingTargetTexture: null,
                    maskTargetTexture: "base",
                    editor: {
                        baseSilhouetteEdges: [[0,1],[1,2],[2,3],[3,0]],
                        baseEdges: [[0,1],[1,2],[2,3],[3,0]],
                        imageBBox: {
                            min: [
                                0,
                                0
                            ],
                            max: [
                                100,
                                100
                            ],
                            width: 100,
                            height: 100,
                            center: [
                                (100 + 0) / 2,
                                (100 + 0) / 2,
                            ]
                        }
                    },
                    animationKeyDatas: [],
                }
            }
        }
    }

    getPrimitiveData(objectType, name) {
        try {
            return this.primitives[objectType][name];
        } catch {
            return null;
        }
    }

    keyframeInsert(object, frame) {
        const datas = object.keyframeBlockManager.blocksMap;
        for (const data in datas) {
            object.keyframeBlockManager.blocksMap[data].insert(frame, object[data]);
        }
    }

    // 自動ウェイトペイント
    async assignWeights(object) {
        if (!object.parent) return ;
        let parentVerticesBuffer;
        let parentAllocationBuffer;
        if (object.parent.type == "アーマチュア") {
            parentVerticesBuffer = this.app.scene.runtimeData.armatureData.baseVertices;
            parentAllocationBuffer = object.parent.objectDataBuffer;
        } else {
            parentVerticesBuffer = this.app.scene.runtimeData.bezierModifierData.baseVertices;
            parentAllocationBuffer = object.parent.objectDataBuffer;
        }
        let objectWeightsBuffer;
        let objectVerticesBuffer;
        let objectAllocationBuffer;
        let runtimeObject;
        if (object.type == "グラフィックメッシュ") {
            objectWeightsBuffer = this.app.scene.runtimeData.graphicMeshData.weightBlocks;
            objectVerticesBuffer = this.app.scene.runtimeData.graphicMeshData.baseVertices;
            objectAllocationBuffer = object.objectDataBuffer;
            runtimeObject = this.app.scene.runtimeData.graphicMeshData;
        } else {
            objectWeightsBuffer = this.app.scene.runtimeData.bezierModifierData.weightBlocks;
            objectVerticesBuffer = this.app.scene.runtimeData.bezierModifierData.baseVertices;
            objectAllocationBuffer = object.objectDataBuffer;
            runtimeObject = this.app.scene.runtimeData.bezierModifierData;
        }
        const group = GPU.createGroup(GPU.getGroupLayout("Csrw_Csr_Cu_Csr_Cu"), [objectWeightsBuffer, objectVerticesBuffer, objectAllocationBuffer, parentVerticesBuffer, parentAllocationBuffer]);
        if (object.parent.type == "アーマチュア") {
            GPU.runComputeShader(calculateParentWeightForBone, [group], Math.ceil(object.verticesNum / 64));
        } else {
            GPU.runComputeShader(calculateParentWeightForBezier, [group], Math.ceil(object.verticesNum / 64));
        }
        runtimeObject.updateCPUDataFromGPUBuffer(object, {vertex: {weight: true}});
    }
}

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
    constructor(/** @type {Application} */ app) {
        this.app = app;
        this.projectName = "名称未設定";
        this.workSpaceTool = new WorkSpaceTool();

        this.MASKTEXTURESIZE = [1024,1024];

        this.MAX_GRAPHICMESH = 200; // グラフィックメッシュの最大数
        this.MAX_VERTICES_PER_GRAPHICMESH = 1000; // グラフィックメッシュあたりの最大頂点数
        this.MAX_MESHES_PER_GRAPHICMESH = 2000; // グラフィックメッシュあたりの最大頂メッシュ数
        this.MAX_ANIMATIONS_PER_GRAPHICMESH = 10; // グラフィックメッシュあたりの最大アニメーション数

        this.MAX_BONEMODIFIER = 32; // アーマチュアの最大数
        this.MAX_BONES_PER_ARMATURE = 200; // アーマチュアあたりの最大頂点数

        this.MAX_BEZIERMODIFIER = 32; // ベジェモディファイアの最大数
        this.MAX_VERTICES_PER_BEZIERMODIFIER = 10; // ベジェモディファイアあたりの最大頂点数
        this.MAX_ANIMATIONS_PER_BEZIERMODIFIER = 10; // ベジェモディファイアあたりの最大アニメーション数

        this.areasConfig = {};
        for (const keyName in useClassFromAreaType) {
            this.areasConfig[keyName] = new useClassFromAreaType[keyName]["areaConfig"]();
        }

        this.contextmenusItems = {}
    }

    stContextmenuItems() {
        this.contextmenusItems = {
            "Viewer": {
                "オブジェクト": [
                    {label: "オブジェクトを追加", children: [
                        {label: "グラフィックメッシュ", children: [
                            {label: "normal", eventFn: () => {
                                const command = new CreateObjectCommand({objectType: "グラフィックメッシュ", dataType: "normal"});
                                app.operator.appendCommand(command);
                                app.operator.execute();
                            }},
                            {label: "body", eventFn: () => {
                                const command = new CreateObjectCommand({objectType: "グラフィックメッシュ", dataType: "body"});
                                app.operator.appendCommand(command);
                                app.operator.execute();
                            }},
                        ]},
                        {label: "ベジェモディファイア", children: [
                            {label: "normal", eventFn: () => {
                                const command = new CreateObjectCommand({objectType: "ベジェモディファイア", dataType: "normal"});
                                app.operator.appendCommand(command);
                                app.operator.execute();
                            }},
                            {label: "body", eventFn: () => {
                                const command = new CreateObjectCommand({objectType: "ベジェモディファイア", dataType: "body"});
                                app.operator.appendCommand(command);
                                app.operator.execute();
                            }},
                        ]},
                        {label: "アーマチュア", children: [
                            {label: "normal", eventFn: () => {
                                const command = new CreateObjectCommand({objectType: "アーマチュア", dataType: "normal"});
                                app.operator.appendCommand(command);
                                app.operator.execute();
                            }},
                            {label: "body", eventFn: () => {
                                const command = new CreateObjectCommand({objectType: "アーマチュア", dataType: "body"});
                                app.operator.appendCommand(command);
                                app.operator.execute();
                            }},
                        ]},
                    ]},
                    {label: "メッシュの生成", eventFn: async () => {
                        for (const /** @type {GraphicMesh} */graphicMesh of this.app.scene.state.selectedObject) {
                            await graphicMesh.editor.createEdgeFromTexture(1, 10);
                        }
                    }},
                    {label: "削除", children: [
                        {label: "選択物", eventFn: () => {
                            const command = new DeleteObjectCommand(this.app.scene.state.selectedObject);
                            app.operator.appendCommand(command);
                            app.operator.execute();
                        }},
                    ]},
                ],
                // "メッシュ編集": [
                //     {label: "test"},
                // ],
            },
            "Hierarchy": {
                "オブジェクト": [
                    {label: "オブジェクトを追加", children: [
                        {label: "グラフィックメッシュ"},
                    ]},
                    {label: "test"},
                ]
            }
        }
    }

    getContextmenuItems(type, mode) {
        return this.contextmenusItems[type][mode];
    }
}

class AreaOperator {
    constructor(app) {
        this.app = app;
        this.areaMap = new Map();
    }

    setArea() {

    }
}

export class Application { // 全てをまとめる
    constructor(/** @type {HTMLElement} **/ dom) {
        this.dom = dom; // エディターが作られるdom
        this.appConfig = new AppConfig(this);
        this.options = new AppOptions(this);

        this.hierarchy = new Hierarchy(this);
        this.scene = new Scene(this);
        this.appConfig.stContextmenuItems();
        this.animationPlayer = new AnimationPlayer(this);

        this.areas = [];
        this.areaMap = new Map();
        this.activeArea = null;
        this.fileIO = new FaileIOManager(this);
        this.input = new InputManager(this);
        this.operator = new Operator(this);

        this.contextmenu = new ContextmenuOperator(this);
    }

    init() {
        this.scene.init();
    }

    async getSaveData() {
        const result = {};
        result.hierarchy = this.hierarchy.getSaveData();
        result.scene = await this.scene.getSaveData();
        return result;
    }

    createArea(axis, target = this.dom) { // エリアの作成
        const area = new AutoGrid(createID(), target, axis, 50);
        this.areaMap.set(area, []);
        return area;
    }

    setAreaType(/** @type {AutoGrid} */grid, index, type) {
        const area_dom = document.createElement("div");
        area_dom.style.width = "100%";
        area_dom.style.height = "100%";
        const area = new Area(type,area_dom);
        area.grid = grid;
        this.areas.push(area);
        this.areaMap.get(grid).push(area);
        grid[`child${index + 1}`].append(area_dom);
    }

    deleteArea(/** @type {Area} */area) {
        area.target.replaceChildren();
        /** @type {AutoGrid} */
        const grid = area.grid;
        const gridInnner = this.areaMap.get(grid);
        indexOfSplice(gridInnner, area);
        console.log(gridInnner)
        console.log(grid.container);
        console.log(grid.target);
        grid.target.replaceChildren();
        if (gridInnner.length) {
            grid.target.append(gridInnner[0].target);
        }
        indexOfSplice(this.areas, area);
        this.areaMap.delete(area);
    }

    update() {
        // 表示順番の再計算
        this.scene.updateRenderingOrder();
        this.scene.updateAnimationCollectors();
        this.scene.update();
        // this.animationPlayer.update(1 / 60);
        this.animationPlayer.update(0.2);
        // ビューの更新
        this.areas.forEach((area) => {
            area.update();
        })
        // this.operator.execute();
    }
}

const useClassFromAreaType = {
    "Viewer": {area: Area_Viewer, areaConfig: ViewerSpaceData},
    "Hierarchy": {area: Area_Hierarchy, areaConfig: HierarchySpaceData},
    "Inspector": {area: Area_Inspector, areaConfig: ViewerSpaceData},
    "Preview": {area: Area_Preview, areaConfig: ViewerSpaceData},
    "Timeline": {area: Area_Timeline, areaConfig: TimelineSpaceData},
    "Property": {area: Area_Property, areaConfig: TimelineSpaceData},
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
        this.uiModel?.creator?.remove();
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
        this.isPlaying = false;
        this.speed = 1.0;
        this.beforeFrame = app.scene.frame_current;
    }

    update(dt) {
        if (this.isPlaying) {
            this.app.scene.frame_current += dt * this.speed;
            managerForDOMs.update("タイムライン-canvas");
        }
        if (this.beforeFrame != this.app.scene.frame_current) {
            if (this.app.scene.frame_end < this.app.scene.frame_current) {
                this.app.scene.frame_current = this.app.scene.frame_start;
            }
            if (this.app.scene.frame_current < this.app.scene.frame_start) {
                this.app.scene.frame_current = this.app.scene.frame_end;
            }
            this.beforeFrame = this.app.scene.frame_current;
            managerForDOMs.update(this.app.scene, "frame_current");
        }
    }
}

export const app = new Application(document.getElementById("app"));

const area1 = app.createArea("w");
const area1_h = app.createArea("h", area1.child1);
const area2 = app.createArea("w", area1.child2);
const area3 = app.createArea("h", area2.child2);
app.setAreaType(area1_h,0,"Viewer");
app.setAreaType(area1_h,1,"Timeline");
app.setAreaType(area2,0,"Hierarchy");
app.setAreaType(area3,0,"Property");
app.setAreaType(area3,1,"Inspector");

app.init();

function appUpdate() {
    try {
        app.update();
    } catch(error) {
        console.error(error)
    }
    requestAnimationFrame(appUpdate);
}

appUpdate();