import { StateContainerService } from '../../services/state-container.service';
import Ractive from 'ractive';
declare var $: any;
import { ResourcesService } from '../../services/resources.service';
import { MapComponent } from '../common-pages/map.component';
import { CompactScadaService } from '../../services/compact-scada.service';

const stateContainer = StateContainerService();
const compactScada = CompactScadaService();
const resources = ResourcesService();
const map = MapComponent();
let assets;
let assetsMarkers = undefined;
let locations = undefined;
let markerMeteoStation = undefined;

export function PageComponent() {             
    
    let ractive: IRactive = undefined;    
    const ractiveData = {
        el: undefined,
        template: `                                 
            <div id="rhpane" style="display:none" class="shy temp">
                <div id="overlay" class="menu">
                    <span class="title">OVERLAYS</span>                    
                    <div class="overlay-item hover selected" data-do="wind">Wind</div>
                    <div class="overlay-item hover" data-do="gust">Windbreak</div>                    
                    <div class="overlay-item hover" data-do="temp">Temperature</div>                
                    <div class="overlay-item hover" data-do="pressure">Pressure</div>
                    <div class="overlay-item hover" data-do="clouds">Clouds</div>
                    <div class="overlay-item hover" data-do="rh">Humidity</div>
                    <div class="overlay-item hover" data-do="wwaves">Waves</div>                    
                </div>
            </div>
            <div id="windyty" class="big-map"></div>   
            {{>initMap}}
            <script id="windytyjs" async defer src="https://api.windytv.com/v2.3/boot.js"></script>     
            <div id="windyForecastClose">X Close forecast view</div>
            <iframe id="windyForecast" style="width:100%; height:0px; position:absolute; bottom:0px"
                src="https://embed.windytv.com/embed2.html?lat=37.3824&lon=-5.9761&type=forecast&metricWind=m%2Fs&metricTemp=%C2%B0C" frameborder="0"></iframe>      
        `,
        data:{
            assetsMarkers: getLocations(),
        },
        partials:{
            initMap: `
            <script id="windytycode">
                var W = undefined;
                var windytyInit = {
                    // Required: API key
                    key: 'jpC7PH3xks2e3zw',
                    // Optional: Initial state of the map
                    lat: 40,
                    lon: -4,
                    zoom: 6
                };

                function windytyMain(map) {
                    "use strict";

                    $('#rhpane').css('display','block');
                    // html elements
                    var overlays = document.getElementById('overlay');

                    // Handle change of overlay
                    overlays.onclick = function(event) {
                        var overlays = event.currentTarget.children;
                        for (var i = 0; i<overlays.length; i++){overlays[i].classList.remove("selected")}
                        W.setOverlay(event.target.dataset.do);
                        event.target.classList.add("selected");
                    }

                    var markers = new Array({{assetsMarkers}}); 
                    var center = calculateCenter(markers);
                    var markercluster = L.markerClusterGroup({
                        disableClusteringAtZoom: 11,
                        showCoverageOnHover: false,
                        zoomToBoundsOnClick: true,
                        spiderfyOnMaxZoom: false,
                        iconCreateFunction: function (cluster) {
                            var isOk = true;
                            cluster.getAllChildMarkers().forEach(marker => { isOk = isOk && marker.options.icon.options.iconUrl.indexOf('yellow')==-1});
                            return L.divIcon({ 
                                        iconAnchor: [iconWidth / 2, iconHeight], 
                                        html: '<b style="color: white; text-align: center; top: 6px; display: block; position: relative; font-size: 10px;">'+cluster.getChildCount()+'</b>', 
                                        className: (isOk) ? 'iconCluster':'iconClusterAlert', 
                                        iconSize: L.point(30, 51)});
                            },
                    });

                    var mapMarkers = []; 

                    // Normal icons
                    var assetIconUrl = '/data/map-europe/icons/pin-blue-solid-2.png';
                    var windTurbineIconUrl = '/data/map-europe/icons/pin-blue-solid-3v2.png';
                    var hydroIconUrl = '/data/map-europe/icons/pin-blue-solid-13v2.png';
                    var solarIconUrl = '/data/map-europe/icons/pin-blue-solid-14v2.png';
                    
                    // Alert icons
                    var assetIconUrlAlert = '/data/map-europe/icons/pin-yellow-solid-2.png';
                    var windTurbineIconUrlAlert = '/data/map-europe/icons/pin-yellow-solid-3v2.png';
                    var hydroIconUrlAlert = '/data/map-europe/icons/pin-yellow-solid-13v2.png';
                    var solarIconUrlAlert = '/data/map-europe/icons/pin-yellow-solid-14v2.png';

                    var iconWidth = 40;
                    var iconHeight = 55;

                    var assetIcon = L.icon({
                        iconUrl: assetIconUrl,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var windTurbineIcon = L.icon({
                        iconUrl: windTurbineIconUrl,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var hydroIcon = L.icon({
                        iconUrl: hydroIconUrl,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var solarIcon = L.icon({
                        iconUrl: solarIconUrl,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var assetIconAlert = L.icon({
                        iconUrl: assetIconUrlAlert,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var windTurbineIconAlert = L.icon({
                        iconUrl: windTurbineIconUrlAlert,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var hydroIconAlert = L.icon({
                        iconUrl: hydroIconUrlAlert,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var solarIconAlert = L.icon({
                        iconUrl: solarIconUrlAlert,
                        iconSize: [iconWidth, iconHeight], // size of the icon
                        iconAnchor: [iconWidth / 2, iconHeight], // point of the icon which will correspond to marker's location
                        popupAnchor: [0, -45] // point from which the popup should open relative to the iconAnchor
                    });

                    var iconsSwitch = {
                        'park' : function() {return windTurbineIcon;},
                        'hydro' : function() {return hydroIcon;},
                        'solar' : function() {return solarIcon;},
                        'default' : function() {return assetIcon;},
                        'parkalert' : function() {return windTurbineIconAlert;},
                        'hydroalert' : function() {return hydroIconAlert;},
                        'solaralert' : function() {return solarIconAlert;},
                        'defaultalert' : function() {return assetIconAlert;}
                    }
                    
                    markers.forEach(function(marker) {
                            var mapMarker = L.marker(
                                L.latLng(marker.latitude, marker.longitude),
                                {icon: iconsSwitch[marker.type]()}                           
                            );
                            //set some properties
                            mapMarker.index = marker.id;
                            mapMarker.displayName = marker.name;
                            mapMarker.msgSignal = marker.WeatherAlertMsg;
                            mapMarker.infoSignal = marker.WeatherAlertInfo;
                            mapMarker.NominalPower = marker.NominalPower;
                            mapMarker.ActivePower = marker.ActivePower;
                            mapMarker.ReactivePower = marker.ReactivePower;
                            mapMarker.WindSpeed = marker.WindSpeed;
                            mapMarker.WindDirection = marker.WindDirection;
                            mapMarker.Temperature = marker.Temperature;
                            mapMarker.bindPopup(\`<div id="\${marker.id}-popup" class="marker-popup"></div>\`);            
    
                            mapMarkers.push(mapMarker);
                            //map.addLayer(mapMarker);
                            markercluster.addLayer(mapMarker);
                        }
                    );
                    
                    mapMarkers.forEach(function(mapMarker) {
                        mapMarker.openPopup();
                        var folderUrl = mapMarker.options.icon.options.iconUrl.split("/");
                        mapMarker.getPopup().setContent(
                            \`
                            <div>
                                    <div class="popUpTitle">
                                        <div style="height: 40px; border-bottom: 1px solid #cecece;">
                                            <img style="width: 32px; height:32px;left: 12px;top: 5px;position: relative; float:left;" src="\` + "/" + folderUrl[1] 
                                                    + "/" + folderUrl[2] 
                                                    + "/" + folderUrl[3] 
                                                    + "/" +"ico_"+ (mapMarker.index.split("_")[0].toLowerCase()) 
                                                    + ".png"+ \`
                                            "/>
                                            <div style="position: relative;float: left;left: 10px;top: 12px;font-weight: 700;text-align: center; width: 160px;"> 
                                            \` + mapMarker.displayName + \`
                                            </div>
                                        </div>
                                        <div style="width:220px; height:109px">                                            
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Nominal Power </div>
                                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">\` + (mapMarker.NominalPower/1000).toFixed(2) + \` MW</div>
                                            </div>
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Active Power </div>
                                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">\`+ (mapMarker.ActivePower/1000).toFixed(1) + \` MW</div>
                                            </div>
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Reactive Power </div>
                                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">\` + (mapMarker.ReactivePower/1000).toFixed(1) + \` MVAr</div>
                                            </div>
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Wind Speed </div>
                                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">\` + mapMarker.WindSpeed.toFixed(1) + \` m/s</div>
                                            </div>
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Wind Direction </div>
                                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">\` + mapMarker.WindDirection.toFixed(1) + \` º</div>
                                            </div>
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Temperature </div>
                                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">\`+ mapMarker.Temperature.toFixed(1) + \` ºC</div>
                                            </div>
                                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Alarms </div>
                                                <div style="position:relative; float:right; right:15px; font-size: 10px; color: white;font-weight: bold;">
                                                    \`+ formatAlarms(mapMarker.msgSignal) + \`
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            </div>
                            \`
                            );
                        
                        mapMarker.closePopup();
                    });
                    
                    map.addLayer(markercluster);

                    map.on('click', deployForecast);
                    $('#windyForecastClose').on('click', closeForecast);
                    
                    function formatAlarms(alarms){                        
                        var result = '';
                        if(alarms != undefined){
                            var alarmArray = alarms.split(",");
                            var numAlarms = alarmArray.length / 3;
                            for(var i = 1; i<=numAlarms; i++){
                                result = result + '<div style="padding-left:4px; color:' + alarmArray[(i*3)-2].replace("Level:", "") + ' ; float:right">'+ alarmArray[(i*3)-3].replace("Alarm:", "") +'  </div>'
                            }
                        }
                        return result;
                    }

                    function deployForecast(event){                        
                        $('#windyForecast').attr('src', 'https://embed.windytv.com/embed2.html?lat='+event.latlng.lat+'&lon='+event.latlng.lng+'&type=forecast&metricWind=m%2Fs&metricTemp=%C2%B0C');                       
                        L.popup({className: 'meteo-popup'}).setLatLng([event.latlng.lat, event.latlng.lng]).setContent('Meteostation').openOn(map);
                        $('#windyForecast').animate({height: "180px"}, 1500);
                        $('#windyForecastClose').show(1500);
                        $('#windyForecastClose').delay(250).animate({
                                                    height: '16px' // 16px height
                                                }, 250, function() {                                                                                                        
                                                });
                    }

                    function closeForecast(){                        
                        map.closePopup();                       
                        $('#windyForecastClose').animate({
                                                    height: '0px' // no height
                                                }, 500, function() {
                                                    $(this).hide();
                                                    $('#windyForecast').animate({height: "0px"}, 500);                                                    
                                                });
                    }
                }

                function getAssets(){
                    var assets;  
                    $.getJSON('/data/app-model.json', function(json) {
                        assets = json;
                    });
                    return assets;
                }

                function calculateCenter(markers) {
                    "use strict";
                    var totalAssets = markers.length;
                    if (totalAssets > 0) {
                        var totalLatitude = 0;
                        var totalLongitude = 0;
                        markers.forEach(function(marker) { totalLatitude = (totalLatitude + marker.latitude); } );
                        markers.forEach(function(marker) { totalLongitude = (totalLongitude + marker.longitude); } );
                        return {latitude: totalLatitude /totalAssets,longitude: totalLongitude/ totalAssets};
                    }
                    return {latitude: 40.4165000, longitude: -3.7025600};
                }
            </script>
            `
        }
    };

    function init(elem,resolve?) {
        console.log("<page-map>");
      
        ractiveData.el = elem;
        ractive = new Ractive(ractiveData);        
        
        var jsonAlerts = JSON.parse(getAlerts());
        var msgSignal, infoSignal, nominalPower, windSpeed, windDirection, activePower, reactivePower, temperature;
        
        assets = resources.getAssets().map( (asset) => {
            jsonAlerts.forEach(alert => {
                if(asset.id+'.WeatherAlertMsg' == alert.Name)
                    msgSignal = alert.Value;
                if(asset.id+'.WeatherAlertInfo' == alert.Name)
                    infoSignal = alert.Value;
                if(asset.id+'.NominalPower' == alert.Name)
                    nominalPower = alert.Value;
                if(asset.id+'.WindSpeed' == alert.Name)
                    windSpeed = alert.Value;
                if(asset.id+'.WindDirection' == alert.Name)
                    windDirection = alert.Value;
                if(asset.id+'.ActivePower' == alert.Name)
                    activePower = alert.Value;
                if(asset.id+'.ReactivePower' == alert.Name)
                    reactivePower = alert.Value;
                if(asset.id+'.Temperature' == alert.Name)
                    temperature = alert.Value;
            });
            let prefix:String = asset.id.split('_')[0];
            return <Marker>{"id":asset.id,"type": (prefix? prefix.toLowerCase(): "default") + checkAlert(asset.id, jsonAlerts) , "latitude": asset.coords.latitude,
                    "longitude": asset.coords.longitude,"name":asset.name, "WeatherAlertMsg": msgSignal, "WeatherAlertInfo": infoSignal, "NominalPower": nominalPower,
                    "WindSpeed": windSpeed, "WindDirection": windDirection, "ActivePower": activePower, "ReactivePower": reactivePower, "Temperature": temperature}
        });    
        
        locations = '';
        assets.forEach(element => {
                locations = locations + "{id:'"+ element.id + 
                                    "',name:'" + element.name + 
                                "',latitude:" + element.latitude + 
                                ", longitude:" + element.longitude + 
                                    ", type:'" + element.type +
                        "',WeatherAlertMsg:'" + replaceAll(element.WeatherAlertMsg, "\'","\"") + 
                        "', WeatherAlertInfo:'" + replaceAll(element.WeatherAlertInfo, "\'","\"") 
                        "', NominalPower:" + element.NominalPower +
                            ", WindSpeed:" + element.WindSpeed +
                        ", WindDirection:" + element.WindDirection +
                          ", ActivePower:" + element.ActivePower +
                        ", ReactivePower:" + element.ReactivePower +
                          ", Temperature:" + element.Temperature +
                     "},";
        });
        ractive.set('assetsMarkers', locations.substring(0,locations.length-1));
        ractive.update();
        let zoom = 6;
      
        map.init('#windyty', assets, zoom);
        resolve(1);
        
        console.log("</page-map>");
    }
    
    function checkAlert(asset, jsonAlerts){
        var isAlert = false;
        jsonAlerts.forEach(alert =>{
            if(asset+'.WeatherAlertInfo' == alert.Name && (alert.Value != '[]' && alert.Value != '')){
                isAlert = true;
            }
        });

        return (isAlert)? 'alert':'';
    }

    function getLocations(){
        var jsonAlerts = JSON.parse(getAlerts());
        var msgSignal, infoSignal, nominalPower, windSpeed, windDirection, activePower, reactivePower, temperature;
        const assets = resources.getAssets().map( (asset) => {
            jsonAlerts.forEach(alert => {
                if(asset.id+'.WeatherAlertMsg' == alert.Name)
                    msgSignal = alert.Value;
                if(asset.id+'.WeatherAlertInfo' == alert.Name)
                    infoSignal = alert.Value;
                if(asset.id+'.NominalPower' == alert.Name)
                    nominalPower = alert.Value;
                if(asset.id+'.WindSpeed' == alert.Name)
                    windSpeed = alert.Value;
                if(asset.id+'.WindDirection' == alert.Name)
                    windDirection = alert.Value;
                if(asset.id+'.ActivePower' == alert.Name)
                    activePower = alert.Value;
                if(asset.id+'.ReactivePower' == alert.Name)
                    reactivePower = alert.Value;
                if(asset.id+'.Temperature' == alert.Name)
                    temperature = alert.Value;
            });
            let prefix:String = asset.id.split('_')[0];
            return <Marker>{"id":asset.id,"type": (prefix? prefix.toLowerCase(): "default") + checkAlert(asset.id, jsonAlerts) , "latitude": asset.coords.latitude,
                    "longitude": asset.coords.longitude,"name":asset.name, "WeatherAlertMsg": msgSignal, "WeatherAlertInfo": infoSignal, "NominalPower": nominalPower,
                    "WindSpeed": windSpeed, "WindDirection": windDirection, "ActivePower": activePower, "ReactivePower": reactivePower, "Temperature": temperature}
        });
        locations = '';
        assets.forEach(element => {
            locations = locations +  "{id:'"+ element.id + 
                                 "',name:'" + element.name + 
                              "',latitude:" + element.latitude + 
                             ", longitude:" + element.longitude + 
                                 ", type:'" + element.type +
                      "',WeatherAlertMsg:'" + replaceAll(element.WeatherAlertMsg, "\'","\"") + 
                    "', WeatherAlertInfo:'" + replaceAll(element.WeatherAlertInfo, "\'","\"") + 
                         "', NominalPower:" + element.NominalPower +
                            ", WindSpeed:" + element.WindSpeed +
                        ", WindDirection:" + element.WindDirection +
                          ", ActivePower:" + element.ActivePower +
                        ", ReactivePower:" + element.ReactivePower +
                          ", Temperature:" + element.Temperature +
                     "},";
        });
        locations = locations.substring(0,locations.length-1);
        return locations;
    }

    function replaceAll(chain, search, replacement) {
        if(chain == undefined) 
            return '';
        else
            return chain.replace(new RegExp(search, 'g'), replacement);
    };

    function formatSignal(signal, signalColumn){
        const value = signal && signal.Value;
        if (value === undefined || signalColumn === undefined) return '';

        const multiply = signalColumn.multiply !== undefined ? signalColumn.multiply : 1;
        const decimals = signalColumn.decimals !== undefined ? signalColumn.decimals : 0;        
        return (value*multiply).toFixed(decimals);
    }

    function getAlerts(){
        //get alerts from compactScada signals 
        return compactScada.getSignalsSynch('^(HYDRO_|SOLAR_|PARK_)([a-zA-Z0-9])*(.)(NominalPower|ReactivePower|WindSpeed|WindDirection|WeatherAlertInfo|WeatherAlertMsg|Temperature|ActivePower)$');
    }

    function clean() {        
        assetsMarkers = [];
        locations = [];
        map.clean();
        ractive.teardown();        
        $('[src="https://www.google-analytics.com/analytics.js"]').remove();
        $('[href="https://api.windytv.com/v2.3/api.css"]').remove();
        $('[src="https://www.windytv.com/gfs/minifest.js"]').remove();
        $('[src="https://api.windytv.com/v2.3/api.js?key=jpC7PH3xks2e3zw"]').remove();      
    }
    
    return {
        init,
        clean
    };
}