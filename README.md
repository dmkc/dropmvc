#dropmvc
A miniature Javascript framework for adding MVC-like flow to bits of a webpage. On a bright sunny day you: 

1. pick a container element as a 'view', a `div` around a comment for instance
1. designate 'controls' within it: a textarea for the comment and the submit button
1. write some logic: validate input, submit the comment, give user a visual cue that all went well
1. glue the controls to methods of the controller

The view will listen for events from its controls, and call methods on the controller when things happen. Nothing fancy or difficult; just makes things a wee bit easier to organize. Like an IKEA desk.
