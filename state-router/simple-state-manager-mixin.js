/**
 * Created by Freddy Snijder on 12/02/16.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;

    var Class               = window.jsface.Class;

    NS.SimpleStateManagerMixin = Class({

        $statics                : {
            REQUIRED_STATEMANGER_API : {
                methods : ['goToState']
            }
        },

        /**
         *
         * Mixin implementing state manger functionality for StateRouter based on M*C's SimpleStateManager.
         * In fact, any state manager for which you only need to call stateManager.goToState(name, data)
         * works with this mixin.
         *
         * You need to inject your state manager instance using the StateRouter config object, such that
         * we will have a _stateManager property available.
         *
         * Example :
         *
         * // Your app's state manager instance
         * var stateManager     = new SimpleStateManager();
         *
         * // ...
         *
         * // Create a functional State Router by mixing in router functionality and state management functionality
         * var AppStateRouter   = Class([StateRouter, TildeIORouteRecognizerMixin, SimpleStateManagerMixin], {
         *      constructor : function(config) {
         *          AppStateRouter.$super.call(this, config);
         *      }
         * });
         *
         * // Create your apps state router by injecting an your app's state manager instance
         * var router           = new AppStateRouter({
         *      stateManager : stateManager
         * });
         *
         * 
         * @module          M*C
         * @class           SimpleStateManagerMixin
         *
         * @for             StateRouter
         *
         */

        /********************************************************************
         *
         *  PROTECTED METHODS
         *
         ********************************************************************/

        _setupStateManager : function() {
            var me      = "[{0}]::SimpleStateManagerMixin::_setupRouter".fmt(this);
            var success = true;

            success = success && _.interfaceAdheres(
                            this._stateManager,
                            NS.SimpleStateManagerMixin.REQUIRED_STATEMANGER_API,
                            "Simple state manager instance");

            return success;
        },

        _goToState : function(stateName, data, fromStateName) {
            return this._stateManager.goToState(stateName, data);
        }
    });
})();
