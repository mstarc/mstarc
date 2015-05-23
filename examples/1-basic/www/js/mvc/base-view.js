/**
 * Created by Freddy on 22/05/15.
 */

(function() {

    window.NS               = window.NS || {};

    var MSTARC              = window.__VI__ || window;

    var _                   = MSTARC.utils;
    var _l                  = MSTARC.logger;

    var Class               = window.jsface.Class;
    var View                = MSTARC.View;

    NS.BaseView             = Class(View, {

        _containerDOM : null,

        /**
         *
         * Base View.
         *
         * Providing shared functionality for all views in this example:
         * - showing/hiding the view
         *
         * @class           BaseView
         * @extends         View
         *
         * @param {string} viewName         Name of view
         * @param {HTMLElement} container   View container
         *
         * @constructor
         *
         */
        constructor: function(viewName, container) {
            this._container = container;

            //The ExampleModel parent will call _setup().
            //If _setup() returns false the validity of the model instance is set to false, else true.
            NS.BaseView.$super.call(this, viewName);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "BaseView::_setup";
            var success = true;

            if (!_.obj(this._container)) {
                _l.error(me, "No valid container provided, view will not function");
                success = false;
            }

            return success;
        },

        _wantToShowUI: function(controller, show) {
            if (!_.bool(show)) {
                show = true;
            }
            //Since this method is only called when the view is valid (when _setup returned true)
            //  no further checking on the validity of _container is required
            if (show) {
                this._container.classList.remove("hide");
            } else {
                this._container.classList.add("hide");
            }
        }
    });
})();
