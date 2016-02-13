/**
 * Created by Freddy Snijder on 12/02/16.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;

    var Class               = window.jsface.Class;
    var StateRouter         = NS.StateRouter;

    var RouteRecognizer     = window.RouteRecognizer;

    NS.TildeIOStateRouter   = Class(StateRouter, {

        $statics                : {
            REQUIRED_ROUTERECOGNIZER_API : {
                methods : ['add', 'recognize', 'generate']
            }
        },

        _router : null,

        /**
         *
         * State Router implementation based on TildeIO's RouteRecognizer.
         * @see https://github.com/tildeio/route-recognizer
         *
         *
         * @class           TildeIOStateRouter
         * @extends         Base
         *
         * @constructor
         *
         * @param {object} stateManager     stateManager instance
         * @param {object} [config]         Optional configuration object
         *
         */
        constructor: function(stateManager, config) {
            NS.TildeIOStateRouter.$super.call(this, stateManager, config);
        },

        /********************************************************************
         *
         *  PROTECTED METHODS
         *
         ********************************************************************/

        _setup : function() {
            var me      = "TildeIOStateRouter::_setup";
            var success = NS.TildeIOStateRouter.$superp._setup.call(this);

            if (_.func(RouteRecognizer)) {
                this._router = new RouteRecognizer();

                success = success && _.interfaceAdheres(
                                this._router,
                                NS.TildeIOStateRouter.REQUIRED_ROUTERECOGNIZER_API,
                                "Route recognizer");
            } else {
                _l.error(me, "No valid RouteRecognizer class available, please load the RouteRecognizer library " +
                             "before this class (see https://github.com/tildeio/route-recognizer)");
                success = false;
            }

            return success;
        },

        _createRoute : function(name, requestPattern, handler) {
            this._router.add([{ path: requestPattern, handler: handler }], { as : name });
            return true;
        },

        _parse : function(request) {
            var me = "StateRouter::_parse";
            var result = this._router.recognize(request);

            if ((!_.object(result)) || (_.empty(result))) {
                _l.warn(me, "No route found for [{0}]".fmt(request));
                return false;
            }

            result = result[0];
            result.handler(request, result.params);

            return true;
        },

        _generateRequest(routeName, data) {
            return this._router.generate(routeName, data);
        }

    });
})();
