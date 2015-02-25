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

        _controller : null,

        /**
         *
         * An abstract View class:
         *  - rendering the data it gets from the model, through the controller,
         *  - providing back information about new data, data changes and other input actions to the controller
         *
         * The controller ensures that the model data is provided to the view in a way that the view able to render.
         *
         *
         * DON'T FORGET:
         *
         * * When the component is ready to process events you need to call this._readyToProcessEvents()
         * in your subclass
         *
         *
         * Methods you need to override in subclasses :
         *
         *  - _setup()                          Sets up the view using the given configuration properties.
         *                                      This is also the place where you validate configuration properties.
         *
         *                                      Returns true on success else false
         *
         *                                      This method is called during construction.
         *
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

            this._valid = true;
            if (!this._setup()) {
                _l.error(me, "Controller setup failed, controller wil not function properly");
                this._valid = false;
            }
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
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/
        _setup : function() {
            var me      = "{0}::Controller::_setup".fmt(this.getIName());
            var success = false;

            _l.error(me, "No implementation given, don't know how to setup this view");
            _l.info(me, "If you don't need to do any set up, just override this method by simply returning true");
            return success;
        },

        _didRegister : function(processorName, processor) {
            if (_.call(processor, 'isController', processorName) === true) {
                this._controller = processor;
            }
        },

        /**
         *
         * @param eventName
         * @param eventData
         * @param [eventProcessedCb]
         * @param {boolean} [throttle = false]      dispatch will be throttled if true
         * @param {number} [throttleDelay]          Optional custom throttleDelay, relevant when throttled = true
         * @returns {boolean}
         *
         * @protected
         */
        _dispatchToController : function(eventName, eventData, eventProcessedCb, throttle, throttleDelay) {
            var success = false;

            if (!_.bool(throttle)) {
                throttle = false;
            }

            var c = this._controller;
            if (!throttle) {
                success = this._dispatchEvent(c, eventName, eventData, eventProcessedCb);
            } else {
                success = this._scheduleEventDispatch(c, eventName, eventData, eventProcessedCb, throttleDelay);
            }

            return success;
        }
    });
})();
