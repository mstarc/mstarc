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

        Class       = jsface.Class;
        Base        = require("../../base.js").Base;

        NS = exports;
    } else {
        //Add to Visionscapers namespace
        NS = window.__VI__ || window;

        _           = NS.utils;
        _l          = NS.logger;
        Class       = window.jsface.Class;
        Base        = NS.Base;
    }

    NS.Storage = Class(Base, {

        /**
         *
         * An Abstract Key-Value storage class
         * To implement a subclass you need to override:
         *
         * - _pack(value)
         * - _store(key, packedValue)
         * - _unpack(packedValue)
         * - _retrieve(key)
         * - _remove(key)
         * - _deleteAllStoredPairs()
         *
         *
         * @Class Storage
         * @extends Base
         *
         * @constructor
         *
         */
        constructor: function () {
            var me = "Storage::constructor";
            NS.Storage.$super.call(this);
        },

        /**
         *
         * @param {string} key
         *
         * @returns                 Returns true is a value exists for key, else false
         *
         */
        exists : function(key) {
            return _.def(this.get(key));
        },

        /**
         *
         * Get value for given key. If <propPath> is given it tries to find
         * the property value (of the object stored at key <key>) by following
         * the path given by <propPath>
         *
         * @param {string} key
         * @param {string} propPath     E.g. "user.address.street"
         *
         */
        get : function(key, propPath) {
            var me      = "Storage::get";
            var value   = undefined;

            if (!this.isValid()) {
                var propPathDesc = _.string(propPath) ? " at path {1}".fmt(propPath) : "";
                _l.error(me, "Storage invalid, unable to get value for key [{0}]{1}".fmt(key, propPathDesc));
                return value;
            }

            if ((!_.string(key)) || (_.empty(key))) {
                _l.error(me, "Given key is invalid, unable to get value".fmt(key));
                return value;
            }

            value = this._unpack(this._retrieve(key));
            if (_.string(propPath)) {
                value = _.get(value, propPath, "Value for key [{0}]".fmt(key));
            }

            return value;
        },

        /**
         *
         * Set <value> for <key>
         *
         * @param {string} key      Key to store value at
         * @param {*} value         Anything but null or undefined
         *
         * @returns {*}
         *
         */
        set : function(key, value, propPath) {
            var me      = "Storage::set";
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "Storage invalid, unable to set value for key [{0}]".fmt(key));
                return success;
            }

            if ((!_.string(key)) || (_.empty(key))) {
                _l.error(me, "Given key is invalid, unable to set value".fmt(key));
                return success;
            }

            var o = null;
            if (_.string(propPath)) {
                o = this.get(key);
                if (_.obj(o)) {
                    if (!_.set(o, propPath, "Object for key {0}".fmt(key))) {
                        _l.error(me, "Unable to set value at path {0} for object at key [{1}]".fmt(propPath, key));
                        return success;
                    }
                } else {
                    _l.error(me, ("Value at key [{0}] not an object, " +
                                  "unable to set value at path {1}").fmt(key, propPath));
                    return success;
                }


                return this.set(key, o);
            }

            if (!_.def(value)) {
                _l.error(me, "Unable to set value to null or undefined, unable to set value of key {0}".fmt(key));
                return success;
            }

            return (success = this._store(key, this._pack(value)));
        },

        remove : function(key) {
            var me      = "Storage::remove";
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "Storage invalid, unable to remove key-value pair at key [{0}]".fmt(key));
                return success;
            }

            if ((!_.string(key)) || (_.empty(key))) {
                _l.error(me, "Given key is invalid, unable to remove key-value pair".fmt(key));
                return success;
            }

            return this._remove(key);
        },

        clearAll : function() {
            var me      = "Storage::clearAll";
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "Storage invalid, unable to remove key-value pair at key [{0}]".fmt(key));
                return success;
            }

            return this._deleteAllStoredPairs();
        },


        /*************************************************************************
         *
         * PROTECTED METHODS TO OVERRIDE
         *
         *************************************************************************/

        /************************ METHODS TO OVERRIDE ***************************/

        _pack : function(value) {
            var me = "Storage::_pack";

            _l.error(me, "Method not implemented, unable to pack value");
            return null;
        },

        _store : function(key, packedValue) {
            var me = "Storage::_store";

            _l.error(me, "Method not implemented, unable to store value at key {0}".fmt(key));
            return false;
        },

        _unpack : function(packedValue) {
            var me = "Storage::_unpack";

            _l.error(me, "Method not implemented, unable to unpack value");
            return null;
        },

        _retrieve : function(key) {
            var me = "Storage::_retrieve";

            _l.error(me, "Method not implemented, unable to retrieve value at key {0}".fmt(key));
            return null;
        },

        _remove : function(key) {
            var me = "Storage::_remove";

            _l.error(me, "Method not implemented, unable to remove key-value pair with key {0}".fmt(key));
            return false;
        },

        _deleteAllStoredPairs : function() {
            var me = "Storage::_deleteAllStoredPairs";

            _l.error(me, "Method not implemented, unable to remove all key-value pairs from storage");
            return false;
        }

    });
})();
