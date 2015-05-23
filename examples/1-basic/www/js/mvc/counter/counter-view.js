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

    NS.CounterView          = Class(BaseView, {

        _counterEl : null,

        /**
         *
         * Counter View.
         *
         * Using vanilla JS, shows counter updates and allows user to stop counting
         *
         * @class           CounterView
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
            NS.CounterView.$super.call(this, "CounterView", container);

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
            var me = "CounterView::_setup";

            //The BaseView must also be setup
            var success = NS.CounterView.$superp._setup.call(this);

            this._counterEl = document.getElementById("counter");
            if (!_.obj(this._counterEl)) {
                _l.error(me, "Unable to find counter DOM element, setup failed");
                success = false;
            }

            var stopButton = document.getElementById("stop-button");
            if (_.obj(stopButton)) {
                stopButton.onclick = this._stopCounting.bind(this);
            } else {
                _l.error(me, "Unable to find stop button element, setup failed");
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

        _updated : function(controller, data, readyCb) {
            var count                   = _.get(data, "count", "data of 'updated' event");
            var validCount              = _.number(count);
            this._counterEl.textContent = validCount ? count : "[ERROR : NO COUNTER AVAILABLE]";

            readyCb((!validCount) ? { message : "No counter value given, unable to render counter"} : undefined);
        },

        _stopCounting : function() {
            this._dispatchToController("wantToStopCounting");
        }
    });
})();
