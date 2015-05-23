/**
 * Created by Freddy on 14/05/15.
 */

(function() {

    window.NS               = window.NS || {};

    var MSTARC              = window.__VI__ || window;

    var _                   = MSTARC.utils;
    var _l                  = MSTARC.logger;

    var Class               = window.jsface.Class;
    var Controller          = MSTARC.Controller;

    NS.CounterController    = Class(Controller, {

        /**
         *
         * Counter Controller.
         *
         * Only forwards count updates from the connected model to the connected view and
         * handles count reset requests from the connected view
         *
         * @class           CounterController
         * @extends         Controller
         *
         * @constructor
         *
         */
        constructor: function(stateManager) {
            //The ExampleModel parent will call _setup().
            //If _setup() returns false the validity of the model instance is set to false, else true.
            NS.CounterController.$super.call(this, "CounterController", stateManager);

            //When you are ready to process events (from the connected model and view),
            // you need to call, _readyToProcessEvents()
            if (this.isValid()) {
                this._readyToProcessEvents()
            }
        },

        startCounting : function() {
            this._dispatchToModel("startCounting");
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        /* NOTHING TO OVERRIDE MANDATORY */
        _updated : function(model, data, readyCb) {
            this._dispatchToView("updated", data, readyCb);
        },

        _wantToStopCounting : function() {
            this._stateManager.sendEvent("stopCounting");
            this._dispatchToModel("stopCounting");
        }

    });
})();
