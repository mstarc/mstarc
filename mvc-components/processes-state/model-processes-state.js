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
                methods : ['isValid', '_sync', '_dispatchToControllers']
            }
        },

        _state                      : null,
        _stateProcessingInitialized : false,

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
         * IMPORTANT : The class that uses this mixin must have a _sync() method implemented
         *
         *
         * IMPORTANT : Almost all methods, including custom methods, have the following form:
         *
         *  actionInitiationSuccess = aMethod(property, value, callback);
         *      or
         *  actionInitiationSuccess = aMethod(value, callback);
         *
         * When actionInitiationSuccess is false the callback WILL NEVER be called.
         * Only when true is the callback ALWAYS called.
         *
         * TODO : stop using success return value, do everything through the callback.
         * This better fits with the event processing function conventions and simplifies a lot of things.
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
         * //TODO : improve sync/update semantics
         * The mixin processes two types of incoming events :
         *
         * - wantToEdit
         * - wantToUpdateToRemote
         * - wantToUpdateFromRemote
         *
         * For convenience these events can called using the following public methods:
         *
         *  edit(property, value, editProcessedCb)      edit local property value
         *  updateToRemote(syncReadyCb)                 update local property values to server
         *  update(updateReadyCb)                       get remote property values from server
         *
         * When the edit method is called, not only is the data <property> set to <value>, also the value is validated
         * if validation has been implemented for the property using a method with the following naming convention:
         *
         *  _validate<Property>(value)
         *
         * This method must return a validity object, see below.
         *
         * TODO : Complex state syncing
         * Further, the global sync state is set to NOT_SYNCED when the new value for the property is
         * different from the old value. To assess if two property values are equal it will use a custom method if
         * available, using the following naming convention:
         *
         *  isEqual<Property>(val1, val2)
         *
         * When the updateToRemote() method is called it is checked if globalSyncing is NOT_SYNCED.
         * If so, the _updateToRemote(updateToRemoteReadyCb) method is called. This method needs to be overridden by
         * the class that uses this mixin and implements the actual updating to the server.
         * When the updateToRemoteReadyCb(err) callback is called without error the globalSyncing is set to SYNCED.
         *
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
         * Get data state for <property>
         *
         * @param property
         *
         * @returns {*}
         *
         */
        getState : function(property) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::getState".fmt(iName);

            var value           = null;

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to get data state for property");
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
                _l.error(me, "Property is not valid, unable to get error state for property");
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
                _l.error(me, "Property is not valid, unable to get error state for property");
                return value;
            }

            return _.get(this._getState("validity"), property);
        },

        /**
         *
         * Edit data <property> by setting it to a new <value>
         *
         * @param property          property for which to edit a value
         * @param value             New value for property
         * @param editProcessedCb   function(err), callback called when the edit has been processed throughout
         *                          the whole MVC
         *
         */
        edit : function(property, value, editProcessedCb) {
            this.wantToEdit(
                    this,
                    {
                        what : property,
                        data : value
                    },
                    editProcessedCb);
        },

        wantToEdit : function(origin, data, editProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::edit".fmt(iName);

            var dataUpdating    = false;

            var callbackGiven   = _.func(editProcessedCb);

            var __returnError   = function(err) {
                callbackGiven ? editProcessedCb(err) :  _l.error(me, "Error occurred : ", _.stringify(err));
            };

            if (!this._stateInitialized) {
                __returnError({
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (!this.isValid()) {
                __returnError({
                    message : "Model is invalid, unable to edit"
                });
                return;
            }

            var dataDesc        = 'Data of wantToEdit event';
            var property        = _.get(data, 'what', dataDesc);
            var newValue        = _.get(data, 'data', dataDesc);

            var errHash         = null;

            //Update Data State Callback called
            var udsCbCalled     = false;
            //Parallel tasks callback called
            var ptCbCalled      = false;

            var finalCbCalled   = false;

            var __finalCallback = function() {
                if (dataUpdating && !(udsCbCalled && ptCbCalled)) {
                    return;
                }

                if (!finalCbCalled) {
                    finalCbCalled = true;
                } else {
                    _l.error(me, "UNEXPECTED : Final callback already called, will not call again");
                    return;
                }

                if (_.obj(errHash)) {
                    __returnError({
                        message: "One or more errors occurred editing property {0}".fmt(property),
                        originalError: {
                            error_hash: errHash
                        }
                    });
                } else if (callbackGiven) {
                    editProcessedCb();
                }
            };

            var __dataStateUpdatedCb = function(_err) {
                udsCbCalled = true;

                if (_.def(_err)) {
                    errHash = errHash || {};
                    errHash["update global sync state"] = _err;
                }

                __finalCallback();
            };

            var __parallelTasksCb = function(_err) {
                ptCbCalled = true;

                if (_.def(_err)) {
                    errHash = errHash || {};
                    errHash["update validity of property {0}".fmt(property)] = {
                        error_hash : _err
                    };
                }

                __finalCallback();
            };

            dataUpdating = this._updateDataState(property, newValue, __dataStateUpdatedCb);
            if (dataUpdating) {

                var parallelTasks = {};

                parallelTasks["update global sync state"] = function(cbReady) {
                    if (!this._updateGlobalSyncState(SyncState.NOT_SYNCED, cbReady)) {
                        cbReady({
                            message : "Problem initiating _updateGlobalSyncState"
                        });
                    }
                };

                parallelTasks["update validity of property {0}".fmt(property)] = function(cbReady) {
                    var validity = this._callCustomMethod("_validate", property, newValue, false);
                    if (!this._updateValidityState(property, validity, cbReady)) {
                        cbReady({
                            message : "Problem initiating _updateValidityState"
                        });
                    }
                };

                _.execASync(parallelTasks, __parallelTasksCb)

            } else {
                __finalCallback();
            }

            return dataUpdating;
        },

        updateToRemote : function(updateToRemoteCb) {
            this.wantToUpdateToRemote(
                    this,
                    null,
                    updateToRemoteCb);
        },

        wantToUpdateToRemote : function(origin, data, syncProcessedCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::wantToUpdateToRemote".fmt(iName);
            var self            = this;

            var callbackGiven   = _.func(syncProcessedCb);

            var __returnError   = function(err) {
                callbackGiven ? syncProcessedCb(err) :  _l.error(me, "Error occurred : ", _.stringify(err));
            };

            if (!this._stateInitialized) {
                __returnError({
                    message : "State object is not initialized (correctly), call _initStateProcessing() in " +
                              "your model-constructor first"
                });
                return;
            }

            if (this.isValid() === false) {
                __returnError({
                    message : "Model is invalid, unable to update to remote"
                });
                return;
            }

            var validityState = this._state.globalValidity;
            if (!_.empty(validityState)) {
                _l.error(me, ("The following properties are invalid, " +
                              "unable to update to remote: {0}").fmt(_.stringify(validityState)));
                return;
            }

            var syncState = this._state.globalSyncing;
            if (syncState > SyncState.NOT_SYNCED) {
                _l.info(me, "Syncing not required, global sync state is : {0}".fmt(SyncStateName[syncState]));

                if (callbackGiven) { syncProcessedCb(); }
                return;
            }

            var syncingStarted = this._sync(function(err) {
                if (_.def(err)) {
                    __returnError(err);
                    return;
                }

                self._updateGlobalSyncState(SyncState.SYNCED, syncProcessedCb);
            });

            if (!syncingStarted) {
                __returnError({
                    message : "A problem occurred syncing, data was not synced"
                });
            }
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _initStateProcessing : function() {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::ModelProcessesState::_initStateProcessing";

            if (!_.interfaceAdheres(this, ModelProcessesState.REQUIRED_VIEW_API)) {
                _l.error(me, "Init state processing failed : this model does not adhere to " +
                             "the required interface for this mixin");
                _.info(me, "Required model interface : ", _.stringify(ModelProcessesState.REQUIRED_MODEL_API));
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

            return stateData;
        },

        /**
         *
         * Updates the data state <property> to <value> and notifies connected controllers that it is updated.
         * After updating the controllers, if it is defined, a custom method
         * _updateDataStateFor<Property>(value, readyCb) is called.
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
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateDataState : function(property, value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateDataState".fmt(iName);

            var success = false;
            var updated = false;
            var err     = {
                error_hash : {}
            };

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your model-constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update data state and notify controllers");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            if (this._isEqual(property, this._state.data[property], value)) {
                _l.debug(me, "Value for property {0} did not change, nothing to update".fmt(property));
                //In next runloop, callback without error but with updated = false
                setTimeout(function() { updateProcessedCb(updated, err); }, 0);
                return (success = true);
            }

            this._state.data[property] = value;
            updated = true;

            success = this._dispatchToControllers("dataStateUpdated", {
                what : property,
                data : value
            }, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched dataStateUpdated to controllers"] = _err;
                }

                var result = this._callCustomMethod("_updateDataStateFor", property, value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _updateDataStateFor {0}".fmt(property)] = _err;
                    }

                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                } else if (result.result !== true) {
                    err.error_hash["initiating custom method _updateDataStateFor {0}".fmt(property)] = {
                        message : "A problem occurred initiating custom method"
                    };

                    updateProcessedCb(updated, err);
                }
            });

            return success;
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
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateGlobalSyncState : function(value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalSyncState".fmt(iName);

            var success = false;
            var updated = false;
            var err     = {
                error_hash : {}
            };

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your model-constructor first");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            if (_.equals(this._state.globalSyncing, value)) {
                _l.debug(me, "Value for global sync state did not change, nothing to update");
                //In next runloop, callback without error but with updated = false
                setTimeout(function() { updateProcessedCb(updated); }, 0);
                return (success = true);
            }

            this._state.globalSyncing = value;
            updated = true;

            success = this._dispatchToControllers("globalSyncStateUpdated", value, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched globalSyncStateUpdated to controllers"] = _err;
                }

                var result = this._callCustomMethod("_globalSyncStateUpdated", "", value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _globalSyncStateUpdated"] = _err;
                    }

                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                } else if (result.result !== false) {
                    err.error_hash["initiating custom method _globalSyncStateUpdated"] = {
                        message : "A problem occurred initiating custom method"
                    };

                    updateProcessedCb(updated, err);
                }
            });

            return success;
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
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateGlobalErrorState : function(value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalErrorState".fmt(iName);

            var success = false;
            var updated = false;
            var err     = {
                error_hash : {}
            };

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your constructor first");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            if (_.equals(this._state.globalError, value)) {
                _l.debug(me, "Value for global error state did not change, nothing to update");
                //In next runloop, callback without error but with updated = false
                setTimeout(function() { updateProcessedCb(updated); }, 0);
                return (success = true);
            }

            this._state.globalError = value;
            updated = true;

            success = this._dispatchToControllers("globalErrorStateUpdated", value, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched globalErrorStateUpdated to controllers"] = _err;
                }

                var result = this._callCustomMethod("_globalErrorStateUpdated", "", value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _globalErrorStateUpdated"] = _err;
                    }

                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                } else if (result.result !== false) {
                    err.error_hash["initiating custom method _globalErrorStateUpdated"] = {
                        message : "A problem occurred initiating custom method _globalErrorStateUpdated"
                    };

                    updateProcessedCb(updated, err);
                }
            });

            return success;
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
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateErrorState : function(property, value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateErrorState".fmt(iName);
            var self    = this;

            var success = false;
            var updated = false;
            var err     = {
                error_hash : {}
            };

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update error state and notify controllers");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            if (_.equals(this._state.error[property], value)) {
                _l.debug(me, "Value for error state of property {0} did not change, nothing to update".fmt(property));
                //In next runloop, callback without error but with updated = false
                setTimeout(function() { updateProcessedCb(updated); }, 0);
                return (success = true);
            }

            this._state.error[property] = value;
            updated = true;

            success = this._dispatchToControllers("errorStateUpdated", {
                what : property,
                data : value
            }, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched errorStateUpdated to controllers"] = _err;
                }

                var initSuccess = self._updateGlobalErrorState(self._calcGlobalErrorState(), function(_updated, _err) {
                    if (_.def(_err)) {
                        err.error_hash["updating globalErrorState"] = _err;
                    }

                    var result = self._callCustomMethod("_errorStateUpdatedFor", "", value, function (_err) {
                        if (_.def(_err)) {
                            err.error_hash["calling custom method _errorStateUpdatedFor {0}".fmt(property)] = _err;
                        }

                        updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                    });

                    if (!result.called) {
                        updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                    } else if (result.result === false) {
                        err.error_hash["Initiating custom method _errorStateUpdatedFor {0}".fmt(property)] = {
                            message : "Problem occurred initiating"
                        };

                        updateProcessedCb(updated, err);
                    }
                });

                if (!initSuccess) {
                    err.error_hash["Initiating _updateGlobalErrorState"] = {
                        message : "Problem occurred initiating _updateGlobalErrorState"
                    };

                    updateProcessedCb(updated, err);
                }
            });

            return success;
        },

        /**
         *
         * Provides a list of properties that have errors.
         *
         * @returns {number} Provides a list of properties that have errors. Null means unknown.
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

            globalErrorState    = [];
            var error           = this._state.error;
            if (_.empty(error)) {
                return globalErrorState;
            }

            var errState = null;
            for (var property in error) {
                if (!error.hasOwnProperty(property)) {
                    continue;
                }

                errState = error[property];
                if (_.def(errState) && (errState !== false)) {
                    globalErrorState.push(property);
                }
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
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateGlobalValidityState : function(value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalValidityState".fmt(iName);

            var success = false;
            var updated = false;
            var err     = {
                error_hash : {}
            };

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your constructor first");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            if (_.equals(this._state.globalValidity, value)) {
                _l.debug(me, "Value for global error state did not change, nothing to update");
                //In next runloop, callback without error but with updated = false
                setTimeout(function() { updateProcessedCb(updated); }, 0);
                return (success = true);
            }

            this._state.globalValidity = value;
            updated = true;

            success = this._dispatchToControllers("globalValidityStateUpdated", value, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched globalValidityStateUpdated to controllers"] = _err;
                }

                var result = this._callCustomMethod("_globalValidityStateUpdated", "", value, function(_err) {
                    if (_.def(_err)) {
                        err.error_hash["calling custom method _globalValidityStateUpdated"] = _err;
                    }

                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                });

                if (!result.called) {
                    updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                } else if (result.result !== false) {
                    err.error_hash["initiating custom method _globalValidityStateUpdated"] = {
                        message : "A problem occurred initiating"
                    };

                    updateProcessedCb(updated, err);
                }
            });

            return success;
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
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateValidityState : function(property, value, updateProcessedCb) {
            var iName   = _.exec(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateValidityState".fmt(iName);

            var success = false;
            var updated = false;
            var err     = {
                error_hash : {}
            };

            if (!this._stateProcessingInitialized) {
                _l.error(me, "State processing is not initialized (correctly), call _initStateProcessing() in " +
                             "your constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update validity state and notify controllers");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            if (_.equals(this._state.validity[property], value)) {
                _l.debug(me, ("Value for validity state of property {0} did not change, " +
                              "nothing to update").fmt(property));
                //In next runloop, callback without error but with updated = false
                setTimeout(function() { updateProcessedCb(updated); }, 0);
                return (success = true);
            }

            this._state.validity[property] = value;
            updated = true;

            success = this._dispatchToControllers("validityStateUpdated", {
                what : property,
                data : value
            }, function(_err) {
                if (_.def(_err)) {
                    err.error_hash["dispatched validityStateUpdated to controllers"] = _err;
                }

                var initSuccess = self._updateGlobalValidityState(self._calcGlobalValidityState(), function(_updated, _err) {
                    if (_.def(_err)) {
                        err.error_hash["updating globalValidityState"] = _err;
                    }

                    var result = self._callCustomMethod("_validityStateUpdatedFor", "", value, function (_err) {
                        if (_.def(_err)) {
                            err.error_hash["calling custom method _validityStateUpdatedFor {0}".fmt(property)] = _err;
                        }

                        updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                    });

                    if (!result.called) {
                        updateProcessedCb(updated, !_.empty(err.error_hash) ? err : null);
                    } else if (result.result === false) {
                        err.error_hash["Initiating custom method _validityStateUpdatedFor {0}".fmt(property)] = {
                            message : "Problem occurred initiating"
                        };

                        updateProcessedCb(updated, err);
                    }
                });

                if (!initSuccess) {
                    err.error_hash["Initiating _updateGlobalValidityState"] = {
                        message : "Problem occurred initiating"
                    };

                    updateProcessedCb(updated, err);
                }
            });

            return success;
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
            var customFunc      = this[customFuncName];
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