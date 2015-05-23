/**
 * Created by Freddy on 22/05/15.
 */

(function() {
    window.NS           = window.NS || {};

    var MSTARC          = window.__VI__ || window;

    var _               = MSTARC.utils;
    var _l              = MSTARC.logger;

    NS.stateManager     = new MSTARC.SimpleStateManager();
    NS.stateManager.addState(NS.waitingAppReadyState);
    NS.stateManager.addState(NS.homeState);
    NS.stateManager.addState(NS.countState);


    _l.info("M*C", "Welcome to the basic M*C example!");

    NS.app              = new MSTARC.Application(
            "Basic M*C Example",
            NS.stateManager,
            {
                services : {},
                managers : {}
            }
    );


    NS.stateManager.goToState("waiting-app-ready");

    //sends appReady event to stateManager
    //Normally you would extend MSTARC.Application and override start to provide your start-up code.
    //(and calling super.start() when your start sequence is ready)
    NS.app.start();
})();