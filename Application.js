/**
 *
 * Created by Freddy Snijder on 22/01/15.
 *
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var NamedBase           = NS.NamedBase;
    var Configurable        = NS.Configurable;

    NS.Application = Class([NamedBase, Configurable], {

        _MVCComponents : {},

        /**
         *
         * An abstract Application class.
         *  - Factory for your MVC components
         *  - Any MVC component our create through the application is registered in the application
         *  - Sends events to the stateManager about device events (when implemented)
         *
         * DON'T FORGET:
         * When applicable, you have to mark this._valid = true or false in your Application subclass constructor
         * to mark the instance validity.
         *
         * @class           Application
         * @module          M*C
         *
         * @extends         NamedBase
         *
         * @constructor
         *
         * @param {String} applicationName          name of controller
         * @param {Object} stateManager             stateManager instance
         *
         * @param {Object} [config]                 Object containing additional properties the controller needs to
         *                                          know about. The properties in the config are added to the Controller
         *                                          instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function(applicationName, stateManager, config) {
            var me = "Application::constructor";
            NS.Controller.$super.call(this, applicationName, config);

            this._stateManager = stateManager;
        },

        /**
         *
         * Allows you to create instances of the MVCComponent class you provide.
         * The provided class must have the following constructor call syntax:
         *
         *  new mvcComponentClass(componentName, <arguments in extraArguments array>)
         *
         * @method create
         *
         * @param {function} mvcComponentClass
         * @param {string} componentName
         * @param {array} [extraArguments]
         *
         * @returns {boolean}                       True on success, else false
         *
         */
        create: function(mvcComponentClass, componentName, extraArguments) {
            var me      = "{0}::Application::create".fmt(this.getIName());
            var success = false;

            if (!_.func(mvcComponentClass)) {
                _l.error(me, "mvcComponentClass is not a function, unable to create component");
                return success;
            }

            if (!_.string(componentName) || _.empty(componentName)) {
                _l.error(me, "No valid componentName give, unable to create component");
                return success;
            }

            if (_.def(extraArguments) && !_.array(extraArguments)) {
                _l.error(me, ("Additional arguments to construct {0} must be represented by an argument array, " +
                              "unable to create component").fmt(componentName));
                return success;
            }

            if (_.def(this._MVCComponents[componentName])) {
                _l.error(me, ("A component named {0} was already created and registered with the application, " +
                              "unable to create component").fmt(componentName));
                return success;
            }

            var constructorArgs = extraArguments || [];
            constructorArgs.unshift(componentName);

            //A way to construct using call
            var factoryFunction = mvcComponentClass.bind.call(mvcComponentClass, constructorArgs);
            var component = new factoryFunction();

            this._MVCComponents[componentName] = component;

            return (success = true);
        }


        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/


    });
})();
