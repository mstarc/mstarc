/**
 * Created by Freddy on 11/03/15.
 */

/**
 * Created by Freddy on 11/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;

    var Class       = window.jsface.Class;

    NS.ReactViewProcessesState = Class({

        /**
         *
         * ReactViewProcessesState Mixin for ReactView classes. Adds functionality to process state in a
         * standardized way.
         *
         * This mixin provides functionality to process the following controller events
         *
         *  - dataStateUpdated
         *  - globalSyncStateUpdated
         *  - globalErrorStateUpdated
         *  - errorStateUpdated
         *  - globalValidityStateUpdated
         *  - validityStateUpdated
         *
         * By default, the particular state data provided by the event is set in the react view state.
         * Subsequently the React UI element is asked to rerender.
         *
         * @class   ReactViewProcessesState
         * @module  M*C
         *
         * @for     ReactView
         *
         */

        dataStateUpdated : function(controller, data, eventProcessedCb) {
            this._processControllerEvent(
                    "dataStateUpdated",
                    false,
                    arguments);
        },

        globalSyncStateUpdated : function(model, data, eventProcessedCb) {
            this._processControllerEvent(
                    "globalSyncStateUpdated",
                    true,
                    arguments);
        },

        globalErrorStateUpdated : function(model, data, eventProcessedCb) {
            this._processControllerEvent(
                    "globalErrorStateUpdated",
                    true,
                    arguments);
        },


        errorStateUpdated : function(model, data, eventProcessedCb) {
            this._processControllerEvent(
                    "globalErrorStateUpdated",
                    false,
                    arguments);
        },

        globalValidityStateUpdated : function(model, data, eventProcessedCb) {
            this._processControllerEvent(
                    "globalValidityStateUpdated",
                    true,
                    arguments);
        },

        validityStateUpdated : function(model, data, eventProcessedCb) {
            this._processControllerEvent(
                    "validityStateUpdated",
                    false,
                    arguments);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _processControllerEvent : function(eventName, isGlobal, processingArguments) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ReactViewProcessesState::_processControllerEvent({1})".fmt(iName, eventName);

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
                __returnError("ReactView is invalid, unable to process {0} event".fmt(eventName));
                return;
            }

            if (!this.isRendered()) {
                __returnError("View is not rendered, unable to process {0} event".fmt(eventName));
                return;
            }

            var dataDesc        = 'Data of {0} event'.fmt(eventName);
            var property        = isGlobal ? null : _.get(data, 'what', dataDesc);
            var value           = isGlobal ? data : _.get(data, 'data', dataDesc);

            if (!isGlobal && (!_.string(property) || _.empty(property))) {
                __returnError("No valid data property provided, unable to process {0} event".fmt(eventName));
                return;
            }

            switch(eventName) {
                case "dataStateUpdated":
                    this._state.data[property]      = value;
                    break;
                case "globalValidityStateUpdated":
                    this._state.globalValidity      = value;
                    break;
                case "validityStateUpdated":
                    this._state.validity[property]  = value;
                    break;
                case "globalErrorStateUpdated":
                    this._state.globalError         = value;
                    break;
                case "errorStateUpdated":
                    this._state.error[property]     = value;
                    break;
                case "globalSyncStateUpdated":
                    this._state.globalSyncing       = value;
                    break;
                default:
                    __returnError("UNEXPECTED : Unknown event {0}, unable to process event".fmt(eventName));
                    return;
            }

            this._renderState();
            if (callbackGiven) { eventProcessedCb(); }
        }

    });
})();