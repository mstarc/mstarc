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

        _state : null,

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
         *      globalSyncing : <unknown || not_synced || syncing || synced>,
         *
         *      //sync state of each property
         *      syncing : {
         *          <prop_1> : <unknown || not_synced || syncing || synced || null>,
         *          ...
         *          <prop_N> : <unknown || not_synced || syncing || synced || null>
         *      },
         *
         *      //overall error state
         *      globalError : <error_object || boolean || null>,
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
                data        : {},

                globalSync  : SyncState.UNKNOWN,
                syncState   : {},

                globalError : null,
                error       : {}
            };
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

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update data state and notify controllers");
                return success;
            }

            _.set(this._state, "data."+property, value, "State object");

            this._dispatchToControllers("dataStateUpdated", {
                what : property,
                data : value
            });
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

            _.set(this._state, "globalSyncing", value, "State object");

            this._dispatchToControllers("globalSyncStateUpdated", value);
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

            var success = false;

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update sync state and notify controllers");
                return success;
            }

            _.set(this._state, "syncing."+property, value, "State object");

            this._dispatchToControllers("syncStateUpdated", {
                what : property,
                data : value
            });
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

            _.set(this._state, "globalError", value, "State object");

            this._dispatchToControllers("globalErrorStateUpdated", value);
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

            var success = false;

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update error state and notify controllers");
                return success;
            }

            _.set(this._state, "error."+property, value, "State object");

            this._dispatchToControllers("errorStateUpdated", {
                what : property,
                data : value
            });
        },

        /**
         *
         * Updates the validity state of <property> to <value> and notifies connected controllers that it is updated.
         * When the update is processed you can optionally use the updateProcessedCb(err) callback
         *
         * This method sends a errorStateUpdated event to the controllers with the following data object:
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

            if (!_.string(property) || _.empty(property)) {
                _l.error(me, "Property is not valid, unable to update validity state and notify controllers");
                return success;
            }

            _.set(this._state, "error."+property, value, "State object");

            this._dispatchToControllers("validityStateUpdated", {
                what : property,
                data : value
            });
        }

    });
})();