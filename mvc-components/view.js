/**
 * Created by Freddy Snijder on 22/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var MVCComponent        = NS.MVCComponent;

    NS.View = Class(MVCComponent, {

        /**
         *
         * An abstract View class:
         *  - rendering the data it gets from the model, through the controller,
         *  - providing back information about new data, data changes and other input actions to the controller
         *
         * The controller ensures that the model data is provided to the view in a way that the view able to render.
         *
         * DON'T FORGET:
         * When applicable, you have to mark this._valid = true or false in your View subclass constructor
         * to mark the instance validity.
         *
         * @class           View
         * @module          M*C
         *
         * @extends         MVCComponent
         *
         * @constructor
         *
         * @param {String} viewName             name of view
         * @param {Object} [config]             Object containing additional properties the view needs to
         *                                      know about. The properties in the config are added to the View
         *                                      instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function (viewName, config) {
            var me = "View::constructor";
            NS.Controller.$super.call(this, viewName, config);
        },

        allowedToRegister : function(component) {
            var me              = "{0}::View::allowedToRegister".fmt(this.getIName());
            var allowed         = false;

            var componentName   = _.call(component, "getIName") || "[UNKNOWN]";

            if (_.call(component, 'isController', componentName) === true) {
                if (this._countRegisteredOfType("controller") < 1) {
                    allowed = true;
                } else {
                    _l.debug(me, ("Controller component {0} is not allowed to register " +
                                  "because a controller has already been registered").fmt(componentName));
                }
            }

            return allowed;
        },

        /**
         *
         * Returns if instance is a view
         *
         * @returns {boolean}
         */
        isView : function() {
            return true;
        }

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/
    });
})();
