/**
 * Created by Freddy on 04/02/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;

    var NamedBase           = NS.NamedBase;
    var Configurable        = NS.Configurable;

    NS.ResourceManager = Class([NamedBase, Configurable], {

        _dataAPIs : null,

        /**
         *
         * TO BE FURTHER DEVELOPED
         *
         * An abstract ResourceManager class, managing access to data of a certain resource.
         * The ResourceManager can us one or more APIs :
         * * API                : (HTTP) API to create, get and update a resource data
         * * messageAPI         : real-time messaging API, to get changes pushed
         * * offlineStorageAPI  : offline storage API, store resource data for offline use
         *
         *
         * Methods you need to override in subclasses :
         *
         *  - _setup()                                  Sets up the ResourceManager using the given API(s) and
         *                                              configuration properties. This is also the place where you
         *                                              validate your APIs and configuration properties.
         *
         *                                              Returns true on success else false
         *
         *                                              This method is called during construction.
         *
         *
         * @class           ResourceManager
         * @module          M*C
         *
         * @extends         NamedBase
         * @uses            Configurable
         *
         * @constructor
         *
         * @param {String} resourceName                 name of resource
         *
         * @param {Object} dataAPIs                     Hash object with one or more APIs :
         * @param {Object} [dataAPIs.httpAPI]           OPTIONAL. (HTTP) API to create, get and update a resource data
         * @param {Object} [dataAPIs.messageAPI]        OPTIONAL. Real-time messaging API, to get changes pushed
         * @param {Object} [dataAPIs.offlineAPI]        OPTIONAL. offline storage API, store resource data for
         *                                              offline use
         *
         * @param {Object} [config]                     Object containing additional properties the resourceManager
         *                                              needs to know about. The properties in the config are added to
         *                                              the ResourceManager instance if they not already exist.
         *                                              Also see Configurable mixin.
         *
         */
        constructor: function(resourceName, dataAPIs, config) {
            var managerName = _.capitaliseFirst(resourceName || 'UnknownResource') + "ResourceManager";
            NS.ResourceManager.$super.call(this, managerName, config);

            var me = "{0}::ResourceManager::constructor".fmt(this.getIName());

            this._addConfigProperties(config);

            this._valid         = true;

            this._resourceName  = resourceName;
            if ((!_.string(resourceName)) || (_.empty(resourceName))) {
                _l.error(me, "No resourceName given, resource manager wil not function properly");
                this._valid = false;
                return;
            }

            this._dataAPIs = dataAPIs;
            if (!this._setup()) {
                _l.error(me, "ResourceManager setup failed, resource manager wil not function properly");
                this._valid = false;
            }
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::ResourceManager::_setup".fmt(this.getIName());
            var success = false;

            _l.error(me, "No implementation given, don't know how to setup this resource manager");
            _l.info(me, "If you don't need to do any set up, just override this method by simply returning true");
            return success;
        }
    });
})();

