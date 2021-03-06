/**
 * Created by Freddy on 01/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;
    var Class       = window.jsface.Class;

    var $           = window.$;

    NS.CanShowUI = Class({

        /**
         *
         * CanShowUI Mixin. Adds a public method showUI.
         * This method assumes a _DOMContainer HTML element and a 'visible' class
         * that enables the container to be shown when added.
         *
         * Also a wantToShowUI method is added to handle this showUI as an event
         *
         * @class   CanShowUI
         * @module  M*C
         *
         * @for     View
         *
         */

        /**
         *
         * @param {boolean} [show = true]      Set to false to hide the UI
         *
         */
        showUI : function(show, showReadyCb) {
            var iName           = _.exec(this, 'getIName') || "[UNKOWN]";
            var me              = "{0}::CanShowView::showUI".fmt(iName);

            if (!this.isValid()) {
                _l.error(me, "View is not valid, unable to show UI");
                return;
            }

            if (!this.isRendered()) {
                _l.error(me, "View not rendered, unable to show UI");
                return;
            }

            if (!_.bool(show)) {
                show = true;
            }

            if (show) {
                $(this._DOMContainer).addClass("show");
            } else {
                $(this._DOMContainer).removeClass("show");
            }

            //TODO : really wait for transition to complete?
            _.ensureFunc(showReadyCb)();
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _wantToShowUI : function(origin, show, showReadyCb) {

            this.showUI(show, showReadyCb);

        }

    });
})();

