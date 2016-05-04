var angular = require('angular');
var window = require('global/window');

var BASE_URL = window.BASE_URL;
var LANG = window.LANG;
var gettext = window.gettext;

module.exports = factory;

factory.dependencies = ['$q', '$interval', '$uibModal', 'notices', '$rootScope', 'focus'];

function factory ($q, $interval, $uibModal, notices, $rootScope, focus) {
  var trezor_api, transport, trezor;

  var promptPin = function (type, callback) {
    var scope, modal;
    scope = angular.extend($rootScope.$new(), {
      pin: '',
      type: type
    });

    modal = $uibModal.open({
      templateUrl: BASE_URL + '/' + LANG + '/wallet/partials/wallet_modal_trezor_pin.html',
      size: 'sm',
      windowClass: 'pinmodal',
      backdrop: 'static',
      keyboard: false,
      scope: scope
    });

    modal.result.then(
      function (res) { callback(null, res); },
      function (err) { callback(err); }
    );
  };

  var promptPassphrase = function (callback) {
    var scope, modal;

    scope = angular.extend($rootScope.$new(), {
      passphrase: ''
    });

    modal = $uibModal.open({
      templateUrl: BASE_URL + '/' + LANG + '/wallet/partials/wallet_modal_trezor_passphrase.html',
      size: 'sm',
      windowClass: 'pinmodal',
      backdrop: 'static',
      keyboard: false,
      scope: scope
    });

    modal.result.then(
      function (res) { callback(null, res); },
      function (err) { callback(err); }
    );
  };

  var handleError = function (e) {
    var message;
    if (e === 'Opening device failed') {
      message = gettext("Device could not be opened. Make sure you don't have any TREZOR client running in another tab or browser window!");
    } else {
      message = e;
    }
    $rootScope.safeApply(function () {
      notices.makeNotice('error', message);
    });
  };

  var handleButton = function (dev) {
    var modal = $uibModal.open({
      templateUrl: BASE_URL + '/' + LANG + '/wallet/partials/wallet_modal_trezor_confirm_button.html',
      size: 'sm',
      windowClass: 'pinmodal',
      backdrop: 'static',
      keyboard: false
    });

    dev.once('pin', function () {
      try { modal.close(); } catch (e) {}
    });
    dev.once('receive', function () {
      try { modal.close(); } catch (e) {}
    });
    dev.once('error', function () {
      try { modal.close(); } catch (e) {}
    });
  };

  return {
    getDevice: function (noModal, silentFailure) {
      var deferred = $q.defer();
      var is_chrome_app = require('has-chrome-storage');
      if (!is_chrome_app) return deferred.promise;

      var tick, modal;
      var showModal = function () {
        if (!noModal && !modal) {
          modal = $uibModal.open({
            templateUrl: BASE_URL + '/' + LANG + '/wallet/partials/wallet_modal_usb_device.html'
          });
          modal.result.finally(function () {
            if (tick) {
              $interval.cancel(tick);
            }
          });
        }
      };
      var plugin_d;

      if (trezor_api) {
        plugin_d = $q.when(trezor_api);
      } else {
        plugin_d = window.trezor.load();
      }
      plugin_d.then(function (api) {
        trezor_api = api;
        tick = $interval(function () {
          var enumerate_fun = is_chrome_app ? 'devices' : 'enumerate';
          $q.when(trezor_api[enumerate_fun]()).then(function (devices) {
            if (devices.length) {
              if (noModal) {
                $interval.cancel(tick);
              } else if (modal) {
                modal.close(); // modal close cancels the tick
              } else {
                $interval.cancel(tick);
              }
              var acquire_fun = is_chrome_app ? 'open' : 'acquire';
              $q.when(trezor_api[acquire_fun](devices[0])).then(function (dev_) {
                if (!is_chrome_app) dev_ = new trezor.Session(transport, dev_.session);
                deferred.resolve(dev_.initialize().then(function (init_res) {
                  var outdated = false;
                  if (init_res.message.major_version < 1) outdated = true;
                  else if (init_res.message.major_version === 1 &&
                    init_res.message.minor_version < 3) outdated = true;
                  if (outdated) {
                    notices.makeNotice('error', gettext('Outdated firmware. Please upgrade to at least 1.3.0 at http://mytrezor.com/'));
                    return $q.reject({outdatedFirmware: true});
                  } else {
                    return dev_;
                  }
                }).then(function (dev) {
                  var trezor_dev = window.trezor_dev = dev;
                  trezor_dev.on('pin', promptPin);
                  trezor_dev.on('passphrase', promptPassphrase);
                  trezor_dev.on('error', handleError);
                  trezor_dev.on('button', function () {
                    handleButton(dev);
                  });
                  return trezor_dev;
                }));
              }, function (err) {
                console.error(err.stack || err);
                handleError('Opening device failed');
              });
            } else if (noModal) {
              if (noModal === 'retry') return;
              deferred.reject();
            } else showModal();
          }, function () {
            if (noModal) {
              if (noModal === 'retry') return;
              $interval.cancel(tick);
              deferred.reject();
            } else showModal();
          });
        }, 1000);
      }).catch(function (e) {
        if (!silentFailure) {
          $rootScope.safeApply(function () {
            // notices.makeNotice('error', gettext('TREZOR initialisation failed') + ': ' + e)
          });
        }
        deferred.reject({pluginLoadFailed: true});
      });
      return deferred.promise;
    },
    recovery: function (mnemonic) {
      return this.getDevice().then(function (dev) {
        return dev.wipeDevice().then(function (res) {
          return dev.loadDevice({mnemonic: mnemonic});
        });
      });
    },
    setupSeed: function (mnemonic) {
      var scope = $rootScope.$new();
      var d = $q.defer();
      var trezor_dev;
      var modal;
      var service = this;
      scope.trezor = {
        use_gait_mnemonic: !!mnemonic,
        store: function () {
          this.setting_up = true;
          var store_d;
          if (mnemonic) {
            store_d = service.recovery(mnemonic);
          } else {
            store_d = trezor_dev.resetDevice({strength: 256});
          }
          store_d.then(function () {
            modal.close();
            d.resolve();
          }).catch(function (err) {
            this.setting_up = false;
            if (err.message) return; // handled by handleError in services.js
            notices.makeNotice('error', err);
          });
        },
        reuse: function () {
          modal.close();
          d.resolve();
        }
      };
      var do_modal = function () {
        modal = $uibModal.open({
          templateUrl: BASE_URL + '/' + LANG + '/wallet/partials/wallet_modal_trezor_setup.html',
          scope: scope
        });
        modal.result.catch(function () { d.reject(); });
      };
      this.getDevice().then(function (trezor_dev_) {
        trezor_dev = trezor_dev_;
        trezor_dev.getPublicKey([]).then(function (pk) {
          scope.trezor.already_setup = true;
          do_modal();
        }, function (err) {
          if (err.code !== 11) { // Failure_NotInitialized
            notices.makeNotice('error', err.message);
          }
          do_modal();
        });
      });
      return d.promise;
    }
  };
}
