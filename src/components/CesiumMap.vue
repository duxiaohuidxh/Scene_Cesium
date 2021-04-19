<template>
  <div class="container">
    <div id="cesiumContainer"></div>
    <canvas id="myCanvas"></canvas>
    <div class="measure">
      <el-menu
              :default-active="activeIndex2"
              class="el-menu-demo"
              mode="horizontal"
              @select="handleSelect"
              background-color="rgba(0,0,0,.4)"
              active-text-color="#ffd04b">
        <el-menu-item index="1">菜单</el-menu-item>
        <el-submenu index="2">
          <template slot="title" >测量工具</template>
          <el-menu-item index="2-1" @click.native="measureTriangle()">高度</el-menu-item>
          <el-menu-item index="2-2" @click.native="measureDistance()">距离</el-menu-item>
          <el-menu-item index="2-3" @click.native="measureArea()">面积</el-menu-item>
          <el-menu-item index="2-4" @click.native="remove()">清除</el-menu-item>
        </el-submenu>
        <el-submenu index="3">
          <template slot="title" >空间分析</template>
          <el-menu-item index="3-1"  @click.native="heatMap()">热力图</el-menu-item>
          <el-menu-item index="3-2" @click.native="createProfile()">剖面分析</el-menu-item>
          <el-menu-item index="3-3" @click.native="add3DTiles()">3DTiles</el-menu-item>
          <el-menu-item index="3-4" @click.native="createViewLine()">通视(DEM)</el-menu-item>
        </el-submenu>
        <el-submenu index="4">
          <template slot="title" >动态分析</template>
          <el-menu-item index="4-1" @click.native="createViewShed()">可视域(DEM)</el-menu-item>
          <el-menu-item index="4-2" @click.native="viewshed3DAnalysis()">可视域(综合)</el-menu-item>
          <el-menu-item index="4-3" @click.native="submergenceAnalysis()">淹没分析</el-menu-item>
          <el-menu-item index="4-4" @click.native="clipTerrainGro()">挖地形</el-menu-item>
        </el-submenu>
        <el-submenu index="5">
          <template slot="title" >综合分析</template>
          <el-menu-item index="5-1" @click.native="slopElevationAnalysis()">坡度等高线</el-menu-item>
          <el-menu-item index="5-2" @click.native="queryBufferAnalysis()">缓冲区</el-menu-item>
          <el-menu-item index="5-3" @click.native="queryAnalysis()">叠置</el-menu-item>
          <el-menu-item index="5-4" @click.native="networkAnalysis()">网络分析</el-menu-item>
        </el-submenu>
        <el-menu-item index="6" @click.native="remove()">清除 <i class="el-icon-delete"></i></el-menu-item>
      </el-menu>
<!--      <ul>-->
<!--        <li v-on:click="measureTriangle()">高度</li>-->
<!--        <li :class="selected?'btn-sel':'btn'" v-on:click="measureDistance()">距离</li>-->
<!--        <li v-on:click="measureArea()">面积</li>-->
<!--        <li v-on:click="remove()">清除</li>-->
<!--        <li v-show="true" v-on:click="heatMap()">热力图</li>-->
<!--        <li v-on:click="createProfile()">剖面分析</li>-->
<!--        <li v-on:click="add3DTiles()">3DTiles</li>-->
<!--        <li v-on:click="createViewLine()">通视(DEM)</li>-->
<!--        <li v-on:click="createViewLine(1)">通视(3DTiles)</li>-->
<!--        <li v-show="false" v-on:click="createViewShed()">可视域(DEM)</li>-->
<!--        <li v-show="false" v-on:click="viewshed3DAnalysis()">可视域(综合)</li>-->
<!--        <li v-on:click="submergenceAnalysis()">淹没分析</li>-->
<!--        <li v-on:click="clipTerrainGro()">挖地形</li>-->
<!--        <li v-on:click="slopElevationAnalysis()">坡度等高线</li>-->
<!--        <li v-on:click="queryBufferAnalysis()">缓冲区</li>-->
<!--        <li v-on:click="queryAnalysis()">叠置</li>-->
<!--        <li v-on:click="networkAnalysis()">网络分析</li>-->
<!--      </ul>-->
    </div>
    <ProfileChart v-show="profileShow" v-bind:dataSet="profileData"></ProfileChart>
    <SubmergAnalysis v-if="submergAna" v-bind:viewer="viewer"></SubmergAnalysis>
    <SlopElevation v-if="slopEle" v-bind:viewer="viewer"></SlopElevation>
    <ViewShed3D v-if="viewshed3D" v-bind:viewer="viewer"></ViewShed3D>
    <QueryBuffer v-if="queryBuf" v-bind:viewer="viewer"></QueryBuffer>
    <MakeRouting v-if="networkAna" v-bind:viewer="viewer"></MakeRouting>
    <div id="credit"></div>
    <PositionMouse v-bind:viewer="viewer"></PositionMouse>
  </div>
</template>

<script>
  // import Cesium from "cesium/Source/Cesium";
  // import Cesium from "cesium/Build/Cesium/Cesium";
  //import Viewer from "cesium/Source/Widgets/Viewer/Viewer";
  import buildModuleUrl from "cesium/Source/Core/buildModuleUrl";
  import "cesium/Source/Widgets/widgets.css";
  import Base from "../modules/Base";
  import MeasureDistance from "../modules/MeasureDistance";
  import MeasureArea from "../modules/MeasureArea";
  import MeasureTriangle from "../modules/MeasureTriangle";
  import HeatMap from "../modules/heatmap";
  import PositionMouse from "./PositionMouse.vue";
  import ProfileChart from "./ProfileChart.vue";
  import DrawProfile from "../modules/DrawProfile";
  import DrawViewLine from "../modules/DrawView";
  import ViewShed3DAnalysis from "../modules/viewshed_3dtiles/ViewShed3DAnalysis";
  import ViewShed3D from "./ViewShed3D";
  import DrawViewShed3D from "../modules/viewshed_3dtiles/DrawViewShed3D";

  import SubmergAnalysis from "./SubmergAnalysis.vue";
  import ClipTerrain from "../modules/ClipTerrain";
  import SlopElevation from "./SlopElevation";
  import { factors } from "@turf/turf";
  import QueryBuffer from "./QueryBuffer.vue";
  import MakeRouting from "./MakeRouting.vue";
  import QueryByPolygon from "../modules/query/queryByPolygon";

  export default {
    name: "CesiumMap",
    mounted: function() {
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhNWIzMTYyZS1kMmQyLTRkOTAtYmRhZC0yZjZhOTE2YzZmYTEiLCJpZCI6MTI2NDksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjE1NDE0ODh9.0jXPnp2IJ0RJ2gwvok4ybt0aIbekgiKRJbi-ehThGO4';
      // buildModuleUrl.setBaseUrl("../static/cesium/");
      buildModuleUrl.setBaseUrl("../cesium/");
      var tdtAnnoLayer = new Cesium.WebMapTileServiceImageryProvider({
        url: "http://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=d99ffacb3eeafd378927c060ab39bdab",
        layer: "tdtAnnoLayer",
        style: "default",
        format: "image/jpeg",
        dimensions: {
          tk: "8cf3af25e445d634f1f8ba4572aebb41",
        },
        tileMatrixSetID: "GoogleMapsCompatible",
      });
      let opts = {
        animation: false, //是否显示动画控件
        baseLayerPicker: false, //是否显示图层选择控件
        geocoder: false, //是否显示地名查找控件
        timeline: false, //是否显示时间线控件
        sceneModePicker: false, //是否显示投影方式控件
        navigationHelpButton: false, //是否显示帮助信息控件
        infoBox: false, //是否显示点击要素之后显示的信息
        homeButton: false,
        selectionIndicator: false,
        creditContainer: "credit",
        shouldAnimate: true,
        shadows: true,
        // terrainProvider: Cesium.createWorldTerrain({
        //   requestVertexNormals: true
        // })

        imageryProvider: new Cesium.MapboxImageryProvider({
          mapId: 'mapbox.satellite',
          accessToken: 'pk.eyJ1IjoiZGVuZ3plbmdqaWFuIiwiYSI6ImNqbGhnbWo1ZjFpOHEzd3V2Ynk1OG5vZHgifQ.16zy39I-tbQv3K6UnRk8Cw',
        }),
        terrainProvider : Cesium.createWorldTerrain(),
        //terrainProvider: Base.addLocalTerrainLayer(),
        // imageryProvider: Base.addLocalImageLayer(),
        //imageryProvider: Base.addBaseImageLayer()

      };
      this.viewer = new Cesium.Viewer("cesiumContainer", opts);
      var viewer = this.viewer;

      /**
       * viewer 导航视图综合展示
       * 包括比例尺
       * 指北针
       * 放大器
       */
      this.viewer.extend(Cesium.viewerCesiumNavigationMixin, {
        defaultResetView: Cesium.Rectangle.fromDegrees(60.0, 60.0, 160, 8.0),
        enableCompass: true,
        enableZoomControls: false,
        enableDistanceLegend: true,
        enableCompassOuterRing: false,
      });

      this.viewer.imageryLayers.addImageryProvider(tdtAnnoLayer,1);
      this.base = new Base(viewer);
      this.base.showBeijingPositon();
      // 深度检测
      viewer.scene.globe.depthTestAgainstTerrain = true;
    },
    data() {
      return {
        viewer: {},
        selected: false,
        profileShow: false,
        profileData: null,
        submergAna: false,
        slopEle: false,
        viewshed3D: false,
        queryBuf: false,
        networkAna: false,
        activeIndex2: '1'
      };
    },
    components: {
      PositionMouse,
      ProfileChart,
      SubmergAnalysis,
      SlopElevation,
      ViewShed3D,
      QueryBuffer,
      MakeRouting
    },
    methods: {
      handleSelect() {

      },
      measureTriangle: function() {
        this.remove();
        this.measureTri = new MeasureTriangle(
                this.viewer,
                false,
                {
                  labelStyle: {
                    font: "15px sans-serif",
                    pixelOffset: new Cesium.Cartesian2(0.0, -30),
                    fillColor: new Cesium.Color(1, 1, 1, 1),
                    showBackground: true,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                  },
                  lineStyle: {
                    width: 2,
                    material: Cesium.Color.CHARTREUSE
                  }
                },
                () => {}
        );
      },
      measureDistance: function() {
        this.remove();
        this.measureDis = new MeasureDistance(
                this.viewer,
                false,
                {
                  labelStyle: {
                    pixelOffset: new Cesium.Cartesian2(0.0, -30),
                    fillColor: new Cesium.Color(1, 1, 1, 1),
                    showBackground: true,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY
                  },
                  lineStyle: {
                    width: 2,
                    material: Cesium.Color.CHARTREUSE
                    // 是否贴地
                    // clampToGround: true,
                  }
                },
                () => {}
        );
      },

      measureArea: function() {
        this.remove();
        this.measureAre = new MeasureArea(this.viewer, false, {
          labelStyle: {
            pixelOffset: new Cesium.Cartesian2(0.0, -30),
            fillColor: new Cesium.Color(1, 1, 1, 1),
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          lineStyle: {
            width: 1,
            material: Cesium.Color.CHARTREUSE
          },
          polyStyle: {
            hierarchy: {},
            outline: true,
            outlineColor: Cesium.Color.MAGENTA,
            outlineWidth: 2,
            material: Cesium.Color.CHARTREUSE,
            // 默认贴地
            arcType: Cesium.ArcType.GEODESIC
          }
        });
      },

      remove: function() {
        if (this.measureAre) {
          this.measureAre.remove();
          this.measureAre = null;
        }
        if (this.measureDis) {
          this.measureDis.remove();
          this.measureDis = null;
        }
        if (this.measureTri) {
          this.measureTri.remove();
          this.measureTri = null;
        }
        if (this.profileObj) {
          this.profileObj.remove();
          this.profileObj = null;
          this.profileShow = false;
        }
        if (this.viewSlightLine) {
          this.viewSlightLine.remove();
          this.viewSlightLine = null;
        }
        if (this.clipTerrainObj) {
          this.clipTerrainObj.remove();
          this.clipTerrainObj = null;
        }
        if (this.viewShedObj) {
          this.viewShedObj.remove();
          this.viewShedObj = null;
        }
        if (this.heatMapObj) {
          this.heatMapObj.show(false);
        }
      },
      heatMap: function() {
        const data = [];
        //  west: -74.013069,
        //     east:  40.7014,
        //      south: -73.9957,
        //      north: 40.7265
        const bounds = {
          west: -74.013069,
          south: 40.7014,
          east: -73.9957,
          north: 40.7265
        };

        for (let index = 0; index < 100; index++) {
          const element = {
            x: bounds.west + (bounds.east - bounds.west) * Math.random(),
            y: bounds.south + (bounds.north - bounds.south) * Math.random(),
            value: Math.random() * 100
          };
          data.push(element);
        }
        // console.log(JSON.stringify(data));
        if (!this.heatMapObj) {
          this.heatMapObj = new HeatMap(this.viewer, data, bounds);
        } else {
          this.viewer.zoomto(this.heatMapObj.heatMap._layer);
        }
      },
      createProfile: function() {
        this.profileShow = false;
        this.profileObj = new DrawProfile(
                this.viewer,
                {
                  lineStyle: {
                    width: 2,
                    material: Cesium.Color.CHARTREUSE,

                    // 是否贴地
                    clampToGround: true
                  }
                },
                data => {
                  this.profileShow = true;
                  this.profileData = data;
                }
        );
      },
      add3DTiles: function() {
        // Load the NYC buildings tileset
        if (!this.tilesetObj) {
          var tileset = this.base.get3Dtiles();
          this.viewer.scene.primitives.add(tileset);
          this.tilesetObj = tileset;
        }
        this.base.show3DtilesPosition();
        // if (!this.tilesetObj) {
        var tileset = this.base.addBJBuilding3Dtiles();
        this.viewer.scene.primitives.add(tileset);
        // this.tilesetObj = tileset;
        // }
      },
      createViewLine: function(type = 0) {
        this.remove();
        this.viewSlightLine = new DrawViewLine(
                this.viewer,
                type,
                {
                  lineStyle: {
                    width: 2,
                    material: Cesium.Color.CHARTREUSE
                    // 是否贴地
                    // clampToGround: true,
                  }
                },
                data => {
                  this.profileShow = true;
                  this.profileData = data;
                }
        );
      },
      submergenceAnalysis: function() {
        this.submergAna = !this.submergAna;
      },
      createViewShed: function() {
        if (!this.viewShedObj) {
          // this.viewShedObj = new ViewShed3D(this.viewer);
          this.viewShedObj = new DrawViewShed3D(
                  this.viewer,
                  false,
                  {
                    labelStyle: {
                      font: "15px sans-serif",
                      pixelOffset: new Cesium.Cartesian2(0.0, -30),
                      fillColor: new Cesium.Color(1, 1, 1, 1),
                      showBackground: true,
                      disableDepthTestDistance: Number.POSITIVE_INFINITY
                    },
                    lineStyle: {
                      width: 2,
                      material: Cesium.Color.CHARTREUSE
                    }
                  },
                  () => {}
          );
        }
      },
      clipTerrainGro: function() {
        if (!this.clipTerrainObj) {
          this.clipTerrainObj = new ClipTerrain(this.viewer);
        }
      },
      slopElevationAnalysis: function() {
        this.slopEle = !this.slopEle;
      },
      viewshed3DAnalysis: function() {
        this.viewshed3D = !this.viewshed3D;
      },
      queryBufferAnalysis: function() {
        this.queryBuf = !this.queryBuf;
      },
      queryAnalysis: function() {
        this.queryPolygon = new QueryByPolygon(this.viewer, false, {
          labelStyle: {
            pixelOffset: new Cesium.Cartesian2(0.0, -30),
            fillColor: new Cesium.Color(1, 1, 1, 1),
            showBackground: true,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          lineStyle: {
            width: 1,
            material: Cesium.Color.CHARTREUSE
          },
          polyStyle: {
            hierarchy: {},
            outline: true,
            outlineColor: Cesium.Color.MAGENTA,
            outlineWidth: 2,
            material: Cesium.Color.CHARTREUSE,
            // 默认贴地
            arcType: Cesium.ArcType.GEODESIC
          }
        });
      },
      networkAnalysis: function() {
        this.networkAna = !this.networkAna;
      }
    }
  };
</script>

<style>
  #cesiumContainer {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .container {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  #credit {
    display: none;
  }

  .measure {
    position: absolute;
    top: 1px;
    /*background-color: #555758;*/
    /*padding: 5px;*/
    width: 100%;
    /*color: #fff;*/
  }
  .btn-sel {
    border: 1px;
  }

  .btn {
    border: 0px;
  }

  #menu {
    position: absolute;
    top: 50px;
  }
  .el-menu--horizontal>.el-submenu .el-submenu__title, .el-menu--horizontal>.el-menu-item {
    height: 45px;
    line-height: 45px;
  }
  .el-menu.el-menu--horizontal{
    border-bottom: solid 0px #e6e6e6;
  }
</style>