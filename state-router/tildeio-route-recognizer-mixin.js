/**
 * Created by Freddy Snijder on 12/02/16.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;

    var Class               = window.jsface.Class;

    var RouteRecognizer     = window.RouteRecognizer;

    NS.TildeIORouteRecognizerMixin = Class({

        $statics                : {
            REQUIRED_ROUTERECOGNIZER_API : {
                methods : ['add', 'recognize', 'generate']
            }
        },

        _router : null,

        /**
         *
         * Mixin implementing router functionality for StateRouter based on TildeIO's RouteRecognizer
         * @see https://github.com/tildeio/route-recognizer
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
         * @module          M*C
         * @class           TildeIORouteRecognizerMixin
         *
         * @for             StateRouter
         *
         */

        /********************************************************************
         *
         *  PROTECTED METHODS
         *
         ********************************************************************/

        _setupRouter : function() {
            var me      = "[{0}]::TildeIORouteRecognizerMixin::_setupRouter".fmt(this);
            var success = true;

            if (_.func(RouteRecognizer)) {
                this._router = new RouteRecognizer();

                success = success && _.interfaceAdheres(
                                this._router,
                                NS.TildeIORouteRecognizerMixin.REQUIRED_ROUTERECOGNIZER_API,
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

        _route : function(request, fromStateName) {
            var me = "[{0}]::TildeIORouteRecognizerMixin::_route".fmt(this);
            var result = this._router.recognize(request);

            if ((!_.object(result)) || (_.empty(result))) {
                _l.warn(me, "No route found for [{0}]".fmt(request));
                return false;
            }

            result = result[0];
            result.handler(request, result.params, fromStateName);

            return true;
        },

        _generateRequest : function(routeName, data) {
            var me = "[{0}]::TildeIORouteRecognizerMixin::_generateRequest".fmt(this);

            try {
                return this._router.generate(routeName, data);
            } catch(e) {
                return null;
            }
        }

    });
})();
