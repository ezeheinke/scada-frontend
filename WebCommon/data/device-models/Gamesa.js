/* global define */
define(function() {
//   var status = {
//     0:   {description: "Emergencia", availability: "ledRed"},
//     25:  {description: "Stop",       availability: "ledRed"},
//     50:  {description: "Pausa",      availability: "ledGrey"},
//     75:  {description: "Listo",      availability: "ledGreen"},
//     100: {description: "Marcha",     availability: "ledGreen"},
//     125: {description: "Manual",     availability: "ledGrey"},
//     'default': {description: "undefined code",     availability: "ledRed"}
//   };
  var status = {
    0:   {description: "Emergencia", availability: "error"},
    25:  {description: "Stop",       availability: "stopped"},
    50:  {description: "Pausa",      availability: "stopped"},
    75:  {description: "Listo",      availability: "available"},
    100: {description: "Marcha",     availability: "available"},
    125: {description: "Manual",     availability: "maintenance"},
    'default': {description: "undefined code", availability: "error"}
  };
  return {

    getAvailability: function(wtgSignals) {
      var statusQuality = wtgSignals.Status.Quality;
      var statusCode    = wtgSignals.Status.Value;
      return statusQuality === 192 ?
                status[statusCode] ?
                    status[statusCode].availability
                    :status['default'].availability
                :"disconnected";
    },
      
    getStatusDescription: function(wtgSignals) {
      var statusQuality = wtgSignals.Status.Quality;
      var statusCode    = wtgSignals.Status.Value;
      return statusQuality === 192 ?
                status[statusCode] ?
                    status[statusCode].description
                    :status['default'].description + " " + statusCode
                :"Disconnected";
    },
    
    getOrderItem: function(asset, wtg, order) {
      order = order.toLowerCase();  
      var orderMap = {
        "enable":  { key: wtg.ItemEnabled + "Request", value: 1 },
        "disable": { key: wtg.ItemEnabled + "Request", value: -1 },
        "start":   { key: wtg.ItemOrder, value: 16777472 },
        "stop":    { key: wtg.ItemOrder, value: 33554688 }
      };
      return orderMap[order];
    }
    
  }
});
