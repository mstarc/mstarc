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

        $statics                : {
            REQUIRED_STATEMANAGER_API : {
                methods : ['goToState']
            }
        },

        _stateChangeHandler     : null,

        /**
         *
         * Abstract State Router.
         *
         * The state router encapsulates a given state manager.
         *
         *
         * Using parse() it can parse a requests string (e.g. URL path) and route to a state that matches a given
         *  mapping of the request to a state.
         *
         * Using routeTo() it can directly go to a given state. It can also generate a request string based on a
         * matching mapping between a request and the given state. This is only done when the onStateChange(handler) is
         * set (see below).
         *
         * For parse() and routeTo() above, the request, state and state data are given to a onStateChange handler
         *  function that can be provided calling onStateChange(handler), where the handler
         *  is a function(request, stateName, data). This can be used to, for instance, change the URL of the browser
         *  using pushState()
         *
         * From the perspective of M*C, a state manager only needs to expose a goToState(stateName[, data]) method.
         * The mapping from request to state and from state to request needs to be implemented in a child class using
         *  the methods described below.
         *
         * The following methods need to be implemented in a child class.
         *
         * *** Protected methods to implement ***
         *
         *  _createRoute(name, requestPattern, handler)
         *                                          name string of route
         *                                          requestPattern is usually a string or a regular expression.
         *                                          handler is a function(routeName, matchedRequest, data) where
         *                                           - matchedRequest is the request string that matched with the route
         *                                           - data in an object with properties derived from the matchedRequest
         *                                             This data is given to the state that relates to the route.
         *
         *                                          Returns true on success, else false
         *
         *  _parse(request)                         If the given request matches a route its handler will be called.
         *
         *
         *  _generateRequest(routeName, data)       routeName for which to generate request string based on data
         *                                          Optional data to use to generate request string
         *
         *
         *                                          Returns request string
         *
         * Optionally you can also override _setup(). The success value returned by this method defines
         *  the instance validity. A new implementation of _setup() should also call the parent implementation because
         *  it checks the validity of the injected stateManager instance.
         *
         *
         * @class           StateRouter
         * @extends         Base
         *
         * @constructor
         *
         * @param {object} stateManager     stateManager instance
         * @param {object} [config]         Optional configuration object
         *
         */
        constructor: function(stateManager, config) {
            NS.StateRouter.$super.call(this);

            this._stateManager          = stateManager;
            this._addConfigProperties(config);

            this._requestStateMapping   = {};

            this._valid = this._setup();
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

            success =  this._createRoute(stateName, requestPattern, function(matchedRequest, data) {
                self._stateManager.goToState(stateName, data);

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

        parse : function(request) {
            var me      = "StateRouter::parse";
            var self    = this;
            var success = false;

            if (!this.isValid()) {
                _l.error(me, "State router is invalid, unable to parse request.");
                return success;
            }

            return this._parse(request);
        },

        routeTo : function(stateName, data) {
            var me      = "StateRouter::routeTo";

            if (this.isValid()) {
                _l.error(me, "State router is invalid, unable to go to state [{0}]".fmt(stateName));
                return false;
            }

            this._stateManager.goToState(stateName, data);
            var request = this._generateRequest(stateName, data);

            if (_.def(request)) {
                var h = _.ensureFunc(this._stateChangeHandler);
                h(request, stateName, data);
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

            success = success && _.interfaceAdheres(
                            this._stateManager,
                            NS.StateRouter.REQUIRED_STATEMANAGER_API,
                            "State manager");

            return success;
        },

        _createRoute : function(name, requestPattern, handler) {
            _l.error("StateRouter::_createRoute", "No implementation provided, " +
                     "implement this method in your child class");

            return false;
        },

        _parse : function(request) {
            _l.error("StateRouter::_parse", "No implementation provided, " +
                     "implement this method in your child class");

            return false;
        },

        _generateRequest(routeName, data) {
            _l.error("StateRouter::_parse", "No implementation provided, " +
                    "implement this method in your child class");

            return null;
        }

    });
})();
