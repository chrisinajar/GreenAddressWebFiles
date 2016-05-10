var test = require('tape');
var proxyquire = require('proxyquire');
var partial = require('ap').partial;

var window = {
  qrcode: {
  },
  navigator: {
  },
  gettext: function (t) {
    return '!@#!@#' + t;
  }
};

test('qrcode', function (t) {
  t.test('single image', function (t) {
    var Service = proxyquire('./qrcode', {
      'angular': {
        element: fakeElement,
        '@noCallThru': true
      },
      'global/window': window
    });
    var $q = require('q');
    var cordovaReady = {};
    var $timeout = setTimeout;
    var notices = {
      makeNotice: function (type, msg) {
        t.equal(type, 'error', 'uses error box');
        t.equal(msg, window.gettext('You must provide only one image file.'));

        notices.makeNotice = partial(t.ok, false, 'makeNotice called too many times');
      }
    };

    var service = Service($q, cordovaReady, $timeout, notices);
    t.ok(service, 'initializes, testing single image...');

    var $scope = {};
    var $event = {
      preventDefault: function () {
        t.ok(false, 'doesnt call preventDefault unless its cordova');
      },
      target: 'thisTarget'
    };
    var suffix = 'what?';
    service.scan($scope, $event, suffix);
    t.notOk($scope.scanning_qr_video, 'doesnt set scanning bit');
    t.end();

    function fakeElement (el) {
      t.equal(el, $event.target, 'Passes event.target into element');
      return {
        on: function onChange (change, cb) {
          t.equal(change, 'change', 'listens on change event');

          t.doesNotThrow(partial(cb, {
            // if (event.target.files.length !== 1 && event.target.files[0].type.indexOf('image/') !== 0) {
          }), 'callback change event');
        }
      };
    }
  });
  t.test('cordove', function (t) {
    window.cordova = {
      plugins: {
        barcodeScanner: {
          scan: function () {
            t.ok(true, 'calls scan');
          }
        }
      }
    };
    var Service = proxyquire('./qrcode', {
      'angular': {
        element: fakeElement,
        '@noCallThru': true
      },
      'global/window': window
    });
    var $q = require('q');
    var cordovaReady = function (fn) { return fn; };
    var $timeout = setTimeout;
    var notices = {};

    var service = Service($q, cordovaReady, $timeout, notices);

    var $scope = {};
    var $event = {
      preventDefault: function () {
        t.ok(true, 'calls prevent default on event passed');
      },
      target: 'thisTarget'
    };
    var suffix = 'what?';
    service.scan($scope, $event, suffix);
    t.ok(service, 'initializes');
    t.ok($scope.scanning_qr_video, 'sets scanning bit on scope');

    setTimeout(function () {
      service.stop_scanning($scope);
      t.end();
    }, 100);

    function fakeElement (el) {
      t.equal(el, $event.target, 'Passes event.target into element');
      return {
        on: noop
      };
    }
  });
});

function noop () {}
