/**
 * Created by Freddy Snijder on 13/01/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS          = window.__VI__ || window;

    var _           = NS.utils;
    var _l          = NS.logger;
    var Class       = window.jsface.Class;
    var NamedBase   = NS.NamedBase;

    NS.Configurable = Class({

        /**
         *
         * Configurable Mixin. Adds a protected method _addConfigProperties(config).
         * This method adds properties in a config object to the instance of the class
         * that uses this mixin.
         *
         * Every config <property> is stored as _<property> (with underscore in front) in the instance.
         *
         * @class   Configurable
         * @module  M*C
         *
         */

        /***************************************************
         *
         * PROTECTED METHODS
         *
         **************************************************/

        /**
         *
         * Adds properties in object Config to the instance as _<property>.
         * Properties are only added when the property resolves to undefined.
         *
         * @param {Object} config       Object that contains properties to add to the instance
         *
         * @protected
         *
         */
        _addConfigProperties : function(config) {
            var me = "[{0}]Configurable::_addConfigProperties".fmt(_.exec(this, 'getIName') || '[UNKOWN]');

            if (!_.obj(config)) {
                //Nothing to do
                return;
            }

            var props = Object.getOwnPropertyNames(config);
            for (var propIdx in props) {
                var prop            = props[propIdx];
                var instanceProp    = "_" + prop;

                if (this[instanceProp] === undefined) {
                    this[instanceProp] = config[prop];
                } else {
                    _l.debug(me, "Skipping property {0} because it already exists in instance".fmt(instanceProp))
                }
            }
        }

    });
})();
