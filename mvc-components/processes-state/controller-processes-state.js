/**
 * Created by Freddy on 11/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;

    var Class       = window.jsface.Class;

    NS.ControllerProcessesState = Class({

        /**
         *
         * ControllerProcessesState Mixin for Controller classes. Adds functionality to process state in a
         * standardized way.
         *
         * This mixin provides functionality to process the following model events
         *
         *  - dataStateUpdated
         *  - globalSyncStateUpdated
         *  - globalErrorStateUpdated
         *  - errorStateUpdated
         *  - globalValidityStateUpdated
         *  - validityStateUpdated
         *
         * By default, the event and data is forwarded to the connected view.
         * However, the class using this mixin can define custom methods to:
         *
         * A) Transform the event value, when required.  The value needs to be returned such that it
         *    can be forwarded to the view.
         * B) Send messages to the state manager, when required.
         * C) Evaluate if the the event (with (transformed) value) must be forwarded or not
         *
         * The default processing methods will try to call one of the following custom methods, depending on which
         * event they process:
         *
         * - _processDataState(model, property, value);
         *
         * - _processGlobalSyncState(model, value);
         *   value : <new global sync state value>
         *
         * - _processGlobalErrorState(model, value);
         *   value : <new global sync state value>
         *
         * - _processErrorState(model, property, value);
         * - _processGlobalValidityState(model, value);
         *
         * - _processValidityState(model, property, value);
         *
         * IMPORTANT : These custom methods must return the following object :
         * {
         *      success : <boolean, true when processing was successful, else false>,
         *      value   : <*, the input value, optionally transformed>,
         *      forward : <boolean, true when the event with value needs to be forwarded to the view, else false>
         * }
         *
         * @class   ControllerProcessesState
         * @module  M*C
         *
         * @for     Controller
         *
         */

        dataStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processDataState",
                    "dataStateUpdated",
                    false,
                    arguments);
        },

        globalSyncStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalSyncState",
                    "globalSyncStateUpdated",
                    true,
                    arguments);
        },

        globalErrorStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalErrorState",
                    "globalErrorStateUpdated",
                    true,
                    arguments);
        },


        errorStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalErrorState",
                    "globalErrorStateUpdated",
                    false,
                    arguments);
        },

        globalValidityStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalValidityState",
                    "globalValidityStateUpdated",
                    true,
                    arguments);
        },

        validityStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processValidityState",
                    "validityStateUpdated",
                    false,
                    arguments);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _processModelEvent : function(customProcessMethodName, eventName, isGlobal, processingArguments) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ControllerProcessesState::_processModelEvent({1})"
                                  .fmt(iName, eventName);

            //unpack arguments
            processingArguments = processingArguments || [];
            var model           = processingArguments[0];
            var data            = processingArguments[1];
            var eventProcessedCb= processingArguments[2];

            var callbackGiven   = _.func(eventProcessedCb);

            var __returnError   = function(errStr) {
                callbackGiven ? eventProcessedCb({ message : errStr }) :  _l.error(me, errStr);
            };

            if (_.exec(this, "isValid") === false) {
                __returnError("Controller is invalid, unable to process {0} event".fmt(eventName));
                return;
            }

            var dataDesc        = 'Data of {0} event'.fmt(eventName);
            var property        = isGlobal ? null : _.get(data, 'what', dataDesc);
            var value           = isGlobal ? data : _.get(data, 'data', dataDesc);

            //Default behavior is to forward the event and value
            var forward         = true;

            if (!isGlobal && (!_.string(property) || _.empty(property))) {
                __returnError("No valid data property provided, unable to process {0} event".fmt(eventName));
                return;
            }

            var customFunc = this[customProcessMethodName];
            if (_.func(customFunc)) {
                var result = isGlobal ? customFunc.call(this, model, value) :
                                           customFunc.call(this, model, property, value);
                if (!_.obj(result)) {
                    __returnError(("{0} did not return an object with results, " +
                                   "unable to process {1} event").fmt(customProcessMethodName, eventName));
                    return;
                }

                if (result.success !== true) {
                    __returnError("Custom processing of the {0} event was not successful".fmt(eventName));
                    return;
                }

                value   = result.value;
                forward = _.bool(result.forward) ? result.forward : forward;
            }

            //Forward
            if (forward) {
                var eventData = isGlobal ? value : { what : property, data : value };
                this._dispatchToView(eventName, eventData, eventProcessedCb);
            } else {
                eventProcessedCb();
            }
        }

    });
})();