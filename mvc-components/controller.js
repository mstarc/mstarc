/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS              = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var MVCComponent             = NS.MVCComponent;

    NS.Controller = Class(MVCComponent, {

        _stateManager : null,

        /**
         *
         * An abstract Controller class. A controller:
         *  - gets notified by a model of new data and data changes
         *  - provides model data to the view in a form the view is capable of rendering
         *  - gets notified of user input by the view
         *  - based on user input from the view can notify a stateManager and provide new data or data changes back
         *    to the model
         *
         * Although a controller connects in principle to only one model, it can connect to multiple models.
         * This allows a controller to listen to specific details of secondary models such the same data doesn't
         * have to be presented by multiple models
         *
         * A controller can only be connected to one view.
         *
         * DON'T FORGET:
         * When applicable, you have to mark this._valid = true or false in your Controller subclass constructor
         * to mark the instance validity.
         *
         * @class           Model
         * @module          M*C
         *
         * @extends         MVCComponent
         *
         * @constructor
         *
         * @param {String} controllerName           name of controller
         * @param {Object} stateManager             stateManager instance
         *
         * @param {Object} [config]                 Object containing additional properties the controller needs to
         *                                          know about. The properties in the config are added to the Controller
         *                                          instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function (controllerName, stateManager, config) {
            var me = "Controller::constructor";
            NS.Controller.$super.call(this, controllerName, config);

            this._stateManager          = stateManager;
        },

        allowedToRegister : function(component) {
            var me              = "{0}::Controller::allowedToRegister".fmt(this.getIName());
            var allowed         = false;

            var componentName   = _.call(component, "getIName") || "[UNKNOWN]";

            if (_.call(component, 'isView', componentName) === true) {
                if (this._countRegisteredOfType("view") < 1) {
                    allowed = true;
                } else {
                    _l.debug(me, ("View component {0} is not allowed to register " +
                                  "because a view has already been registered").fmt(componentName));
                }

                return allowed;
            }

            if (_.call(component, 'isModel', componentName) === true) {
                if (this._countRegisteredOfType("model") < 1) {
                    allowed = true;
                } else {
                    _l.debug(me, ("Model component {0} is not allowed to register " +
                                  "because a model has already been registered").fmt(componentName));
                }

                return allowed;
            }

            return allowed;
        },

        /**
         *
         * Returns if instance is a controller
         *
         * @returns {boolean}
         */
        isController : function() {
            return true;
        }

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/
    });
})();
