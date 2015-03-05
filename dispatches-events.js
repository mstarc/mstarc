/**
 * Created by Freddy Snijder on 20/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;
    var Class       = window.jsface.Class;

    NS.DispatchesEvents = Class({

        _processors          : null,
        _processorsIndex     : null,

        /**
         *
         * To handle event dispatch throttling
         *
         * @property _throttleTimers
         * @protected
         *
         */
        _throttleTimers     : null,

        /**
         *
         * DispatchesEvents Mixin.
         * Adds functionality to register processor objects to an instance and allow this instance to dispatch events to
         * the processors for processing.
         *
         *
         *
         * Dispatching events works by calling _dispatch(eventName, eventData, eventProcessedCb).
         * The eventProcessedCb has signature:
         *
         *  function(processor, err), with
         *      processor that is ready processing and
         *      err an object if an error occurred processing the event dispatched
         *
         *
         *
         * To receive and process dispatched events, processors must implement the following method
         *
         *  processEvent : function(eventDispatcher, data, eventProcessedCb) { ... }
         *  The eventDispatcher is the instance using this mixin
         *  The eventProcessedCb has signature:
         *
         *      function(err), with
         *          err an object if an error occurred
         *
         *  The processEvent method must return true if **initiation** of processing was successful, else false.
         *
         *
         *
         * A processor is registered through register(processorName, processor)
         *
         *
         *
         * Methods to override:
         *
         *  * allowedToRegister(processorName, processor)     To control who is allowed to be registered
         *  * _didRegister(processorName, processor)          To act on the registration of a processor
         *
         *
         * This method returns true by default
         *
         *
         * @module  M*C
         * @class   DispatchesEvents
         *
         */

        /**
         *
         * Register processor with name listerName
         *
         * @method register
         *
         * @param {string} processorName
         * @param {object} processor
         *
         * @returns {boolean}               True on success, else false
         *
         */
        register : function(processorName, processor) {
            var instanceName = _.exec(this, 'getIName') || '[UNKOWN]';
            var me = "[{0}]::DispatchesEvents::register".fmt(instanceName);
            var success = false;

            this._processors        = this._processors || {};
            this._processorsIndex   = this._processorsIndex || {};

            if (!_.string(processorName)) {
                _l.error(me, "No processor name given, unable to register");
                return success;
            }

            if (!_.obj(processor)) {
                _l.error(me, "No valid {0} processor given, unable to register".fmt(processorName));
                return success;
            }

            if (_.def(this._processors[processorName])) {
                _l.error(me, "A processor with name [{0}] already registered, unable to register".fmt(processorName));
                return success;
            }

            if (!this.allowedToRegister(processor)) {
                _l.error(me, "It is not allowed to register processor [{0}], unable to register".fmt(processorName));
                return success;
            }

            _l.info(me, "Registering [{0}]".fmt(processorName));

            this._processors[processorName] = processor;
            this._processorsIndex[processor] = processorName;

            this._didRegister(processorName, processor);

            return (success = true);
        },

        /**
         *
         * Deregisters the given <processor> object
         *
         * @method deregister
         *
         * @param {object} processor
         *
         * @returns {boolean}
         *
         */
        deregister : function(processor) {
            var instanceName = _.call(this, 'getIName') || '[UNKOWN]';
            var me = "[{0}]::DispatchesEvents::deregister".fmt(instanceName);
            var success = false;

            this._processors        = this._processors || {};
            this._processorsIndex   = this._processorsIndex || {};

            if (!_.obj(processor)) {
                _l.error(me, "No processor instance given, unable to deregister");
                return success;
            }

            var processorName = this._processorsIndex[processor];
            if (!_.def(processorName)) {
                _l.error(me, "Object not found as a registered processor, unable to deregister");
                return success;
            }

            _l.info(me, "Deregistering [{0}]".fmt(processorName));

            success = true;
            delete this._processors[processorName];

            return success;
        },

        allowedToRegister : function(processor) {
            return true;
        },

        destroy : function() {
            this._processors        = null;
            this._processorsIndex   = null;
        },

        /***************************************************
         *
         * PROTECTED METHODS
         *
         **************************************************/

        /**
         *
         * Dispatches event <eventName> to registered processors with <eventData> for processing.
         * When a processor is ready processing <cbEventProcessed> callback is called
         *
         * Also see DispatchesEvents constructor for more info.
         *
         * @method _dispatch
         *
         * @param {string} eventName                Event name string
         * @param {object} eventData                Event data object
         * @param {function} [cbEventProcessed]     Optional callback called for each processor that
         *                                          finished processing. Callback signature:
         *
         *                                          function(processor, err)
         *
         *                                          <processor> is the processor that finished processing the
         *                                          dispatched event
         *
         *                                          <err> is an error object when processing the event resulted in
         *                                          an error
         *
         * @protected
         *
         */
        _dispatch : function(eventName, eventData, cbEventProcessed) {
            //var me      = "[{0}]::DispatchesEvents::_dispatch".fmt(_.call(this, 'getIName') || '[UNKOWN]');
            var self    = this;

            this._processors = this._processors || {};

            cbEventProcessed = _.ensureFunc(cbEventProcessed);

            var __doDispatch = function(processor) {
                self._dispatchEvent(processor, eventName, eventData, function(err) {
                    cbEventProcessed(processor, err);
                });
            };

            for (var processor in this._processors) {
                if (_.obj(processor)) { __doDispatch(processor); }
            }
        },

        /**
         *
         * Using throttling, dispatch event to registered processors.
         *
         * If a new event dispatch is scheduled for event <eventName>, before the <throttleDelay> period of a previously
         * scheduled dispatch for the same event type has passed, the previously scheduled dispatch is canceled
         * and the new dispatch is scheduled.
         *
         * If no new dispatch request is made for the same event type with the given <throttleDelay> the
         * dispatch is performed
         *
         * Also see DispatchesEvents constructor for more info.
         *
         * @method _dispatchThrottled
         *
         * @param {string} eventName                Event name string
         * @param {object} eventData                Event data object
         * @param {function} [cbEventProcessed]     See _dispatch method
         * @param {number} [throttleDelay]          Delay in milliseconds, see _scheduleEventDispatch for default value
         *
         * @protected
         *
         */
        _dispatchThrottled : function(eventName, eventData, cbEventProcessed, throttleDelay) {
            //var me      = "[{0}]::DispatchesEvents::_dispatchThrottled".fmt(_.call(this, 'getIName') || '[UNKOWN]');

            this._processors = this._processors || {};

            for (var processor in this._processors) {
                if (_.obj(processor)) {
                    this._scheduleEventDispatch(processor, eventName, eventData, cbEventProcessed, throttleDelay);
                }
            }
        },

        /**
         *
         * Dispatches event to processor
         *
         * @method _dispatchEvent
         *
         * @param {object} processor                instance that can process events
         * @param {string} eventName                Event name string
         * @param {object} eventData                Event data object
         * @param {function} [eventProcessedCb]     Optional callback when the processor is ready processing the event
         *                                          Callback signature:
         *
         *                                          function(err)
         *
         *                                          <err> is an error object when the processing resulted in error
         *
         *
         * @returns {boolean}           True on success, else false
         *
         * @protected
         */

        _dispatchEvent : function(processor, eventName, eventData, eventProcessedCb) {
            var success = false;

            this._processorsIndex   = this._processorsIndex || {};

            if (!_.hasMethod(processor, 'processEvent')) {
                var iName           = _.call(this, 'getIName') || "[UNKOWN]";
                var me              = "{0}::DispatchesEvents::_dispatchEvent".fmt(iName);
                var processorName   = this._processorsIndex[processor] || "[UNKNOWN]";

                _l.error(me, "Processor {0} has no processEvent method, unable to dispatch event".fmt(processorName));
                return success;
            }

            return (success = processor.processEvent(this, eventName, eventData, eventProcessedCb));
        },

        /**
         *
         * See _dispatchThrottled for explanation about throttle mechanism
         *
         * @param processor
         * @param eventName
         * @param eventData
         * @param eventProcessedCb
         * @param [throttleDelay=300]
         *
         * @return {boolean} success
         *
         * @protected
         */
        _scheduleEventDispatch : function(processor, eventName, eventData, eventProcessedCb, throttleDelay) {
            var success             = false;
            var self                = this;

            this._processorsIndex   = this._processorsIndex || {};
            this._throttleTimers    = this._throttleTimers || {};

            if ((!_.number(throttleDelay)) || (throttleDelay < 0)) {
                throttleDelay = 300;
            }

            if (!_.hasMethod(processor, 'processEvent')) {
                var iName           = _.call(this, 'getIName') || "[UNKOWN]";
                var me              = "{0}::DispatchesEvents::_scheduleEventDispatch".fmt(iName);
                var processorName   = this._processorsIndex[processor] || "[UNKNOWN]";

                _l.error(me, "Processor {0} has no processEvent method, unable to dispatch event".fmt(processorName));
                return success;
            }

            var timer = this._throttleTimers[eventName];
            if (_.def(timer)) {
                clearTimeout(timer);
                this._throttleTimers[eventName] = null;
            }

            this._throttleTimers[eventName] = setTimeout(function() {
                self._throttleTimers[eventName] = null;

                if (!processor.processEvent(self, eventName, eventData, eventProcessedCb)) {

                    var processorName  = self._processorsIndex[processor] || "[UNKNOWN]";

                    eventProcessedCb({
                        message : "Unable to initiate processing of event {0} at processor {1}"
                                  .fmt(eventName, processorName)
                    });

                }
            }, throttleDelay);

            return (success = true);
        },

        _didRegister : function(processorName, processor) {}

    });
})();

