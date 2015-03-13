/**
 * Created by Freddy on 11/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;

    var Class       = window.jsface.Class;

    var SyncState   = NS.SyncState;

    NS.ModelProcessesState = Class({

        _state              : null,
        _stateInitialized   : false,

        /**
         *
         * ModelProcessesState Mixin for Model classes. Adds functionality to process state in a
         * standardized way.
         *
         *
         * IMPORTANT : Call _initStateProcessing() during construction of your class that uses this mixin
         *
         *
         * State is structured as follows:
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
         *      //sync state of each property
         *      syncing : {
         *          <prop_1> : <unknown || sync_error || not_synced || syncing || synced || null>,
         *          ...
         *          <prop_N> : <unknown || sync_error || not_synced || syncing || synced || null>
         *      },
         *
         *      //overall error state. How many properties have errors?
         *      globalError : <number>,
         *
         *      // Error object for any state property that has an error
         *      error : {
         *          <prop_1> : <prop_1_error_object || boolean || null>,
         *          ...
         *          <prop_N> : <prop_N_error_object || boolean || null>
         *      },
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
         * _updateSyncState(property, sync_value, updateProcessedCb)
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
         * _syncStateUpdatedFor<Property>(value)
         *
         * _globalErrorStateUpdated(value)
         * _errorStateUpdatedFor<Property>(value)
         *
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

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _initStateProcessing : function() {
            this._state = {
                //The actual state property values
                data            : {},

                globalSyncing   : SyncState.UNKNOWN,
                syncing         : {},

                globalError     : -1,
                error           : {},

                validity        : {}
            };

            this._stateInitialized = true;
        },


        /**
         *
         * Updates the data state <property> to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a dataStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the data state of <property>
         * @param {function} [updateProcessedCb]    Callback called when update has been processed
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateDataState : function(property, value, updateProcessedCb) {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateDataState".fmt(iName);

            var success = false;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update data state and notify controllers");
                return success;
            }

            this._state.data[property] = value;

            success = this._callCustomMethod("_updateDataStateFor", property, value);

            success = this._dispatchToControllers("dataStateUpdated", {
                what : property,
                data : value
            }, updateProcessedCb) && success;

            return success;
        },

        /**
         *
         * Updates the global sync state to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a globalSyncStateUpdated event to the controllers.
         *
         * @param {*} value                         New value for the global sync state
         * @param {function} [updateProcessedCb]    Callback called when update has been processed
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateGlobalSyncState : function(value, updateProcessedCb) {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalSyncState".fmt(iName);

            var success = false;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
                return success;
            }

            this._state.globalSyncing = value;

            success = this._callCustomMethod("globalSyncStateUpdated", "", value);
            success = this._dispatchToControllers("globalSyncStateUpdated", value, updateProcessedCb) && success;

            return success;
        },

        /**
         *
         * Updates the sync state of <property> to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a syncStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the sync state of <property>
         * @param {function} [updateProcessedCb]    Callback called when update has been processed
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateSyncState : function(property, value, updateProcessedCb) {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateSyncState".fmt(iName);
            var self    = this;

            var success = false;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
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
        },

        /**
         *
         * Calculates "most severe" sync state among all property sync states.
         *
         * @returns {number} One of the SyncState constants
         *
         * @protected
         */
        _calcGlobalSyncState : function() {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_calcGlobalSyncState".fmt(iName);

            var globalSyncState = SyncState.SYNCED;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
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
                //Is this sync state most severe?
                if (syncState < globalSyncState) {
                    globalSyncState = syncState;
                }
            }

            return globalSyncState;
        },

        /**
         *
         * Updates the global error state to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a globalErrorStateUpdated event to the controllers.
         *
         * @param {*} value                         New value of the global error state
         * @param {function} [updateProcessedCb]    Callback called when update has been processed
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateGlobalErrorState : function(value, updateProcessedCb) {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateGlobalErrorState".fmt(iName);

            var success = false;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
                return success;
            }

            this._state.globalError = value;
            success = this._callCustomMethod("_globalErrorStateUpdated", "", value);
            success = this._dispatchToControllers("globalErrorStateUpdated", value, updateProcessedCb) && success;

            return success;
        },

        /**
         *
         * Updates the error state of <property> to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a errorStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <error value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the error state of <property>
         * @param {function} [updateProcessedCb]    Callback called when update has been processed
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateErrorState : function(property, value, updateProcessedCb) {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateErrorState".fmt(iName);
            var self    = this;

            var success = false;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update error state and notify controllers");
                return success;
            }

            updateProcessedCb = _.ensureFunc(updateProcessedCb);

            this._state.error[property] = value;

            success = this._callCustomMethod("_errorStateUpdatedFor", property, value);
            success = this._dispatchToControllers("errorStateUpdated", {
                what : property,
                data : value
            }, function(err) {
                if (_.def(err)) {
                    _l.error(me, ("Processing errorStateUpdated event for {0} failed, " +
                                  "continuing anyway ... Error : ").fmt(property), _.stringify(err));
                }

                self._updateGlobalErrorState(self._calcGlobalErrorState(), function(_err) {
                    if (!_.def(_err)) {
                        //propagate error
                        _err = err;
                    }

                    updateProcessedCb(_err);
                });
            }) && success;

            return success;
        },

        /**
         *
         * Calculates how many properties have errors as global error state value.
         *
         * @returns {number} Number of properties that have errors, -1 implies unknown
         *
         * @protected
         */
        _calcGlobalErrorState : function() {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_calcGlobalErrorState".fmt(iName);

            var globalErrorState = -1;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
                return globalErrorState;
            }

            globalErrorState    = 0;
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
                    globalErrorState++;
                }
            }

            return globalErrorState;
        },

        /**
         *
         * Updates the validity state of <property> to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a validityStateUpdated event to the controllers with the following data object:
         * {
         *  what : <property>,
         *  data : <value>
         * }
         *
         * @param {string} property                 property that is updated
         * @param {*} value                         New value for the validity state of <property>
         * @param {function} [updateProcessedCb]    Callback called when update has been processed
         *
         * @returns {boolean}                       True if update was initiated successfully, false otherwise.
         *
         * @protected
         *
         */
        _updateValidityState : function(property, value, updateProcessedCb) {
            var iName   = _.call(this, 'getIName') || "[UNKOWN]";
            var me      = "{0}::ModelProcessesState::_updateValidityState".fmt(iName);

            var success = false;

            if (!this._stateInitialized) {
                _l.error(me, "State object is not initialized, call _initStateProcessing() in your constructor first");
                return success;
            }

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update validity state and notify controllers");
                return success;
            }

            this._state.validity[property] = value;

            success = this._callCustomMethod("_validityStateUpdatedFor", property, value);
            success = this._dispatchToControllers("validityStateUpdated", {
                what : property,
                data : value
            }, updateProcessedCb) && success;

            return success;
        },

        _callCustomMethod : function(methodPrefix, property, value) {
            var success         = true;

            var customFuncName  = methodPrefix+property;
            var customFunc      = this[customFuncName];
            if (_.func(customFunc)) {
                success = customFunc.call(this, value);
                if (!_.bool(success)) {
                    var iName   = _.call(this, 'getIName') || "[UNKOWN]";
                    var me      = "{0}::ModelProcessesState::_callCustomMethod".fmt(iName);

                    _l.warn(me, ("Custom method {0} did not return a " +
                                 "boolean success value, setting to true").fmt(customFuncName));

                    success = true;
                }
            }

            return success;
        }

    });
})();