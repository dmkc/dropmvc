#dropmvc

## Quick How To
A miniature Javascript framework for adding MVC-like flow to bits of a webpage. On a bright sunny day you: 

1. pick a container element as a `view`, a `div` around a comment for instance
1. designate `controls` within it: a textarea for the comment and the submit button
1. write some logic in the `controller`: validate input, submit the comment, give a visual response if all is ok
1. glue controls to methods of the controller

The view will listen for events from its controls, and call methods on the controller when interesting things happen. 
Nothing fancy or difficult; just makes stuff a bit easier to organize. Like a cheap IKEA desk.

## What's the point?
The point of it all is to split presentation and logic. You can write some `control` behaviour within each of your control objects, say, `submitButton.disable()` to disable the submit button when a comment has already been submitted. Then add more general presentation code to the `view`, like displaying some kind of confirmation message. The main logic will then go into the `controller`, where you can do your ajax, validation, processing, whatever it is your magical app does. 

At the end of the day the controller doesn't have to directly touch any DOM elements: it can fire methods on its view and the view's controls, and if the appearance or the DOM elements behind the view or the control changes, it won't care: all of that DOM specific crap is encapsulated within the controls and views.

