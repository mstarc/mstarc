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

        $statics : {
            REQUIRED_CONTROLLER_API : {
                methods : ['isValid', '_dispatchToModel', '_dispatchToView']
            }
        },

        _stateProcessingInitialized : false,

        /**
         *
         * ControllerProcessesState Mixin for Controller classes. Adds functionality to process, edit and sync
         * state in a standardized way.
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
         *  It also processes the following view events:
         *  - wantToEdit
         *  - wantToUpdateToRemote
         *  - wantToUpdateFromRemote
         *
         * **Processing model events**
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
         *
         * **Processing view events**
         * The class using this mixin can implement the following custom methods that are called when the view
         * events are received:
         *
         * [before processing]
         * - _onWantToEdit(property, value)
         * - _onWantToUpdateToRemote()
         * - _onWantToUpdateFromRemote()
         *
         * [after processing]
         * - _onUpdatedToRemote()
         * - _onUpdatedFromRemote()
         *
         * These methods are called before the view events are forwarded to the connected model.
         *
         * For convenience these events can called using the following public methods:
         *
         *  resetData()                                 reset all data in model
         *  edit(property, value, editProcessedCb)      edit local property value
         *  updateToRemote(updateReadyCb)               send local property values to server
         *                                              updateReadyCb(responseData, err)
         *
         *  updateFromRemote(updateReadyCb)             Get remote property values from server
         *                                              updateReadyCb(responseData, err)
         *
         *
         * @class   ControllerProcessesState
         * @module  M*C
         *
         * @for     Controller
         *
         */

        resetData : function(readyCb) {
            this._dispatchToModel("wantToResetModel", null, readyCb);
        },

        /**
         *
         * Edit data <property> by setting it to a new <value>
         *
         * @param property          property for which to edit a value
         * @param value             New value for property
         * @param editProcessedCb   function(result, err), callback called when the edit has been processed throughout
         *                          the whole MVC
         *
         */
        edit : function(property, value, editProcessedCb) {
            this._wantToEdit(
                    this,
                    {
                        what : property,
                        data : value
                    },
                    editProcessedCb);
        },

        /**
         *
         * Get remote property values from server based on some optional context
         *
         * @param {function} updateReadyCb     function(result, err), value of result depends on implementation
         *
         */
        updateFromRemote : function(updateReadyCb, context) {

            this._wantToUpdateFromRemote(
                    this,
                    context,
                    updateReadyCb);
        },

        /**
         *
         * @param updateToRemoteCb     function(result, err), value of result depends on implementation
         *
         */
        updateToRemote : function(updateToRemoteCb) {
            this._wantToUpdateToRemote(
                    this,
                    null,
                    updateToRemoteCb);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _initStateProcessing : function() {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ControllerProcessesState::_initStateProcessing";

            if (!_.interfaceAdheres(this, ControllerProcessesState.REQUIRED_CONTROLLER_API)) {
                _l.error(me, "Init state processing failed : this controller does not adhere to " +
                             "the required interface for this mixin");

                var api = ControllerProcessesState.REQUIRED_CONTROLLER_API;
                _l.info(me, "Required controller interface : ", _.stringify(api));

                return this._stateProcessingInitialized;
            }

            return (this._stateProcessingInitialized = true);
        },

        /********************************************************************
         *
         * MODEL EVENT HANDLERS
         *
         ********************************************************************/

        _dataStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processDataState",
                    "dataStateUpdated",
                    false,
                    arguments);
        },

        _globalSyncStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalSyncState",
                    "globalSyncStateUpdated",
                    true,
                    arguments);
        },

        _globalErrorStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalErrorState",
                    "globalErrorStateUpdated",
                    true,
                    arguments);
        },


        _errorStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processErrorState",
                    "errorStateUpdated",
                    false,
                    arguments);
        },

        _globalValidityStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processGlobalValidityState",
                    "globalValidityStateUpdated",
                    true,
                    arguments);
        },

        _validityStateUpdated : function(model, data, eventProcessedCb) {
            this._processModelEvent(
                    "_processValidityState",
                    "validityStateUpdated",
                    false,
                    arguments);
        },

        /********************************************************************
         *
         * VIEW EVENT HANDLERS
         *
         ********************************************************************/

        _wantToEdit : function(origin, data, editProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ControllerProcessesState::_wantToEdit".fmt(iName);

            var callbackGiven   = _.func(editProcessedCb);

            var __returnError   = function(errStr) {
                callbackGiven ? editProcessedCb(null, { message : errStr }) :  _l.error(me, errStr);
            };

            if (!this._stateProcessingInitialized) {
                __returnError("State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your controller-constructor first");
                return;
            }

            if (this.isValid() === false) {
                __returnError("Controller is invalid, unable to edit property {0}".fmt(property));
                return;
            }

            var dataDesc        = 'Data of wantToEdit event';
            var property        = _.get(data, 'what', dataDesc);
            var newValue        = _.get(data, 'data', dataDesc);

            if (_.func(this._onWantToEdit)) {
                this._onWantToEdit(property, newValue);
            }

            if (!_.func(this._dispatchToModel)) {
                __returnError(("_dispatchToModel method missing : this is not a Controller class, " +
                               "unable to edit property {0}").fmt(property));
                return;
            }

            this._dispatchToModel(
                    "wantToEdit",
                    {
                        what : property,
                        data : newValue
                    },
                    editProcessedCb);
        },

        _wantToUpdateToRemote : function(origin, data, updateReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ControllerProcessesState::_wantToUpdateToRemote".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(updateReadyCb);

            var __returnError   = function(err) {
                callbackGiven ? updateReadyCb(null, err) :  _l.error(me, "Error occurred : " + _.stringify(err));
            };

            if (!this._stateProcessingInitialized) {
                __returnError({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your controller-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __returnError({
                    message : "Controller is invalid, unable to update to remote"
                });
                return;
            }

            if (_.func(this._onWantToUpdateToRemote)) {
                this._onWantToUpdateToRemote();
            }

            this._dispatchToModel(
                    "wantToUpdateToRemote",
                    data,
                    function(responseData, err) {
                        var onUpdatedToRemote = _.func(self._onUpdatedToRemote) ?
                            self._onUpdatedFromRemote.bind(self) :
                            // Dummy function that calls callback immediately
                            function(respondsData, err, callback) {
                                callback();
                            };
                        onUpdatedToRemote(responseData, err, function(err) {
                            if (_.def(err)) {
                                __returnError(err);
                                return;
                            }

                            if (callbackGiven) { updateReadyCb(responseData); }
                        });
                    });
        },

        _wantToUpdateFromRemote : function(origin, data, updateReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ControllerProcessesState::_wantToUpdateFromRemote".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(updateReadyCb);

            var __returnError   = function(err) {
                callbackGiven ? updateReadyCb(null, err) :  _l.error(me, "Error occurred : " + _.stringify(err));
            };

            if (!this._stateProcessingInitialized) {
                __returnError({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                               "your controller-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __returnError({
                    message : "Controller is invalid, unable to update to remote"
                });
                return;
            }

            if (_.func(this._onWantToUpdateFromRemote)) {
                this._onWantToUpdateFromRemote();
            }

            this._dispatchToModel(
                    "wantToUpdateFromRemote",
                    data,
                    function(respondsData, err) {
                        var onUpdatedFromRemote = _.func(self._onUpdatedFromRemote) ?
                            self._onUpdatedFromRemote.bind(self) :
                            // Dummy function that calls callback immediately
                            function(respondsData, err, callback) {
                                callback();
                            };
                        onUpdatedFromRemote(respondsData, err, function(err) {
                            if (_.def(err)) {
                                __returnError(err);
                                return;
                            }

                            if (callbackGiven) { updateReadyCb(respondsData); }
                        });
                    });
        },

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
                callbackGiven ? eventProcessedCb(null, { message : errStr }) : _l.error(me, errStr);
            };

            if (!this._stateProcessingInitialized) {
                __returnError("State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your controller-constructor first");
                return;
            }

            if (this.isValid() === false) {
                __returnError("Controller is invalid, unable to process {0} event".fmt(eventName));
                return;
            }

            var dataDesc        = 'Data of {0} event'.fmt(eventName);
            var property        = isGlobal ? null : _.get(data, 'what', dataDesc);
            var value           = isGlobal ? data : _.get(data, 'data', dataDesc);

            //Default behavior is to forward the event and value
            var forward         = true;

            if (!isGlobal && (!_.string(property) || _.empty(property))) {
                __returnError("No valid data property name provided, unable to process {0} event".fmt(eventName));
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