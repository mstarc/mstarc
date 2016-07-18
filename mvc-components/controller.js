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

        $statics : {
            REQUIRED_STATE_MANAGER_API : {
                methods : ['sendEvent']
            }
        },

        _stateManager   : null,

        _view           : null,
        _model          : null,

        /**
         *
         * An abstract Controller class. A controller:
         *  - gets notified by a model of new data and data changes
         *  - provides model data to the view in a form the view is capable of rendering
         *  - gets notified of user input by the view
         *  - based on user input from the view can notify a stateManager and provide new data or data changes back
         *    to the model
         *
         * Although a controller connects in principle to only one model, it can register to multiple model.
         * This allows a controller to listen to specific details of secondary models such the same data doesn't
         * have to be presented by multiple models. However, the controller only communicates back to the controller
         * it is connected to.
         *
         * A controller can only be connected to one view.
         *
         * IMPORTANT :
         *
         * * When a view is connected to a controller and it is not rendered, the controller will call
         *   render() on the view
         *
         * DON'T FORGET:
         *
         * * When the component is ready to process events you need to call this._readyToProcessEvents()
         * in your subclass
         *
         *
         * Methods you optionally can override in subclasses :
         *
         *  - _setup()                              Sets up the controller using the given state managers and
         *                                          configuration properties.  This is also the place where you
         *                                          validate your state manager and configuration properties.
         *
         *                                          Returns true on success else false
         *
         *                                          This method is called during construction.
         *
         *
         * @class           Controller
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
        constructor: function(controllerName, stateManager, config) {
            var me = "Controller::constructor";
            NS.Controller.$super.call(this, controllerName, config);

            this._stateManager = stateManager;

            this._valid = true;
            if (!this._setup()) {
                _l.error(me, "Controller setup failed, controller wil not function properly");
                this._valid = false;
            }
        },

        allowedToRegister : function(component) {
            var me              = "{0}::Controller::allowedToRegister".fmt(this.getIName());
            var allowed         = false;

            var componentName   = _.exec(component, "getIName") || "[UNKNOWN]";

            if (_.exec(component, 'isView', componentName) === true) {
                if (this._countRegisteredOfType("view") < 1) {
                    allowed = true;
                } else {
                    _l.debug(me, ("View component {0} is not allowed to register " +
                                  "because a view has already been registered").fmt(componentName));
                }

                return allowed;
            }

            if (_.exec(component, 'isModel', componentName) === true) {
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
        },

        showUI : function(show, readyCb) {
            this._dispatchToView(
                    "wantToShowUI",
                    show,
                    readyCb);
        },

        /**
         * @override
         * @param component
         */
        connect : function(component) {
            var me = this;
            var connected = NS.Controller.$superp.connect.call(this, component);

            if(!connected || !_.hasMethod(component, 'getSubComponents')) {
                _l.error(me, "Could not connect subcomponents.");
                return false;
            }

            var ownSubComponents = this.getSubComponents();
            var otherSubComponents = component.getSubComponents();

            for(var name in ownSubComponents) {
                var other = otherSubComponents[name];
                if(!_.hasMethod(other, 'connect')) {
                    _l.error(me, "Could not connect subcomponent '{0}'.".fmt(name));
                    return false;
                }

                // Connect subcomponent to other component's subcomponent with same name
                if(!ownSubComponents[name].connect(other)) {
                    return false;
                }
            }

            return true; // success
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::Controller::_setup".fmt(this.getIName());
            var success = false;

            if (_.interfaceAdheres(this._stateManager, NS.Controller.REQUIRED_STATE_MANAGER_API)) {
                success = true;
            } else {
                _l.error(me, "Statemanager does not adhere to required interface");
                _l.info(me, "Statemanager must adhere to following interface definition",
                        _.stringify(NS.Controller.REQUIRED_STATE_MANAGER_API));
            }

            return success;
        },

        _didRegister : function(processorName, processor) {
            if (_.exec(processor, 'isModel', processorName) === true) {
                this._model = processor;
            } else if (_.exec(processor, 'isView', processorName) === true) {
                this._view = processor;

                if (!this._view.isRendered()) {
                    this._view.render();
                }
            }
        },

        /**
         *
         * @param eventName
         * @param [eventData]
         * @param [eventProcessedCb]                function(result, err)
         * @param {boolean} [throttle = false]      dispatch will be throttled if true
         * @param {number} [throttleDelay]          Optional custom throttleDelay, relevant when throttled = true
         * @returns {boolean}
         *
         * @protected
         */
        _dispatchToModel : function(eventName, eventData, eventProcessedCb, throttle, throttleDelay) {
            var success = false;
            var self    = this;

            if (!_.bool(throttle)) {
                throttle = false;
            }

            var m = this._model;
            if (!throttle) {
                success = this._dispatchEvent(m, eventName, eventData, eventProcessedCb);
            } else {
                success = this._scheduleEventDispatch(
                        m,
                        eventName,
                        eventData,
                        eventProcessedCb,
                        function() {
                            var me = "{0}::Controller::_dispatchToModel".fmt(this.getIName());
                            _l.info(me, "Processing of [{0}] by model was cancelled, doing nothing".fmt(eventName));
                        },
                        throttleDelay);
            }

            return success;
        },

        /**
         *
         * @param eventName
         * @param [eventData]
         * @param [eventProcessedCb]                function(result, err)
         * @param {boolean} [throttle = false]      dispatch will be throttled if true
         * @param {number} [throttleDelay]          Optional custom throttleDelay, relevant when throttled = true
         * @returns {boolean}
         *
         * @protected
         */
        _dispatchToView : function(eventName, eventData, eventProcessedCb, throttle, throttleDelay) {
            var success = false;

            if (!_.bool(throttle)) {
                throttle = false;
            }

            var v = this._view;
            if (!throttle) {
                success = this._dispatchEvent(v, eventName, eventData, eventProcessedCb);
            } else {
                success = this._scheduleEventDispatch(
                        v,
                        eventName,
                        eventData,
                        eventProcessedCb,
                        function() {
                            var me = "{0}::Controller::_dispatchToView".fmt(this.getIName());
                            _l.info(me, "Processing of [{0}] by view was cancelled, doing nothing".fmt(eventName));
                        },
                        throttleDelay);
            }

            return success;
        }
    });
})();
