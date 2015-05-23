/**
 * Created by Freddy on 22/05/15.
 */

(function() {

    window.NS               = window.NS || {};

    var MSTARC              = window.__VI__ || window;

    var _                   = MSTARC.utils;
    var _l                  = MSTARC.logger;

    var Class               = window.jsface.Class;

    //Our custom base view with some common functionality
    var BaseView            = NS.BaseView;

    NS.HomeView             = Class(BaseView, {

        /**
         *
         * Home View.
         *
         * Using vanilla JS, shows button to go to counting view and start counting
         *
         * @class           HomeView
         * @extends         View
         *
         * @param {HTMLElement} container   View container
         *
         * @constructor
         *
         */
        constructor: function(container) {
            //The ExampleModel parent will call _setup().
            //If _setup() returns false the validity of the model instance is set to false, else true.
            NS.HomeView.$super.call(this, "HomeView", container);

            //When you are ready to process events (from the connected controller),
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
            var me = "HomeView::_setup";

            //The BaseView must also be setup
            var success = NS.HomeView.$superp._setup.call(this);

            var startButton = document.getElementById("start-button");
            if (_.obj(startButton)) {
                startButton.onclick = this._startCounting.bind(this);
            } else {
                _l.error(me, "Unable to find start button element, setup failed");
                success = false;
            }

            return success;
        },

        _render : function() {
            //Nothing to render because in this example, the view structure is hardcoded in index.html
            //This method is called, through the view.render() method, by the controller after it was connected
            // with this view
            return true;
        },

        _startCounting : function() {
            this._dispatchToController("wantToStartCounting");
        }
    });
})();
