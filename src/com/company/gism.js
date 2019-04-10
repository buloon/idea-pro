/**
 * 地图初始化模块
 * Created by Tomas on 2017/7/6.
 */
define('gism', function ( ) {

    // 命名空间 避免产生冲突
    var global = {

        // 地图缓存
        map : {},
        LACOrCI : 'lac', // 显示LACorCI，默认显示LAC
        LAC : 'lac',     // LAC
        CI : 'ci',       // CI
        data : null,     // 服务器返回的前台数据,默认为null，每次框选后更新
        tempData : [],   // 需要显示在地图上的数据，data的子集
        markers : [],    // 查询条件
        events : ['click', 'contextmenu', 'mouseover', 'mouseout'], // 事件
        colorMap : {1 : 'x'},    // 色码对
        lacColorMap : {1 : 'x'}, // lac 对应的颜色
        ciColorMap : {1 : 'x'},  // ci  对应的颜色

        tvalue: null,
        tmarkers: [], // 切换点标识符

        // query-area 模块中查询方法需要的参数
        type : {},
        layer: {},
        map  : {},
        minX : null,
        minY : null,
        maxX : null,
        maxY : null,

        // switch模块查询时需要的参数
        s_lac : '',
        s_ci  : '',
        queryMethod : '',      // 查询方法

        // 基站查询
        isShowStation : false,
        sdata : [],      // 基站数据
        smarkers : [],     // 基站的图标
        clusterLayer:{},   // 基站聚合层
        s_data : [],       // 基站下包含的数据(普通数据数组)
        s_polyline : [],   // 点到基站的距离图标
        stationSwitch : {},// 显示基站开关
        stationPoper : null, // 基站导出弹窗对象
        fields : [],
        stationData: [],  // 基站原始数据
        tempStation: null,

        // playMarkers
        pMarkers: [],
        lc: null,
        dc: null,
        i: 0,
        j: 0,
        timer: null,

        // 右侧点击切换点标识
        toggleFlag: true,

        // 基站纠偏(默认为杭州标准)
        transLat : -0.0022241001501903668,
        transLon : 0.004597023223894325
    };

    /**
     * 获取地图信息
     */
    var initMapOptions = function() {
        var url = "/syngis-map/mapInfo/getProperties";
        var param =  window.location.search;
        var depId = {depId:param.substring(7, param.length)}
        $.ajax({
            type: "GET",
            url: url,
            async: false,
            dataType: 'json',
            data: depId,
            success: function(returnData){
                return renderMap(returnData);
            },
            error: function () {
                alertify.error('无法获取地图信息');
            }
        });
    }

    /**
     * 初始化地图
     * @returns {L.Map} map 对象
     */
    var renderMap =  function(options){
        var options = {
            mapUrl: 'http://12.6.3.15:7775/map',
            //mapUrl: 'http://60.191.98.34:7780/HangZhouMap',
            YMin: 36.0729083503,  
            XMin: 103.8699673554,
        }
        var mapUrl = options.mapUrl;

        // 图层
        var base = new L.TileLayer(mapUrl+ '/{z}/{xd}/{yd}/{x}_{y}_{z}.png',{
            maxZoom : 17,
        });

        // 初始化map对象
        map = new L.Map('map', {
            renderer : L.canvas(),
            layers: [base],
            center: new L.LatLng(options.YMin, options.XMin),
            zoom: 12,
            fullscreenControl: false,// 地图全屏
            zoomControl:false,

            // 禁止地图右键
            contextmenu: true,
            contextmenuWidth: 140,
            contextmenuItems: []
        });

        // var normalm = L.tileLayer.chinaProvider('GaoDe.Normal.Map', {
        //     maxZoom: 18,
        //     minZoom: 5
        // });
        // var imgm = L.tileLayer.chinaProvider('GaoDe.Satellite.Map', {
        //     maxZoom: 18,
        //     minZoom: 5
        // });
        // var imga = L.tileLayer.chinaProvider('GaoDe.Satellite.Annotion', {
        //     maxZoom: 18,
        //     minZoom: 5
        // });
        //
        // var officeLine = L.tileLayer.chinaProvider('GaoDe.Normal.Map2', {
        //     maxZoom: 18,
        //     minZoom: 5
        // });
        // var normal = L.layerGroup([normalm]),
        //     image = L.layerGroup([imgm, imga]);
        //
        // var baseLayers = {
        //     "高德在线地图": normal,
        //     "高德离线地图": officeLine,
        //     "高德影像地图": image,
        // }

        // map = gis.map = L.map("map", {
        //     center: [options.YMin, options.XMin],
        //     zoom: 12,
        //     layers: [normal],
        //     zoomControl: false
        // });
        L.control.layers(base, null).addTo(map);

        // 比例尺
        L.control.scale().addTo(map);
        // zoom条
        L.control.zoom({position:'topleft'}).addTo(map);

        /**
         * 小地图
         */
        var osmUrl=mapUrl+'/{z}/{xd}/{yd}/{x}_{y}_{z}.png';// http:// 172.16.1.55:7780/Map
        var osmAttrib='Map data &copy; OpenStreetMap contributors';// 属性
        var osm = new L.TileLayer(osmUrl, {minZoom: 0, maxZoom: 13, attribution: osmAttrib});// MiniMap 图层
        // ---设置MiniMap---
        var miniMap = new L.Control.MiniMap(osm, {  toggleDisplay: true }).addTo(map);
        global.map  = map;
        // 设置纠偏
        localStorage.setItem("transLat", options.transLat);
        localStorage.setItem("transLon", options.transLon);

        global.transLat = Number(options.transLat);
        global.transLon = Number(options.transLon);
        // gis.latcorrection = Number(options.OffsetY);
        // gis.lngcorrection = Number(options.OffsetX);
        gis.latcorrection = 0;
        gis.lngcorrection = 0;
        gis.lngcorrection = 0;

        // 设置提示条位置
        alertify.set('notifier','position', 'bottom-center');
        return map;
    };

    /**
     * 渲染右上角菜单
     */
    var renderMainMenu = function () {
        var flag = true;// 展开
        $("#toggle-menu").click(function () {
            if(flag == true){
                $(".toggle").hide().delay(1000);
                $(".main-menu").animate({'width':370},500,'swing');
                $("#toggle-menu").empty();
                $("#toggle-menu").append('<i class="fa fa-chevron-right " aria-hidden="true" ></i>')
                flag = false;
            }else{
                $(".main-menu").animate({'width':679},500,'swing');
                setTimeout(function () {
                   $(".toggle").show();
                },500);
                $("#toggle-menu").empty();
                $("#toggle-menu").append('<i class="fa fa-chevron-left " aria-hidden="true" ></i>')
                flag = true;
            }
        });
    };

    /**
     * 绘制点函数
     * @param data    点数据
     * @param lacOrCi 显示lac切换orci切换
     */
    var drawPoints = function(data,rightMenuFlag){
        removelayerFromMap(map, global.pMarkers);
        // 移除地图上的切换点layer
        removelayerFromMap(map, global.tmarkers);

        // 移除地图上的普通点layer
        removelayerFromMap(map, global.markers);

        // 移除地图上的基站layer
        removelayerFromMap(map, global.smarkers);

        // 移除虚线layers
        removelayerFromMap(map, global.s_polyline);

        // 清空markers缓存
        global.markers = [];

        if(data.length == 0){
            alertify.error('无数据');
            $('#loading').hide();
            renderToggleMenu(rightMenuFlag, data);
            return;
        }

        // 清除点颜色缓存
        // 处理markers
        for(var i in data){
            // 排除LAC CI 为0 经纬度为0的点
            if(data[i].lac == '0' || data[i].lat == '0'){
                continue;
            }

            var color = setPointColor(data[i], global.LACOrCI);
            var x_y  = gis.wgs84_To_Gcj02(data[i].lat, data[i].lon);
            var lat  = x_y.split("-")[0];
            var lon = x_y.split("-")[1];
            var marker = L.circle([lat, lon], 0, {color: color});
            marker.addTo(global.map);

            // 注册事件
            showInfo(marker, data[i])
        }

        // 传入tempData 而不是 global.data
        global.tempData = data;

        // 生成切换菜单
        renderToggleMenu(rightMenuFlag, data);

        // 显示基站
        if(global.isShowStation){
            showStation();
        }
        $('#loading').hide();
        alertify.success('查询完成');
    }

    /**
     * 绑定maker的Dom事件
     * @param marker 对应图标
     * @param data marker 的一些基本信息
     */
     var showInfo = function (marker, data) {
        global.markers.push(marker);
        marker.on('mouseover', function (e) {
            // 阻止冒泡
            L.DomEvent.stopPropagation(e);
            gis.renderMouseMenu(e.containerPoint,data);
        });

        marker.on("mouseout", function (e) {
            //e.stopPropagation();
            L.DomEvent.stopPropagation(e);
            gis.hideMouseMenu();
        })


        marker.on('click',function (e) {
            // 阻止冒泡
            L.DomEvent.stopPropagation(e);
            pointClick(data);
        });

        marker.on('contextmenu', function (e) {
            L.DomEvent.stopPropagation(e);
            // 右键菜单渲染
            pointContextMenu(data);
        })
    };

    /**
     * 数据预览按钮
     */
    var pointContextMenu = function(data){
        // 添加选择操作的窗口，此处应该有设计模式
        var modal_id = Math.ceil(Math.random()*10000000);
        var content = ''
            +'<div>'
            +'    <button type="button" id="btn-dataPreview'+modal_id+'" class="btn btn-info" style="margin:0px 55px 0px 4px;">对应基站</button>'
            +'    <button type="button" id="btn-dataReport'+modal_id+'"  class="btn btn-info">同基站数据</button>'
            +'</div>';
 
        var poper = gis.pop_init('功能选择',content,null,"200",'100');

        /**
         * 同基站下数据
         */
        $('#btn-dataReport'+modal_id).click(function () {
            // 弹出框取消
            poper.fadeOut(100);
            poper.empty();
            queryDataByCI(data);
        })

        /**
         * 查看对应基站
         */
        $('#btn-dataPreview'+modal_id).click(function(){

            // 弹出框取消
            poper.fadeOut(100);
            poper.empty();

            var url ='/syngis-map/queryStation/querySingleStation';
            var param = {module:$("#model_select").val(), lac:data.lac, ci:data.ci};
            $.synfun.ajax(url, param, function (returnData) {
                // 清除上个虚线layer
                if(global.s_polyline.length > 0){
                    global.s_polyline.forEach(function (e) {
                        e.unbindTooltip();
                        global.map.removeLayer(e);
                    })
                }

                // 无数据不进行打点
                if(returnData.length ==0 || returnData == ""){
                    poper.fadeOut(100);
                    poper.empty();
                    alertify.error('无对应基站');
                    return;
                }

                var temData = returnData;
                // {4G:[]} --> [] 遍历属性
                for(var i in returnData){

                    // 判断经纬度是否符合实际情况
                    var lat = returnData[i][0].lat;

                    // lat == 0
                    if(lat == '0'){
                        poper.fadeOut(100);
                        poper.empty();
                        alertify.error('基站经纬度为0');
                        return ;
                    }

                    // lat == 0.001
                    lat = lat.split('.')[0];
                    lat = lat.charAt(0);
                    if(lat == '0'){
                        poper.fadeOut(100);
                        poper.empty();
                        alertify.error('基站经纬度为0');
                        return ;
                    }

                    // 范围外数据无图标
                    global.tempStation = returnData[i][0];
                    if(returnData[i].length != 0 && returnData[i] != null  ){
                        returnData = returnData[i];
                        break;
                    }
                }

                // 数据纠偏
                var x_y  = gis.wgs84_To_Gcj02(data.lat, data.lon);
                var latP  = x_y.split("-")[0];
                var lonP = x_y.split("-")[1];

                // 基站纠偏
                var x_y  = gis.wgs84_To_Gcj02(returnData[0].lat, returnData[0].lon);
                var latS = x_y.split("-")[0];
                var lonS = x_y.split("-")[1];

                // 3.渲染虚线layer
                var polyline = gis.drawPolyline(map, latP, lonP, latS, lonS);
                polyline.addTo(global.map);

                // 1.渲染数据
                var pointData = gis.queryDataFromGloab(global.tempData, data.lac, data.ci );
                drawPoints(pointData);

                drawStations(temData, null);

                // 虚线存入缓存
                global.s_polyline.push(polyline);
            },'POST');
        });

        $('#btn-dataReport'+modal_id).click(function(){
            // 窗口消失
            poper.fadeOut(0);
            poper.empty();
        });
    };

    var queryDataByCI = function(data){

        // 1.渲染数据
        var pointData = gis.queryDataFromGloab(global.tempData, data.lac, data.ci );
        drawPoints(pointData);
    };

    /**
     * 根据lac设置点的颜色
     * @param data
     * @returns 十六位色码
     */
    var setPointColor = function (data, moduleKey) {
        // true : colormap 中存在对应的lac-color映射

        var flag = true;
        for(var key in global.colorMap){
            if(data[moduleKey] == key ){
                flag = false;
                break;
            }
        }
        var color = null;
        if(flag){
            color = gis.getRandomColor();
            global.colorMap[data[moduleKey]] = color;
        }else{
            color = global.colorMap[data[moduleKey]];
        }
        return color;
    };

    /**
     * 点的单机事件 弹出对话框
     * @param data 点的所有制式的详细信息
     */
    var pointClick = function (data) {
        var url = '/syngis-map/queryArea/queryPointInfo';
        var param = {'aid': data.aid, 'lon' : data.lon, 'lat':data.lat};
        $.synfun.ajax(url, param, function (returnData) {
            var modal_id = Math.ceil(Math.random()*10000000);
            // tab标签
            var tabHeader  = '';
            var tabContent = '';
            // 主区表头
            var mTableHeader = '';
            var mTableBody = '';

            // 邻区表头
            var nTableHeader = '';
            var nTableBody = '';

            // actve 属性
            var active = '';
            // 匹配以N结束的字符串
            var pattern = /N$/;

            // 邻区的英文名称
            var neiModuleName = '';

            // 模块字段集合
            var modules = gis.modules();

            // 当前的模式名称
            var thisModuleName = $('#model_select').val();

            // 模块中文名称
            var cnModuleName = gis.moduleName;

            for(var i in modules ){
                // 实际的名称
                var moduleName = i;
                // 跳过邻区
                if(i.match(pattern)){
                    continue;
                }
                if(i.indexOf('X') > 0){
                    neiModuleName = i + 'N';
                }else{
                    neiModuleName = i.substring(0, i.length - 1) + 'N';
                }
                // tab标签名
                if(thisModuleName == moduleName){
                    // 设置active属性和标签头属性
                    active = ' in active';
                    tabHeader =  '<li class="active"><a data-toggle="pill" href="#' +i+modal_id + '">'+cnModuleName[thisModuleName]+'</a></li>' +tabHeader;
                }else{
                    tabHeader += '<li><a data-toggle="pill" href="#' +i+modal_id+ '">'+cnModuleName[i]+'</a></li>'
                }

                var mData = '';
                if(returnData[moduleName]){
                    // 生成主区表格,主区长度为1，故取[0]
                    mData = returnData[moduleName][0];
                    mTableHeader += '<tr>';
                    mTableBody += '<tr>';
                    for(var j in modules[i]){ // j 数组下标
                        if(!mData[modules[i][j]]){
                            mData[modules[i][j]] = '';
                        }
                        mTableHeader += '<th style="white-space: nowrap">' + modules[i][j].toUpperCase() + '</th>';
                        mTableBody += '<td  style="white-space: nowrap">'+ mData[modules[i][j]] + '</td>';
                    }

                    mTableHeader += '</tr>';
                    mTableBody += '</tr>';

                    var headerFlag = true;
                    // 生成邻区表格
                    // nData 邻区数据，数组形式
                    var nData = returnData[[neiModuleName]];

                    for(var j in nData){

                        var obj = nData[j]; // obj 一个邻区数据

                        nTableHeader += '<tr>';
                        nTableBody += '<tr>';
                        for(var k in modules[neiModuleName]){
                            // 保证邻区表头不重复
                            if(headerFlag){
                                nTableHeader += '<th style="white-space: nowrap">' +  modules[neiModuleName][k].toUpperCase() + '</th>';
                            }
                            nTableBody += '<td style="white-space: nowrap">'+ obj[modules[neiModuleName][k]] + '</td>';
                        }
                        nTableHeader += '</tr>';
                        nTableBody += '</tr>';
                        headerFlag = false;
                    }
                }

                tabContent +=
                    '<div id="'+i+modal_id+'" class="tab-pane fade'+active+'" >' +
                    '<h4 style="text-align:center">主区</h4>'+
                    <!--main-->
                    '    <table class="table table-bordered table-responsive">' +
                    '        <thead>' +
                                 mTableHeader +
                    '        </thead>' +
                    '        <tbody>' +
                                 mTableBody +
                    '        </tbody>' +
                    '    </table>' +

                    '<h4 style="text-align:center">邻区</h4>'+
                    <!--nei-->
                    '    <table class="table table-bordered table-responsive">' +
                    '        <thead>' +
                                 nTableHeader +
                    '        </thead>' +
                    '        <tbody>' +
                                 nTableBody +
                    '        </tbody>' +
                    '    </table>' +
                    '</div>';
                mTableHeader = '';
                mTableBody = '';
                nTableHeader = '';
                nTableBody = '';
                active = '';
            } <!-- /for(returnData)-->

           var content = ' ' +
                   '<div class="point-menu" >' +
                       '<div style="overflow: auto">' +
                           '<ul class="nav nav-pills" style="width:1600px">' +
                                tabHeader +
                           '</ul>' +
                       '</div>'+
                       '<div style="overflow: auto; height: 495px"> '+
                           '<div class="tab-content">' +
                                tabContent +
                           '</div>'+
                       '</div>'+
               '</div><!-- /. tabular menu -->'
            gis.pop_init('点信息', content, null, 800, 600);

            // 生成右侧模块信息
            renderRightModuleMenu(returnData);
        }, 'POST')

    };

    /**
     * 点击地图的点，在右侧菜单生成所有制式的lac-ci列表
     * @param returnData 返回的点的所有制式
     */
    var renderRightModuleMenu = function (returnData) {
        var moduleName = gis.moduleName;
        var result = []
        for(var i in moduleName){
            // 排除邻区
            if(i.indexOf('N') > 0){
                continue;
            }
            var name = moduleName[i];
            if(returnData[i]){
                var lac = returnData[i][0].lac;
                var ci = returnData[i][0].ci;
                result.push({name: name, lac: lac, ci:ci})
            }else{
                result.push({name: name, lac: '', ci:''})
            }
        }
        // 渲染到页面
        $scope = angular.element($('#module-data')).scope();
        $scope.$apply(function () {
            $scope.lcData = result;
        });
    };

    /**
     * 按lac-ci的按钮，功能：切换LAC-CI
     */
    var toggleLC = function () {

        $('.switch').on('switchChange.bootstrapSwitch', function (e, flag) {
            // data = true ,显示LAC
            if(flag){
                global.LACOrCI = global.LAC;
            }else{
                global.LACOrCI = global.CI;
            }
            // 如果没有数据，则不进行操作
            if(!global.tempData){
                return ;
            }
           drawPoints(global.tempData);
        });
    };

    /**
     * 从地图中移除layer
     * @param map 对象
     * @param layers 对应的图层或者图层数组
     */
    var removelayerFromMap = function (map, layers) {
        // 数组
        if(layers instanceof Array){
            for(var i in layers){
                map.removeLayer(layers[i]);
                for(var type in global.events){
                    layers[i].off(global.events[type], null,null);
                }
            }
        }else{
            map.removeLayer(layers);
            for(var type in global.events){
                layers.off(global.events[type], null,null);
            }
        }
        // 清空缓存数组
        // global.markers = [];
    };

    /**
     * 右侧菜单栏生成
     * @param element
     * @param gis
     */
    var renderRightSideMenu = function(){
        var titleHeight = 20;
        var height = $(window).height() - titleHeight ; // 窗口高度-导航栏，
        var left = $(window).width();	  // 右侧菜单left值
        var right_menu_closeId = Math.ceil(Math.random()*100);

        $('[toolId=menu_figure]').css({left:left, height:height});
        $('[toolId=menu_figure]').fadeIn(500);
        $('.right-row').css({'height':height - 120});

        var now_status = $('.popover-rightmenu').attr('sfzt')
        // 当鼠标移动到按钮时 触发弹出时间
        $('.outbtn').click(function(e){
            now_status = $('.popover-rightmenu').attr('sfzt')
            if(now_status == 1){
                $('[toolId=menu_figure]').animate({'left':left-350+'px'}); // 移出
                $('.popover-rightmenu').attr('sfzt',2)
            }
            if(now_status == 2 ){
                $('[toolId=menu_figure]').animate({'left':left+'px'}); // 收回
                $('.popover-rightmenu').attr('sfzt',1)
            }
        });

        // 点X关闭窗口
        $('button[syngis_rightmenu_closeId=right_menu_closeId]').click(function(){
            $('[toolId=menu_figure]').animate({'left':left+'px'});
            $('.popover-rightmenu').attr('sfzt',1)
        });

        // 窗口变化，菜单随之变化
        $(window).resize(function(){
            left = $(window).width();
            height = $(window).height() - titleHeight ;
            $('.popover-rightmenu').css({'left':left,'height':height})

            $('.right-row').css({'height':height - 120});
        });


    };// <!-- 右侧菜单结束 -->

    /**
     * 渲染右侧lac-ci颜色菜单
     * @param rightMenuFlag
     * @data 需要渲染的数据
     */
    var renderToggleMenu = function (rightMenuFlag, data, isShowLac) {

        if(!rightMenuFlag){
            // 多线程，不影响其他dom事件
            var worker = new Worker('./plugins/woker.js');
            worker.postMessage([data, global.colorMap, global.LACOrCI]);
            worker.onmessage = function (e) {

                var data = e.data;
                var lacViewData = e.data;

                // 清空当前表格
                $(".lac-tbody").html('');

                var tbody = '<tbody class="lac-tbody">';
                for(var i in data){
                    if(data[i]['lac'] == '0'){
                        continue;
                    }

                    var rowspan = 'rowspan = "' + data[i].cis.length + ' " ';
                    var tdCi = '';

                    // 显示lac时rowspan应该为1
                    if(!isShowLac){
                        rowspan ='';

                        // ci单元格在只显示lac时，值为''
                        // tdCi = '<td></td>'
                        tdCi =  '<td class="ciView" value="' + data[i].cis[0].color + '">' + data[i].cis[0].key + '</td>' ;
                    }else{
                        tdCi =  '<td class="ciView" value="' + data[i].cis[0].color + '">' + data[i].cis[0].key + '</td>' ;
                    }
                    tbody += '' +
                        '<tr class = "lac-line">' +  // 第一行数据
                        '    <td class="serial-num" ' + rowspan + '>'+ i + ' &nbsp' +
                                 ' <i class="fa fa-angle-down" style="cursor: pointer" aria-hidden="true"></i>' +
                                 ' <i class="fa fa-angle-up"  aria-hidden="true" style="cursor: pointer; display: none"></i>' +
                            '</td>' +
                        '    <td class="lacView" value="'+ data[i].cis[0].color + '" ' + rowspan + '>' + data[i].lac + '</td>' +
                              tdCi +// ci单元格
                        '    <td > <div class="td-circle"  style="background-color: ' + data[i].cis[0].color + '"></div></td>' +
                        '</tr>';

                    // 判断是否显CI
                    if(isShowLac){
                        for(var j =1; j < data[i].cis.length; j++){
                            tbody += '' +
                                '<tr lac-attr=' + data[i].lac + ' >' +
                                '    <td class="ciView" value="' + data[i].cis[j].color + '">' + data[i].cis[j].key + '</td>' +
                                '    <td>' +
                                '        <div class="td-circle"  style="background-color: ' + data[i].cis[j].color + '"></div>' +
                                '    </td>' +
                                '</tr>';
                        }
                    }
                }
                tbody += '</tbody>';

                $("#right-menu-table").append(tbody)

                // 添加表格展开标记 expand
                if(isShowLac){
                    $(".lac-line").attr('expand', '1');
                    $(".fa-angle-down").hide();
                    $(".fa-angle-up").show();
                }

                // 表格点击查询事件
                rowClickEvent();

                // 点击查看lac下对应ci
                var lacViewFlag = true;
                $(".serial-num").click(function(){

                    // 获取当前选择的lac节点
                    var lac = $(this).next('.lacView').text();
                    var thisLacLine = $(this).parent();
                    var index = 0;
                    var trs = '';

                    if(thisLacLine.attr('expand') == "1"){
                        thisLacLine.removeAttr('expand');
                        $(this).next().removeAttr('rowspan');
                        $(this).removeAttr('rowspan');
                        thisLacLine.children("td").children('.fa-angle-down').show();
                        thisLacLine.children("td").children(".fa-angle-up").hide();
                        $("[lac-attr=" + lac + "]").remove();
                        return;
                    }else{
                        thisLacLine.children("td").children('.fa-angle-down').hide();
                        thisLacLine.children("td").children(".fa-angle-up").show();
                    }

                    // 遍历数据
                    lacViewData.forEach(function (e) {
                        // 选取对应lac下的ci
                        if(e.lac == lac ){
                            var cis = e.cis;
                            for(var i in cis){
                                ++index;
                                // 第一个ci 对应lac所在的第一行
                                if(i == '0'){
                                    // .lacView 的兄弟元素 CI 那行
                                    thisLacLine.next('.lacView').next().text(cis[i].key);
                                    // 给添加标记的属性
                                    thisLacLine.attr("expand","1");
                                    continue;
                                }
                                trs += '' +
                                    '<tr lac-attr=' + lac + '>' +
                                    '     <td class="ciView" value="cis[i].color">' + cis[i].key + '</td>' +
                                    '     <td>' +
                                    '         <div class="td-circle"  style="background-color: ' + cis[i].color + '"></div>' +
                                    '     </td>'
                                    '</tr>';
                            }
                        }
                    });

                    // 设置rowspan属性
                    thisLacLine.children(':first-child').attr("rowspan", index);
                    thisLacLine.children('.lacView').attr("rowspan", index);
                    thisLacLine.after(trs);
                    // 添加表格点击事件

                    rowClickEvent();
                })

                // 初始化只显示LAC开关
                var options = {
                    size   : 'small',
                    checked:  false,
                    beforeChange : function () {},
                    onChange :function () {
                        var flag = $('#isShowLAC').prop('checked');
                        renderToggleMenu(rightMenuFlag, global.tempData, flag);
                    },
                };
                var el = document.querySelector('#isShowLAC');
                var lacSwitch = new Switch(el, options);
                worker.terminate();
            };// 线程结束
        }
    };

    /**
     *  单机表格事件
     */
    var rowClickEvent = function(){
        $('.ciView').unbind('click');
        $('.lacView').unbind('click');
        var flag2 = false;
        var flag = false;
        // 添加ci点击地图对应点显示事件
        $('.ciView').click(function (e) {


            var ci =  $(this).text();

            //发生切换 显示
            if(ci != global.tvalue){

                inde()
                global.tvalue = ci;
                var color = $(this).attr("value");
                global.tmarkers = toggleMenuFun(ci, color, 'ci');
                e.stopPropagation();
                console.log('1')
                flag2 = false;
                flag = false;
            // 点击本身进行 显示-->隐藏
            }else if(flag){
                inde()
                global.tvalue = ci;
                var color = $(this).attr("value");
                global.tmarkers = toggleMenuFun(ci, color, 'ci');
                e.stopPropagation();
                flag = false;
                console.log('2')
            }else{
                inde();
                flag = true;
                console.log('3')
            }


        });

        // 添加LAC点击,地图显示对应点事件
        $('.lacView').click(function (e) {

            var lac  = $(this).text();
            //发生切换 显示
            if(lac != global.tvalue){

                inde()
                global.tvalue = lac;
                var color = $(this).attr("value");
                global.tmarkers = toggleMenuFun(lac, color, 'lac');
                e.stopPropagation();
                flag2= false;
                flag = false;
                // 点击本身进行 显示-->隐藏
            }else if(flag2){
                inde()
                global.tvalue = lac;
                var color = $(this).attr("value");
                global.tmarkers = toggleMenuFun(lac, color, 'lac');
                e.stopPropagation();
                flag2= false;
            }else{
                inde();
                flag2 = true;
            }

        })

        var inde = function(){
            // 移除原来地图上的点
            if( global.tmarkers.length >= 1){
                removelayerFromMap(map, global.tmarkers);
            }
        }

    }

    /**
     * 点击右侧lac-ci菜单，在地图中突出显示
     */
    var toggleMenuFun = function (key, color, isLacOrCi) {


        var layers = [];

        // 鼠标聚焦事件
        // 点击显示对应覆盖物
        // 赋值方便操作
        var data = global.tempData;

        // 移除原来地图上的点
        if(layers.length >= 1){
            removelayerFromMap(map,layers);
        }

        // 清除缓存
        // layers = [];


        var index = 0;
        for(var i in data){
            // 获取lac或者ci的值
            if(data[i][isLacOrCi] == key){

                var x_y  = gis.wgs84_To_Gcj02(data[i].lat, data[i].lon);
                var lat  = x_y.split("-")[0];
                var lon = x_y.split("-")[1];

                if(index == 0){

                    map.panTo([lat, lon]);
                }
                // 点击LAC显示对应的覆盖物（纠偏）
                var layer = L.marker([lat, lon]);
                map.addLayer(layer);
                layers.push(layer);
                index++;
            }
        }

        return layers;
        // $('.lacView,.ciView').click(function () {
        //     console.log("隐藏", !global.toggleFlag)
        //     // 移除原来地图上的点
        //     if(layers.length >= 1){
        //         removelayerFromMap(map,layers);
        //         // 清除缓存
        //         layers = [];
        //        // result = [];
        //     }
        //     global.toggleFlag = true;
        // });
    };

    /**
     * 切换制式的时候对信息进行查询
     */
    var drawPointsBySelectModule = function () {
        // 注册事件
        $('#model_select').change(function () {
            if(global.queryMethod == 'area'){
                QueryAreaFactory(global.type, global.layer, global.map)
            }else if(global.queryMethod == 'switch'){
                if(!$("#lac").val()){
                    alertify.confirm('请输入LAC-CI值!').setHeader('提示 ');
                    return;
                }
                queryBySwtich();
            }
        });
    };

    /**
     * 绘制覆盖物工具条
     * @param map
     */
    var renderToolbar = function () {

        // 初始化的FeatureGroup存储可编辑的图层
        var drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);
        // 初始化drawControl并将FeaGroup导入其中
        var drawControl = new L.Control.Draw({
            draw: {
                position: 'topleft',
                polygon: {
                    title: 'Draw a sexy polygon!',
                    allowIntersection: false,
                    drawError: {
                        color: '#b00b00',
                        timeout: 1000
                    },
                    shapeOptions: {
                        color: '#bada55'
                    },
                    showArea: true
                },
                polyline: {
                    metric: false
                },
                circle: {
                    shapeOptions: {
                        color: '#662d91'
                    }
                }
            },
            edit: {
                featureGroup: drawnItems
            }
        });
        // 将工具条加入地图
        map.addControl(drawControl);

        // 画图完成事件
        map.on('draw:created', function (e) {
            var type = e.layerType;
            var layer = e.layer;
            drawnItems.addLayer(layer);
            $('#loading').show();
            var queryArea = QueryAreaFactory(type, layer, map);
            // marker时，不采取赋值全局变量操作
            if(type != 'marker'){
                global.layer = layer;
                global.type = type;
                global.map = map;
            }

            // 删除覆盖物
            global.markers.push(layer);
        });

        undoTyping();
    };

    /**
     * 返回按钮
     */
    var undoTyping = function () {
        $('#undo-typing').click(function(e){
            QueryAreaFactory(global.type, global.layer, map);

            //// 显示基站
            if(global.isShowStation){
                showStation();
            }

        })
    }
    /**
     * 安全工厂方法生成基类 QueryAreaFactory
     * 根据区域查询数据
     * @param type
     * @param layer
     * @param map
     * @returns {QueryAreaFactory}
     * @constructor
     *
     */
    var QueryAreaFactory = function (type, layer, map) {
        // 先清除上一次的数据
        global.data = [];
        global.queryMethod = 'area';

        if(this instanceof QueryAreaFactory){

            var s = new this[type](layer,map);
            return s;
        }else{

            return new QueryAreaFactory(type, layer, map);
        }
    }

    /**
     * QueryAreaFactory 查询区域中的点
     * @type {{polyline: polyline, polygon: polygon, rectangle: rectangle, circle: circle, marker: marker}}
     */
    QueryAreaFactory.prototype = {
        marker : function (layer, map) {
            // 纠偏功能
            var layerO = null;

            // 鼠标移动时，直线跟着移动
            map.on('mousemove',function (e1) {

                if(layerO){
                    map.removeLayer(layerO);
                }
                layerO = L.polyline([layer._latlng, e1.latlng],{
                    weight: 2,
                    color: 'black',
                    dashArray: '2, 6'
                });
                map.addLayer(layerO);
            })

            // 点击鼠标右键，取消纠偏操作
            map.on('contextmenu', function (e) {
                map.off('mousemove');
                map.off('click');
                map.off('contextmenu');
                map.removeLayer(layerO);
                map.removeLayer(layer);
            })

            // 点击地图 获取坐标计算误差
            map.on('click', function (e) {
                map.off('mousemove');
                map.off('click');
                map.off('contextmenu');
                map.removeLayer(layerO);
                map.removeLayer(layer);
                var latT = global.transLat = layerO._latlngs[1].lat - layerO._latlngs[0].lat ;
                var lngT = global.transLon = layerO._latlngs[1].lng - layerO._latlngs[0].lng ;

                localStorage.setItem("transLat", latT);
                localStorage.setItem("transLon", lngT);
                drawStations(global.stationData)
            })
        },

        polyline : function (layer, map) {

            // 将经纬度按照大小顺序排列
            var latlngs = layer._latlngs;
            var lats = [];
            var lons = [];
            for(var i in latlngs){
                // 反纠偏
                lats.push(latlngs[i].lat);
                lons.push(latlngs[i].lng);
            }

            // 排序
            lats = lats.sort();
            lons = lons.sort();

            // 取出最大最小值
            var minX = global.minX = lons[0];
            var minY = global.minY = lats[0];
            var maxX = global.maxX = lons[lons.length - 1];
            var maxY = global.maxY = lats[lats.length - 1];
            var WIDTH = 100;
            var DEGREE_WIDTH = WIDTH / (1.1111 * Math.pow(10, 5)) / 0.86602;

            // 查询数据
            var url = '/syngis-map/queryArea/queryAreaData';
            var params = {module:$("#model_select").val(), minX:minX - DEGREE_WIDTH, minY:minY - DEGREE_WIDTH, maxX:maxX + DEGREE_WIDTH, maxY:maxY + DEGREE_WIDTH};
            $.synfun.Ajax(url, params,
                function(data) {
                    // 实际的判断过程
                    data = gis.isInpolyline(data, latlngs);
                    if(data.length == 0){
                        alertify.error("无符合条件数据");
                        $('#loading').hide();
                        return;
                    }
                    global.data = data;
                    drawPoints(data);
                },
                function() {
                    console.log("未查询到数据");
                }, null,null)
        },

        // 多边形
        polygon : function (layer, map) {

            // 解析图层;
            var latlngs = layer._latlngs[0];

            var temp = null;
            var lats = [];
            var lngs = [];
            for(var i in latlngs){
                lats.push(latlngs[i].lat);
                lngs.push(latlngs[i].lng);
            }

            lats = lats.sort();
            lngs = lngs.sort();
            var length = lats.length;

            var minX = global.minX = lngs[0];
            var minY = global.minY = lats[0];
            var maxX = global.maxX = lngs[length-1];
            var maxY = global.maxY = lats[length-1];

            // 查询数据
            var url = '/syngis-map/queryArea/queryAreaData';
            var params = {module:$('#model_select').val(), minX:minX, minY:minY, maxX:maxX, maxY:maxY};
            $.synfun.Ajax(url, params,function(data) {

                    // 判断点是否在多边形内部 数学逻辑判断
                    var data = gis.isInPolygon(data, latlngs)
                    // 执行打点操作
                    drawPoints(data);
                    global.data = data;
                },
                function() {
                    console.log("未查询到数据")
                }, null,null)
        },

        // 矩形
        rectangle :function (layer, map) {

            var minLatlng = layer._latlngs[0][0];
            var maxLatlng = layer._latlngs[0][2];

            // 经纬度纠偏
            var minX = global.minX = minLatlng.lng;
            var minY = global.minY = minLatlng.lat;
            var maxX = global.maxX = maxLatlng.lng;
            var maxY = global.maxY = maxLatlng.lat;

            // 查询数据
            var url = "/syngis-map/queryArea/queryAreaData";
            var params = {module:$('#model_select').val(), minX:minX, minY:minY, maxX:maxX, maxY:maxY};
            $.synfun.Ajax(url, params, function(data) {
                    drawPoints(data);
                    global.data = data;
                },
                function() {
                    console.log("查询出错")
                }, null, null);
        },

        // 圆
        circle : function (layer, map) {
            var r = layer._mRadius;// 半径 米

            // 圆心经纬度反纠偏
            var lat = layer._latlng.lat;
            var lng = layer._latlng.lng;

            var d = r/(1.1111*Math.pow(10,5))/0.6;

            var minX = global.minX = lng-d;
            var minY = global.minY = lat-d;
            var maxX = global.maxX = lng+d;
            var maxY = global.maxY = lat+d;

            // 查询数据
            var url = '/syngis-map/queryArea/queryAreaData';
            var params = {module:$('#model_select').val(), minX:minX, minY:minY, maxX:maxX, maxY:maxY};
            $.synfun.Ajax(url, params, function(data) {
                data = gis.isInCircle(data, lat, lng , r);
                drawPoints(data);
                global.data = data;
            },function() {}, null, null);
        },
    };

    /**
     * 安全工厂方法生成基类 QueryStationFactory
     * 根据区域查询基站
     * @param type
     * @param layer
     * @param map
     * @returns {QueryAreaFactory}
     * @constructor
     */
    var QueryStationFactory = function (type, layer, map) {
        if(type == 'marker'){
            return;
        }
        if(this instanceof QueryStationFactory){
            var s = new this[type](layer,map);
            return s;
        }else{
            return new QueryStationFactory(type, layer, map);
        }
    };

    /**
     * QueryStationFactory 查询区域中的基站
     * @type {{polyline: polyline, polygon: polygon, rectangle: rectangle, circle: circle, marker: marker}}
     */
    QueryStationFactory.prototype = {

        polyline : function (layer, map) {

            // 将经纬度按照大小顺序排列
            var latlngs = layer._latlngs;
            var lats = [];
            var lons = [];
            for(var i in latlngs){
                // 反纠偏
                lats.push(latlngs[i].lat);
                lons.push(latlngs[i].lng);
            }

            // 排序
            lats = lats.sort();
            lons = lons.sort();

            // 取出最大最小值
            var minX = global.minX = lons[0];
            var minY = global.minY = lats[0];
            var maxX = global.maxX = lons[lons.length - 1];
            var maxY = global.maxY = lats[lats.length - 1];
            var WIDTH = 100;
            var DEGREE_WIDTH = WIDTH / (1.1111 * Math.pow(10, 5)) / 0.86602;

            // 查询基站
            var url = "/syngis-map/queryStation/queryByArea";
            var params = {module:$("#model_select").val(), minX:minX - DEGREE_WIDTH, minY:minY - DEGREE_WIDTH, maxX:maxX + DEGREE_WIDTH, maxY:maxY + DEGREE_WIDTH};

            $.synfun.Ajax(url, params,
                function(data) {
                    for(var module in data){
                        data[module] = gis.isInpolyline(data[module], latlngs)
                    }

                    drawStations(data);
                }, function() {console.log("未查询到数据")}, null,null);
        },

        // 多边形
        polygon : function (layer, map) {

            // 解析图层
            this.map = map;
            this.layer = layer;
            var latlngs = layer._latlngs[0];

            var lats = [];
            var lngs = [];

            for(var i in latlngs){
                lats.push(latlngs[i].lat);
                lngs.push(latlngs[i].lng);
            }

            var lats = lats.sort();
            var lngs = lngs.sort();
            var length = lats.length;

            var minX = lngs[0];
            var minY = lats[0];
            var maxX = lngs[length-1];
            var maxY = lats[length-1];

            // 查询基站
            var url = "/syngis-map/queryStation/queryByArea";
            var params = {module:$('#model_select').val(), minX:minX, minY:minY, maxX:maxX, maxY:maxY};
            $.synfun.Ajax(url, params,
                function(data) {
                    // 判断点是否在多边形内部 数学逻辑判断
                    for(var module in data){
                        data[module] = gis.isInPolygon(data[module], latlngs)
                    }
                    drawStations(data);
                }, function() {console.log("未查询到数据")}, null,null);

        },

        // 矩形
        rectangle :function (layer, map) {

            var minLatlng = layer._latlngs[0][0];
            var maxLatlng = layer._latlngs[0][2];

            // 经纬度纠偏
            // var minX = gis.stationTransLon(minLatlng.lng, global.transLon, false);
            // var minY = gis.stationTransLat(minLatlng.lat, global.transLat, false);
            // var maxX = gis.stationTransLon(maxLatlng.lng, global.transLon, false);
            // var maxY = gis.stationTransLat(maxLatlng.lat, global.transLat, false);


            var minX = minLatlng.lng;
            var minY = minLatlng.lat;
            var maxX = maxLatlng.lng;
            var maxY = maxLatlng.lat;
            // 查询基站
            var url = "/syngis-map/queryStation/queryByArea";
            var params = {module:$('#model_select').val(), minX:minX, minY:minY, maxX:maxX, maxY:maxY};
            $.synfun.Ajax(url, params,
                function(data) {
                for(var module in data){
                    if(!global.tempStation)
                        break;
                    data[module].push(global.tempStation);
                    break;
                }
                global.tempStation =  null;

                drawStations(data)
                }, function() {console.log("未查询到数据")}, null,null);

        },

        // 圆
        circle : function (layer, map) {
            this.map = map;
            this.layer = layer;
            var r = layer._mRadius;// 半径 米

            // 圆心经纬度反纠偏
            var lat = layer._latlng.lat;
            var lng = layer._latlng.lng;

            var d = r/(1.1111*Math.pow(10,5))/0.6;

            var minX = lng-d;
            var minY = lat-d;
            var maxX = lng+d;
            var maxY = lat+d;

            // 查询基站
            var url = "/syngis-map/queryStation/queryByArea";
            var params = {module:$('#model_select').val(), minX:minX, minY:minY, maxX:maxX, maxY:maxY};
            $.synfun.Ajax(url, params, function(data) {
                // 判断点是否在圆内部 数学逻辑判断
                for(var module in data){
                    data[module] =  gis.isInCircle(data[module], lat, lng , r);
                }
                drawStations(data);
            }, function() {console.log("未查询到数据")}, null,null);
        },
    };

    /******************query-switch********************/

    /**
     * 根据lac 或者ci 进行查询
     */
    var initializeSwitch = function () {
        // 点击go开始查询
        $('#go').click(function () {
            if(!$("#lac").val()){
                alertify.confirm('请输入LAC-CI值!').setHeader('提示 ');
                return;
            }
            queryBySwtich();
        })
        $('#station-go').click(function () {
            if(!$("#lac").val()){
                alertify.confirm('请输入LAC-CI值!').setHeader('提示 ');
                return;
            }
            querySingleStation()
        })
    }

    /**
     * 根据：LAC CI 查询基站
     */
    var querySingleStation = function () {
        var url ='/syngis-map/queryStation/querySingleStation';
        var lac = global.s_lac = $("#lac").val();
        var ci  = global.s_ci = '';
        if(lac.indexOf('-') > 0){
             lac = $("#lac").val().split('-')[0];
             ci  = $("#lac").val().split('-')[1];
        }

        var param = {module: $("#model_select").val(), lac: lac, ci: ci};
        $.synfun.ajax(url, param, function (returnData) {
            if(!returnData){
                alertify.error('无数据!');

            }
            drawStations(returnData )
        }, "POST")
    }
    /**
     * lac-ci 查询基础数据
     */
    var queryBySwtich = function () {

        var moduleName = $("#model_select").val();
        global.queryMethod = 'switch';

        var lac = global.s_lac = $("#lac").val();

        var ci  = global.s_ci = '';
        if(lac.indexOf('-') != -1){
             lac = $("#lac").val().split('-')[0];
             ci  = $("#lac").val().split('-')[1];
        }

        var url='/syngis-map/queryArea/queryBySwitch';
        var param = {moduleName: moduleName, lac: lac, ci: ci}
        $.synfun.ajax(url, param, function (returnData) {

            if(returnData.length == 0){
                alertify.error('无数据!');
                // 移除地图上的数layer
                removelayerFromMap(map, global.markers);

                // 移除地图上的基站layer
                removelayerFromMap(map, global.smarkers);

                // 移除虚线layers
                removelayerFromMap(map, global.s_polyline);

                return ;
            }
            // 渲染覆盖物
            drawPoints(returnData);
        }, "POST")
    }

    /**
     * 初始化显示基站按钮(插件 i-switch)
     */
    var initializeStation = function () {
        var options = {
            size   : 'small',
            onChange :function () {
                if(global.markers.length == 0 && $('#isShowStation').prop('checked')){
                    alertify.error('请先进行框选操作');
                    global.stationSwitch.off();
                    return;
                }

                // 查询单个基站时避免重复运行
                showStation();
            },
        };
        var el = document.querySelector('#isShowStation');
        global.stationSwitch = new Switch(el, options);
    }

    /**
     * 显示基站
     */
    var showStation = function () {
        // 显示基站
        // flag
        if($('#isShowStation').prop('checked')){
            // 注意圆没有_latlngs属性
            if(!(global.layer._latlngs || global.layer._latlng)){
               // global.isShowStation = true;
                return;
            }else{
                QueryStationFactory(global.type, global.layer, global.map);
            }
            // 设置开关flag为true
            global.isShowStation = true;
        }else{
            // 删除基站图标和相应的缓存
            if(global.smarkers.length != 0 && global.clusterLayer){
                removelayerFromMap(map, global.smarkers);
                removelayerFromMap(map, global.clusterLayer);

                // 清除虚线layer
                if(global.s_polyline.length > 0){
                    global.s_polyline.forEach(function (e) {
                        e.unbindTooltip();
                        global.map.removeLayer(e);
                    })
                }
                // 设置开关flag为false
                global.isShowStation = false;
            }
        }
    }


    var drawStations = function (data, options) {
        console.log('基站')
        // 移除已经在地图上显示的基站
        removelayerFromMap(map, global.smarkers);
        removelayerFromMap(map, global.pMarkers);

        // 移除聚合图层
        map.removeLayer(global.clusterLayer);


        if(data == null || data == '' ||data.length == 0 ){
            return;
        }

        global.stationData = data;
        global.smarkers = [];

        // 聚合层设置
        global.clusterLayer = L.markerClusterGroup({
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: true,
            zoomToBoundsOnClick: true,
            spiderfyOnMaxZoom:1,
            disableClusteringAtZoom:18,
            removeOutsideVisibleBounds: true,
            maxClusterRadius : 20
        });

        // 遍历model
        for(var model in data){
            var myIcon = L.icon({
                iconUrl: './icon/' + $('#model_select').val() + model + '.png',
                iconSize: [32, 32],
                iconAnchor: [15, 30],
                popupAnchor: [0, 0],
                shadowUrl: null,
                shadowSize: [0, 0],
                shadowAnchor: [0, 0]
            });

            var arr = data[model];



            // 保存到缓存中
            global.sdata  = arr;
            //global.sdata.push(arr);

            // 基站纠偏 true:不纠偏 false:纠偏
            if( !options || !options.transFlag){
                arr = gis.transStationData(arr,global.transLon, global.transLat);
            }
            // arr.push();
            arr.forEach(function(e){

                var marker = L.marker([e.lat, e.lon], {icon:myIcon});
                global.clusterLayer.addLayer(marker);
                global.smarkers.push(marker);
                switch (model){
                    case '2G' : bindStationEvent(marker, {'2G':[e]}); break;
                    case '3G' : bindStationEvent(marker, {'3G':[e]}); break;
                    case '4G' : bindStationEvent(marker, {'4G':[e]}); break;
                }
            });
        }

        // 地图上作图
        map.addLayer(global.clusterLayer);
    };

    /**
     * 绑定基站事件
     * @param marker
     * @param data
     */
    var bindStationEvent = function (marker, data) {
        // 基站鼠标over事件
        marker.on('mouseover',function (e) {
            L.DomEvent.stopPropagation(e);
            gis.renderStationMenu(e.containerPoint,data);
            console.log('3')
        });

        // 基站鼠标out事件
        marker.on('mouseout',function (e) {
            L.DomEvent.stopPropagation(e);
            gis.hideStationMenu();
            console.log('4')
        });

        // 基站单击事件
        marker.on('click', function (e) {
            stationClick(data)
        });

        // 基站右键点击事件
        marker.on('contextmenu',function () {
            stationContextMenu(data)
        });
    };

    /**
     * 基站点击事件
     * @param data
     */
    var stationClick = function(data){

        for(var moduleName in data){
            // 一般情况下只有一个数据
            var tempData = data[moduleName][0];
            var heads = [];
            var content = [[]];
            var fields = gis.stationFields.ALL;

            // 遍历字段 获取对应模块的字段
            for(var i in fields){
                var tempField = '';
                for(var key in tempData){
                    // 变为小写后比较字段，选取符合条件的字段
                    if(key.toLowerCase() == fields[i].toLowerCase()){
                        tempField = fields[i];
                        heads.push( tempField);
                        content[0].push(tempData[key]);
                    }
                }
            }

            // 渲染表格
            var table = gis.renderTable(heads, content, 160);
            gis.pop_init('基站信息', table, null, 850, 160);
        }
    }


    /**
     * 基站右键按钮
     * 1.查询基站对应的基础数据 目前以lac ci 相等为条件
     */
    var stationContextMenu = function(data){

        // 添加选择操作的窗口，此处应该有设计模式
        var modal_id = Math.ceil(Math.random()*10000000);
        var content = ''
            +'<div>'
            +'    <button type="button" id="btn-dataPreview'+modal_id+'" class="btn btn-info" style="margin:0px 55px 0px 4px;">对应数据</button>'
            +'    <button type="button" id="btn-dataReport'+modal_id+'"  class="btn btn-info">范围外数据</button>'
            // +'    <button type="button" id="btn-stationTrans'+modal_id+'" data-target="#station-trans" data-toggle="modal"  class="btn btn-info">基站纠偏</button>'
            +'</div>';

        var poper = gis.pop_init('功能选择', content, null,"200",'100');
        $('#btn-stationTrans'+modal_id).click(function () {
            // 窗口消失
            poper.fadeOut(0);
            poper.empty();


        })

        $('#btn-dataReport'+modal_id).click(function () {
            // 窗口消失
            poper.fadeOut(0);
            poper.empty();
            // 查询款选范围外的数据
            outSideData(data);
        })

        /**
         * 查对应数据
         */
        $('#btn-dataPreview'+modal_id).click(function(){
            // 窗口消失
            poper.fadeOut(0);	
            poper.empty();

            // 提示框选
            if(global.data ==[] || global.data == null){
                alertify.error("请先框选数据");
                return;
            }

            // 移除地图上已经存在的点
            removelayerFromMap(global.map, global.markers);

            // 移除地图上的基站虚线图标
            removelayerFromMap(global.map, global.s_polyline);

            // 选出对应基站下的数据
            var _data ;
            for(var i in data){
                _data = data[i]; // {'2G':[]} 取出数组
            }
            global.s_data = [];

            // 修改
            // 4G 判断方式TAC and CI
            if(i == '4G'){
                global.data.forEach(function (e) {
                    if(e.lac == _data[0].tac && e.ci == _data[0].eci){
                        global.s_data.push(e);
                    }
                })
            }else{
                global.data.forEach(function (e) {
                    if(e.lac == _data[0].lac &&  e.ci == _data[0].ci){
                        global.s_data.push(e);
                    }
                })
            }

            // 基站下无对应的数据,提示
            if(global.s_data.length == 0){
                alertify.error("无数据");
                return;
            }

            // 移除地图上的点的缓存
            global.markers = [];

            // 处理markers
            for(var i in global.s_data){
                var color = setPointColor(global.s_data[i], global.LACOrCI);
                var xy= gis.wgs84_To_Gcj02(global.s_data[i].lat, global.s_data[i].lon);
                var lon =xy.split("-")[1];
                var lat =xy.split("-")[0];
                var marker = L.circle([lat, lon], 0, {color: color});
                marker.addTo(global.map);
                global.markers.push(marker);
            }

            // 注册事件(可以考虑多线程)
            for(var j in global.s_data){
                marker = global.markers[j];
                showInfo(marker, global.s_data[j])
            };

            // 生成切换菜单
            renderToggleMenu(false, global.s_data);

            // 将tempData赋值
            global.tempData = global.s_data;

            // 成功提示
            alertify.success("查询完成");
        });

        $('#btn-dataReport'+modal_id).click(function(){
            // 案件报告，案件报告预览
            poper.fadeOut(0);	// 窗口消失
            poper.empty();
        });
    };

    /**
     * 查询款选范围外的数据
     * @param data 点击点的数据
     */
    var outSideData = function (data) {

        // 移除地图上已经存在的点
        removelayerFromMap(global.map, global.markers);

        // 移除地图上的基站虚线图标
        removelayerFromMap(global.map, global.s_polyline);

        var _data ;
        for(var i in data){
            _data = data[i]; // {'2G':[]} 取出数组
        }

        var moduleName = $("#model_select").val();
        var param = null;

        if(i == '4G'){
            param = {moduleName: moduleName, lac: _data[0].tac, ci: _data[0].eci}
        }else{
            param = {moduleName: moduleName, lac: _data[0].lac, ci: _data[0].ci}
        }
        var url='/syngis-map/queryArea/queryBySwitch';
        $.synfun.ajax(url, param, function (returnData) {

            if(returnData.length == 0){
                alertify.confirm('无数据!').setHeader('提示');
                return ;
            }
            // 渲染覆盖物
            drawPoints(returnData);
        }, "POST")
    };


    var domEvent = [
        {id:'data-export-config', type:'click', fn:function () {exportData('exportConfig', null, null)}}, // 导出按钮
        {id:'exportRightToggleData', type:'click', fn:function () {exportExitsStation()}},
        {id:'data-export', type:'click', fn:function () { exportData('renderMenu', null, null)}}// 导出渲染
    ];

    /**
     * 绑定事件
     */
    var addEvent = function (dom, type, fn) {
        if(dom.addEventListener){
            dom.addEventListener(type, fn, false);
        }else if(dom.attachEvent()){
            dom.attach('on' + type, fn);
        }else{
            dom['on' + type ] = fn ;
        }
    };

    /**
     * 绑定事件
     */
    var bindFun = function() {
        for(var i in domEvent){
            addEvent(document.getElementById(domEvent[i].id), domEvent[i].type, domEvent[i].fn)
        }
    };

    /**
     * 导出存在性基站
     */
    exportExitsStation = function () {
        // 地图上显示的数据中技术存在性基站
        // 去重临时对象
        var tempObj = new Object();
        var result = [];
        var data = global.tempData;
        data.forEach(function (x) {
            if(!tempObj[x.ci]){
                result.push($('#model_select').val() + "#"+ x.lac + ',' + x.ci);
                tempObj[x.ci] = 'x';
            }
        });

        if(result.length == 0){
            alertify.error("无数据");
            return ;
        }
        result.sort();
        // 后台下载
        var token = gis.getMilliSeconds();
        var url = '/syngis-map/export/exportExitesStation';
        var header = [$('#model_select').val() + ":" + 'lac-ci'];
        var sheets = [$('#model_select').val()];
        var param = {'fileName':'存在性基站-'+token, 'sheet':sheets, 'head':header, 'cont':result};

        $.synfun.ajax(url, param, function (returnData) {

           window.location.href = "/syngis-map/download/downloadFile?fileName=存在性基站-"+token+"&fileType=.xls";

        },"POST");
    }

    /**
     * 数据导出模块
     * @param data 需要导出的数据
     * @param options 导出选项
     * @returns {ExprotData}
     * @constructor
     */
    var exportData = function (type, data, options) {

        if(this instanceof exportData){
            var s = new this[type](data, options);
            return s;
        }else{
            return new exportData(type, data, options);
        }
    };

    exportData.prototype = {

        // 导出数据去重
        duplicateData : function () {

        },

        // 渲染表格
        renderMenu : function () {
            var modal_id = Math.ceil(Math.random()*10000000);
            // 检查本地是设置过导出格式
            if(!localStorage.getItem('exportConfig')){
                alertify.error('请先设置导出格式');
                return ;
            }
            var obj = localStorage.getItem('exportConfig');

            var tempData = global.data;
            if(!tempData){
                alertify.error("无数据，请重新选择", 2);
                return;
            }

            var liClass = 'active';
            var li = '';
            obj = JSON.parse(obj);

            var table = renderDataPreviewMenu(tempData, obj, modal_id);

            // 获取模块中文名称
            var moduleCHName = gis.moduleName;

            var moduleName = $("#model_select").val();
            li += '<li class="'+liClass+'"><a data-toggle="pill" href="#'+modal_id+moduleName+'">'+ moduleCHName[moduleName] +'</a></li>';

            // 设置content内容
            var left = 100, areaName  = '';
            var content = ''
                +'<div style="overflow:auto">'
                +'    <ul class="nav nav-pills" style="margin-bottom:10px; overflow:auto;">'
                +     li
                +'    </ul>'
                +'</div>'
                +'<div class="tab-content" id="content'+modal_id+'">'
                +     table
                +'</div>'
                +'<div class="row" style="margin-top:10px">'
                +'    <div class="col-sm-2 col-sm-offset-9" style="; width:80px">'
                +'        <button type="button" id="duplicate'+modal_id+'" class="btn btn-success export">&nbsp数据去重&nbsp</button>  '
                +'    </div>'
                +'    <div class="col-sm-2 " style="margin-left:20px; width:80px">'
                +'        <button type="button" id="export'+modal_id+'" class="btn btn-success export">&nbsp导出&nbsp</button>  '
                +'    </div>'
                +'</div>';
            gis.pop_init('数据预览',content,null,850,570);

            // 导出选项
            var url =  $('#exportMethod'+modal_id).val();
            $('#exportMethod'+modal_id).change(function(){
                url = $('#exportMethod'+modal_id).val();
            })

            // 导出事件
            $('#export'+modal_id).click(function(){
                gis.sendDuplicateData(global.fields, obj[moduleName], moduleName);
            });

            // 数据去重
            $('#duplicate'+modal_id).click(function(){
                // 获取去重字段
                var duplicateData = [];
                for(var i in obj){
                    $('input[name='+i+modal_id+'duplicate]:checkbox').each(function(){
                        if($(this).prop('checked')){
                            duplicateData = gis.getDuplicateArray(duplicateData,$(this).val());
                        }
                    })
                }
                // 不进行去重操作
                if(duplicateData.length == 0){
                    alertify.error("请选择去重字段", 2000);
                    return ;
                }

                // 进行数据去重
                tempData = gis.deleteDuplicateData(duplicateData, obj[moduleName], global.fields);

                // UI界面处理
                // 清除以前的table-content
                $('#content'+modal_id).empty();
                // 获取新的数据
                table = renderDataPreviewMenu(tempData, obj ,modal_id, true);
                // 渲染操作
                $('#content'+modal_id).html(table);
            })
        },

        // 导出设置
        exportConfig : function (){
            // 变量
            var li = '';
            var content = '';
            var modules =  gis.modules();
            var  tempModules = [];
            var modal_id = Math.ceil(Math.random()*10000000);

            // 查看本地是否已经存储格式
            if(JSON.parse(localStorage.getItem('exportConfig'))){
                tempModules = JSON.parse(localStorage.getItem('exportConfig'));
                for(var i in tempModules){
                    tempModules[i] = tempModules[i].replace(/\$/g,'').split(',');
                }
            }

            for(var i in modules){
                // a-MM 变为 MM
                var moduleName = i;
                li += '<li ><a data-toggle="pill" href="#'+i+modal_id+'">'+gis.moduleName[moduleName]+'</a></li>';// MM 变为中文
                // 默认显示MM
                if(i == 'MM'){
                    content += '<div id="'+i+modal_id+'" class="tab-pane fade in active">';
                }else{
                    content += '<div id="'+i+modal_id+'" class="tab-pane fade">';
                }
                var value = localStorage.getItem(i);
                if(!value){
                    value='LAC-CI';
                }

                content +=''
                    +'<div>'
                    +'自定义格式<br>'
                    +'<input type="text" class="form-control" value="'+ value +'" id="'+i+modal_id+'attr">'
                    +'	       <h5>列选择</h5>'
                    +'</div>';
                for(var j in modules[i]){
                    var checked = '';
                    for(var k in tempModules[i]){
                        if(tempModules[i][k] ==  modules[i][j] ){
                            checked = 'checked';
                            break;
                        }
                    }

                    // 初始设置默认字段
                    if(!localStorage.getItem('exportConfig') && (modules[i][j] == 'lac' || modules[i][j] == 'ci' || modules[i][j] == 'gpsTime'
                        || modules[i][j] == 'keyName' || modules[i][j] == 'area' || modules[i][j] == 'key' || modules[i][j] == 'model')){
                        checked = 'checked';
                    }
                    content += ''
                        +'<label><input name="'+i+modal_id+'" type="checkbox" value="'+modules[i][j]+'"'+checked+'>'+modules[i][j]+'</label><br>'
                }
                content += '</div>'
            }

            var body  = ''
                +'<div class="container" style="width:600px;">'
                +'    <div style="text-align:left;width:240px;height:530px;padding:10px;float:left;border:1px solid black;overflow:scroll;">'
                +'        <h5>模块选择</h5>'
                +' 	      <ul>'
                +             li
                +'        </ul>'
                +'    </div>'
                +'    <div class="tab-content checkboks" style="text-align:left;margin-left:210px;padding:10px 10px 10px 30px;width:300px;height:530px;border:1px solid black;overflow:scroll;">'
                +         content
                +'    </div>'
                +'</div>';
            var style = "width:620px;margin-top:150px; overflow: hidden;"
            var footer = ''
                +'<div style="position:relative">'
                +'<button type="button" id="btn-'+modal_id+'clearConfig"  class="btn btn-success">清除格式</button>'
                +'<button type="button" class="btn btn-default" data-dismiss="modal">取消</button>'
                +'<button type="button" id="btn-'+modal_id+'" class="btn btn-primary" data-dismiss="modal">确认</button>'
                +'</div>'

            gis.modal_init('数据导出',body,footer,modal_id,style);
            // 点击确认设置导出参数
            $('#btn-'+modal_id).click(function(){
                // 批量操作CheckBox 按module处理
                var obj =  gis.modules();
                for(var i in modules){
                    var str = '';
                    // 自定义属性
                    var attr = $('#'+i+modal_id+'attr').val();
                    localStorage.setItem(i,attr)
                    // 自定义属性存在
                    if(attr){
                        str += (function(attr){
                            var regE = /([^a-zA-Z])/;
                            var regN = /([a-zA-Z])/
                            var attrs = attr.split(',');
                            for(var i in attrs ){
                                var singleAttrs = attrs[i].split(/[^a-zA-Z]/);
                                for(var j in singleAttrs){
                                    str += '$'+singleAttrs[j]+'$-';
                                }
                                str = str.substring(0,str.length-1);
                                str += ',';
                            }
                            return str;
                        })(attr)
                    }

                    $('input[name='+i+modal_id+']:checkbox').each(function(){
                        if($(this).prop('checked')){
                            str += '$'+$(this).val()+'$,';
                        }
                    })

                    obj[i] = str.substring(0, str.length-1);
                }
                localStorage.setItem('exportConfig', JSON.stringify(obj));

            })

            // 清除格式操作
            $('#btn-'+modal_id+'clearConfig').click(function(){
                localStorage.removeItem('exportConfig');
                for(var i in modules){
                    localStorage.removeItem(i);
                }
                // alertify.success("删除设置完成", 1);
                $('#myModal'+modal_id).modal('hide');
                this();
            });
        }
    };

    /**
     * 渲染报告表格
     */
    var renderDataPreviewMenu = function(returnData, obj ,modal_id, flag){

        var table = '';
        var tabPaneClass = 'fade in active';
        for(var i in obj){
            var name = $("#model_select").val();
            if(i != name){
                continue;
            }

            // 设定table 的表头
            var thead = '';
            var heads = obj[i].split(',');
            for(var k in heads){
                var space = '';
                if(heads[k] == '$gpsTime$'){
                    space = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
                }
                if(heads[k] == '$area$' ){
                    space = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp';
                }

                thead +=
                      '<th style="white-space: nowrap; text-align: center">'
                    +       heads[k].replace(/\$/g,'').toUpperCase() + '&nbsp&nbsp<label><input name="'+i+modal_id+'duplicate" type="checkbox"  value="'+heads[k].replace(/\$/g,'')+'"></label>' + space
                    + '</th>';
            }

            // 设定tbody
            var tbody = '';

            if(flag){
                tempArr = returnData;
            }else{
                var tempArr = [];
                // 将$lac$-$ci$转为对应的values
                for(var j in returnData) {
                    var field = obj[i].replace(/\$/g, '#'); // 每循环一条数据，filed重置
                    // 将字段替换为值
                    for (var k in returnData[j]) {
                        var str = new RegExp("#"+k+"#", 'g');
                        field = field.replace(str,  returnData[j][k]);// 全局替换
                    }
                    // .replace(/#/g, '');
                    tempArr.push(field);
                }
            }

            global.fields = tempArr;

            // 将$value$组成表格
            for(var x in tempArr){
                var field = tempArr[x].split(',');
                tbody += '<tr>';
                for(var y in field){
                    if(field[y] == 'null'){
                        field[y] = '';
                    }
                    if(field[y].match(/[a-zA-Z]/)){
                        field[y] = '';
                    }
                    tbody += '<td>' + field[y] + '</td>';
                }
                tbody += '</tr>';
            }

            table += ''
                +'<div style="overflow:auto;height:420px"  id="'+modal_id+i+'" class="tab-pane '+tabPaneClass+'">'
                +'	  <table  class="table table-hover table-bordered table-condensed">'
                +'   	  <thead>'
                +'            <tr>'
                +          	     thead
                +'            </tr>'
                +'        </thead>'
                +'		  <tbody>'
                +			  tbody
                +'        </tbody>'
                +'    </table>'
                +'</div>'
        }
        return table;
    };

    /**
     * 基站导出模块
     */
    var stationExport = function () {
        var heads = [];
        var content = [];
        var sheetContent = []

        $('#station-export').click(function () {
            heads = [];
            content = [];
            sheetContent = [];

            if(!global.sdata){
                alertify.error('无基站数据');
                return;
            }
            if(global.stationPoper){
                global.stationPoper.remove();
            }

            var heads = [];
            var content = [];
            var sheetContent = [];

            // 获取缓存中的基站数据
            var data = global.sdata;

            // 导出字段缓存
            var exportContent = [];
            var moduleName = $("#model_select").val();
            var stationFields = gis.stationFields.ALL;

            // 遍历数据
            for(var i in data){
                // 模拟二维数组
                content[i] = [];
                var obj = data[i];
                var tempObj = '';

                // 遍历每条数据的值和对应的字段
                for(var j in stationFields){ //&& key.toLowerCase() == stationFields[j].toLowerCase()
                    for(var key in obj){
                        // 小写变大写
                        var upperCaseKey = key.toUpperCase();
                        // 处理表格头
                        if(i == '0' && key.toLowerCase() == stationFields[j].toLowerCase()){
                            heads.push(upperCaseKey);
                        }
                        // 处理表格内容
                        if( key.toLowerCase() == stationFields[j].toLowerCase() ){
                            if(obj[key] == 'null'){
                                obj[key] = '';
                            }

                            // 将数据存入缓存
                            content[i].push(obj[key]);
                            tempObj += obj[key] + ',';
                        }
                    }
                }
                
                tempObj = tempObj.substring(0, tempObj.length);
                exportContent.push([tempObj])
            }

            var table = gis.renderTable(heads, content, 400);
            table += '' +
                '<div style="text-align: right">' +
                '    <button id="export-staion-btn" class="btn btn-success">下载</button>' +
                '</div>';

            global.stationPoper = gis.pop_init('基站数据下载预览', table, null, 850, 500);
            stationDataDownload(heads, exportContent);
        })
    }

    /**
     * 下载基站表
     * @param heads
     * @param content
     */
    var stationDataDownload = function(heads, content){
        $('#export-staion-btn').click(function(){
            var token = gis.getMilliSeconds();
            var url = '/syngis-map/export/exportStations';
            var module = $('#model_select').val();
            var sheet = gis.moduleName[module];

            var param = {'fileName':'基站表-'+token, 'sheet':sheet, 'heads':heads, 'content':content};

            $.synfun.ajax(url, param, function (returnData) {
                window.location.href = "/syngis-map/download/downloadFile?fileName=基站表-"+token+"&fileType=.xls";
            },"POST");
        });
    };

    /**
     * 初始化时间查询窗口
     */
    var initDatePopover = function(){

        //各部分id
        var popoverId = 'syngins_popver_common';//窗口id
        var openId = 'syngis_popover_open';
        var popoverCloseId = '_syngis_popover_close';//窗口关闭图标的id
        var poper = $('div[syngis_popver_id=' + popoverId + ']');//窗体jQuery
        var movepoper = $('[syngis_title_id=' + openId + ']');

        $(window).mouseup(function(){	      // 鼠标up解除移动状态
            movepoper.css("cursor","default");
            $(this).unbind("mousemove");
        });

        //关闭窗口
        $('[data-dismiss=' + popoverCloseId + ']').click(function (e) {
            e.stopPropagation();
            poper.fadeOut(400)
        });

        // 日期选择
        $("#bTime").jeDate({
            isinitVal:true,
            festival: true,
            format: ' YYYY-MM-DD hh:mm:ss',
            festival: false
        });

        $("#eTime").jeDate({
            isinitVal:true,
            festival: true,
            format: ' YYYY-MM-DD hh:mm:ss',
            festival: false
        });

        // 点击按钮弹出对话框
        $('#data-query-date').click(function(){
            poper.fadeIn(400);
        })

        $('#date-query').click(function(){
            queryDataByDate();
        })
        return poper;
    }

    /**
     * 根据日期查询数据
     */
    var queryDataByDate = function(){
        var result = [];
        $('#loading').show();
        var bTime = $('#bTime').val().trim();
        var eTime = $('#eTime').val().trim();

        // 验证时间的正确性
        if(eTime <= bTime){
            alertify.error('开始时间 > 截至时间')
            $('#loading').hide();
            return;
        }
        var data = global.data;
        for (var i in data) {
            if(data[i].gpsTime > bTime && data[i].gpsTime < eTime){
                result.push(data[i]);
            }
        }
        drawPoints(result);
    }

    var stationImport = function(lc) {
        var url = '/syngis-map/queryArea/queryByLC';
        $.synfun.ajax(url,{lc:lc},function (data) {
            var stn ;
            if(data.data){
                stn = data.data;
                drawPoints(data.data)
            }
            if(data.station){
                stn = data.station;
                drawStations({'4G': data.station})
            }
            if(stn){

                var temp = [];
                for(var i in lc){
                    var ci = lc[i].split('-')[1];
                    var tdata = [];
                    for(var j in stn) {
                        if (stn[j].ci == ci) {
                            tdata.push(stn[j])
                        }
                    }

                    if(tdata.length > 0){
                        tdata.sort(function (a,b) {
                            if(a.gpsTime > b.gpsTime){
                                return -1;
                            }else if(a.gpsTime == b.gpsTime){
                                return 0;
                            }else{
                                return 1;
                            }
                        })
                    }

                    if(tdata.length > 0)
                        temp.push(tdata[0]);
                }
                playStation(lc, temp);
                $scope = angular.element($('#lc-menu')).scope();
                $scope.$apply(function () {
                    $scope.lcData = temp;
                })
            }
            $('#loading').hide();
        },"POST")
    }

    /**
     * 点击按钮播放数据点
     */
    var playSt = function () {
        $('#play-st').unbind('click');
        $('#play-st').click(function () {
            //playStation(global.lc, global.dc);
            if(global.i == global.j ){
                global.j = global.lc.length;
                global.i = 0;
            }
            playImpl(global.dc);
        })

        $('#play-pause').unbind('click');
        $('#play-pause').click(function () {
            //playStation(global.lc, global.dc);
            playPause()
        })
    }

    var playMarker = function(dx, dy){

        d1 = gis.wgs84_To_Gcj02(dx.lat, dx.lon);
        d2 = gis.wgs84_To_Gcj02(dy.lat, dy.lon);

        var myMovingMarker = L.Marker.movingMarker([[d1.split('-')[0], d1.split('-')[1]],[d2.split('-')[0], d2.split('-')[1]]],
            [1000]).addTo(map);
        myMovingMarker.bindPopup('' +
            '<p>LAC: '+ dy.lac +'<br/>' +
            'CI: '+ dy.ci + '<br/>' +
            'GpsTime: '+ dy.gpsTime + '</p>'
        )
        global.pMarkers.push(myMovingMarker);
        myMovingMarker.start();
    }

    var playStation =  function (lc, data) {
        playSt();
        global.lc = lc;
        global.dc = data;
        removelayerFromMap(map, global.pMarkers);
        var latlngs = [];
        for(var i in data){
            if(data[i]){
                var latlng = gis.wgs84_To_Gcj02(data[i].lat, data[i].lon);
                latlngs.push({'lat': latlng.split('-')[0], 'lon': latlng.split('-')[1]})
            }
        }

        var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
        global.pMarkers.push(polyline);
        map.fitBounds(polyline.getBounds());
        global.j = lc.length;
        global.i = 0;
        playImpl(data)

    }
    var playPause = function () {
        clearInterval(global.timer);

    }
    var playImpl = function (data) {
        clearInterval(global.timer);
        global.timer = setInterval(function () {
            if(global.i < global.j){

                if(data[global.i] && data[global.i+1]){
                    playMarker(data[global.i], data[global.i+1]);
                }

                $('.' + global.i + 'lc').css({"color": "white"})
                $('.' + global.i + 'lc').css({"background-color": "grey"})

                var k = global.i-1;
                $('.'+k+'lc').css({"color": "black"})
                $('.'+k+'lc').css({"background-color": "white"})
            }

            if(global.i == global.j){
                global.j = lc.length;
                global.i = 0;
                clearInterval(global.timer)
            }
            global.i++;
        }, 1000);
    }

    var fileUpload = function () {
        $('.station-trans-submit').click(function () {
            var formData = new FormData();
            formData.append('file', $('#fileUpload')[0].files[0]);
            var fileName =  $('#fileUpload')[0].files[0].name;
            $.ajax({
                url: '/syngis-map/upload/singleFile',
                type: 'POST',
                cache: false,
                data: formData,
                processData: false,
                contentType: false,
            }).done(function(res){
                $('#loading').show();
                alertify.success('上传成功');
                exportExcel(fileName)
            }).fail(function (res) {
                alertify.error('上传失败')
            })
        })
    }

    var exportExcel = function (fileName) {
        var url = '/syngis-map/export/exportExcelStation'
        $.synfun.ajax(url, {fileName: fileName}, function(res){
            console.log(res)
            var lc = [];
            for(var i in res){
               lc.push(res[i].lac + '-' + res[i].ci);
            }
            var lactxt = $('#lac-txt').val();
            if(lactxt){
                lactxt = lactxt.split(',');
                lc = lc.concat(lactxt);
            }
            stationImport(lc)
        }, "GET")
    }

    /**
     * 将方法暴露给其他插件
     */
    return {
        // 全局函数命名空间
        global : global,

        // lac-ci 切换按钮初始化
        toggleLC : toggleLC,

        // 渲染地图
        renderMap : renderMap,

        // 渲染地图右上角菜单
        renderMainMenu : renderMainMenu,

        // 打点
        drawPoints : drawPoints,

        // 渲染右侧菜单栏
        renderRightSideMenu : renderRightSideMenu,

        // 根据模式选择案件
        drawPointsBySelectModule : drawPointsBySelectModule,

        // 渲染工具条
        renderToolbar : renderToolbar,

        // 初始化lac-ci切换查询
        initializeSwitch : initializeSwitch,

        // 初始化基站显示按钮
        initializeStation : initializeStation,

        // 初始化时间查询窗口
        initDatePopover : initDatePopover,

        // 绑定事件
        bindFun : bindFun,

        // 基站导出
        stationExport : stationExport,

        // 基站导入
        stationImport: stationImport,

        // 文件上传
        fileUpload: fileUpload,

        //获取地图配置
        initMap: initMapOptions,
    };
});