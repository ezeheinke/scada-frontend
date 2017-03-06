(function(global) {

  var map = {
    'app': 'app',
  };

  var packages = {
    'app': { main: 'main.js',  defaultExtension: 'js' }
  };

  var config = {
    map: map,
    packages: packages,
    paths: {      
      'ractive': 'node_modules/ractive/ractive.js',
      'director': 'node_modules/director/build/director.js',
      'whatwg-fetch': 'node_modules/whatwg-fetch/fetch.js',
      'myers': 'libs/myers.min.js',
      //'leaflet': 'data/map-europe/leaflet.js',
      //'markercluster': 'data/map-europe/MarkerCluster.js',
      'vis': 'libs/vis-custom.min.js',
      'ractive-tooltip': 'node_modules/ractive-tooltip/ractive-tooltip.min.js',
      'ractive-events-keys': 'node_modules/ractive-events-keys/dist/ractive-events-keys.min.js',
      'jquery': 'node_modules/jquery/dist/jquery.min.js'
      // not importing well moment -> add to index.html
      // 'moment': 'node_modules/moment/min/moment.min.js'
      // not importing well dcjs so will load in index.html
      // 'dc': 'node_modules/dc/dc.js',
      // 'd3': 'node_modules/dc/node_modules/d3/d3.js',
      // 'crossfilter': 'node_modules/dc/node_modules/crossfilter2/crossfilter.js'
    }
  }

  // filterSystemConfig - index.html's chance to modify config before we register it.
  if (global.filterSystemConfig) { global.filterSystemConfig(config); }

  System.config(config);

})(this);
