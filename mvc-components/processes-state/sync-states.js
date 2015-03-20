/**
 * Created by Freddy on 11/03/15.
 */

(function() {
    /**
     *
     * Local sync state. Are there local property values changed that need to be updated on the server?
     *
     * @type {*|Window}
     */

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
    NS.SyncStateName[NS.SyncState.NOT_SYNCED]   = "Not Synced";    //Local changes
    NS.SyncStateName[NS.SyncState.SYNCING]      = "Syncing";       //Updating server
    NS.SyncStateName[NS.SyncState.SYNCED]       = "Synced";        //Server updated
})();


