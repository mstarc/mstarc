/**
 * Created by Freddy on 14/05/15.
 */

(function() {

    window.NS       = window.NS || {};

    var MSTARC      = window.__VI__ || window;

    var _           = MSTARC.utils;
    var _l          = MSTARC.logger;

    var Class       = window.jsface.Class;
    var Model       = MSTARC.Model;

    NS.HomeModel = Class(Model, {

        /**
         *
         * Home Model. Empty, nothing to do here (for now)
         *
         *
         * @class           HomeModel
         * @extends         Model
         *
         * @constructor
         *
         */
        constructor: function() {
            //The HomeModel parent will call _setup().
            //If _setup() returns false the validity of the model instance is set to false, else true.
            NS.CounterModel.$super.call(this, "HomeModel");

            //When you are ready to process events (from connected controllers),
            // you need to call, _readyToProcessEvents()
            if (this.isValid()) {
                this._readyToProcessEvents()
            }
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            return true;
        }

    });
})();
