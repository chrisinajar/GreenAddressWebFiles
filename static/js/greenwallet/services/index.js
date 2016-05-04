// expects an angular module
// attaches all of the services to it!

module.exports = Services;

// these are all the services exposed when this runs
// we would just iterate over the FS and include them all,
// however browserify wont find them automatically if we do that..
// it's easier to just maintain this list manually,
// also you can swap out implementations if you want based on runtime logic
var serviceMap = {
  autotimeout: require('./autotimeout'),
  blind: require('./blind'),
  cordovaReady: require('./cordovaReady'),
  crypto: require('./crypto'),
  facebook: require('./facebook'),
  focus: require('./focus'),
  gaEvent: require('./gaEvent'),
  hostname: require('./hostname'),
  notices: require('./notices'),
  parseKeyValue: require('./parseKeyValue'),
  parse_bitcoin_uri: require('./parse_bitcoin_uri'),
  reddit: require('./reddit'),
  storage: require('./storage'),
  wallets: require('./wallets'),
  tx_sender: require('./tx_sender')
};

function Services (module) {
  Object.keys(serviceMap).forEach(function (serviceName) {
    var service = serviceMap[serviceName];
    module.factory(
      serviceName,
      (service.dependencies || []).concat(service)
    );
  });
}
