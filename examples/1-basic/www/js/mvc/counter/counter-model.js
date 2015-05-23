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

    NS.CounterModel = Class(Model, {

        count       : 0,
        timerID     : null,

        /**
         *
         * Counter Model.
         *
         * This model represents a count value that is increased periodically
         *
         * @class           CounterModel
         * @extends         Model
         *
         * @constructor
         *
         */
        constructor: function() {
            //The CounterModel parent will call _setup().
            //If _setup() returns false the validity of the model instance is set to false, else true.
            NS.CounterModel.$super.call(this, "CounterModel");

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
            //Nothing special to set up
            return true;
        },

        _update : function() {
            var me = "CounterModel::_update";

            _l.info(me, "Updating the count and notifying controllers ...");
            this.count++;

            //Tell the connected controllers that data has been updated
            this._dispatchToControllers(
                    "updated",
                    {
                        count : this.count
                    },
                    function(err) {
                        if (_.def(err)) {
                            _l.error(me, _.stringify(err));
                        }
                    }
            );
        },

        _startCounting : function() {
            var me = "CounterModel::_startCounting";

            if (_.def(this.timerID)) {
                _l.warn(me, "Already counting, doing nothing");
                return;
            }

            this.timerID = setInterval(this._update.bind(this), 1000);

            _l.info(me, "Did start counting");
        },

        _stopCounting : function() {
            var me = "CounterModel::_stopCounting";

            clearInterval(this.timerID);
            this.timerID = null;

            _l.info(me, "Did stop counting");
        }
    });
})();
