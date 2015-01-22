/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var MVCComponent        = NS.MVCComponent;
    var Controller          = NS.Controller;

    NS.Model = Class(MVCComponent, {

        _resourceManagerTable : null,

        /**
         *
         * An abstract Model class, representing the ground truth for a View.
         * Although a model is in principle for one MVC combination, multiple controllers can be
         * connected to one model. This allows secondary controllers to listen to specific details in
         * a model that is of interest to them.
         *
         * DON'T FORGET:
         * When applicable, you have to mark this._valid = true or false in your Model subclass constructor to mark
         * the instance validity.
         *
         * Methods you need to override in subclasses :
         *
         *  - _bindResourceManagers()               Binds to the resource managers to get new or changed data updates
         *
         *
         * @class           Model
         * @module          M*C
         *
         * @extends         MVCComponent
         *
         * @constructor
         *
         * @param {String} modelName                name of model
         * @param {Object} resourceManagerTable     Hash table of resourceManagers that the model needs to
         *                                          get (new) data from, and provide updated data to.
         *                                          Usually a model only deals with one type of resource, however this
         *                                          setup allows for more complex MVCs dealing with multiple resource
         *                                          types
         *
         * @param {Object} [config]                 Object containing additional properties the model needs to
         *                                          know about. The properties in the config are added to the Model
         *                                          instance if they not already exist. Also see Configurable mixin.
         *
         */
        constructor: function (modelName, resourceManagerTable, config) {
            NS.Model.$super.call(this, modelName, config);

            var me = "{0}::Model::constructor".fmt(this.getIName());

            this._resourceManagerTable  = resourceManagerTable;

            this._valid = true;
            if (!this._bindResourceManagers()) {
                _l.error(me, "Unable to bind resource managers given, model wil not function properly");
                this._valid = false;
            }
        },

        allowedToRegister : function(component) {
            return (_.call(component, 'isController', _.call(component, 'getIName')) === true);
        },

        /**
         *
         * Returns if instance is a model
         *
         * @returns {boolean}
         */
        isModel : function() {
            return true;
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _bindResourceManagers : function() {
            var me      = "{0}::Model::_bindResourceManagers".fmt(this.getIName());
            var success = false;

            if (_.obj(this._resourceManagerTable) && _.empty(this._resourceManagerTable)) {
                return (success = true);
            }

            _l.warn(me, "No implementation given, don't know how to bind to given resource managers");
            _l.info(me, "If you don't need data pushed from resource managers, " +
                        "override this method by simply returning true.");
            return success;
        }

    });
})();
