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
        _didRender  : false,

        /**
         *
         * An abstract View class:
         *  - rendering the data it gets from the model, through the controller,
         *  - providing back information about new data, data changes and other input actions to the controller
         *
         * The controller ensures that the model data is provided to the view in a way that the view able to render.
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
         *  - _render                           Implements the actual rendering of the view.
         *
         *                                      This method is called by the public render method
         *
         * Methods you can OPTIONALLY override in subclasses :
         *
         *  - _onRendered                       Called after the view is rendered
         *
         *
         *  NOTE:
         *
         *  _readyToProcessEvents() is called by _onViewRendered() which must be called when rendering successfully
         *  completed. _onViewRendered() subsequently calls _onRendered, which must be overridden in you subclass.
         *
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
            NS.View.$super.call(this, viewName, config);

            this._valid = true;
            if (!this._setup()) {
                _l.error(me, "Controller setup failed, controller wil not function properly");
                this._valid = false;
            }
        },

        /**
         *
         * Renders view.
         * This method can only be called once unless forceRerender is set to true.
         *
         * @param {boolean} [forceRerender=false]   When true, forces rerendering even if the view was already rendered.
         *
         * @returns {boolean}                       True if initiation of rendering was successful else false
         *
         */
        render : function(forceRerender) {
            var me = "{0}::View::render".fmt(this.getIName());
            var success = false;

            if (!_.bool(forceRerender)) {
                forceRerender = false;
            }

            if (!this.isValid()) {
                _l.error(me, "View not valid, unable to render");
                return success
            }

            if ((!this.isRendered()) || forceRerender) {
                this._didRender = false;
                success = this._render();
            } else {
                _l.warn(me, "View already rendered, not re-rendering view");
            }

            return success;
        },

        isRendered : function() {
            return this._didRender;
        },

        allowedToRegister : function(component) {
            var me              = "{0}::View::allowedToRegister".fmt(this.getIName());
            var allowed         = false;

            var componentName   = _.exec(component, "getIName") || "[UNKNOWN]";

            if (_.exec(component, 'isController', componentName) === true) {
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
            var me      = "{0}::View::_setup".fmt(this.getIName());
            var success = false;

            _l.error(me, "No implementation given, don't know how to setup this view");
            _l.info(me, "If you don't need to do any set up, just override this method by simply returning true");
            return success;
        },

        _didRegister : function(processorName, processor) {
            if (_.exec(processor, 'isController', processorName) === true) {
                this._controller = processor;
            }
        },

        /**
         *
         * Actual view rendering implementation that needs to be implemented by subview.
         *
         * @returns {boolean} True is initiation of rendering was successful
         *
         * @protected
         */
        _render : function() {
            var me = "{0}::View::_render".fmt(this.getIName());
            _l.error(me, "No implementation, unable to render view");
            _l.info(me, "Implement this method in your subclass in order to render the view");

            return false;
        },

        _onViewRendered : function() {
            var me = "{0}::View::_onViewRendered".fmt(this.getIName());
            _l.debug(me, "View rendered");

            this._didRender = true;

            this._readyToProcessEvents();

            this._onRendered();
        },

        _onRendered : function() {
            var me = "{0}::View::_onRendered".fmt(this.getIName());
            _l.debug(me, "Not implemented, nothing to do");
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
                success = this._scheduleEventDispatch(
                        c,
                        eventName,
                        eventData,
                        eventProcessedCb,
                        function() {
                            var me = "{0}::View::_dispatchToController".fmt(this.getIName());
                            _l.info(me, "Processing of [{0}] by controller was cancelled, doing nothing".fmt(eventName));
                        },
                        throttleDelay);
            }

            return success;
        }
    });
})();
