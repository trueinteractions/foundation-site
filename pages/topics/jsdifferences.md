# How does Tint work? #

Tint is a bit different than anything you might be used to, especially if more familiar with developing web applications.  Its not harder, just different. 

1. Tint creates a javascript environment just like your Web Browser or node WITHOUT a DOM.
2. Tint exposes native OS objects through its language bridge so you can directly integrate with the OS safely.
3. In addition Tint remains compatible with node and includes its API (and is binary and command-line compatible).
4. Asyncronous calls can be made on any OS related call to prevent blocking the main thread, this creates more responsive UI's.
5. Tint creates an "AOM" (Application Object Model ?) that allows you to access application specific functions, create windows and more.

For those die hard dev's out there scratching their heads as to how this works, the application event loop is automatically handled and integrated into the libuv event loop.  All calls are made on the (single) main thread and will block (if requested), however most calls proxy to another thread to execute (as needed) and if possible.

Finally, Tint inherits all of the capabilities of node, including the npm package management utility and ```require``` javascript module system. Regular node modules work just fine within Tint. 

### Integrating with the OS ###

Tint on OSX provides a toll-free bridge to Apple's obj-c Runtime.  It proxies, manages, and destroys objects for you. When V8 releases an object in Tint, the subsequent [obj release] is executed in objective-c.  This allows users to safely use objective-c classes without worry.  Similarly on Windows Tint provides a CLR .net Runtime allowing access to any WinForms, WPF or DLL (with a CLR compiled option) to load in its classes and use them with the same rules of memory (loose the object and V8 will let the CLR know it no longer needs it, then the CLR can GC it).

To provide a simpler way of creating cross-OS apps, Tint provides a standard framework for doing common tasks.  These classes (see the Tint Reference) allow you to create Windows, Buttons, Toolbars, Notifications and more.  They wrap around the native object standardizing how you use it across operating systems.  All while exposing the native object through the .native (or .nativeView) property.  If you don't want to deal with native objects, don't worry you can use the SDK completely without needing to know them.  If you do find yourself needing extra functionality, new widgets, components or capabilities can be created by using the language bridge and deploying your new user interface component as a node module (or rather, tint module).

### WebView, A Tale of Two Javascripts ###

For those who may have noticed the "WebView" component, you're correct, Tint contains the ability to natively create a WebKit or IE view (control) on a window and subsequently render HTML.  While the WebView module allows arbitrary javascript to be executed in its context, or posting string (serializable) messages back and forth from Tint there is no "integration" of contexts (similar to node-webkit). 

This means just like front-end and back-end development on the web, when you create a WebView, the "back-end" is Tint (V8 runtime) with all of the capabilities to read/write to the computer, and the "front-end" WebView is just a regular embedded web browser with no difference in its security. 

You can use the webview to render content that you host in your application using the app:// schema.  The app schema allows access to packaged resources (where its root is relative to the main executed file when ran, or when packaged).

So in a nutshell, when you create a webview, you're creating two totally different implementations of javascript, while the ability to communicate across them exists, there is no integrated method for one context to access variables (or functions) in the other. This is on purpose to prevent security issues (think for a second if an http resource accidently got access to a node object!  A remote server could run any code on the computer!).

