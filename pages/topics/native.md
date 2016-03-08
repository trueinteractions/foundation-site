# Using Native Classes in Tint #

Tint uses FFI language bridges to marshal C/C#/C++/Objective-C items back and forth from Javascript.

Note: Use ``require('Bridge')``, ``require('Application')`` or ``require('Common')`` to setup the native bridge prior to using these calls.

## .NET C/C#/C++ Native Bridge (Windows)
You can use .NET Classes, Assemblies (DLL's) (both built in and external) with Tint.  The language bridge exists at process.bridge.dotnet and is globally (always) available. The language bridge supports:

* Ability to import any managed C (idiomatic), C# or C++ symbol (and use it)
* Import any .NET Assembly (either built-in or by path)
* Any .NET or managed Class (instantiate or build your own)
* Properties, and Fields (set/get)
* WinForms / WPF and MFC Controls (The application loop GetMessage/Translate/Dispatch is handled for you).
* Static/instance methods or functions
* Built-in types (uint, DWORD, struct, etc)

### Importing a Windows Assembly

Import a common assembly contained in any DLL search path;

```Javascript
process.bridge.dotnet.import('System.Windows.Forms');
```

or from a dll assembly file by a specific path;

```Javascript
process.bridge.dotnet.import('C:\\my\\path\\MyAssembly.dll');
```

The subsequent loaded classes (consts, enums, etc) are loaded onto process.bridge.dotnet. For example, if you wanted to use System.Windows.Forms.Form, you would use process.bridge.dotnet.import('System.Windows.Forms'); then the class is available at its fully qualified namespace path: process.bridge.dotnet.System.Windows.Forms.Form.  

### Using C#/C++ .NET Windows Objects

C#/C++ (managed) .NET classes are exactly like Javascript classes.  Static methods are on the class, instance methods are on the prototype (e.g., you need to use new Form() taking from the example above). When you create a JS object from the class, you're creating a real .NET object, the constructor in javascript calls the constructor in .NET.  You can execute any method, field, property and pass in JS functions for delegates (this is handled automatically for you, no need to worry about types).

In addition Javascript manages your garbage collection.  You do not need to explicitly dispose (just as .NET) any of the classes.  Just loose the reference and its recollected by .NET's CLR and Javascript's V8.

### Creating C#/C++ .NET Classes From Javascript

To create new objects in javascript you can use the bridge to define a new object.  All objects must inherit (or extend) from a previous object, therefore you'll need to pick a base class, System.Object will do fine. 

```javascript
$ = process.bridge.dotnet; // for brevity.
var protoClass = $.System.Object.extend('MyNewClass'); // creates a new class "template"
protoClass.addMethod(
  "myMethod", // The method name
  false, // static or instance, true = static, false = instance, 
  true, // public=true, private = false, protected does not exist in runtime.
  false, // whether to override an existing method name.
  $.System.Boolean, // the return type, lets go with true/false.
  [ $.System.String ], // The argument types it takes as an array.
  function(someString) { // Some javascript function to exec when myMethod is called
    console.log(someString);
    return false; // must return type "System.Boolean"
  }
);
var MyNewClass = protoClass.register(); // create a new REAL class. 

// Now we can create a new instance:
var inst = new MyNewClass();
inst.myMethod('This is a c++ DOT net class, but in JS!');
```

The proto class or class "template" has the following methods, once you're finished with modifying the class you can register it with the register() method.  The register method returns back the new .NET class.

```javascript
var ProtoClass = process.bridge.dotnet.System.Object.extend(className)
ProtoClass.addConstructor = function(public, types, callback)
ProtoClass.addMethod = function(name, static, public, override, retType, types, callback)
ProtoClass.addProperty = function(name, static, public, readOnly, propType, value) 
ProtoClass.addField = function(name, static, public, readOnly, propType, value)
ProtoClass.register = function() // returns the new .NET class.
```

### Listening to Events and Adding Delegates

Instead of using the C# event syntax of ``SomeObject.Event += Delegate`` in javascript you can either use the .NET delegate class to manually create a delegate and assign it to the event (just as you would in C++) or you can use the shortcut provided by the language bridge: ``addEventListener``.  This takes two parameters, the first is the name of the event, the second is the callback function to execute on the event. The callback function (when the event occurs) is executed and passed two arguments, the .NET Object that caused the event (sender) as a ``System::Object`` and second, the base ``System::EventArgs`` that holds the arguments to the callback.

```Javascript
$ = process.bridge.dotnet; // done for brevity...
$.import('System.Windows');
var window = new $.System.Windows.Window();
// Implements the MouseDown event on System.Windows.Window class in .NET
window.addEventListener('MouseDown', function(sender, eventargs) { 
   console.log('mouse down!'); 
});
```

Note, you can use addEventListener for any event, regardless of its type signature (this is automatically resolved via reflection).

### WPF, WinForms and MFC
The main event loop for the application (note, NOT winproc or Window message loop) is handled and dispatches messages to all WinForms, MFC and WPF windows created.  While you cannot EASILY intermix controls between WPF/MFC/WinForms there's no restrictions on one window being MFC+GDI, and another being WPF or WinForms.  Tint is compatible with any creation method. Note that MFC may be more difficult as reflection is not available and syntax requires using the FFI bridge rather than .NET assembly imports.

<h3>Windows .NET C/C#/C++ Example</h3>
```Javascript
require('Bridge');
$ = process.bridge.dotnet;
$.import("System.Windows.Forms");
$.import("System.Drawing");
var Form = $.System.Windows.Forms.Form;
var Button = $.System.Windows.Forms.Button;
var Point = $.System.Drawing.Point;


// Create a new instance of the form.
var form1 = new Form();
// Create two buttons to use as the accept and cancel buttons.
var button1 = new Button ();
var button2 = new Button ();

// Set the text of button1 to "OK".
button1.Text = "OK";
// Set the position of the button on the form.
button1.Location = new Point(10,10);
// Set the text of button2 to "Cancel".
button2.Text = "Cancel";
// Set the position of the button based on the location of button1.
button2.Location = new Point (button1.Left, button1.Height + button1.Top + 10);
// Set the caption bar text of the form.   
form1.Text = "My Dialog Box";
// Display a help button on the form.
form1.HelpButton = true;
// Define the border style of the form to a dialog box.
form1.FormBorderStyle = $.FormBorderStyle.FixedDialog;
// Set the MaximizeBox to false to remove the maximize box.
form1.MaximizeBox = false;
// Set the MinimizeBox to false to remove the minimize box.
form1.MinimizeBox = false;
// Set the accept button of the form to button1.
form1.AcceptButton = button1;
// Set the cancel button of the form to button2.
form1.CancelButton = button2;
// Set the start position of the form to the center of the screen.
form1.StartPosition = $.FormStartPosition.CenterScreen;
// Add button1 to the form.
form1.Controls.Add(button1);
// Add button2 to the form.
form1.Controls.Add(button2);
// Display the form, modals block, use normal.
form1.Show();
```
### .NET Common Errors

* If you receive `System.BadImageFormatException` when importing, you're most likely importing a Win32 classic DLL.

## OSX Objective-C Native Bridge
You can use Objective-C Classes, Frameworks (both built in and external) with Tint.  The language bridge exists at process.bridge.objc and is globally (always) available. The bridge supports:

* Any compiled external or built-in Objective-C Framework (to import)
* Objective-C Classes, static (+) or instance (-) methods (selectors)
* Functions (``NSMakeRect, NSLog, etc.``)
* Variadic Functions (e.g, ``NSLog(@"Foo %@", SomeObject);`` )
* Block Functions (e.g., ``^(type1 arg1, type2 arg2){ some anonymous function ... }``)
* Class Properties, Static Structures and Simply Types (e.g., char *, int, etc).
* Inheriting, overloading, overriding Classes and Methods (Selectors)
* Extending Classes (or creating new ones from NSObject)
* Delegates/Protocols


### Importing an OSX Objective-C Framework

```Javascript
process.bridge.objc.import('SomeFramework');
```

Once imported the classes, functions, structures and constants are imported onto the process.bridge.objc object. For example if you import Foundation, NSString now exists as a javascript class at process.bridge.objc.NSString. 

### Sending OSX Objective-C Messages
The following shows an example of how we create native windows using Tint in objective-c. The first step is to import the AppKit framework.  Next, we allocate a new NSWindow class, then initialize it with initWithContentFrame. After an object is established and returned from init we can then use it in a slightly modified objective-c syntax suitable for javascript that follows: object('selectorString', <argument>, 'nextSelectorArg', <argument>);  Note that strings in javascript are cast as const char * (NOT NSString).

```Javascript
var $ = process.bridge.objc; // done for ease of use.
$.import('AppKit');

var mywindow = $.NSWindow('alloc')('initWithContentFrame', $.NSMakeRect(0,0,500,500), 
               'styleMask', ($.NSTitledWindowMask | $.NSClosableWindowMask | $.NSMiniaturizableWindowMask | 
                             $.NSResizableWindowMask | $.NSTexturedBackgroundWindowMask)
               'backing', $.NSBackingStoreBuffered,
               'defer', $.NO);

mywindow('makeKeyAndOrderFront', mywindow);
mywindow('setTitle', $('This is my title.')); // note strings are const char * in Obj-C, wrapping
                                              // wrapping it in $() turns it into a NSString for us.
```

### Creating OSX Objective-C Classes

You can extend any objective-c class using the .extend('NewClassName').  This function is available on all obj-c classes. It returns back a "unsealed" class, unsealed classes can use addMethod, addClassMethod to add to it (or overwrite a method on its super class). Once you're ready to use the class use .register() on the unsealed class to finalize it.

The .addClassMethod([selector name], [signature type], function(self, selector, ...) {}); can be used to add class (+) methods. You can add instance methods (-) using the same execution signature but addMethod (rather than addClassMethod) method. Finally once you want the class to be sealed and registered with Objective-C use .register().

So to create a class in objective-c from javascript; 1) use $.SuperClass.extend('NameOfNewClass').  It will return an unsealed class.  2) Use the unsealed classes "addMethod" and "addClassMethod" functions to add functionality or overwrite methods on the super class. Finally, 3) once you're ready use "register" on the unsealed class to finalize it. 4) Start using it..

```Javascript
var $ = process.bridge.objc; // for convenience

var SomeNewClass = $.NSObject.extend('SomeNewClass'); // Extend NSObject to SomeNewClass, inherit its selectors.
    // Add a new +(void)someSelector:id method.
    SomeNewClass.addClassMethod('someSelector','v@:@', function(self, selector, someClassArg) {
        console.log('someSelector executed on the class!');
    });
    // Add a new -(id) init: method, it just returns itself.
    SomeNewClass.addMethod('init:','@@:', function(self, selector) { return self; });
    // Add a new -(void) someInstanceSelector method, no arguments.
    SomeNewClass.addMethod('someInstanceSelector','v@:', function(self, selector) {
        console.log('someInstanceSelector executed on the object!');
    });
    SomeNewClass.register(); // Seal it, the class can no longer be modified.

    // lets start using it! After we register, its now on the objc-bridge as $.SomeNewClass
    var obj = $.SomeNewClass('alloc')('init');
    obj('someInstanceSelector'); // prints out 'someInstanceSelector executed on the object!'
```

### OSX Objective-C Type Encodings

Objective-C has type encodings which are strings that describe a method or functions type. When using addMethod or addClassMethod (when creating your own class) you'll need to refer to the objective-c runtime reference to figure out how to express the signature of the method through the type encoding format:

https://developer.apple.com/library/mac/documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtTypeEncodings.html#//apple_ref/doc/uid/TP40008048-CH100-SW1

For example 'v@:@' says (returns void, executes an object/class on ':' selector, then takes in an id (@)).  All methods second and third values in the string should be '@:', directly after the return type. 

### OSX Objective-C/C Passing By Reference

Below is an example that loads up Apple's recent iPhone keynote using QuickTime classes in QTKit and decodes it into a QTMovie class (although Quicktime is now deprecated for AV Foundation)

```javascript
> require('Bridge');
{}
> process.bridge.objc.import('QTKit')
undefined
> process.bridge.objc.QTMovie
[Class: QTMovie]
> var errorRef = process.bridge.objc.alloc(process.bridge.objc.NSError).ref()
> var qtMovie = process.bridge.objc.QTMovie('movieWithURL', process.bridge.objc.NSURL('URLWithString',process.bridge.objc('http://p.events-delivery.apple.com.edgesuite.net/14pijnadfpvkjnfvpijhabdfvpijbadfv09/refs/14oijhbaefvohi9_hd_vod_ref.mov')), 'error', errorRef);
```

Any method from the QTMovie class is now accessible on the target video (but really AV foundation should be used as QTKit is now deprecated). 

_NOTE:_

1. errorRef is a double pointer "reference" to an NSError object, method(selectors) with NSError ** are asking for a pointer to a reference where it can place an error, if an error happens I can use errorRef to find out what happened (its an NSError object). Or it will equal null if no error occured. 

2. It seems weird I passed the string for the url of the apple movie into process.bridge.objc(), but remember NSObject and objective-c uses NSString not "char *" (which javascript uses) so process.bridge.objc() is short hand for allocating a NSString for me quickly so I don't have to create one manually from a ASCII value (or UTF8 Value). 

3. Remember to require('Bridge') or require('Application') (one or the other, or both, no harm will be done).

### OSX Objective-C Common Errors

A common error is:

```javascript
TypeError: error setting argument 2 - writePointer: Buffer instance expected as third argument
    at bridge.writePointer (ref.js:730:11)
    at bridge.set (ref.js:478:13)
    at bridge.alloc (ref.js:508:13)
    at ForeignFunction.proxy (_foreign_function.js:48:22)
    at unwrapper (core.js:300:31)
    at Class.module.exports.Class.msgSend (class.js:189:34)
    at Function.rtn [as NSURL] (core.js:374:47)
    at repl:1:79
    at REPLServer.self.eval (repl.js:110:21)
    at repl.js:249:20
```

It means the wrong type or selector was passed into one of the methods(selectors).  Double check the arguments passed in, ensure javascript strings were converted to NSString first (by passing them through process.bridge.objc('my string')).  Also make sure the class hasn't been inappropriately used (e.g., trying to use a static (+) method on a instance, or an instance method/selector (-) on a class object).

## Simple C libraries or C++ objects
Tint utilities and builds in node-ffi and libffi into its executable for you.  Inspect the process.bridge object for more methods and ways of importing C/C++ objects without reflection. Node-ffi has excellent documentation on how load .so/.dll/.dylib libraries that do not contain meta data or a CLR. If you need additional help see libffi documentation.  

## Limitations

* All executions are performed on the main thread, and cannot be performed on a secondary thread (without instantiating a worker, but, to come!)
* Executions that take a function and require a call back on a specific thread are not yet supported.  All call backs are routed back to the main thread.
* Blocking executions that insist on running within the main thread (e.g., application event loops, however this is builtin to Tint).
* Creating destructors (or destructor callbacks) from JS, however both Objective-C and .NET C++/C# objects automatically call their destructors/release when removed from v8's environment for garbage collection purposes.
* Overloaded methods that vary in meta-data only.  NOTE: Overloaded methods match by type signature, this only applies for private/public methods that use the "context" of the call (e.g., private/public) to select one or the other (e.g., very rare).

## Accessing Native objects from Tint Objects

All of the javascript objects in Tint, (Window, Toolbar, etc) just wrap around native objects.  With a Tint window, say as the JS variable "win", access to the inner native object is available through win.native, or the inner native content view object with win.nativeView.  the "native" and "nativeView" exist on every Tint object and expose its underlying native object (whatever it might be, it varies by OS).