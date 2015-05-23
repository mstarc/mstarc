/**
 * Created by Freddy on 22/05/15.
 */

(function() {
    window.NS               = window.NS || {};

    var MSTARC              = window.__VI__ || window;

    var _                   = MSTARC.utils;
    var _l                  = MSTARC.logger;

    NS.homeState = {
        name        : "home",

        _mvcSetup    : false,

        onEnter : function() {
            var me = "State [{0}]::onEnter";

            //Setup the Home model, -view and -controller
            if (!this._mvcSetup) {
                this._mvcSetup = this._setupMVC();
            }

            //Show the UI
            //Notice that states always communicate with controllers only
            //So, there is no direct communication with models or views.
            if (this._mvcSetup) {
                var controller = NS.app.getComponent("HomeController");
                _.exec(controller, "showUI", true, "HomeController");
            } else {
                _l.error(me, "Home MVC not setup, unable to show Home UI");
            }
        },

        onExit : function() {
            //Hide the UI
            if (this._mvcSetup) {
                var controller = NS.app.getComponent("HomeController");
                _.exec(controller, "showUI", false, "HomeController");
            }
        },

        startCounting : function() {
            NS.stateManager.goToState("count");
        },

        /*************************************************
         *
         * PROTECTED METHODS
         *
         *************************************************/

        _setupMVC : function() {
            var me              = "State [{0}]::_setupMVC".fmt(this.name);
            var errOccurred     = true;


            var model           = NS.app.createComponent(NS.HomeModel, "HomeModel");
            var controller      = NS.app.createComponent(NS.HomeController, "HomeController", [NS.stateManager]);

            var container       = document.getElementById("home-view");
            var view            = NS.app.createComponent(NS.HomeView, "HomeView", [container]);


            if (_.hasMethod(controller, 'connect')) {
                errOccurred     = !(controller.connect(model) && controller.connect(view));
            } else {
                _l.error(me, "No valid controller to register model and view");
            }

            return (errOccurred === false);
        }
    };

})();