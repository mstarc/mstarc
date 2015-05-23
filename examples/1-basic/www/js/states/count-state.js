/**
 * Created by Freddy on 22/05/15.
 */

(function() {
    window.NS               = window.NS || {};

    var MSTARC              = window.__VI__ || window;

    var _                   = MSTARC.utils;
    var _l                  = MSTARC.logger;

    NS.countState = {
        name        : "count",

        _mvcSetup    : false,

        onEnter : function() {
            var me = "State [{0}]::onEnter";
            if (!this._mvcSetup) {
                this._mvcSetup = this._setupMVC();
            }

            //Show the UI
            //Notice that states always communicate with controllers only
            //So, there is no direct communication with models or views.
            if (this._mvcSetup) {
                var controller = NS.app.getComponent("CounterController");
                _.exec(controller, "showUI", true, "CounterController");
                _.exec(controller, "startCounting", true, "CounterController");
            } else {
                _l.error(me, "Counter MVC not setup, unable to show Counter UI");
            }
        },

        onExit : function() {
            //Hide the UI
            if (this._mvcSetup) {
                var controller = NS.app.getComponent("CounterController");
                _.exec(controller, "showUI", false, "CounterController");
            }
        },

        stopCounting : function() {
            NS.stateManager.goToState("home");
        },

        /*************************************************
         *
         * PROTECTED METHODS
         *
         *************************************************/

        _setupMVC : function() {
            var me              = "State [{0}]::_setupMVC".fmt(this.name);
            var errOccurred     = true;


            var model           = NS.app.createComponent(NS.CounterModel, "CounterModel");
            var controller      = NS.app.createComponent(NS.CounterController, "CounterController", [NS.stateManager]);

            var container       = document.getElementById("counter-view");
            var view            = NS.app.createComponent(NS.CounterView, "CounterView", [container]);


            if (_.hasMethod(controller, 'connect')) {
                errOccurred     = !(controller.connect(model) && controller.connect(view));
            } else {
                _l.error(me, "No valid controller to register model and view");
            }

            return (errOccurred === false);
        }
    };

})();