/**
 * Created by Freddy Snijder on 01/03/15.
 */

(function() {

    //Add to Visionscapers namespace
    var NS                  = window.__VI__ || window;

    var _                   = NS.utils;
    var _l                  = NS.logger;
    var Class               = window.jsface.Class;
    var React               = window.React;
    var View                = NS.View;

    var CanShowUI           = NS.CanShowUI;

    NS.ReactView = Class([View, CanShowUI], {

        $statics : {
            REQUIRED_REACT_API : {
                methods : ['createElement', 'render']
            },

            /*REQUIRED_REACT_CLASS_API : {
                methods : ['mountComponent', 'receiveComponent']
            },*/

            createReactElement : function(type, config, children) {
                return React.createElement(type, config, children);
            }
        },

        _state              : {},

        _reactUIClass       : null,
        _reactUIElement     : null,
        _reactUIInstance    : null,

        _DOMContainer       : null,

        /**
         *
         * Hooks up a React UI to a MVC combination. A react UI is a high-level React element that combines multiple
         * elements in to an UI.
         *
         * The ReactView renders the React UI, by first creating the _reactUIElement based on the _reactUIClass given
         * during construction. createReactUIElement() provides the implementation for creating the _reactUIElement.
         * By creating the _reactUIElement you provide view methods that need to be called on user input., e.g.:
         *
         * createReactUIElement : function(reactUIClass) {
         *      var view = this; //The view instance
         *
         *      return ReactView.createReactElement(reactUIClass, {
         *          onSubmit : view.handleSubmit.bind(view),
         *
         *          ...
         *
         *          someProp : view.someProp
         *      });
         * }
         *
         * During _render() React.render() is called which returns a reference to the rendered React component:
         * _reactUIInstance. This instance is used to call setState(), allowing the view to pass state updates to
         * the React UI. In the callback if React.render() _onViewRendered() is called which subsequently calls
         * _onRendered(), which can optionally be implemented in your subclass.
         *
         *
         * NOTES:
         * - Before calling _onRendered(), the initialState, set by _state, is set in the ReactUI instance.
         *   This is done by calling the _renderState() method.
         *
         * - Every time you update the view _state object, call _renderState() afterwards to update the state in the
         *   React UI instance.
         *
         * - You can get the reactUI instance in your subclass using _getReactUIInstance()
         *
         * - This class has it's own base implementation of the _setup() method. You should call this implementation
         *   in your own implementation as follows:
         *
         *   success = MyReactView.$superp._setup.call(this);
         *
         *
         * Methods you need to override in subclasses :
         *
         *  - _setup()                          Sets up the view using the given configuration properties.
         *                                      This is also the place where you validate configuration properties.
         *
         *                                      Returns true on success else false
         *
         *                                      This method is called during construction.
         *
         *  - createReactUIElement              Implements the creation of the React UI element, hooking up
         *                                      view methods that need to handle user input
         *
         * Methods you can OPTIONALLY override in subclasses :
         *
         *  - _onRendered                       Called after the view is rendered
         *
         *
         * @class           ReactView
         * @module          M*C
         *
         * @extends         View
         *
         * @constructor
         *
         * @param {String} viewName                 name of view
         * @param {ReactClass} reactUIClass         ReactClass object
         * @param {HTMLElement} DOMContainer        Container element in the DOM in which to render the view
         * @param {Object} [config]                 Not used by ReactView base class, but can be
         *                                          used by subclass
         *
         */
        constructor: function (viewName, reactUIClass, DOMContainer, config) {
            var me = "ReactView::constructor";

            this._reactUIClass = reactUIClass;
            this._DOMContainer = DOMContainer;

            NS.ReactView.$super.call(this, viewName, config);
        },

        isRendered : function() {
            return this._didRender && _.object(this._reactUIInstance);
        },

        /*********************************************************************
         *
         * PROTECTED METHODS
         *
         *********************************************************************/

        _setup : function() {
            var me      = "{0}::ReactView::_setup".fmt(this.getIName());
            var success = false;

            var errorOccurred = false;
            if (!_.interfaceAdheres(React, NS.ReactView.REQUIRED_REACT_API)) {
                _l.error(me, "Unable to setup React view, " +
                             "no React component or does not adhere to required interface. " +
                             "Did you load the React library?");
                _l.info(me, "Required React API is : ", _.stringify(NS.ReactView.REQUIRED_REACT_API));

                errorOccurred = true;
            }

            if (!_.class(this._reactUIClass)) {
                _l.error(me, "Unable to setup React view, ReactClass is not a Class");
                errorOccurred = true;
            }

            if (!(this._DOMContainer instanceof window.HTMLElement)) {
                _l.error(me, "Unable to setup React view, " +
                             "Container DOM element is not a HTMLElement");

                errorOccurred = true;
            }

            return (success = !errorOccurred);
        },

        /**
         *
         * Renders the React UI element by creating it first using the _createReactUIElement() method
         *
         * @returns {boolean}
         *
         * @protected
         */
        _render : function() {
            var me      = "{0}::ReactView::_render".fmt(this.getIName());
            var self    = this;

            var success = false;

            this._reactUIElement = this._createReactUIElement(this._reactUIClass);
            if (!_.def(this._reactUIElement)) {
                _l.error(me, "Unable to create React UI element, will not render view");
                return success;
            }

            this._reactUIInstance = React.render(this._reactUIElement, this._DOMContainer, function() {
                //Make async because the rendering seems to be a synchronous process such that
                // this callback is called before returning the react UI instance
                setTimeout(function() {
                    self._renderState();
                    self._onViewRendered();
                }, 0);
            });

            return (success = true);
        },

        _renderState : function() {
            var me = "{0}::ReactView::_renderState".fmt(this.getIName());

            var ui = this._getReactUIInstance();
            if (_.hasMethod(ui, "setState", "React UI Instance")) {
                ui.setState(this._state);
            } else {
                _l.error(me, "No valid React UI instance available, unable to render state");
            }
        },

        _createReactUIElement : function(reactUIClass) {
            var me = "{0}::ReactView::_createReactUIElement".fmt(this.getIName());

            _l.error(me, "No implementation, create React UI element based on provided class");
            _l.info(me, "Implement this method in your subclass in order to create the " +
                        "React UI element, hooking up view methods that process user input");

            return null;
        },

        _getReactUIInstance : function() {
            return this._reactUIInstance;
        }
    });
})();
