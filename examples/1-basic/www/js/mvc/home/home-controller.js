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

    NS.HomeController    = Class(Controller, {

        /**
         *
         * Home Controller.
         *
         * Only handles count start requests from the connected view
         *
         * @class           HomeController
         * @extends         Controller
         *
         * @constructor
         *
         */
        constructor: function(stateManager) {
            //The ExampleModel parent will call _setup().
            //If _setup() returns false the validity of the model instance is set to false, else true.
            NS.HomeController.$super.call(this, "HomeController", stateManager);

            //When you are ready to process events (from the connected model and view),
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

        /* NOTHING TO OVERRIDE MANDATORY */

        _wantToStartCounting : function() {
            this._stateManager.sendEvent("startCounting");
        }

    });
})();
