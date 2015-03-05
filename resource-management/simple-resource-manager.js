/**
 * Created by Freddy on 05/02/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                      = window.__VI__ || window;

    var _                       = NS.utils;
    var _l                      = NS.logger;
    var Class                   = window.jsface.Class;

    var ResourceManager         = NS.ResourceManager;
    var SpeaksREST              = NS.SpeaksREST;

    NS.SimpleResourceManager    = Class([ResourceManager, SpeaksREST], {

        $statics : {
            REQUIRED_HTTP_API_CLIENT_API : {
                methods : ['request']
            }
        },

        _httpAPI : null,


        /**
         *
         * A simple resource manager uses a HTTP API client to create, update, get and deleted resources
         * of a given type. The simple resource manager provides the protected methods _get, _post, _put and _delete
         * methods (of the SpeaksREST mixin) to request the HTTP API.
         *
         *
         * @class           SimpleResourceManager
         * @module          M*C
         *
         * @extends         ResourceManager
         *
         *
         * @constructor
         *
         * @param {String} resourceName                 name of resource
         *
         * @param {Object} httpAPI                      (HTTP) API to create, get and update a resource data

         * @param {Object} [config]                     Can be used by sub-class.
         *
         */
        constructor: function(resourceName, httpAPI, config) {
            NS.SimpleResourceManager.$super.call(this,
                    resourceName,
                    {
                        httpAPI : httpAPI
                    },
                    config);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::SimpleResourceManager::_setup".fmt(this.getIName());
            var success = true;

            this._httpAPI = _.get(this._dataAPIs, 'httpAPI');
            if (!_.interfaceAdheres(this._httpAPI, SimpleResourceManager.REQUIRED_HTTP_API_CLIENT_API)) {
                _l.error(me, "No valid HTTP API Client given, resource manager will not function");
                _l.info(me, "Required API for HTTP API is : ",
                        _.stringify(SimpleResourceManager.REQUIRED_HTTP_API_CLIENT_API));

                success = false;
            }

            return success;
        }

    });
})();

