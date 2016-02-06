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

        $statics : {
            REQUIRED_STATE_MANAGER_API : {
                methods : ['sendEvent']
            }
        },

        /**
         *
         * An abstract Application class.
         *  - Factory for your MVC components
         *  - Any MVC component you create through the application is registered in the application
         *  - Get services and managers by name based on what is injected through the config object during construction
         *  - Sends events to the stateManager about device events (when implemented)
         *
         *
         * Methods to optionally override in subclasses :
         *
         *  - _setup()                              Sets up the application using all injected instances.
         *                                          This is also the place where you validate the stateManager and
         *                                          other provided instances, such as services and managers.
         *
         *                                          Returns true on success else false
         *
         *                                          This method is called during construction
         *
         *  - start()                               Called when you want to start the application. The default
         *                                          implementation uses the state manager to sendEvent 'appReady'
         *
         *
         * @class           Application
         * @module          M*C
         *
         * @extends         NamedBase
         *
         * @constructor
         *
         * @param {String} applicationName              name of controller
         * @param {Object} stateManager                 stateManager instance
         *
         * @param {Object} [config]                     Object containing additional properties the controller needs to
         *                                              know about.
         *
         *                                              The properties in the config are added to the Controller
         *                                              instance if they not already exist. Also see Configurable mixin.
         *
         * @param {Object} [config.services]            Hash object with service instances. A service can later be
         *                                              retrieved using getService(name), where name is the key used in
         *                                              the hash object.
         *
         * @param {Object} [config.managers]            Hash object with manager instances. A manager can later be
         *                                              retrieved using getManager(name), where name is the key used in
         *                                              the hash object.
         *
         *                                              For instance, here you place ResourceManager instances.
         *
         */
        constructor: function(applicationName, stateManager, config) {
            NS.Application.$super.call(this, applicationName, config);

            var me = "{0}::Application::constructor".fmt(this.getIName());

            this._stateManager = stateManager;
            this._addConfigProperties(config);

            this._valid = true;
            if (!this._setup()) {
                _l.error(me, "Application setup failed, application wil not function properly");
                this._valid = false;
            }
        },

        start : function() {
            var me      = "{0}::Application::start".fmt(this.getIName());
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "Application not valid, unable to start");
                return success;
            }

            this._stateManager.sendEvent('appReady');
        },

        /**
         *
         * Allows you to create instances of the MVCComponent class you provide.
         * The provided class must have the following constructor call syntax:
         *
         *  new mvcComponentClass(componentName, <arguments in extraArguments array>)
         *
         * @method createComponent
         *
         * @param {function} mvcComponentClass
         * @param {string} componentName
         * @param {array} [extraArguments]
         *
         * @returns {Object}                       Created component or null on error
         *
         */
        createComponent: function(mvcComponentClass, componentName, extraArguments) {
            var me          = "{0}::Application::createComponent".fmt(this.getIName());
            var component   = null;

            if (!_.func(mvcComponentClass)) {
                _l.error(me, "mvcComponentClass is not a function, unable to create component");
                return component;
            }

            if (!_.string(componentName) || _.empty(componentName)) {
                _l.error(me, "No valid componentName give, unable to create component");
                return component;
            }

            if (_.def(extraArguments) && !_.array(extraArguments)) {
                _l.error(me, ("Additional arguments to construct {0} must be represented by an argument array, " +
                              "unable to create component").fmt(componentName));
                return component;
            }

            if (_.def(this._MVCComponents[componentName])) {
                _l.error(me, ("A component named {0} was already created and registered with the application, " +
                              "unable to create component").fmt(componentName));
                return component;
            }

            _l.info(me, "Creating component {0} ...".fmt(componentName));

            var constructorArgs = extraArguments || [];
            constructorArgs.unshift(componentName);

            //A way to construct using call
            var factoryFunction = mvcComponentClass.bind.apply(mvcComponentClass, constructorArgs);
            component           = new factoryFunction();

            this._MVCComponents[componentName] = component;

            return component;
        },

        setComponent : function(componentName, component) {
            this._MVCComponents[componentName] = component;
        },

        getComponent : function(componentName) {
            return this._MVCComponents[componentName];
        },

        removeComponent : function(componentName) {
            var me      = "{0}::Application::create".fmt(this.getIName());

            if (_.def(this._MVCComponents[componentName])) {
                _l.info(me, "Removing component {0} ...".fmt(componentName));
                delete this._MVCComponents[componentName];
            }
        },

        getStateManager : function() {
            return this._stateManager;
        },

        getService : function(name) {
            var me      = "Application:getService";
            var service = null;

            if (!_.obj(this._services)) {
                _l.error(me, "No services provided, unable to get [{0}]".fmt(name));
                return service;
            }

            return (service = this._services[name]);
        },

        getManager : function(name) {
            var me      = "Application:getManager";
            var manager = null;

            if (!_.obj(this._managers)) {
                _l.error(me, "No managers provided, unable to get [{0}]".fmt(name));
                return manager;
            }

            return (manager = this._managers[name]);
        },

        isMobile : function() {
            return !_.empty(this.__agent().match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/i));
        },

        isiPad : function() {
            return !_.empty(this.__agent().match(/iPad/i));
        },

        isiOS : function() {
            return !_.empty(this.__agent().match(/(iPhone|iPod|iPad)/i));
        },

        isAndroid : function() {
            return !_.empty(this.__agent().match(/(Android)/i));
        },

        isAndroidTablet : function() {
            return this.isAndroid() && (!('mobile' in this.__agent()));
        },


        /**
         *
         * @Deprecated
         *
         * @returns {boolean}
         */
        isFirefoxOS : function() {
            return !_.empty(this.__agent().match(/(Mozilla.*Mobile)/));
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::Application::_setup".fmt(this.getIName());
            var success = false;

            if (_.interfaceAdheres(this._stateManager, NS.Application.REQUIRED_STATE_MANAGER_API)) {
                success = true;
            } else {
                _l.error(me, "Statemanager does not adhere to required interface");
                _l.info(me, "Statemanager must adhere to following interface definition",
                        _.stringify(NS.Application.REQUIRED_STATE_MANAGER_API));
            }

            return success;
        },

        /*********************************************************************
         *
         * PRIVATE METHODS
         *
         *********************************************************************/

        __agent : function() {
            return (navigator.userAgent || navigator.vendor || window.opera || "").toLowerCase();
        }

    });
})();
