/**
 * Created by Freddy on 22/05/15.
 */

(function() {
    window.NS               = window.NS || {};

    var MSTARC              = window.__VI__ || window;

    var _                   = MSTARC.utils;
    var _l                  = MSTARC.logger;

    NS.waitingAppReadyState = {

        name            : "waiting-app-ready",
        stateManager    : null,

        onEnter : function() {
            _l.info("State [{0}]::onEnter".fmt(this.name), "Waiting for app the app to be ready ...");
        },

        onExit : function() {
            _l.info("State [{0}]::onExit".fmt(this.name), "Leaving state ...");
        },

        appReady : function() {
            _l.info("State [{0}]::appReady".fmt(this.name),
                    "App is ready, let's got to the initial (home) state of the app ...");

            NS.stateManager.goToState("home");
        }

    };

})();