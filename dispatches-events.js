/**
 * Created by Freddy Snijder on 20/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;
    var Class       = window.jsface.Class;

    var DataMap     = NS.DataMap;

    NS.DispatchesEvents = Class({

        _processors          : null,
        _processorsIndex     : null,

        /**
         *
         * To handle event dispatch throttling
         *
         * @property {object} _throttleTimers   Structure is as follows:
         *
         * {
         *      <processor instance i> : {
         *                                  <event x> : <throttleTimer object>,
         *
         *                                  ...
         *
         *                                  <event y> : <throttleTimer object>
         *                               }
         *
         *     ...
         *
         *      <processor instance j> : {
         *                                  <event x> : <throttleTimer object>,
         *
         *                                  ...
         *
         *                                  <event y> : <throttleTimer object>
         *                               }
         *
         * }
         *
         *
         * Each throttleTimer object contains:
         * {
         *     timer         : <the timer>,
         *     cancelledCb   : <callback called when cancelled>
         * }
         *
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
            this._processorsIndex   = this._processorsIndex || (new DataMap());

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
            this._processorsIndex.set(processor,  processorName);

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
            var instanceName = _.exec(this, 'getIName') || '[UNKOWN]';
            var me = "[{0}]::DispatchesEvents::deregister".fmt(instanceName);
            var success = false;

            this._processors        = this._processors || {};
            this._processorsIndex   = this._processorsIndex || (new DataMap());

            if (!_.obj(processor)) {
                _l.error(me, "No processor instance given, unable to deregister");
                return success;
            }

            var processorName = this._processorsIndex.get(processor);
            if (!_.def(processorName)) {
                _l.error(me, "Object not found as a registered processor, unable to deregister");
                return success;
            }

            _l.info(me, "Deregistering [{0}]".fmt(processorName));

            success = true;
            delete this._processors[processorName];

            return success;
        },

        numberOfProcessorsRegistered : function() {
            return (Object.getOwnPropertyNames(this._processors || {})).length;
        },

        /**
         *
         * @returns {object}    Returns hash with registered processors :
         *
         * {
         *
         *  <processor name1> : <processor instance1>,
         *
         *  ...
         *
         *  <processor nameN> : <processor instanceN>
         *
         * }
         *
         */
        getRegisteredProcessors : function() {
            return _.clone(this._processors);
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
         * @param {object} [excludedProcessor]      Optionally you can exclude a processor from receiving the event
         *
         * @returns {boolean}                       True when dispatch was initiated successfully else false
         *
         * @protected
         *
         */
        _dispatch : function(eventName, eventData, cbEventProcessed, excludedProcessor) {
            //var me      = "[{0}]::DispatchesEvents::_dispatch".fmt(_.exec(this, 'getIName') || '[UNKOWN]');
            var self    = this;
            var success = true;

            this._processors = this._processors || {};

            cbEventProcessed = _.ensureFunc(cbEventProcessed);

            var __doDispatch = function(processor) {
                return self._dispatchEvent(processor, eventName, eventData, function(err) {
                    cbEventProcessed(processor, err);
                });
            };

            var processor = null;
            for (var processorName in this._processors) {
                processor = this._processors[processorName];
                if (processor === excludedProcessor) {
                    cbEventProcessed(processor);
                    continue;
                }

                if (_.obj(processor)) { success = __doDispatch(processor) && success; }
            }

            return success;
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
         * @param {function} [cbEventProcessed]     Optional callback called for each processor that
         *                                          finished processing or for which processing was cancelled.
         *                                          Callback signature:
         *
         *                                          function(processor, cancelled, err)
         *
         *                                          <processor> is the processor that finished processing the
         *                                          dispatched event, or for which processing was cancelled
         *
         *                                          <cancelled> boolean, if true, processing was cancelled, else
         *                                          false
         *
         *                                          <err> is an error object when processing the event resulted in
         *                                          an error
         *
         * @param {object} [excludedProcessor]      Optionally you can exclude a processor from receiving the event
         *
         * @param {number} [throttleDelay]          Delay in milliseconds, see _scheduleEventDispatch for default value
         *
         * @protected
         *
         */
        _dispatchThrottled : function(eventName, eventData, cbEventProcessed, throttleDelay, excludedProcessor) {
            //var me      = "[{0}]::DispatchesEvents::_dispatchThrottled".fmt(_.exec(this, 'getIName') || '[UNKOWN]');
            var success   = true;

            this._processors = this._processors || {};

            cbEventProcessed = _.ensureFunc(cbEventProcessed);

            var processor = null;
            for (var processorName in this._processors) {
                processor = this._processors[processorName];
                if (processor === excludedProcessor) {
                    cbEventProcessed(processor);
                    continue;
                }

                if (_.obj(processor)) {
                    success = this._scheduleEventDispatch(
                            processor,
                            eventName,
                            eventData,
                            function(err) {
                                cbEventProcessed(processor, false, err);
                            },
                            function() {
                                cbEventProcessed(processor, true);
                            },
                            throttleDelay) && success;
                }
            }

            return success;
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

            this._processorsIndex   = this._processorsIndex || (new DataMap());

            if (!_.hasMethod(processor, 'processEvent')) {
                var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
                var me              = "{0}::DispatchesEvents::_dispatchEvent".fmt(iName);
                var processorName   = this._processorsIndex.get(processor) || "[UNKNOWN]";

                _l.error(me, "Processor {0} has no processEvent method, unable to dispatch event".fmt(processorName));
                return success;
            }

            return (success = processor.processEvent(this, eventName, eventData, eventProcessedCb));
        },

        /**
         *
         * See _dispatchThrottled for explanation about throttle mechanism
         *
         * @param {object} processor
         * @param {string} eventName
         * @param {*} eventData
         * @param {function} [eventProcessedCb]      function(err)
         * @param {function} [cancelledCb]           function() Called for the given processor
         *                                           when scheduled event processing was cancelled
         * @param [throttleDelay=300]
         *
         * @return {boolean} success
         *
         * @protected
         *
         */
        _scheduleEventDispatch : function(processor, eventName, eventData, eventProcessedCb, cancelledCb, throttleDelay) {
            var success             = false;
            var self                = this;

            this._processorsIndex  = this._processorsIndex || (new DataMap());
            this._throttleTimers   = this._throttleTimers || (new DataMap());

            if ((!_.number(throttleDelay)) || (throttleDelay < 0)) {
                throttleDelay = 300;
            }

            if (!_.hasMethod(processor, 'processEvent')) {
                var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
                var me              = "{0}::DispatchesEvents::_scheduleEventDispatch".fmt(iName);
                var processorName   = this._processorsIndex.get(processor) || "[UNKNOWN]";

                _l.error(me, "Processor {0} has no processEvent method, unable to dispatch event".fmt(processorName));
                return success;
            }

            this._throttleTimers.set(processor, this._throttleTimers.get(processor) || {});

            var timerInfo   = this._throttleTimers.get(processor)[eventName];
            var timer       = _.get(timerInfo, 'timer');
            if (_.def(timer)) {
                clearTimeout(timer);

                //Call cancelledCb if provided
                _.ensureFunc(timerInfo.cancelledCb)();

                this._throttleTimers.get(processor)[eventName]  = null;
                timerInfo                                       = null;
            }

            this._throttleTimers.get(processor)[eventName] = {

                cancelledCb : cancelledCb,

                timer       : setTimeout(function() {
                    self._throttleTimers.get(processor)[eventName] = null;

                    if (!processor.processEvent(self, eventName, eventData, eventProcessedCb)) {

                        var processorName  = self._processorsIndex.get(processor) || "[UNKNOWN]";

                        eventProcessedCb({
                            message : "Unable to initiate processing of event {0} at processor {1}"
                                    .fmt(eventName, processorName)
                        });

                    }
                }, throttleDelay)
            };

            return (success = true);
        },

        _didRegister : function(processorName, processor) {}

    });
})();