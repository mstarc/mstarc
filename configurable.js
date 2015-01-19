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
         * @class   Configurable
         *
         */

        /***************************************************
         *
         * PROTECTED METHODS
         *
         **************************************************/

        /**
         *
         * Adds properties in object Config to the instance.
         * Properties are only added when the property resolves to undefined.
         *
         * @param {Object} config       Object that contains properties to add to the instance
         *
         * @protected
         *
         */
        _addConfigProperties : function(config) {
            var me = "[{0}]Configurable::_addConfigProperties".fmt(_.do(this, 'getName') || '[UNKOWN]');

            if (!_.obj(config)) {
                //Nothing to do
                return;
            }

            var props = Object.getOwnPropertyNames(config);
            for (var propIdx in props) {
                var prop    = props[propIdx];

                if (this[prop] === undefined) {
                    this[prop] = config[prop];
                } else {
                    _l.debug(me, "Skipping property {0} because it already exists in instance".fmt(prop))
                }
            }
        }

    });
})();
