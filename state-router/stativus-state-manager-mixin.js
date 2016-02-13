/**
 * Created by Freddy Snijder on 12/02/16.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;

    var Class               = window.jsface.Class;

    NS.StativusStateManagerMixin = Class({

        $statics                : {
            REQUIRED_STATEMANGER_API : {
                methods : ['getState']
            },

            REQUIRED_STATE_API : {
                methods : ['goToState']
            }
        },

        /**
         *
         * Mixin implementing state manger functionality for StateRouter based on Stativus.
         * @see http://stativ.us
         *
         * You need to inject your state manager instance using the StateRouter config object, such that
         * we will have a _stateManager property available.
         *
         * Example :
         *
         * // Your app's Stativus state manager instance
         * var stateManager     = Stativus.createStatechart();
         *
         * // ...
         *
         * // Create a functional State Router by mixing in router functionality and state management functionality
         * var AppStateRouter   = Class([StateRouter, TildeIORouteRecognizerMixin, StativusStateManagerMixin], {
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
         * *** Inside a state *** you can now do :
         *
         * router.route(url, this); //this is the current state object (the from state)
         * router.route(url, this.name); //this.name is the state's name (the from state)
         *
         * OR
         *
         * router.goTo("some-state-name", this); //this is the current state object (the from state)
         * router.goTo("some-state-name", this.name); //this.name is the state's name (the from state)
         *
         * 
         * @module          M*C
         * @class           StativusStateManagerMixin
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
            var me      = "[{0}]::StativusStateManagerMixin::_setupRouter".fmt(this);
            var success = true;

            success = success && _.interfaceAdheres(
                            this._stateManager,
                            NS.StativusStateManagerMixin.REQUIRED_STATEMANGER_API,
                            "Stativus state manager instance");

            return success;
        },

        _goToState : function(stateName, data, fromState) {
            var me      = "[{0}]::StativusStateManagerMixin::_goToState".fmt(this);

            if (!_.hasMethod(fromState, "goToState")) {
                //is it a string?
                if (_.string(fromState) && (!_.empty(fromState))) {
                    fromState = this._stateManager(fromState);
                }
            }

            if (!_.hasMethod(fromState, "goToState")) {
                _l.error(me, "No valid from state found, don't know from where to go to state [{0}]".fmt(stateName));
                return false;
            }

            fromState.goToState(stateName, data);

            return true;
        }
    });
})();
