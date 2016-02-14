/**
 * Created by Freddy Snijder on 08/02/16.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;

    var Class               = window.jsface.Class;
    var Base                = NS.Base;

    var Configurable        = NS.Configurable;

    NS.StateRouter   = Class([Base, Configurable], {

        _isBlocked              : false,

        _stateChangeHandler     : null,

        /**
         *
         * Abstract State Router.
         *
         * The state router combines router and state manager functionality to allow
         *  a) routing to a state based on a request string
         *  b) routing to a state based on a state name
         *
         * Using route(request[, fromState]) it can parse a requests string (e.g. URL path) and route to a state that
         *  matches a given mapping of the request to a state. fromState is optional and provides a means to
         *  indicate from which state the state manager needs to go to the matching state
         *  (can be a state object or state name).
         *
         * Using goTo(stateName, data, fromState) it can directly go to a given state from an optional fromState.
         * It can also generate a request string based on a matching mapping between a request and the given state.
         * This is only done when the onStateChange(handler) is set (see below).
         *
         * For route() and goTo() above, the request, state and state data are given to a onStateChange handler
         *  function that can be provided calling onStateChange(handler), where the handler
         *  is a function(request, stateName, data). This can be used to, for instance, change the URL of the browser
         *  using pushState()
         *
         * The routing functionality and the state manager functionality can be implemented as separate mixins
         *  that can be used to construct a child class of this abstract state router
         *
         * The following methods need to be implemented.
         *
         *
         * *** Protected methods to implement for routing functionality ***
         *
         *  _setupRouter()                          Do any setup and validate functionality during construction.
         *                                          Return true on success, else false
         *
         *  _createRoute(name, requestPattern, handler)
         *                                          name string of route
         *                                          requestPattern is usually a string or a regular expression.
         *                                          handler is a function with the following arguments
         *                                           - matchedRequest is the request string that matched with the route
         *                                           - data in an object with properties derived from the matchedRequest
         *                                             This data is given to the state that relates to the route.
         *                                           - fromState, state object or state name to route from
         *
         *                                          Returns true on success, else false
         *
         *  _route(request, fromState)              If the given request matches a route its handler will be called.
         *                                          The fromState needs to be forwarded to the handler, see above.
         *
         *                                          Returns true on success, else false
         *
         *
         *  _generateRequest(routeName, data)       routeName for which to generate request string based on data
         *                                          Optional data to use to generate request string
         *
         *                                          Returns request string on success, else null
         *
         *
         * *** Protected methods to implement for state manager functionality ***
         *
         *  _setupStateManager()                    Do any setup and validate functionality during construction.
         *                                          Return true on success, else false
         *
         *  _goToState(stateName, stateData, fromState)
         *                                          stateName is the name of the state to go to
         *                                          stateData is the data object to give as input to the new state
         *                                          fromState is optional and provides the state object or the name
         *                                              of the state from which to got to the new state, this is
         *                                              important when you use a state manager that can have multiple
         *                                              parallel states
         *
         *                                          Returns true on success, else false
         *
         *
         *
         * ****************************** EXAMPLE *******************************
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
         * @class           StateRouter
         * @extends         Base
         *
         * @constructor
         *
         * @param {object} [config]         Optional configuration object
         *
         */
        constructor: function(config) {
            NS.StateRouter.$super.call(this);

            this._addConfigProperties(config);

            this._valid = this._setup();
        },

        block : function() {
            var me      = "StateRouter::block";

            if (!this.isValid()) {
                _l.error(me, "State router is invalid, unable to block the router");
                return;
            }

            this._isBlocked = true;
        },

        unblock : function() {
            if (!this.isValid()) {
                _l.error(me, "State router is invalid, unable to unblock the router");
                return;
            }

            this._isBlocked = false;
        },

        /**
         *
         * Add a route, mapping a request pattern to a state
         *
         * @param requestPattern
         * @param stateName
         *
         * @returns {boolean}
         *
         */
        addRoute : function(requestPattern, stateName) {
            var me      = "StateRouter::addRoute";
            var self    = this;
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "State router is invalid, unable to add route");
                return success;
            }

            if (!_.string(requestPattern) || _.empty(requestPattern)) {
                _l.error(me, "No valid request pattern provided, unable to add route");
                return success;
            }

            if (!_.string(stateName) || _.empty(stateName)) {
                _l.error(me, "No valid state name provided, unable to add route");
                return success;
            }

            _l.info(me, "Adding route [{0}] ===> [{1}]".fmt(requestPattern, stateName));
            success =  this._createRoute(stateName, requestPattern, function(matchedRequest, data, fromState) {
                self._goToState(stateName, data, fromState);

                var h = _.ensureFunc(self._stateChangeHandler);
                h(matchedRequest, stateName, data);
            });

            return success;
        },

        onStateChange : function(handler) {
            var me = "StateRouter::onStateChange";

            if (_.func(handler)) {
                this._stateChangeHandler = handler;
            } else {
                _l.error(me, "Given handler is not a function, state change handler not set");
            }
        },

        route : function(request, fromState) {
            var me      = "StateRouter::route";
            var self    = this;
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "State router is invalid, unable to route request.");
                return success;
            }

            if (this._isBlocked === true) {
                _l.debug(me, "I'm blocked, will not route request [{0}]".fmt(request));
                return false;
            }

            return this._route(request, fromState);
        },

        goTo : function(stateName, data, fromState) {
            var me      = "StateRouter::goTo";

            if (!this.isValid()) {
                _l.error(me, "State router is invalid, unable to go to state [{0}]".fmt(stateName));
                return false;
            }

            if (this._isBlocked === true) {
                _l.debug(me, "I'm blocked, will not go to state [{0}]".fmt(stateName));
                return false;
            }

            var success = this._goToState(stateName, data, fromState);
            if (success !== true) {
                return success;
            }

            var request = this._generateRequest(stateName, data);

            if (_.def(request)) {
                var h = _.ensureFunc(this._stateChangeHandler);
                h(request, stateName, data, fromState);
            }

            return true;
        },

        /********************************************************************
         *
         *  PROTECTED METHODS
         *
         ********************************************************************/

        _setup : function() {
            var me      = "StateRouter::_setup";
            var success = true;

            success = this._setupRouter() && success;
            success = this._setupStateManager() && success;

            return success;
        },

        /********************* Routing functionality ************************/

        _setupRouter : function() {
            _l.error("StateRouter::_setupRouter", "No implementation provided, " +
                    "implement this method in your child class (e.g. use a given router mixin)");

            return false;
        },

        _createRoute : function(name, requestPattern, handler) {
            _l.error("StateRouter::_createRoute", "No implementation provided, " +
                     "implement this method in your child class (e.g. use a given router mixin)");

            return false;
        },

        _route : function(request, fromState) {
            _l.error("StateRouter::_route", "No implementation provided, " +
                     "implement this method in your child class (e.g. use a given router mixin)");

            return false;
        },

        _generateRequest(routeName, data) {
            _l.error("StateRouter::_generateRequest", "No implementation provided, " +
                    "implement this method in your child class (or use a given router mixin)");

            return null;
        },

        /********************* State management functionality ************************/

        _setupStateManager : function() {
            _l.error("StateRouter::_setupStateManager", "No implementation provided, " +
                    "implement this method in your child class (e.g. use a given router mixin)");

            return false;
        },

        _goToState : function(stateName, data, fromState) {
            _l.error("StateRouter::_goToState", "No implementation provided, " +
                    "implement this method in your child class (e.g. use a given state management mixin)");

            return null;
        }

    });
})();
