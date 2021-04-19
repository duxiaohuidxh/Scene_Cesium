/**
 * @Description:
 * @author 杜晓辉
 * @date 2021/4/19 10:13:49
 */
import * as turf from '@turf/turf'
import Cesium from 'cesium/Source/Cesium'
export default class MeasureArea {
    constructor(viewer, isTerrain, style) {
        this.viewer = viewer;
        this.isTerrain = isTerrain;
        this.style = style
        this.handler = null
        this.tempEntities = [];
        this.lineEntities = []
        this.labelPosition = {
            x: 1,
            y: 1,
            z: 1
        };
        this.countArea = "";
        this.tempPoints = []
        this.textDivs = []

        this._addDisListener()
    }
    _addDisListener() {
        let viewer = this.viewer
        let scene = viewer.scene;
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        this.handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
        this._countArea()
        // 绘制面
        this._drawPoly();
        let isDraw = false
        let reDraw = false
        this.handler.setInputAction((movement) => {
            if (reDraw) {
                this._reDraw()
                reDraw = false
            }

            let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
            //test
            let ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            if (cartesian) {
                this.tempPoints.push(cartesian.clone());
                this._drawPoint(this.tempPoints[this.tempPoints.length - 1]);
            }

            isDraw = true

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.endPosition) : viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
                let ray = viewer.camera.getPickRay(movement.endPosition);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (cartesian) {
                    let tempPoints = this.tempPoints
                    if (tempPoints.length > 2) {
                        tempPoints.pop()
                        tempPoints.push(cartesian.clone());
                        if (tempPoints.length > 2) {
                            // 大于3个点的时候，在显示面积
                            this.labelPosition = cartesian.clone();
                        } else {
                            this.labelPosition = null;
                        }

                    }
                    if (tempPoints.length === 2) {
                        tempPoints.push(cartesian.clone());
                    }
                    if (tempPoints.length < 2) {
                        return;
                    }
                    var area = this._SphericalPolygonAreaMeters(tempPoints)
                    this.countArea = area > 1000000 ? (area / 1000000).toFixed(1) + 'k㎡' : area.toFixed(1) + '㎡'
                    if (area > 10000000000) this.countArea = (area / 10000000000).toFixed(1) + '万k㎡'
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction((movement) => {
            if (isDraw) {
                let cartesian = this.isTerrain === true ? scene.pickPosition(movement.position) : viewer.camera.pickEllipsoid(movement.position, scene.globe.ellipsoid);
                //test
                let ray = viewer.camera.getPickRay(movement.position);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
                if (cartesian) {
                    var tempLength = this.tempPoints.length;
                    if (tempLength < 2) {
                        alert('请选择3个以上的点再执行闭合操作命令');
                        this._reDraw()
                        return;
                    }
                    let tempPoints = this.tempPoints
                    // tempPoints.push(cartesian.clone());
                    if (tempPoints.length > 2) {
                        tempPoints.pop();
                        tempPoints.push(cartesian.clone());
                    }
                    this._drawPoint(tempPoints[tempPoints.length - 1]);

                }
                isDraw = false
                reDraw = true
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)
    }
    _reDraw() {
        this.tempPoints = []
        this.labelPosition = null
        for (let entity of this.tempEntities) {
            this.viewer.entities.remove(entity)
        }
        this.tempEntities = []
    }
    _drawArea(tempPoints) {
        let area = this._SphericalPolygonAreaMeters(tempPoints)
        let are = area > 1000000 ? (area / 1000000).toFixed(1) + 'k㎡' : area.toFixed(1) + '㎡'
        if (area > 10000000000) are = (area / 10000000000).toFixed(1) + '万k㎡'

        var entity =
            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(tempPoints[tempPoints.length - 1].lon, tempPoints[tempPoints.length - 1].lat),
                label: this.style.labelStyle
            });
        entity.label.text = '面积' + are
        this.tempEntities.push(entity);
    }
    _countArea() {
        let self = this;
        let entity = this.viewer.entities.add({
            label: this.style.labelStyle
        });
        entity.position = new Cesium.CallbackProperty(function () {
            return self.labelPosition;
        }, false)
        entity.label.text = new Cesium.CallbackProperty(function () {
            return self.countArea;
        }, false)
        this.lineEntities.push(entity);
    }

    _drawLine(linePositionList) {
        let lineStyle = this.style.lineStyle

        let entity = this.viewer.entities.add({
            polyline: lineStyle,
        });

        entity.polyline.positions = new Cesium.CallbackProperty(function () {
            return linePositionList;
        }, false)

        this.lineEntities.push(entity);
    }
    _drawPoint(point_Cartesian3) {
        let entity =
            this.viewer.entities.add({
                position: point_Cartesian3,
                point: {
                    pixelSize: 10,
                    color: Cesium.Color.GOLD,
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });
        this.tempEntities.push(entity);
    }

    _drawDiv(cartesian3) {
        let viewer = this.viewer
        let container = viewer.container
        let textDiv = document.createElement('div')
        this.textDivs.push(textDiv)
        container.appendChild(textDiv)
        textDiv.setAttribute('style', 'width:200px;height:30px;border:1px solid rgb(61,154,250);border-radius:4px;box-shadow:0px 0px 30px rgb(61,154,250) inset, 0px 0px 30px rgb(61,154,250);position:absolute;')

        viewer.clock.onTick.addEventListener(function () {
            let cartesian = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, cartesian3);
            // console.log(cartesian)
            textDiv.style.left = `${cartesian.x - 100}px`
            textDiv.style.top = `${cartesian.y}px`
        })
    }
    _removeDiv() {
        for (let textDiv of this.textDivs) {
            this.viewer.container.removeChild(textDiv)
            this.textDivs = []
        }
    }

    _drawPoly() {
        let polyStyle = this.style.polyStyle
        let entity =
            this.viewer.entities.add({
                polygon: polyStyle
            });
        entity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
            return this.tempPoints;
        }, false)
        // entity.polygon.hierarchy = Cesium.Cartesian3.fromDegreesArrayHeights(pArray)
        this.lineEntities.push(entity);

    }

    // 世界坐标转经纬坐标
    _car3ToLatLon(cartesian) {
        let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        let longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        let latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        return {
            lon: longitudeString,
            lat: latitudeString,
            height: cartographic.height
        };
    }
    //微元法求面积
    /**
     * var ray = viewer.scene.camera.getPickRay(movement.endPosition);
                if (ray)
                    position1 = viewer.scene.globe.pick(ray, viewer.scene);

     * cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(position1);
                if (cartographic) {
                    //海拔
                    var height = viewer.scene.globe.getHeight(cartographic);
            var point = Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, height);
         = String(countAreaInCartesian3(polygon.path))
     * @param {*} ps 
     */
    countAreaInCartesian3(ps) {
        var s = 0;
        for (var i = 0; i < ps.length; i++) {
            var p1 = ps[i];
            var p2;
            if (i < ps.length - 1)
                p2 = ps[i + 1];
            else
                p2 = ps[0];
            s += p1.x * p2.y - p2.x * p1.y;
        }
        return Math.abs(s / 2);
    }



    // 计算面积
    _SphericalPolygonAreaMeters1(points) {
        let arr = []
        for (let point of points) {
            arr.push([point.lon, point.lat])
        }
        arr.push([points[0].lon, points[0].lat])
        let arr1 = []
        arr1.push(arr)
        let polygon = turf.polygon(arr1)
        let area = turf.area(polygon);
        // console.log(area)
        return area;
    }
    // 计算面积
    _SphericalPolygonAreaMeters(points) {
        let arr = []
        let arr0 = []
        for (let point of points) {
            point = this._car3ToLatLon(point)
            arr.push([point.lon, point.lat])
            arr0.push(point);
        }

        let pt0 = this._car3ToLatLon(points[0]);
        arr.push([pt0.lon, pt0.lat])
        let arr1 = []
        arr1.push(arr)
        // let polygon = turf.polygon(arr1)
        // let area = turf.area(polygon);
        let area = getArea(arr0, points);
        // console.log("turf方法：" + area)
        // console.log("微元法：" + this.countAreaInCartesian3(points));
        // console.log("叉积：" + getArea(arr0, points));
        return area;
    }

    //移除整个资源
    remove() {
        let viewer = this.viewer
        // for (let textDiv of this.textDivs) {
        // 	viewer.container.removeChild(textDiv)
        // }
        for (let tempEntity of this.tempEntities) {
            viewer.entities.remove(tempEntity)
        }
        for (let lineEntity of this.lineEntities) {
            viewer.entities.remove(lineEntity)
        }
        this.handler.destroy()
    }

}
const getArea = (function () {
    var radiansPerDegree = Math.PI / 180.0;//角度转化为弧度(rad) 
    var degreesPerRadian = 180.0 / Math.PI;//弧度转化为角度
    //计算多边形面积
    function getArea(points, positions) {

        var res = 0;
        //拆分三角曲面
        for (var i = 0; i < points.length - 2; i++) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            var totalAngle = Angle(points[i], points[j], points[k]);
            var dis_temp1 = distance(positions[i], positions[j]);
            var dis_temp2 = distance(positions[j], positions[k]);
            res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
        }
        // return (res / 1000000.0).toFixed(4);
        return res;
    }

    /*角度*/
    function Angle(p1, p2, p3) {
        var bearing21 = Bearing(p2, p1);
        var bearing23 = Bearing(p2, p3);
        var angle = bearing21 - bearing23;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }
    /*方向*/
    function Bearing(from, to) {
        var lat1 = from.lat * radiansPerDegree;
        var lon1 = from.lon * radiansPerDegree;
        var lat2 = to.lat * radiansPerDegree;
        var lon2 = to.lon * radiansPerDegree;
        var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
        if (angle < 0) {
            angle += Math.PI * 2.0;
        }
        angle = angle * degreesPerRadian;//角度
        return angle;
    }
    function distance(point1, point2) {
        var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
        var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        var s = geodesic.surfaceDistance;
        //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
        //返回两点之间的距离
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
        return s;
    }
    return getArea;
})()