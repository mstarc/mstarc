/**
 * Created by Freddy on 11/03/15.
 */

/**
 * Created by Freddy on 11/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS              = window.__VI__ || window;

    var _               = NS.utils;
    var _l              = NS.logger;

    var Class           = window.jsface.Class;

    var SyncState       = NS.SyncState;

    NS.ViewProcessesState = Class({

        $statics : {
            REQUIRED_VIEW_API : {
                methods : ['isValid', 'isRendered', '_renderState', '_dispatchToController']
            }
        },

        _state                      : null,
        _stateProcessingInitialized : false,

        /**
         *
         * ViewProcessesState Mixin for View classes. Adds functionality to process, edit and sync state in a
         * standardized way.
         *
         *
         * IMPORTANT : The class that uses this mixin must have a _scheduleRenderState(stateRenderedCb) method
         *             implemented
         *
         *
         * IMPORTANT : Call _initStateProcessing() during construction of your class that uses this mixin
         *
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
         *
         * Further, it adds functionality to allow editing and syncing of data state.
         * When _edit() is called a "wantToEdit" event is send to the connected controller.
         * When _updateToRemote() is called a "wantToUpdateToRemote" event is send to the connected controller.
         * When _updateFromRemote() is called a "wantToUpdateFromRemote" event is send to the connected controller.
         *
         * @class   ViewProcessesState
         * @module  M*C
         *
         * @for     ReactView
         *
         */

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _initStateProcessing : function() {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ViewProcessesState::_initStateProcessing";
            
            if (!_.interfaceAdheres(this, ViewProcessesState.REQUIRED_VIEW_API)) {
                _l.error(me, "Init state processing failed : this view does not adhere to " +
                             "the required interface for this mixin");
                _.info(me, "Required view interface : ", _.stringify(ViewProcessesState.REQUIRED_VIEW_API));
                return this._stateProcessingInitialized;
            }
            
            this._state     = {
                //The actual state property values
                data            : {},

                globalSyncing   : SyncState.UNKNOWN,
                syncing         : {},

                globalError     : null,
                error           : {},

                globalValidity  : null,
                validity        : {}
            };

            return (this._stateProcessingInitialized = true);
        },


        /**
         *
         * @param property
         * @param newValue
         * @param editProcessedCb function(result, err)
         *
         * @protected
         *
         */
        _edit : function(property, newValue, editProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ViewProcessesState::_edit".fmt(iName);

            var callbackGiven   = _.func(editProcessedCb);

            var __returnError   = function(errStr) {
                callbackGiven ? editProcessedCb(null, { message : errStr }) :  _l.error(me, errStr);
            };

            if (!this._stateProcessingInitialized) {
                __returnError({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                    "your view-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __returnError("View is invalid, unable to edit property {0}".fmt(property));
                return;
            }

            this._dispatchToController(
                    "wantToEdit",
                    {
                        what : property,
                        data : newValue
                    },
                    editProcessedCb);
        },

        _dataStateUpdated : function(controller, data, eventProcessedCb) {
            var self = this;

            this._processControllerEvent(
                    "dataStateUpdated",
                    false,
                    function(property, value) {
                        self._state.data[property]  = value;

                        if (_.func(self._onDataStateUpdate)) { self._onDataStateUpdate(property, value); }
                    },
                    arguments);
        },

        _globalSyncStateUpdated : function(controller, data, eventProcessedCb) {
            var self = this;

            this._processControllerEvent(
                    "globalSyncStateUpdated",
                    true,
                    function(value) {
                        self._state.globalSyncing = value;

                        if (_.func(self._onGlobalSyncUpdate)) { self._onGlobalSyncUpdate(value); }
                    },
                    arguments);
        },

        _globalErrorStateUpdated : function(controller, data, eventProcessedCb) {
            var self = this;

            this._processControllerEvent(
                    "globalErrorStateUpdated",
                    true,
                    function(value) {
                        self._state.globalError = value;

                        if (_.func(self._onGlobalErrorStateUpdate)) { self._onGlobalErrorStateUpdate(value); }
                    },
                    arguments);
        },


        _errorStateUpdated : function(controller, data, eventProcessedCb) {
            var self = this;

            this._processControllerEvent(
                    "errorStateUpdated",
                    false,
                    function(property, value) {
                        self._state.error[property] = value;

                        if (_.func(self._onErrorStateUpdate)) { self._onErrorStateUpdate(property, value); }
                    },
                    arguments);
        },

        _globalValidityStateUpdated : function(controller, data, eventProcessedCb) {
            var self = this;

            this._processControllerEvent(
                    "globalValidityStateUpdated",
                    true,
                    function(value) {
                        self._state.globalValidity = value;

                        if (_.func(self._onGlobalValidityStateUpdate)) { self._onGlobalValidityStateUpdate(value); }
                    },
                    arguments);
        },

        _validityStateUpdated : function(controller, data, eventProcessedCb) {
            var self = this;

            this._processControllerEvent(
                    "validityStateUpdated",
                    false,
                    function(property, value) {
                        self._state.validity[property] = value;

                        if (_.func(self._onValidityStateUpdate)) { self._onValidityStateUpdate(property, value); }
                    },
                    arguments);
        },

        /**
         *
         *
         * @param action
         * @param syncProcessedCb   function(result, err)
         *
         * @protected
         */
        _updateToRemote : function(action, syncProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ViewProcessesState::_updateToRemote".fmt(iName);

            var callbackGiven   = _.func(syncProcessedCb);

            var __returnError   = function(errStr) {
                callbackGiven ? syncProcessedCb(null, { message : errStr }) :  _l.error(me, errStr);
            };

            action = action || "update to remote";

            if (!this._stateProcessingInitialized) {
                __returnError({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                    "your view-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __returnError("View is invalid, unable to update to remote");
                return;
            }

            this._dispatchToController(
                    "wantToUpdateToRemote",
                    {
                        action : action
                    },
                    syncProcessedCb);
        },

        _processControllerEvent : function(eventName, isGlobal, stateUpdateFunc, processingArguments) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ViewProcessesState::_processControllerEvent({1})".fmt(iName, eventName);

            //unpack arguments
            processingArguments = processingArguments || [];
            var controller      = processingArguments[0];
            var data            = processingArguments[1];
            var eventProcessedCb= processingArguments[2];

            var callbackGiven   = _.func(eventProcessedCb);

            var __return   = function(err) {
                if (_.def(err)) {
                    callbackGiven ? eventProcessedCb(null, err) :  _l.error(me, "Error occurred : " + _.stringify(err));
                } else {
                    callbackGiven ? eventProcessedCb() : null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your view-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __return({
                    message : "ReactView is invalid, unable to process {0} event".fmt(eventName)
                });
                return;
            }

            if (!this.isRendered()) {
                __return({
                    message : "View is not rendered, unable to process {0} event".fmt(eventName)
                });
                return;
            }

            var dataDesc        = 'Data of {0} event'.fmt(eventName);
            var property        = isGlobal ? null : _.get(data, 'what', dataDesc);
            var value           = isGlobal ? data : _.get(data, 'data', dataDesc);

            if (!isGlobal && (!_.string(property) || _.empty(property))) {
                __return({
                    message : "No valid data property name provided, unable to process {0} event".fmt(eventName)
                });
                return;
            }

            stateUpdateFunc = _.ensureFunc(stateUpdateFunc);

            if (isGlobal) {
                stateUpdateFunc(value);
            } else {
                stateUpdateFunc(property, value);
            }

            this._scheduleRenderState(__return);
        }

    });
})();