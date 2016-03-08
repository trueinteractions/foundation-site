# Getting Started #

## Downloading Tint ##

Before we start ensure you have the latest version of Tint installed.  

You can download the latest release for OSX and Windows from Github.

[https://github.com/trueinteractions/tint2/releases](https://github.com/trueinteractions/tint2/releases)

## Introduction ##

Tint enables programmers to create desktop applications with JavaScript by utilizing the node runtime with direct access to both native objects (Objective-C Objects and .NET/COM objects) or by using Tint's built in application object model and API that standardizes GUI components across various operating systems.  One could view Tint as a flavor of the node.js runtime but is focused on developing desktop applications instead of servers.

Tint, unlike other alternatives, is not a minimal Chromium browser with an API.  It's a light-weight node runtime that integrates the application loop of the target operating system and safely exposes any native OS object needed to build an application. Tint removes the need to worry about threading, garbage collection or any other concerns generally necessary to consider when building most native applications. 

An application begins by creating a V8 JavaScript context and running the main file specified in a package.json formatted file or specified from the command line. At this point the main javascript file may create windows, web view (browser contexts) and other native GUI elements.  This provides a more aligned approach to application development. Making applications in Tint can be completely native with no HTML, or CSS; or they can entirely rely on simply opening a window and attaching a webview to create a native-web application.  The amount that you use native components or web-based html for your GUI is up to you.

### Why use Javascript for Desktop Applications? ###

Javascript is uniquely capable (including libuv and node) at handling event-based programming.  Both server applications and desktop applications share a common problem; responding to events and blocking an event loop.  This is typically the cause of slow server performance; or the "white-out" application on Windows or spinning beach-ball of doom on OSX. Tint uses event-based programming to overcome this and makes development of desktop applicaitons much easier and clearer by using an entirely event-based model and non-blocking API for user interfaces.

### Writing Your First Tint App ###

While there's no requirement as to how your application should be structured, Tint applications are generally structures as such:

```
  app-directory/
   |-- package.json
   |-- main.js
   `-- index.html
```

Tint utilizes the same package.json format as npm and node; and adheres to all node's and npm's requirements. When tint runs it will look for the `main` field in `package.json` as the startup script of an application.  For example;

```json
{
  "name": "app-name-short",
  "longname": "My Application Name",
  "namespace": "com.company.app-name-short",
  "version": "2.0.1",
  "description": "App description, no more than 50 characters",
  "author": "Company Name, or Your Name",
  "sources": {
    "directory":"."
  },
  "icon": { "windows":["someicon.png"], "osx":["someicon.png"] },
  "main": "main.js",
  "license": "MIT",
  "copyright": "2014 True Interactions"
}
```

The `main.js` file, or the startup javascript file should do a few special or specific things.  It should create any initial windows, perform startup routimes, restore any preferences or respond to system and user events. An example of what a main.js file may look like is:

```javascript
require('Common'); // Includes Tint's API, and sets up the runtime bridge.
var window = new Window(); // Creates an initially hidden window.
application.exitAfterWindowsClose = true; // If no windows are open, exit.
window.visible = true; // Show the window to the user.
window.title = "Some Title"; // Give the window a caption.

var webview = new WebView(); // Create a new webview for HTML.
window.appendChild(webview); // attach the webview to the window.

// position the webview 0 pixels from all the window's edges.
webview.left=webview.right=webview.top=webview.bottom=0;

// What we should do when the web-page loads.
webview.addEventListener('load', function() {
	webview.postMessage(JSON.stringify(process.versions));
});

webview.location = "app://index.html"; // Tell the webview to render the index.html 
```

Finally, the `index.html` should contain the html you want to show:
 
```html
<!DOCTYPE html>
<html>
<head>
	<title>Hello</title>
	<script>
	window.addEventListener('message', function(message) {
		var versions = JSON.parse(message.data);
		document.getElementById('node-version').innerText = versions['node'];
		document.getElementById('tint-version').innerText = versions['tint'];
	});
	</script>
</head>
<body>
	<h1>Hello World!</h1>
	<p>This is my first tint application.</p>
	<p>We are using node.js <span id="node-version"></span></p>
	<p>In addition using tint <span id="tint-version"></span></p>
</body>
</html>
```


Running the application above can be done through the command line tool `tint`, which has the same options and is compatible with `node`. 

```bash
$ tint main.js
```

![My First Application](simpleapp.png)

## Comparing Tint, Node Webkit (nw.js) and Atom Shell ##

If you have experience creating web-based applications with node-webkit (now nw.js) or Atom Shell then Tint will be familiar with the exception of one caveat.  Both node-webkit and atom-shell rely on using a browser window for all GUI work, with one location per window.  

### Browsers vs. Applications ###

With Tint its necessary to first create a [Window](Window.html) with javascript, then a [WebView](WebView.html) that is attached to and positioned on the window.  Afterwards, the WebView can be loaded to a location using the [location](WebView.html#location) property. For desktop html-based applications, instead of pointing the URL at a web-server with a domain (such as https://www.google.com/), the app protocol can be used as a URI to access internal resources of your application; such as an HTML file.  For instance, if your folder has "main.js", and "index.html" files the main.js may do the work of opening the window, attaching a web view, then pointing it at "app://index.html".  The path specified on the app protocol begins relative to the main javascript file (if executed on the command line) or from the package.json (if one exists and is launched as a packaged application).  For more information on packaging your applications, read the topic [Packaging Applications](tutorial-packaging.html), for more information on how the app protocol works, read the topic [Application Schema](tutorial-appschema.html).

Tint uses this approach of creating a webview (rather than a browser window) to allow for more complex situations where you may need multiple web pages rendered on the same window, or perhaps greater control over how the container of your html based application behaves. 

### Node Contexts in Browsers ###

In addition, with node-webkit and atom-shell both runtimes (to a lesser or greater degree) integrate the node.js runtime into the javascript runtime of the browser (e.g., Chromium). This isn't the case with Tint.  Tint seperates the javascript contexts between itself and the [WebView](WebView.html).  The reasoning behind this is both for App Store compliance and security.  In node-webkit and atom-shell its possible for any rendered content to access native GUI operations, in addition to file operations or potentially hazardess OS operations.  

Because web development typically uses servers for resources, it's not uncommon to find desktop html-based applications including libraries such as JQuery from CDN's or perhaps, other javascript files from areas outside of the applications internal sources.  In node-webkit or atom-shell, if a webpage is accidently loaded that is not part of your application (say, by a user clicking on an accidental link placed in your applications html) or because the javascript library included by your application came from a compromised server; this could very well potentially be a catostrophic security issue. 

Tint overcomes these issues by not allowing the [WebView](WebView.html)'s javascript context any access to node's context and completely isolating it.  This does raise the need for communication between the webview and Tint's javascript contexts. An html based Tint application may use ```window.postMessageToHost``` to send any javascript-serializable object or string to Tint's context.  Tint's javascript context may use the 'message' event on the WebView to listen for these messages.  In addition Tint can send messages to a WebView using the [postMessage](WebView.html#postMessage) method on a webview, or execute arbitrary javascript within the WebView at any time using the [execute](WebView.html#execute) method (with the resulting value passed back).

Tint's approach allows for scalability in an application design and transparent security policies in an application. 

In short, Tint provides scalability and flexibility in your approach to building your application, while providing solid security to prevent malicious or un-intended consequences of mixed node and browser javascript contexts.



## Running Tint ##

* On Windows, click the start button and "Run" the command ```cmd.exe```, then type in ```tint```. 

* On OSX, open the Terminal application in your Applications -> Utilities folder and type ```tint```.

### Running Tint in Interactive Mode ###
You should now see a command prompt:

```
>
```


Type ```console.log(process.versions)``` and hit enter, you should see an output similar to:

```
> console.log(process.versions)
{ http_parser: '1.0',
  node: '0.10.21',
  v8: '3.14.5.9',
  ares: '1.9.0-DEV',
  uv: '0.10.18',
  zlib: '1.2.3',
  modules: '11',
  openssl: '1.0.1e',
  tint: '2.0.1' }
undefined
> 
```

You can type javascript commands directly into this command line window. You can either close the window or hit ```Control-C``` on Windows or ```Command-C``` on OSX to exit.

Running tint this way is called "Interactive Mode".  Running in "Interactive Mode" is great for experimenting or trying things out (also for debugging applications). However its typically not how applications are built. 

### Running Tint in Script Mode ###

Open your favorite text editor, and type the following into a new file:

```
require('Common');
var win = new Window();
application.exitAfterWindowsClose = true;
win.visible = true;
win.title = "Hello World";
```

1. Save the file to your desktop with the name "helloworld.js".  Like in the example before lets open a terminal, you can reuse an existing one if one is already open.
2. In your terminal change directories to your desktop, this is done either by typing ```cd ~/Desktop``` in OSX, or ```cd %HOMEPATH%\Desktop``` on Windows. 
3. Now run ```tint helloworld.js```

You should see a window with the text "Hello World" in its caption.  You can exit the program by closing the window or exiting tint in the command window. 

Running Tint in this way is called "Scripting Mode".  Running in "Scripting Mode" is great while you're developing your application, you can modify the source code in your favorite IDE then run Tint to see the results. 

### Running Tint in Packaged Mode ###

Finally, there's one last "mode" which is "Packaged Mode".  This is where all of your javascript, html, images or any other resources are combined into a single executable for OSX or Windows (as a standalone application). To find out more about packaging applications into a standard OSX or Windows app see [Packaging Applications](tutorial-packaging.html).

### Understanding Modules ###

Tint uses "modules" much like node which allows you to import functionality, classes and other items as needed.  This allows you to keep in control of the overhead (or memory use) of your application.  To import a module use the require function:

```
require('someModule');
```

Each class in the Reference can be imported using require.  If you plan on using all of them there's a short cut to importing all of the common classes:

```
require('Common');
```

Note that to remain backwards compatible with node.js, Tint by default does not load an application "context".  Importing common will automatically import the application context; but if you plan on using any Tint features you'll need to remember either to import Common or you can import Application, which creates the application context so you can create windows and other UI elements.

```
require('Application');
```

For more information on application contexts, javascript contexts and more in-depth analysis of Tint's structure see the topic [How does Tint work?](tutorial-jsdifferences.html).


