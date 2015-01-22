/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS              = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var NamedBase           = NS.NamedBase;
    var Configurable        = NS.Configurable;
    var NotificationCapable = NS.NotificationCapable;

    NS.MVCComponent = Class([NamedBase, Configurable, NotificationCapable], {

        $statics : {
            REQUIRED_COMPONENT_CONNECT_API : {
                methods : ['getIName', 'register', 'isModel', 'isController', 'isView']
            }
        },

        /**
         *
         * MVCComponent provides functionality shared by the Model, View and Controller classes
         *
         * @class           MVCComponent
         * @module          M*C
         *
         * @extends         NamedBase
         * @uses            Configurable
         * @uses            NotificationCapable
         *
         * @constructor
         *
         * @param {String} componentName            name of model
         *
         * @param {Object} [config]                 Object containing additional properties the model needs to
         *                                          know about. The properties in the config are added to the Model
         *                                          instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function (componentName, config) {
            var me = "{0}::MVCComponent::constructor".fmt(componentName);
            NS.MVCComponent.$super.call(this, componentName);

            this._addConfigProperties(config);
        },

        connect: function(component) {
            var iName   = this.getIName();
            var me      = "{0}::MVCComponent::connect".fmt(iName);
            var success = false;

            if (!_.interfaceAdheres(component, MVCComponent.REQUIRED_COMPONENT_CONNECT_API)) {
                _l.error(me, "Component does not adhere to the required interface, unable to connect");
                return success;
            }

            if (!this.register(component.getIName(), component)) {
                _l.error(me, "A problem occurred registering component {0} with us, unable to connect".fmt(me));
                return success;
            }

            if (!component.register(iName, this)) {
                this.deregister(component);
                _l.error(me, "A problem occurred registering us with component {0}, unable to connect".fmt(me));
                return success;
            }

            return (success = true);
        },

        allowedToRegister : function(component) {
            var me = "{0}::MVCComponent::allowedToRegister".fmt(this.getIName());
            _l.error(me, "No implementation provided, unable to assess if component is allowed to be registered");

            return false;
        },

        /**
         *
         * Returns if instance is a model
         * Override this function in model classes
         *
         * @returns {boolean}
         */
        isModel : function() {
            return false;
        },

        /**
         *
         * Returns if instance is a view
         * Override this function in view classes
         *
         * @returns {boolean}
         */
        isView : function() {
            return false;
        },

        /**
         *
         * Returns if instance is a controller
         * Override this function in controller classes
         *
         * @returns {boolean}
         */
        isController : function() {
            return false;
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _countRegisteredOfType : function(componentType) {
            var me = "{0}::MVCComponent::_countRegisteredOfType".fmt(this.getIName());
            var count = -1;

            if (!_.string(componentType)) {
                _l.error(me, "componentType is not a string, unable to count number of registered components");
                return count;
            }

            count = 0;
            var typeAssessor = "is" + _.capitaliseFirst(componentType);

            var listenerNames = Object.getOwnPropertyNames(this._listeners);

            var listenerName = null;
            var listener = null;
            for (var idx in listenerNames) {
                listenerName = listenerNames[idx];
                listener     = this._listeners[listenerName];

                count += ((_.call(listener, typeAssessor, listenerName) === true) ? 1 : 0);
            }

            return count;
        }

    });
})();
