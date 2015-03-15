/**
 * Created by Freddy on 11/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS = window.__VI__ || window;

    //Placed in order of severity
    NS.SyncState    = {
        UNKNOWN     : -2,
        SYNC_ERROR  : -1,
        NOT_SYNCED  : 0,
        SYNCING     : 1,
        SYNCED      : 2
    };

    NS.SyncStateName = {};
    NS.SyncStateName[NS.SyncState.UNKNOWN]      = "Unknown";
    NS.SyncStateName[NS.SyncState.SYNC_ERROR]   = "Syncing Error";
    NS.SyncStateName[NS.SyncState.NOT_SYNCED]   = "Not Synced";
    NS.SyncStateName[NS.SyncState.SYNCING]      = "Syncing";
    NS.SyncStateName[NS.SyncState.SYNCED]       = "Synced";
})();


