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
    // Simplified prototypal inheritance. Return a function that will return
    // instances of objects with a prototype set to 'obj'.
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
        // copy all non-prototyped properties and methods, including breed
        for(var p in this)
            if(p != 'prototype') Newobj[p] = this[p];
        return Newobj;
    };

    // Controls are buttons, checkboxes, anything that could emit events.
    // They are a basic unit of UI, and are grouped together under a view.
    var Control = DropObject.breed({
        init: function(elmt) {
            this._elmt = false;
            this._view = undefined;
            this._selector = undefined;
            if(elmt)
                this.elmt( elmt );
            return this;
        },

        // Initialize the jQuery selector within scope of context. Called
        // when this control is assigned to a view, which will speed up 
        // the jQuery selector.
        _initSelector: function(context){ 
            this._elmt = $(this._selector, context);
            delete this._selector;
        },

        // Set the primary DOM element for this control. Accepts either a jQuery
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

        // Bind a method to this control. The handler always executes within 
        // the context of the controller object that the view of this control
        // belongs to.
        bind: function(eventType, handler){
            if(!eventType || !handler) 
                throw 'Both eventType and handler are required to bind controls';
            this._view.bind(this, eventType, handler);
        }
    });

    // Views are a generic 'container' for controls. Its primary task is to 
    // listen for all registered bubbling events, and call controller methods when
    // an event originates from one of the controls within this view. It can
    // obviously have other methods that work with the view as a whole, though.
    var View = DropObject.breed({
        // View's contructor takes in a jQuery selector of the main DOM element
        // for this view and an optional object filled with controls
        init: function(selector, controls) {
            if(selector)
                this.elmt( selector );
            this._controller = undefined;
            this._controls = []; // keep array of all controls as well
            if( controls )
                this.controls( controls );
            
            return this;
        },
        // Set the container DOM element for this view. This element
        // will be listening for events bubbling up from this view's controls.
        elmt: function( elmt ) {
            if(!elmt) return this._elmt;
            this._elmt = $( elmt );
        },
        controller: function( ctrl ) {
            if(!ctrl) return this._controller;
            this._controller = $( ctrl );
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
        // The name becomes available under this, e.g. this['name']
        control: function(name,control) {
            if(this[name] !== undefined) throw(name+" is already defined.");
                this[name] = (control instanceof Control) ? control : Control().init(control);
            this._controls.push({control: this[name]});
            this[name]._view = this;
            this[name]._initSelector(this._elmt);
        },
        // Bind a handler (a controller method, typically) to a given control
        // and event type.
        bind: function(control, eventType, handler) {
            var c = 0;
            while(this._controls[c].control != control) {
                if(c > this._controls.length) throw 'No such control in this view.';
                c++; // aa-haha
            }
            this._controls[c].handler = handler;
            // only bind if we're not already
            var events = this._elmt.data('events');
            if(events === null || 
			   events !== null && events[eventType] === undefined)
                   this._elmt.bind(eventType, $.proxy( this._eventHandler, this ) );
        },
        // Main view event handler. Listens for all events, and calls controller
        // methods if an event originated from one of this view's controls.
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

    // Controllers connect views, controls and models together, and represent
    // the main 'business logic' of the given chunk of code.
    var Controller = DropObject.breed({ 
        init: function(){
            this._views = {}; 
            // convenient auto-binding, if such a method is present.
            //if(this.bindings !== undefined) this.bindings();

            return this;
        },

        // Register a drop.view view object with this controller.
        addView: function(name, view) {
            this[name] = this._views[name] = view;
            view._controller = this;
        }
    });
    
    // Hello, world!
    window.drop = { view: View, co: Controller, ctrl: Control, obj: DropObject};
})(jQuery);

