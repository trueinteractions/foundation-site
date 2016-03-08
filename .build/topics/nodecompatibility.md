# Node Compatibility #

Tint is fully compatible with node.

## What does this mean? ##

* Binary compatibility - Node compiled projects work with Tint, without modification. C++ object, C functions, calling conventions and the C++/C API and exported symbols are the same as in Node.
* Command line compatibility - Node command line arguments are honored by Tint. Tint also reproduces the exact same command line output as node, unmodified or appended.
* Event loop order and contract - Tint executes event loop callbacks in the same order as Node.
* API compatibility - Any and all API's and their behavior is retained by Tint.
* Stability compatibility - Tint always aims to use the latest stable release of Node.

## Known Incompatibilities ##

There are two exceptions to the compatibility.

* Exiting - Tint requests an application runtime event loop, this is incompatible with node's exit-if-theres-nothing philosophy. The application event loop does not exit unless explicitly asked to.

* Using native modules in Windows - Tint is binary compatible and supports native modules on Windows, due to the nature of how node-gyp and node loads binary modules on Windows the name of the executable must be "node.exe" for many node native modules to successfully register.  While work at node-gyp, io.js and node is on-going to resolve this incompatibility there is a workaround, simply renaming tint.exe to node.exe fixes the loading problems. Once the issue is fixed upstream this workaround is no longer necessary.