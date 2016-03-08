# Packaging #

Tint contains a command line tool for packaging Windows and OSX applications into a single executable that can be distributed. This allows developers (once finished developing applications) to distribute them through familiar channels to users (such as in an App Store or downloadable from the web).

To create an application you'll need to create a package file first.  Most node (and tint) apps contain a file called "package.json".  This file has very little to no meaning for your application while its running (as no information from it is used), but it is important for bundling the application as the information used in it describes what your application does, who built it, its icon, name and more information (such as dependencies).  Tint translates information in this package file into "manifest" information an operating system will read from your application prior to a user opening it. 

### Package Format ###

Note: This is not an exhaustive list of the options that you can have in a package.json file, just the ones that are required for Tint. 

```json
{
  "name": "shortname",
  "longname": "My Application Name",
  "namespace": "com.trueinteractions",
  "version": "2.0.1",
  "description": "App description, no more than 50 characters",
  "author": "Company Name, or Your Name",
  "sources": {
    "directory":"."
  },
  "icon": {
    "osx":["./tintruntime.png"],
    "windows":["./tintruntime.png"]
  },
  "main": "lib/main.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/some/repo.git"
  },
  "bugs": {
    "url": "https://github.com/some/repo/issues"
  },
  "license": "MIT",
  "copyright": "2014 True Interactions"
}
```

A few things to point out, the icon resources must be a 512x512 PNG (RGBA) type image. A PNG image can be produced by popular imaging tools such as Photoshop. RGBA simply implies that using transparency is allowed, and 512x512 are the dimensions of the image, or resolution. 

The main property in the package tells Tint what javascript file will initially run when a user clicks on the application. The sources (and sources/directory) property sets the path where Tint will find all the sources to the application.

The remaining properites are to provide information to the user and to properly namespace your application.  These are not optional values and do have an effect on how your application behaves.  An operating system creates unique entries for preferences and other items using the "namespace" property, its important to make this as unique as possible to your company or organization name and product.  The version information is encoded in the manifest as well, if it's not properly updated on each build, updates may not be properly applied. 

### Compiling a Build ###

A command line tool called ```tntbuild``` for Tint exists to build executables for Windows and OSX and comes with Tint. To use the tool just pass in the path to the package.json file. 

```
$ tntbuild path/to/some/package.json
```

The build for OSX and Windows will be in a newly created folder from where the command was ran called 'build'.

There are also additional command line options you can specify to change the behavior of the build.  See ```tntbuild --help``` for more information.

### Building for Windows on OSX and Vice Versa ###

Tint can build Windows applications from OSX and OSX applications from Windows.  However, when building an OSX application from Windows you'll need to either transfer the OSX package to OSX and re-enable the execution bit on the package (as Windows does not have a concept of executable bits in the same sense). Windows applications build on OSX do not have this issue.

On an OSX machine (or Linux) prior to packaging you'll need to run this command within a Terminal:

```bash
$ chmod +x ./YourAppName.app/Contents/MacOS/Runtime
```

Using an installer on OSX (pkg) or Windows (msi) fixes this issue as well. 

### Excluding Files and Folders from a Build ###

The package.json file provides a way for users to excempt or exclude files/folders from the build process, the option (from the root) sources.exclude can be any regular expression that is applied to each file to determine whether it is included or excluded, a match on a file excludes it from the build. 

For example:

```json
{
  "name": "shortname",
  "longname": "My Application Name",
  "namespace": "com.trueinteractions",
  "version": "2.0.1",
  "description": "App description, no more than 50 characters",
  "author": "Company Name, or Your Name",
  "sources": {
    "directory":".",
    "exclude":"someFile.png|someOtherFile.js"
  },
  "icon": {
    "osx":["./tintruntime.png"],
    "windows":["./tintruntime.png"]
  },
  "main": "lib/main.js",
  "repository": {
    "type": "git",
    "url": "https://github.com/some/repo.git"
  },
  "bugs": {
    "url": "https://github.com/some/repo/issues"
  },
  "license": "MIT",
  "copyright": "2014 True Interactions"
}
```

In the above example any file with "someFile.png" or "someOtherfile.js" will be excluded, in addition folder names can be provided to exclude an entire folder.
