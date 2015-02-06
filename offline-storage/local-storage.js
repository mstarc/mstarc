/**
 * Created by Freddy Snijder on 24/01/15.
 */

(function() {
    var NS          = null;

    var _l          = null;
    var _           = null;
    var Class       = null;
    var Base        = null;

    var __isNode = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
    if (__isNode) {
        var jsface  = require("jsface");

        _           = require('../../utils.js').utils;
        _l          = require('../../logger.js').logger;

        NS = exports;

        //@TODO
        _l.error("local-storage.js", "local storage not available for node.js");

        return;
    } else {
        //Add to Visionscapers namespace
        NS = window.__VI__ || window;

        _           = NS.utils;
        _l          = NS.logger;
        Class       = window.jsface.Class;
        Storage     = NS.Storage;
    }

    NS.LocalStorage = Class(Storage, {

        /**
         *
         * An Key-Value storage based on the browser's localStorage implementation
         *
         * @Class LocalStorage
         * @extends Storage
         *
         * @constructor
         *
         */
        constructor: function () {
            var me = "LocalStorage::constructor";
            NS.LocalStorage.$super.call(this);

            this._valid = _.obj(window['localStorage']);
        },

        /*************************************************************************
         *
         * PROTECTED METHODS TO OVERRIDE
         *
         *************************************************************************/

        _pack : function(value) {
            var me = "LocalStorage::_pack";

            var str = null;
            try {
                str = JSON.stringify(value);
            } catch(e) {
                _l.error(me, "A problem occurred stringify : ", e);
            }

            return str;
        },

        _store : function(key, packedValue) {
            localStorage.setItem(key, packedValue);
            return true;
        },

        _unpack : function(packedValue) {
            var me  = "LocalStorage::_unpack";
            var obj = null;

            if (!_.string(packedValue)) {
                _l.error(me, "Packed value is a string, unable to unpack value");
                return obj;
            }

            try {
                obj = JSON.parse(packedValue);
            } catch(e) {
                _l.error(me, "A problem occurred parsing the packed value, unable to unpack");
            }

            return obj;
        },

        _retrieve : function(key) {
            localStorage.getItem(key);
            return true;
        },

        _remove : function(key) {
            localStorage.removeItem(key);
            return true;
        },

        _deleteAllStoredPairs : function() {
            localStorage.clear();
            return true;
        }
    });
})();
