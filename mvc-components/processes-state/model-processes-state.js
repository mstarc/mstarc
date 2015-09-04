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
    var SyncStateName   = NS.SyncStateName;

    NS.ModelProcessesState = Class({

        $statics : {
            REQUIRED_MODEL_API : {
                methods : ['isValid', '_dispatchToControllers']
            }
        },

        _state                      : null,
        _stateUpdated               : null,
        _stateProcessingInitialized : false,

        /**
         *
         * {
         *  <property name1> : <default value property 1>,
         *
         *  ...
         *
         *  <property nameN> : <default value property N>,
         * }
         *
         */
        _properties                 : null,

        /**
         *
         * TODO : DRY up code.
         *
         * ModelProcessesState Mixin for Model classes. Adds functionality to process, edit and sync state in a
         * standardized way.
         *
         *
         * IMPORTANT : Call _initStateProcessing() during construction of your class that uses this mixin
         *
         *
         * IMPORTANT : The class that uses this mixin must implement the following methods :
         *
         * - _updateToRemote(updateReadyCb), with updateReadyCb(responseData, err)
         * - _updateFromRemote(updateReadyCb), with updateReadyCb(err)
         *
         * IMPORTANT : The class that uses this mixin must define an object _properties, defining all
         *             model property names (keys) and default values (values).
         *
         *
         * *** TODO START : FUTURE : COMPLEX STATE ***
         * Model state is always partitioned per **resource type** and per resource type you can have state for
         * one or multiple resource instances. To explain this, for example, a library book lending
         * UI might enable the user to view and edit 'user' info and info about 'books'. So it shows and
         * and allows editing information of a user resource and multiple book resources.
         * *** TODO END : FUTURE : COMPLEX STATE ***
         *
         * This mixin defines and processes the following types of state:
         *  * data state of properties
         *  * sync state of properties
         *  * global sync state
         *  * error state of properties
         *  * global error state
         *  * validity state of properties
         *
         * The mixin processes two types of incoming events :
         *
         * - wantToEdit
         * - wantToUpdateToRemote
         * - wantToUpdateFromRemote
         *
         * if validation has been implemented for the property use a async method with the following naming convention:
         *
         *  _validate<Property>(value, validationCb)
         *
         * With validationCb(validity, err), where validity is the validity object or null (when valid), see below.
         *
         * TODO : Complex state syncing
         * Further, the global sync state is set to NOT_SYNCED when the new value for the property is
         * different from the old value. To assess if two property values are equal it will use a custom method if
         * available, using the following naming convention:
         *
         *  _isEqual<Property>(val1, val2)
         *
         * When the updateToRemote() method is called it is checked if globalSyncing is NOT_SYNCED.
         * If so, the _updateToRemote(updateToRemoteReadyCb) method is called. This method needs to be overridden by
         * the class that uses this mixin and implements the actual updating to the server.
         * When the updateToRemoteReadyCb(responseData, err) callback is called without error the globalSyncing is
         * set to SYNCED.
         *
         * The updateFromRemote()/wantToUpdateFromRemote() basically calls the _updateFromRemote() method if the
         * global syncing state is SYNCED. This method needs to be implemented by the class that uses this mixin.
         *
         * Internally the state is structured as follows:
         * {
         *      // The actual state property values.
         *      data : {
         *          <prop_1> : <prop_1_value>,
         *          ...
         *          <prop_N> : <prop_N_value>,
         *      },
         *
         *      //overall sync state
         *      globalSyncing : <unknown || sync_error || not_synced || syncing || synced>,
         *
         *      //TODO : complex state
         *      //sync state of each property
         *      syncing : {
         *          <prop_1> : <unknown || sync_error || not_synced || syncing || synced || null>,
         *          ...
         *          <prop_N> : <unknown || sync_error || not_synced || syncing || synced || null>
         *      },
         *
         *      //overall error state
         *      globalError : <List of properties that have errors || null>,
         *
         *      // Error object for any state property that has an error
         *      error : {
         *          <prop_1> : <prop_1_error_object || boolean || null>,
         *          ...
         *          <prop_N> : <prop_N_error_object || boolean || null>
         *      },
         *
         *      //overall validity state
         *      globalValidity : <List of properties that are invalid || null>,
         *
         *      //Validity for each property
         *      validity : {
         *          <prop_1> : <prop_1_validity_object || null>,
         *          ...
         *          <prop_N> : <prop_N_validity_object || null>
         *      }
         * }
         *
         * Error objects are defined as follows:
         * {
         *      message         : <error message>,
         *      code            : <OPTIONAL : error code>,
         *      original_error  : <OPTIONAL : error object || error message string>
         * }
         *
         * Validity object:
         * {
         *      valid           : <true || false>,
         *      message         : <descriptions of what is wrong>,
         *      requirements    : <description of the value requirements>,
         * }
         *
         * Data state, sync state, error state and validity state are updated and propagated
         * in the following standardized way:
         *
         * _updateDataState(property, value, updateProcessedCb)
         *
         * _updateGlobalSyncState(syncValue, updateProcessedCb)
         * //TODO : complex state
         * //_updateSyncState(property, sync_value, updateProcessedCb)
         *
         * _updateGlobalErrorState(errorValue, updateProcessedCb)
         * _updateErrorState(property, errorValue, updateProcessedCb)
         *
         * _updateValidityState(property, validityValue, updateProcessedCb)
         *
         *
         * A class that uses this mixin can define methods for specific
         * properties that are called during any of the update state methods.
         * These methods have the following naming convention.
         *
         * _dataStateUpdatedFor<Property>(value)
         *
         * _globalSyncStateUpdated(value)
         * //TODO : complex state
         * //_syncStateUpdatedFor<Property>(value)
         *
         * _globalErrorStateUpdated(value)
         * _errorStateUpdatedFor<Property>(value)
         *
         * _globalValidityStateUpdated(value)
         * _validityStateUpdatedFor<Property>(value)
         *
         * These custom method must return an a success boolean value.
         *
         * Example:
         *
         * If for property 'title' an _dataStateUpdatedFor method is created, like so:
         * _dataStateUpdatedForTitle(value, updateProcessedCb)
         *
         * Then, when calling _updateDataState('title', value, updateProcessedCb) the above methods is
         * called just before the controllers are notified.
         *
         * @class   ModelProcessesState
         * @module  M*C
         *
         * @for     Model
         *
         */

        /**
         *
         * Get data state object
         *
         * @returns {*}
         *
         */
        getDataState : function() {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::getDataState".fmt(iName);

            return this._getState("data");
        },

        /**
         *
         * Get data state for <property>
         *
         * @param property
         *
         * @returns {*}
         *
         */
        getDataStateFor : function(property) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::getDataStateFor".fmt(iName);

            var value           = null;

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property name is not valid, unable to get data state for property");
                return value;
            }

            return _.get(this._getState("data"), property);
        },

        /**
         *
         * Get global syncing state
         *
         * @returns {number | null}
         *
         */
        getGlobalSyncingState : function() {
            return this._getState("globalSyncing");
        },

        /**
         *
         * Get global error state
         *
         * @returns {array | null}
         *
         */
        getGlobalErrorState : function() {
            return this._getState("globalError");
        },

        /**
         *
         * Get error state for <property>
         *
         * @returns {object | null}
         *
         */
        getErrorState : function(property) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::getErrorState".fmt(iName);

            var value           = null;

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property name is not valid, unable to get error state for property");
                return value;
            }

            return _.get(this._getState("error"), property);
        },

        /**
         *
         * Get global error state
         *
         * @returns {array | null}
         *
         */
        getGlobalValidityState : function() {
            return this._getState("globalValidity");
        },

        allPropertiesValid : function() {
            return _.empty(this.getGlobalValidityState());
        },

        /**
         *
         * Get validity state for <property>
         *
         * @returns {object | null}
         *
         */
        getValidityState : function(property) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::getValidityState".fmt(iName);

            var value           = null;

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property name is not valid, unable to get error state for property");
                return value;
            }

            return _.get(this._getState("validity"), property);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        /**
         *
         * Resets any data state property back to null
         *
         * Calls custom method _onResetDataState() (if exists) before resetting the state
         *
         * @param {function} [resetProcessedCb]     function(err)
         *
         */
        _wantToResetDataState : function(origin, data, resetProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::resetDataState".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(resetProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    self._updateGlobalErrorState(err, function() {
                        callbackGiven ? resetProcessedCb(err) : _l.error(me, "Error occurred : ", _.stringify(err));
                    });
                } else {
                    self._updateGlobalErrorState(null, function() {
                        resetProcessedCb ? resetProcessedCb() : null;
                    });
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (!this.isValid()) {
                __return({
                    message : "Model is invalid, unable to reset data state"
                });
                return;
            }

            this._callCustomMethod("_onResetDataState", "", null);

            var defaultData = {};
            if (_.obj(this._properties) && !_.empty(this._properties)) {
                defaultData = _.clone(this._properties);
            } else {
                _l.warn(me, "No _properties object defined in Model");
            }

            this._wantToSetDataState(origin, defaultData, __return);
        },

        /**
         *
         * Set the model data state according to the property values given in <data>
         *
         * @param {object} data
         * @param {function} [setDataProcessedCb]  function(err)
         *
         */
        _wantToSetDataState : function(origin, data, setDataProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_wantToSetDataState".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(setDataProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    self._updateGlobalErrorState(err, function() {
                        callbackGiven ? setDataProcessedCb(err) : _l.error(me, "Error occurred : ", _.stringify(err));
                    });
                } else {
                    self._updateGlobalErrorState(null, function() {
                        callbackGiven ? setDataProcessedCb() : null;
                    });
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (!this.isValid()) {
                __return({
                    message : "Model is invalid, unable to set new data"
                });
                return;
            }

            data = data || {};

            var err = {
                error_hash : {}
            };

            var properties = Object.getOwnPropertyNames(data);
            _.iterateASync(
                    properties.length,
                    function(i, iterCb) {
                        var property    = properties[i];
                        var value       = data[property];

                        self._updateDataState(property, value, function(updated, _err) {
                            var success = !_.def(_err);
                            if (!success) {
                                err.error_hash["Updating data property {0}".fmt(property)] = _err;
                                iterCb(success);

                                return;
                            }

                            self._callCustomMethod(
                                    "_validate",
                                    property,
                                    value,
                                    function(validity, _err) {
                                        var success = !_.def(_err);
                                        if (!success) {
                                            var action = "Calculating validity for data property {0}".fmt(property);
                                            err.error_hash[action] = _err;

                                            iterCb(success);
                                            return;
                                        }

                                        self._updateValidityState(property, validity, function(updated, _err) {
                                            var success = !_.def(_err);
                                            if (!success) {
                                                var action = "Updating validity of data property {0}".fmt(property);
                                                err.error_hash[action] = _err;
                                            }

                                            iterCb(success);
                                        });
                                    },
                                    false);
                        });
                    },
                    function(success) {
                        self._state.globalValidity = self._calcGlobalValidityState();

                        if (success) {
                            __return();
                        } else {
                            __return({
                                message : "Unable to set all data properties",
                                originalError : err
                            });
                        }
                    });
        },

        _wantToEdit : function(origin, data, editProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_wantToEdit".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(editProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    self._updateGlobalErrorState(err, function() {
                        callbackGiven ? editProcessedCb(err) : _l.error(me, "Error occurred : ", _.stringify(err));
                    });
                } else {
                    self._updateGlobalErrorState(null, function() {
                        callbackGiven ? editProcessedCb() : null;
                    });
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                    "your model-constructor first"
                });
                return;
            }

            if (!this.isValid()) {
                __return({
                    message : "Model is invalid, unable to edit"
                });
                return;
            }

            var dataDesc        = 'Data of wantToEdit event';
            var property        = _.get(data, 'what', dataDesc);
            var newValue        = _.get(data, 'data', dataDesc);

            this._updateDataState(property, newValue, function(updated, err) {

                if (_.def(err)) {
                    __return({
                        message       : "Unable to update property [{0}] to edited value".fmt(property || "[UNKNOWN]"),
                        originalError : err
                    });
                    return;
                }

                if (!updated) {
                    _l.debug(me, "Property [{0}] was not updated, stopping".fmt(property));
                    __return();
                    return;
                }

                var parallelTasks = {};

                parallelTasks["update global sync state"] = function(cbReady) {
                    self._updateGlobalSyncState(SyncState.NOT_SYNCED, function(updated, err) {
                        cbReady(err);
                    });
                };

                parallelTasks["update validity of property {0}".fmt(property)] = function(cbReady) {
                    self._callCustomMethod(
                        "_validate",
                        property,
                        newValue,
                        function(validity, err) {
                            if (_.def(err)) {
                                cbReady(err);
                                return;
                            }

                            self._updateValidityState(property, validity, function(updated, err) {
                                cbReady(err);
                            });
                        },
                        false);
                };

                _.execASync(parallelTasks, function(errHash) {
                    if (!_.empty(errHash)) {
                        __return({
                            error_hash : errHash
                        });
                        return;
                    }

                    __return();
                });

            });
        },

        //updateReadyCb(responseData, err)
        _wantToUpdateToRemote : function(origin, data, updateReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_wantToUpdateToRemote".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(updateReadyCb);
            var __return        = function(responseData, err) {
                if (_.def(err)) {
                    self._updateGlobalErrorState(err, function() {
                        callbackGiven ? updateReadyCb(responseData, err) : _l.error(me, "Error occurred : ", _.stringify(err));
                    });
                } else {
                    self._updateGlobalErrorState(null, function() {
                        callbackGiven ? updateReadyCb(responseData) : null;
                    });
                }
            };

            if (!this._stateProcessingInitialized) {
                __return(null, {
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __return(null, {
                    message : "Model is invalid, unable to update to remote"
                });
                return;
            }

            var validityState = this._state.globalValidity;
            if (!_.empty(validityState)) {
                __return(null, {
                    message : ("The following properties are invalid, " +
                               "unable to update to remote: {0}").fmt(validityState.join(", "))
                });
                return;
            }

            var syncState = this._state.globalSyncing;
            if (syncState > SyncState.NOT_SYNCED) {
                __return(null, {
                    message : "Syncing not required, global sync state is : {0}".fmt(SyncStateName[syncState])
                });
                return;
            }

            this._updateToRemote(function(responseData, err) {
                if (_.def(err)) {
                    __return(null, err);
                    return;
                }

                self._updateGlobalSyncState(SyncState.SYNCED, function() {
                    self._updateGlobalErrorState(null, function() {
                        __return(responseData, err);
                    });
                });
            });
        },

        _wantToUpdateFromRemote : function(origin, data, updateReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_wantToUpdateFromRemote".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(updateReadyCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    self._updateGlobalErrorState(err, function() {
                        callbackGiven ? updateReadyCb(err) : _l.error(me, "Error occurred : ", _.stringify(err));
                    });
                } else {
                    self._updateGlobalErrorState(null, function() {
                        callbackGiven ? updateReadyCb() : null;
                    });
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __return({
                    message : "Model is invalid, unable to update to remote"
                });
                return;
            }

            var syncState = this._state.globalSyncing;
            if ((syncState < SyncState.SYNCED) && (syncState != SyncState.UNKNOWN)) {
                _l.info(me, ("There are local changes, update to server first. " +
                             "(SyncState = {0})").fmt(SyncStateName[syncState]));

                __return();
                return;
            }

            if (syncState == SyncState.UNKNOWN) {
                _l.debug(me, "SyncState is UNKNOWN, continuing anyway ...");
            }

            this._updateFromRemote(function(data, err) {
                if (_.def(err)) {
                    __return(err);
                } else {
                    self._wantToSetDataState(origin, data, __return);
                }
            });
        },

        _updateFromRemote : function(updateReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_updateFromRemote".fmt(iName);

            var errStr          = "_updateFromRemote method not implemented, " +
                                  "please implement in your {0} class".fmt(iName);

            _l.error(me, errStr);

            _.ensureFunc(updateReadyCb)({
                message : errStr
            });
        },

        _updateToRemote : function(updateReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_updateToRemote".fmt(iName);

            var errStr          = "_updateToRemote method not implemented, " +
                                  "please implement in your {0} class".fmt(iName);

            _l.error(me, errStr);

            _.ensureFunc(updateReadyCb)({
                message : errStr
            });
        },

        _initStateProcessing : function() {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_initStateProcessing";

            if (!_.interfaceAdheres(this, ModelProcessesState.REQUIRED_MODEL_API)) {
                _l.error(me, "Init state processing failed : this model does not adhere to " +
                             "the required interface for this mixin");
                _l.info(me, "Required model interface : ", _.stringify(ModelProcessesState.REQUIRED_MODEL_API));
                return this._stateProcessingInitialized;
            }

            this._state = {
                //The actual state property values
                data            : {},

                globalSyncing   : SyncState.UNKNOWN,
                syncing         : {},

                globalError     : null,
                error           : {},

                globalValidity  : null,
                validity        : {}
            };

            this._stateUpdated = {
                //The actual state property values
                data            : {},

                globalSyncing   : false,
                syncing         : {},

                globalError     : false,
                error           : {},

                globalValidity  : false,
                validity        : {}
            };

            return (this._stateProcessingInitialized = true);
        },

        /**
         *
         * Get data <stateType> state data
         *
         * @param {string} stateType
         *
         * @returns {*}
         *
         */
        _getState : function(stateType) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_getState".fmt(iName);

            var stateData       = null;

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing not initialized (correctly), call _initStateProcessing() in " +
                             "your model-constructor first");
                return stateData;
            }

            if (this.isValid() === false) {
                _l.error(me, "Model is invalid, unable to getState");
                return;
            }

            if (!_.string(stateType) || _.empty(stateType)) {
                _l.error(me, "stateType is not valid, unable to get state data for stateType");
                return stateData;
            }

            stateData = this._state[stateType];

            return stateData;
        },

        /**
         *
         * Updates the data state <property> to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, if it is defined, a custom method
         * _dataStateUpdatedFor<Property>(value, readyCb) is called.
         *
         * Only when both steps are completed the optional updateProcessedCb(updated, err) is called.
         *
         * This method sends a dataStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the data state of <property>
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         * @param {object} [excludedComponent]      When an excludedComponent is given, the update event is not send
         *                                          to this component
         *
         *
         * @protected
         *
         */
        _updateDataState : function(property, value, updateProcessedCb, excludedComponent) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateDataState".fmt(iName);
            var self    = this;

            var updated = false;
            var err     = {
                error_hash : {}
            };

            var callbackGiven   = _.func(updateProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    callbackGiven ? updateProcessedCb(updated, err) :
                                    _l.error(me, "Error occurred : ", _.stringify(err));
                } else {
                    callbackGiven ? updateProcessedCb(updated) :
                                    null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (!_.string(property) || _.empty(property)) {
                __return({
                    message : "Property name is not valid, unable to update data state and notify controllers"
                });
                return;
            }

            if (
                    this._isEqual(property, this._state.data[property], value) &&
                    (this._stateUpdated.data[property] === true)
               )
            {
                _l.debug(me, "Value for property {0} did not change, nothing to update".fmt(property));
                __return();
                return;
            }

            this._state.data[property]          = value;
            this._stateUpdated.data[property]   = true;
            updated = true;

            this._dispatchToControllers("dataStateUpdated", {
                what : property,
                data : value
            }, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched dataStateUpdated to controllers"] = _err;
                }

                var result = self._callCustomMethod("_dataStateUpdatedFor", property, value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _dataStateUpdatedFor {0}".fmt(property)] = _err;
                    }

                    __return(!_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    __return(!_.empty(err.error_hash) ? err : null);
                } else if (result.result !== true) {
                    err.error_hash["initiating custom method _dataStateUpdatedFor {0}".fmt(property)] = {
                        message : "A problem occurred initiating custom method"
                    };

                    __return(err);
                }
            },
            {
                excludedComponent: excludedComponent
            });
        },

        /**
         *
         * Updates the global sync state to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, if it is defined, a custom method _globalSyncStateUpdated(value, readyCb)
         * is called.
         *
         * Only when both steps are completed the optional updateProcessedCb(updated, err) is called.
         *
         * This method sends a globalSyncStateUpdated event to the controllers.
         *
         * @param {*} value                         New value for the global sync state
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         *
         * @protected
         *
         */
        _updateGlobalSyncState : function(value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalSyncState".fmt(iName);
            var self    = this;

            var updated = false;
            var err     = {
                error_hash : {}
            };

            var callbackGiven   = _.func(updateProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    callbackGiven ? updateProcessedCb(updated, err) :
                            _l.error(me, "Error occurred : ", _.stringify(err));
                } else {
                    callbackGiven ? updateProcessedCb(updated) :
                            null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (_.equals(this._state.globalSyncing, value) && (this._stateUpdated.globalSyncing === true)) {
                _l.debug(me, "Value for global sync state did not change, nothing to update");
                __return();
                return;
            }

            this._state.globalSyncing = value;
            this._stateUpdated.globalSyncing = true;
            updated = true;

            this._dispatchToControllers("globalSyncStateUpdated", value, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched globalSyncStateUpdated to controllers"] = _err;
                }

                var result = self._callCustomMethod("_globalSyncStateUpdated", "", value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _globalSyncStateUpdated"] = _err;
                    }

                    __return(!_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    __return(!_.empty(err.error_hash) ? err : null);
                } else if (result.result !== false) {
                    err.error_hash["initiating custom method _globalSyncStateUpdated"] = {
                        message : "A problem occurred initiating custom method"
                    };

                    __return(err);
                }
            });
        },

        //TODO : complex state
        /**
         *
         * Updates the sync state of <property> to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(updated, err) callback
         *
         * This method sends a syncStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the sync state of <property>
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        /*_updateSyncState : function(property, value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateSyncState".fmt(iName);
            var self    = this;

            var success = false;

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in
                              your constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update sync state and notify controllers");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            this._state.syncing[property] = value;

            success = this._callCustomMethod("_syncStateUpdatedFor", property, value);
            success = this._dispatchToControllers("syncStateUpdated", {
                what : property,
                data : value
            }, function(err) {
                if (_.def(err)) {
                    _l.error(me, ("Processing syncStateUpdated event for {0} failed, " +
                                  "continuing anyway ... Error : ").fmt(property), _.stringify(err));
                }

                self._updateGlobalSyncState(self._calcGlobalSyncState(), function(_err) {
                    if (!_.def(_err)) {
                        //propagate error
                        _err = err;
                    }

                    updateProcessedCb(_err);
                });
            }) && success;

            return success;
        },*/

        //TODO : complex state
        /**
         *
         * Calculates "most severe" sync state among all property sync states.
         *
         * @returns {number} One of the SyncState constants
         *
         * @protected
         */
        /*_calcGlobalSyncState : function() {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_calcGlobalSyncState".fmt(iName);

            var globalSyncState = SyncState.SYNCED;

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in
                              your constructor first");
                return SyncState.UNKNOWN;
            }

            var syncing     = this._state.syncing;
            if (_.empty(syncing)) {
                return SyncState.UNKNOWN;
            }

            var syncState   = null;
            for (var property in syncing) {
                if (!syncing.hasOwnProperty(property)) {
                    continue;
                }

                syncState = syncing[property];
                //Is this sync state more severe?
                if (syncState < globalSyncState) {
                    globalSyncState = syncState;
                }
            }

            return globalSyncState;
        },*/

        /**
         *
         * Updates the global error state to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, if it is defined, a custom method
         * _globalErrorStateUpdated(value, readyCb) is called.
         *
         * Only when both steps are completed the optional updateProcessedCb(updated, err) is called.
         *
         * This method sends a globalErrorStateUpdated event to the controllers.
         *
         * @param {*} value                         New value of the global error state
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         *
         * @protected
         *
         */
        _updateGlobalErrorState : function(value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalErrorState".fmt(iName);
            var self    = this;

            var updated = false;
            var err     = {
                error_hash : {}
            };

            var callbackGiven   = _.func(updateProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    callbackGiven ? updateProcessedCb(updated, err) :
                            _l.error(me, "Error occurred : ", _.stringify(err));
                } else {
                    callbackGiven ? updateProcessedCb(updated) :
                            null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (_.equals(this._state.globalError, value) && (this._stateUpdated.globalError === true)) {
                _l.debug(me, "Value for global error state did not change, nothing to update");
                __return();
                return;
            }

            this._state.globalError         = value;
            this._stateUpdated.globalError  = true;
            updated = true;

            this._dispatchToControllers("globalErrorStateUpdated", value, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched globalErrorStateUpdated to controllers"] = _err;
                }

                var result = self._callCustomMethod("_globalErrorStateUpdated", "", value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _globalErrorStateUpdated"] = _err;
                    }

                    __return(!_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    __return(!_.empty(err.error_hash) ? err : null);
                } else if (result.result !== false) {
                    err.error_hash["initiating custom method _globalErrorStateUpdated"] = {
                        message : "A problem occurred initiating custom method _globalErrorStateUpdated"
                    };

                    __return(err);
                }
            });
        },

        /**
         *
         * Updates the error state of <property> to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, the global error state is recalculated and updated.
         * Finally, if it is defined, a custom method
         * _errorStateUpdatedFor<Property>(value, readyCb) is called.
         *
         * Only when all steps are completed the optional updateProcessedCb(updated, err) is called.
         *
         * This method sends a errorStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <error value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the error state of <property>
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         *
         * @protected
         *
         */
        _updateErrorState : function(property, value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateErrorState".fmt(iName);
            var self    = this;

            var updated = false;
            var err     = {
                error_hash : {}
            };

            var callbackGiven   = _.func(updateProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    callbackGiven ? updateProcessedCb(updated, err) :
                            _l.error(me, "Error occurred : ", _.stringify(err));
                } else {
                    callbackGiven ? updateProcessedCb(updated) :
                            null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (!_.string(property) || _.empty(property)) {
                __return({
                    message : "Property name is not valid, unable to update error state and notify controllers"
                });
                return;
            }

            if (_.equals(this._state.error[property], value) && (this._stateUpdated.error[property] === true)) {
                _l.debug(me, "Value for error state of property {0} did not change, nothing to update".fmt(property));
                __return();
                return;
            }

            this._state.error[property] = value;
            this._stateUpdated.error[property] = true;
            updated = true;

            this._dispatchToControllers("errorStateUpdated", {
                what : property,
                data : value
            }, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched errorStateUpdated to controllers"] = _err;
                }

                self._updateGlobalErrorState(self._calcGlobalErrorState(), function(_updated, _err) {
                    if (_.def(_err)) {
                        err.error_hash["updating globalErrorState"] = _err;
                    }

                    var result = self._callCustomMethod("_errorStateUpdatedFor", property, value, function (_err) {
                        if (_.def(_err)) {
                            err.error_hash["calling custom method _errorStateUpdatedFor {0}".fmt(property)] = _err;
                        }

                        __return(!_.empty(err.error_hash) ? err : null);
                    });

                    if (!result.called) {
                        __return(!_.empty(err.error_hash) ? err : null);
                    } else if (result.result === false) {
                        err.error_hash["Initiating custom method _errorStateUpdatedFor {0}".fmt(property)] = {
                            message : "Problem occurred initiating"
                        };

                        __return(err);
                    }
                });
            });
        },

        /**
         *
         * @returns {object} Error object summarizing the current errors
         *
         * @protected
         */
        _calcGlobalErrorState : function() {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_calcGlobalErrorState".fmt(iName);

            var globalErrorState = null;

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your constructor first");
                return globalErrorState;
            }

            var error           = this._state.error;
            if (_.empty(error)) {
                return globalErrorState;
            }

            var errHash     = {};
            var errState    = null;
            var errDesc     = null;
            var numErrors   = 0;
            for (var property in error) {
                if (!error.hasOwnProperty(property)) {
                    continue;
                }

                errState = error[property];
                if (_.def(errState) && (errState !== false)) {
                    numErrors++;
                    errDesc = _.capitaliseFirst(property) + " error";
                    errHash[errDesc] = errState;
                }
            }

            if (!_.empty(errHash)) {
                globalErrorState = {
                    message : (numErrors > 1) ? "An error occurred" : "Multiple errors occurred",
                    originalError : {
                        error_hash : errHash
                    }
                };
            }

            return globalErrorState;
        },

        /**
         *
         * Updates the global validity state to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, if it is defined, a custom method
         * _globalValidityStateUpdated(value, readyCb) is called.
         *
         * Only when both steps are completed the optional updateProcessedCb(updated, err) is called.
         *
         * This method sends a globalValidityStateUpdated event to the controllers.
         *
         * @param {*} value                         New value of the global validity state
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         *
         * @protected
         *
         */
        _updateGlobalValidityState : function(value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalValidityState".fmt(iName);
            var self    = this;

            var updated = false;
            var err     = {
                error_hash : {}
            };

            var callbackGiven   = _.func(updateProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    callbackGiven ? updateProcessedCb(updated, err) :
                            _l.error(me, "Error occurred : ", _.stringify(err));
                } else {
                    callbackGiven ? updateProcessedCb(updated) :
                            null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (_.equals(this._state.globalValidity, value) && (this._stateUpdated.globalValidity === true)) {
                _l.debug(me, "Value for global error state did not change, nothing to update");
                __return();
                return;
            }

            this._state.globalValidity = value;
            this._stateUpdated.globalValidity = value;
            updated = true;

            this._dispatchToControllers("globalValidityStateUpdated", value, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched globalValidityStateUpdated to controllers"] = _err;
                }

                var result = self._callCustomMethod("_globalValidityStateUpdated", "", value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _globalValidityStateUpdated"] = _err;
                    }

                    __return(!_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    __return(!_.empty(err.error_hash) ? err : null);
                } else if (result.result !== false) {
                    err.error_hash["initiating custom method _globalValidityStateUpdated"] = {
                        message : "A problem occurred initiating"
                    };

                    __return(err);
                }
            });
        },

        /**
         *
         * Updates the validity state of <property> to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, if it is defined, a custom method
         * _errorStateUpdatedFor<Property>(value, readyCb) is called.
         *
         * Only when both steps are completed the optional updateProcessedCb(updated, err) is called.
         *
         * This method sends a validityStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the validity state of <property>
         * @param {function} [updateProcessedCb]    Callback(updated, err) called when update has been processed
         *                                          When updated is false and err is not an object, no update was
         *                                          performed because the value didn't change.
         *
         * @protected
         *
         */
        _updateValidityState : function(property, value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateValidityState".fmt(iName);
            var self    = this;

            var updated = false;
            var err     = {
                error_hash : {}
            };

            var callbackGiven   = _.func(updateProcessedCb);
            var __return        = function(err) {
                if (_.def(err)) {
                    callbackGiven ? updateProcessedCb(updated, err) :
                            _l.error(me, "Error occurred : ", _.stringify(err));
                } else {
                    callbackGiven ? updateProcessedCb(updated) :
                            null;
                }
            };

            if (!this._stateProcessingInitialized) {
                __return({
                    message : "State processing is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }


            if (!_.string(property) || _.empty(property)) {
                __return({
                    message : "Property name is not valid, unable to update validity state and notify controllers"
                });
                return;
            }

            if (_.equals(this._state.validity[property], value) && (this._stateUpdated.validity[property] === true)) {
                _l.debug(me, ("Value for validity state of property {0} did not change, " +
                              "nothing to update").fmt(property));
                __return();
                return;
            }

            this._state.validity[property] = value;
            this._stateUpdated.validity[property] = true;
            updated = true;

            this._dispatchToControllers("validityStateUpdated", {
                what : property,
                data : value
            }, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched validityStateUpdated to controllers"] = _err;
                }

                self._updateGlobalValidityState(self._calcGlobalValidityState(), function(_updated, _err) {
                    if (_.def(_err)) {
                        err.error_hash["updating globalValidityState"] = _err;
                    }

                    var result = self._callCustomMethod("_validityStateUpdatedFor", property, value, function (_err) {
                        if (_.def(_err)) {
                            err.error_hash["calling custom method _validityStateUpdatedFor {0}".fmt(property)] = _err;
                        }

                        __return(!_.empty(err.error_hash) ? err : null);
                    });

                    if (!result.called) {
                        updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                    } else if (result.result === false) {
                        err.error_hash["Initiating custom method _validityStateUpdatedFor {0}".fmt(property)] = {
                            message : "Problem occurred initiating"
                        };

                        __return(err);
                    }
                });
            });
        },

        /**
         *
         * Provides a list of properties that are INvalid.
         *
         * @returns {number} Provides a list of properties that are INvalid. Null means unknown.
         *
         * @protected
         *
         */
        _calcGlobalValidityState : function() {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_calcGlobalValidityState".fmt(iName);

            var globalValidityState = null;

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your constructor first");
                return globalValidityState;
            }

            globalValidityState    = [];
            var validity           = this._state.validity;
            if (_.empty(validity)) {
                return globalValidityState;
            }

            var validityState = null;
            for (var property in validity) {
                if (!validity.hasOwnProperty(property)) {
                    continue;
                }

                validityState = validity[property];
                if (_.get(validityState, "valid") === false) {
                    globalValidityState.push(property);
                }
            }

            return globalValidityState;
        },

        _isEqual : function(property, oldVal, newVal) {
            var isEqual = false;

            var customFuncName  = this._getCustomMethodName("_isEqual", property);
            var customFunc      = this["_" + customFuncName];
            if (_.func(customFunc)) {
                isEqual = customFunc(oldVal, newVal);
                if (!_.bool(isEqual)) {
                    var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
                    var me      = "{0}::ModelProcessesState::_isEqual".fmt(iName);

                    _l.error(me, ("Custom method {0} did not return a " +
                                  "boolean equality value").fmt(customFuncName));
                }

                return isEqual;
            }

            return (isEqual = _.equals(oldVal, newVal));
        },

        _getCustomMethodName : function(methodPrefix, property) {
            return methodPrefix + _.capitaliseFirst(property);
        },

        /**
         *
         * Calls custom callback, with its name based on methodPrefix and property, if available.
         * The return value of this function is an object containing info about the process:
         *
         * {
         *      result : <return value of the call, if not called this is undefined>,
         *      called : <true if method called, else false>
         * }
         *
         * NOTE : Custom methods must return a boolean value indicating that the task of method was successfully
         * initiated.
         *
         * @param {string} methodPrefix             The string the custom method name starts with
         * @param {string} property                 The property name, together with the methodPrefix form the custom
         *                                          method name. Also see _getCustomMethodName().
         * @param {*} value                         The first argument of the custom method to be called
         * @param {function} [callback]             The second argument of the custom method to be called
         * @param {boolean} [returnsBoolean=true]   True if the custom method must return a boolean, else false
         *
         *
         * @returns {object}                    See definition above
         *
         * @protected
         */
        _callCustomMethod : function(methodPrefix, property, value, callback, returnsBoolean) {
            var result          = {
                result : undefined,
                called : false
            };

            if (!_.bool(returnsBoolean)) {
                returnsBoolean = true;
            }

            var customFuncName  = this._getCustomMethodName(methodPrefix, property);
            var customFunc      = this[customFuncName];
            if (_.func(customFunc)) {
                result.result = customFunc.call(this, value, callback);
                result.called = true;
                if (returnsBoolean && (!_.bool(result.result))) {
                    var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
                    var me      = "{0}::ModelProcessesState::_callCustomMethod".fmt(iName);

                    _l.warn(me, ("Custom method {0} did not return a " +
                                 "boolean value").fmt(customFuncName));
                }
            }

            return result;
        }

    });
})();