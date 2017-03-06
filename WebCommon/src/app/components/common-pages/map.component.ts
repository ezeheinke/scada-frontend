import { PopupComponent } from './popup.component';

declare var $: any; 
declare var L: any;

import { CompactScadaService } from '../../services/compact-scada.service';
const compactScada = CompactScadaService();

export function MapComponent() {             
    
    let map = undefined;
    let mapMarkers = [];
    let popups = [];
    
    function init(elem, markers, requiredZoom?) {
        console.log("<map>");
        
        if (markers instanceof Array === false) {
            markers = [];
        }  
        drawMap(elem, markers, requiredZoom);

        console.log("</map>");
    }

    function drawMap(elem, markers: Marker[],requiredZoom?){
        var mapElem = document.querySelector(elem);
        const height = mapElem.parentElement.clientHeight;
        mapElem['style'].height = height+'px';
               
        const center = calculateCenter(markers);

        map = L.map(elem.slice(1), {
            center: [center.latitude, center.longitude],
            zoom: requiredZoom?requiredZoom:11
        });

        const mapTilesUrl = '/data/map-europe/mapTiles/{z}/{x}/{y}.jpg';

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

        L.tileLayer(mapTilesUrl, {
            minZoom: 6,
            maxZoom: 11,
            attribution: "Map data &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> " +
                        "(<a href='http://www.openstreetmap.org/copyright'>Licence</a>)"
        }).addTo(map);

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
            mapMarker.bindPopup(`<div id="${marker.id}-popup" class="marker-popup"></div>`);            

            mapMarkers.push(mapMarker);
            //map.addLayer(mapMarker);
            markercluster.addLayer(mapMarker);
        }
    );

    mapMarkers.forEach(function(mapMarker) {
        mapMarker.openPopup();
        var folderUrl = mapMarker.options.icon.options.iconUrl.split("/");
        mapMarker.getPopup().setContent(
            `
            <div>
                    <div class="popUptitle">
                        <div style="height: 40px; border-bottom: 1px solid #cecece;">
                            <img style="width: 32px; height:32px;left: 12px;top: 5px;position: relative; float:left;" src="` + "/" + folderUrl[1] 
                                    + "/" + folderUrl[2] 
                                    + "/" + folderUrl[3] 
                                    + "/" +"ico_"+ (mapMarker.index.split("_")[0].toLowerCase()) 
                                    + ".png"+ `
                            "/>
                            <div style="position: relative;float: left;left: 10px;top: 12px;font-weight: 700;text-align: center; width: 160px;"> 
                            ` + mapMarker.displayName + `
                            </div>
                        </div>
                        <div style="width:220px; height:109px">                                            
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Nominal Power </div>
                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">` + (mapMarker.NominalPower/1000).toFixed(2) + ` MW</div>
                            </div>
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Active Power </div>
                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">`+ (mapMarker.ActivePower/1000).toFixed(1) + ` MW</div>
                            </div>
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Reactive Power </div>
                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">` + (mapMarker.ReactivePower/1000).toFixed(1) + ` MVAr</div>
                            </div>
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Wind Speed </div>
                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">` + mapMarker.WindSpeed.toFixed(1) + ` m/s</div>
                            </div>
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Wind Direction </div>
                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">` + mapMarker.WindDirection.toFixed(1) + ` º</div>
                            </div>
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Temperature </div>
                                <div style="position:relative;float: right; right:15px; font-size: 10px; color: white;">`+ mapMarker.Temperature.toFixed(1) + ` ºC</div>
                            </div>
                            <div style="border-bottom: 1px solid #565656; height: 14px;">
                                <div style="clear: both;position:relative;float: left; left:15px; font-size: 10px; color: white;font-weight: bold;">Alarms </div>
                                <div style="position:relative; float:right; right:15px; font-size: 10px; color: white;font-weight: bold;">
                                    `+ formatAlarms(mapMarker.msgSignal) + `
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
            `
            );
        
        mapMarker.closePopup();
    });

    map.addLayer(markercluster);
    }

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

    function calculateCenter(markers: Marker[]) {
         let totalAssets = markers.length;
         if (totalAssets > 0) {
             let totalLatitude = 0;
             let totalLongitude = 0;
             markers.forEach(marker => totalLatitude = (totalLatitude + marker.latitude));
             markers.forEach(marker => totalLongitude = (totalLongitude + marker.longitude));  
             return {latitude: totalLatitude /totalAssets,longitude: totalLongitude/ totalAssets};
         }
         return {latitude: 40.4165000, longitude: -3.7025600};
    }
    
    function clean() {
        mapMarkers.forEach((marker)=>marker.unbindPopup());
        mapMarkers = [];
        popups.forEach( (popupComponent)=>popupComponent.clean());
        map = undefined;        
    }
    
    return {
        init,
        clean
    };
}