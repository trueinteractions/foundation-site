# Using the Application Schema #

When you create applications with Tint you'll often need to reference or use resources packaged with your application. Resources can be anything, javascript files, HTML files, images, etc.  Resources can be accessed several different ways. Resources are simply files relative to the running script and within the same directory (or sub directory) of the main script. When you package your application all of these files are included as application resources.

## Accessing Application Resources ##

1. Using require('module').  Regardless if your application is packaged or ran as a script any javascript can be included using the require method. If your application is packaged Tint will automatically resolve this issue for you.
2. Using {@link Application.resource}.  This method returns a Buffer object of the requested resource regardless if the application is packaged or not (if not packaged it just reads from the relative path of the running script, just like require).
3. Using app:// schema.  Tint exposes an app schema you can use with several modules in Tint such as {@link WebView}.  This allows other non-node contexts to access your application resources using standard URL requests (so long as its in the same process as Tint, or a built in module of Tint). 

### Accessing Application Resources from WebViews ###

For this example, lets assume you have a directory structure as such:

```
  app-directory/
   |-- package.json
   |-- main.js
   `-- somefolder/
     `--index.html
```

To access index.html in a webview, use the app scheme:

```javascript
require('Common');

var win = new Window();
win.height = 500; // change the height to 800
win.width = 200; // change the width to 200
win.visible = true; // now show the window.
var webview = new WebView();
win.appendChild(webview);
webview.left=webview.right=webview.top=webview.bottom=0;
webview.location = 'app://index.html'
```

The app scheme allows you to access resources packaged (or from the file system relative to the main javascript file).  This works regardless if you're using tint from the command line or if your application is packaged as a native app. If your index.html includes files relative to the path, say, a CSS file or javascript file it will automatically resolve as it does on a webserver.

### Accessing Application Resources from Node ###

To access native application resources from node use the application.resource() method, it retrieves (relative to the main javascript file executed) the requested file.  Note that this is a path URI, and not a require('javascript.js'), meaning if the asset is in a directory you'll need to specify the directory as well (unlike node modules in the node_modules folder).

For example, lets say you have the following folder structure:

```
  app-directory/
   |-- package.json
   |-- main.js
   |-- someotherfolder/
   | `--somejavascript.js
   `-- somefolder/
     `--someasset.pdf
```

To access someasset.pdf thats part of your application resources you'd need to use application.resource('./somefolder/someasset.pdf'), regardless if somejavascript.js was requesting it, or if main.js was requesting it (IMPORTANT: This assumes main.js was the main javascript file executed).
