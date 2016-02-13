/**
 * Created by Freddy on 22/05/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;

    var Class               = window.jsface.Class;
    var Base                = NS.Base;

    NS.SimpleStateManager   = Class(Base, {

        _currentState : null,

        _states       : null,

        /**
         *
         * Simple Statemanager.
         *
         * *** Created for simple apps that don't require concurrent states or nested states.
         *     Please consider state managers like Stativus or Ember statemanager as alternative. ****
         *
         * From the perspective of M*C, a statemanager only needs to expose a
         *   sendEvent(eventName, data, ...) method
         *
         * @class           SimpleStateManager
         * @extends         Base
         *
         * @constructor
         *
         */
        constructor: function() {
            NS.SimpleStateManager.$super.call(this);

            this._states    = {};
            this._valid     = true;
        },

        addState : function(stateObj) {
            var me      = "SimpleStateManager::addState";
            var success = false;

            if (!_.obj(stateObj)) {
                _l.error(me, "No valid state object provided, no state to add");
                return success;
            }

            var stateName = stateObj.name;
            if ((!_.string(stateName)) || (_.empty(stateName))) {
                _l.error(me, "No valid state name given in state object, " +
                             "please provide a name property in your state object");
                return success;
            }

            this._states[stateName] = stateObj;

            return (success = true);
        },

        goToState : function(stateName) {
            var me      = "SimpleStateManager::goToState";
            var success = false;


            //Call on exit for current state
            if (_.obj(this._currentState)) {
                this.sendEvent("onExit");
            }

            var newState = this._states[stateName];
            if (!_.obj(newState)) {
                _l.error(me, "State {0} does not exist, did not change state".fmt(stateName));
                return success;
            }

            var currentStateName = _.get(this._currentState, "name") || "[NO STATE]";
            _l.info(me, "Changing from state {0} to state {1}".fmt(currentStateName, newState.name));
            this._currentState = newState;

            this.sendEvent("onEnter");

            return (success = true);
        },

        sendEvent : function(event) {
            var me      = "SimpleStateManager::sendEvent";
            var success = false;

            if (!_.obj(this._currentState)) {
                _l.error(me, "We are currently stateless, please add states using addState and then " +
                             "use goToState to select a state");
                return success;
            }

            if (!_.hasMethod(this._currentState, event)) {
                _l.debug(me, ("State {0} does not have a method called {1}, " +
                              "unable to handle event, doing nothing").fmt(this._currentState.name, event));
                return success;
            }

            var args = Array.prototype.slice.call(arguments);
            args.splice(0, 1);

            this._currentState[event].apply(this._currentState, args);
            return (success = true);
        }

    });
})();
