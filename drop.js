if(jQuery === undefined) throw 'dropmvc requires jQuery';

(function($){
    // Standard in JavaScript 1.8.5, and introduced by Doug Crockford
    if (typeof Object.create !== 'function') {
         Object.create = function (o){
             var func = function (){};
             func.prototype = o;
             return new func();
         };
    }
    // The primary object everything else derives from
    function DropObject(){ }
    // Simplified prototypal inheritance
    DropObject.breed = function(obj) {
        var self = this,
            Newobj = function() {
                // merge in the prototype and the given methods
                var superior = self(),
                    o = Object.create( $.extend({}, superior, obj) );
                o.superior = {};
                for(var p in superior)
                    o.superior[p] = $.proxy( superior[p], o );
                return o;
            };
        // clone all non-prototyped properties and methods, including breed
        for(var p in this)
            if(p != 'prototype') Newobj[p] = this[p];
        return Newobj;
    };

    // Controls are buttons, checkboxes, anything that could emit events.
    // They are a basic unit of UI, and are grouped together with a View.
    var Control = DropObject.breed({
        init: function(elmt) {
            this._elmt = false;
            this._view = undefined;
            this._selector = undefined;
            if(elmt)
                this.elmt( elmt );
            return this;
        },
        // Initialize the jQuery selector within scope of context. Run upon
        // assigning this controler to a view to speed things up.
        _initSelector: function(context){ 
            this._elmt = $(this._selector, context);
            delete this._selector;
        },
        // Set the DOM element for this control. Accepts either a jQuery
        // selector, a DOM element or a jQuery object.
        elmt: function( elmt ) {
            if(!elmt) return this._elmt;
            if(typeof elmt == 'string') {
                if( elmt.length == 0 ) throw 'Can\'t accept empty selector.';
                // stash the selector away for later
                this._selector = elmt;
            // else it's an object to build this control from
            } else {
                $.extend( this, elmt );
                if(this.selector === undefined) 
                    throw('The "selector" property is required.');
                this._selector = this.selector;
                delete this.selector;
            }
        },
        // Bind this control to a given function. The function is always 
        // run in the context of the Controller this controler belongs to.
        bind: function(eventType, handler){
            if(!eventType || !handler) 
                throw 'Both eventType and handler are required to bind controls';
            this._view.bind(this, eventType, handler);
        }
    });

    // Views are a generic 'container' that contains Control objects, 
    // listens for bubbling events, and calls corresponding controller 
    // methods if the events are emitted from one of its controls.
    var View = DropObject.breed({
        // View's contructor takes in a jQuery selector and an optional object
        // filled with controls to assign to this view
        init: function(selector) {
            var controls = arguments[1];
            if(selector)
                this.elmt( selector );
            this._controller = undefined;
            this._controls = []; // keep array of all controls as well
            if( controls )
                this.controls( controls );
            
            return this;
        },
        // Set the internal container element for this view. This element
        // will be listening for events emitting from view controls.
        elmt: function( elmt ) {
            if(!elmt) return this._elmt;
            this._elmt = $( elmt );
        },
        // Add a number of controls to this view at once. Takes in
        // an object filled with controls and executes this.control()
        // on each one of them.
        controls: function( controls ) {
            if(!controls) return this._controls;
            // wrap control in jQuery object if necessary
            for(var c in controls) this.control(c, controls[c]);
        },
        // Add a Control object to this view. Takes in a name of the
        // control and an object filled out with methods for this control.
        control: function(name,control) {
            if(this[name] !== undefined) throw(name+" is already defined.");
                this[name] = (control instanceof Control) ? control : Control().init(control);
            this._controls.push({control: this[name]});
            this[name]._view = this;
            this[name]._initSelector(this._elmt);
        },
        // Bind a handler (most often a controller method) to a given control
        // and event type.
        bind: function(control, eventType, handler) {
            var c = 0;
            while(this._controls[c].control != control) {
                if(c > this._controls.length) throw 'No such control in this view.';
                c++; // aa-haha
            }
            this._controls[c].handler = handler;
            // only bind if we're not already
            var events = this._elmt.data().events;
            if(typeof events == 'undefined' || typeof events[eventType] == 'undefined')
                this._elmt.bind(eventType, $.proxy( this._eventHandler, this ) );
        },
        // Handle DOM events from controls and redirect them to the appropriate
        // controller methods.
        _eventHandler: function(e){
            for(var i=0; i < this._controls.length; i++) 
                // call the handler if one is assigned for this control
                if (this._controls[i].control._elmt.get(0) == e.target
                    && typeof this._controls[i].handler != 'undefined') {
                    // easy access to the control the event was triggered on
                    e.targetControl = this._controls[i].control;
                    this._controls[i].handler.call(this._controller, e); 
                    e.preventDefault();
                    return false;
                }
        }
    });


    // Controllers connect views, controls and models together. E.g. a control 
    // is typically assigned to a controller method.
    var Controller = DropObject.breed({ 
        init: function(o){
            this._views = {}; 
            if(o) var bindings = (o.bindings || o._bindings);
            // run the initializer and add bindings if present
            if(bindings !== undefined) bindings.apply(this);

            return this;
        },

        // add a view to the controller
        addView: function(name, view) {
            this[name] = this._views[name] = view;
            view._controller = this;
        }
    });
    
    // finally, announce self to the world
    window.drop = { view: View, co: Controller, ctrl: Control, obj: DropObject};
})(jQuery);

