/*global env: true */
'use strict';
process.require = require;
var fs = require('jsdoc/fs');
var helper = require('jsdoc/util/templateHelper');
var logger = require('jsdoc/util/logger');
var path = require('jsdoc/path');
var taffy = require('taffydb').taffy;
var template = require('jsdoc/template');
var util = require('util');
var prettify = require('json-prettify/json2').stringify;
var htmlsafe = helper.htmlsafe;
var linkto = helper.linkto;
var resolveAuthorLinks = helper.resolveAuthorLinks;
var scopeToPunc = helper.scopeToPunc;
var hasOwnProp = Object.prototype.hasOwnProperty;

var data;
var view;
var fullData = {};
var refData = [];

var outdir = env.opts.destination;
var projectname = env.opts.project;
var projecturl = env.opts.url;
var company = env.opts.company

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    if ( !/^(#.+)/.test(hash) ) { return hash; }

    var url = helper.createLink(doclet);

    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    }
    // typedefs that contain functions get a signature, too
    else if (doclet.kind === 'typedef' && doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (var i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }

    return needsSig;
}

function getSignatureAttributes(item) {
    var attributes = [];

    if (item.optional) {
        attributes.push('opt');
    }

    if (item.nullable === true) {
        attributes.push('nullable');
    }
    else if (item.nullable === false) {
        attributes.push('non-null');
    }

    return attributes;
}

function updateItemName(item) {
    var attributes = getSignatureAttributes(item);
    var itemName = item.name || '';

    if (item.variable) {
        itemName = '&hellip;' + itemName;
    }

    if (attributes && attributes.length) {
        itemName = util.format( '%s<span class="signature-attributes">%s</span>', itemName,
            attributes.join(', ') );
    }

    return itemName;
}

function addParamAttributes(params) {
    return params.filter(function(param) {
        return param.name && param.name.indexOf('.') === -1;
    }).map(updateItemName);
}

function buildItemTypeStrings(item) {
    var types = [];

    if (item.type && item.type.names) {
        item.type.names.forEach(function(name) {
            types.push( linkto(name, htmlsafe(name)) );
        });
    }

    return types;
}

function buildAttribsString(attribs) {
    var attribsString = '';

    if (attribs && attribs.length) {
        attribsString = htmlsafe( util.format('(%s) ', attribs.join(', ')) );
    }

    return attribsString;
}

function addNonParamAttributes(items) {
    var types = [];

    items.forEach(function(item) {
        types = types.concat( buildItemTypeStrings(item) );
    });

    return types;
}

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = util.format( '%s(%s)', (f.signature || ''), params.join(', ') );
}

function addSignatureReturns(f) {
    var attribs = [];
    var attribsString = '';
    var returnTypes = [];
    var returnTypesString = '';

    // jam all the return-type attributes into an array. this could create odd results (for example,
    // if there are both nullable and non-nullable return types), but let's assume that most people
    // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
    if (f.returns) {
        f.returns.forEach(function(item) {
            helper.getAttribs(item).forEach(function(attrib) {
                if (attribs.indexOf(attrib) === -1) {
                    attribs.push(attrib);
                }
            });
        });
        attribsString = buildAttribsString(attribs);
    }

    if (f.returns) {
        returnTypes = addNonParamAttributes(f.returns);
    }
    if (returnTypes.length) {
        returnTypesString = util.format( ' &rarr; %s{%s}', attribsString, returnTypes.join('|') );
    }

    f.signature = '<span class="signature">' + (f.signature || '') + '</span>' +
        '<span class="type-signature">' + returnTypesString + '</span>';
}

function addSignatureTypes(f) {
    var types = f.type ? buildItemTypeStrings(f) : [];

    f.signature = (f.signature || '') + '<span class="type-signature">' +
        (types.length ? ' :' + types.join('|') : '') + '</span>';
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f);
    var attribsString = buildAttribsString(attribs);

    f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
    Object.keys(files).forEach(function(file) {
        files[file].shortened = files[file].resolved.replace(commonPrefix, '')
            // always use forward slashes
            .replace(/\\/g, '/');
    });

    return files;
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta)
        return null;
    return doclet.meta.path && doclet.meta.path !== 'null' ?
        path.join(doclet.meta.path, doclet.meta.filename) :
        doclet.meta.filename;
}

function getAllDescendants(objname) {
    if(!fullData[objname])
        return [];

    var descendants = [];

    for(var key in fullData) {
        if(fullData[key] && key != objname) {
            var objnamecurrent = fullData[key][0].name;
            var cur = fullData[key][0].augments;
            if(typeof(cur) == 'array' || Array.isArray(cur)) {
                for(var i=0; i < cur.length; i++) {
                    if(cur[i] == objname)
                        descendants.push(objnamecurrent);
                }
            }
        }
    }
    return descendants;
}

function getAllAncestors(objname) {
    if(!fullData[objname])
        return [];

    var ancestors = [];
    var cur = fullData[objname][0].augments;

    if(typeof(cur) == 'array' || Array.isArray(cur)) {
        if(cur && cur.length > 0) {
            ancestors = ancestors.concat(cur);
            for(var i=0; i < cur.length; i++)
                ancestors = ancestors.concat(getAllAncestors(cur[i]));
        }
    } else if (typeof(cur) == 'string')
        ancestors.push(cur);

    return ancestors;
}

function generate(title, docs, filename, resolveLinks) {
    resolveLinks = resolveLinks === false ? false : true;

    var doc = docs[0];
    doc.members = find({kind: 'member', memberof: title === 'Global' ? {isUndefined: true} : doc.longname});
    doc.methods = find({kind: 'function', memberof: title === 'Global' ? {isUndefined: true} : doc.longname});
    doc.events = find({kind: 'event', memberof: title === 'Global' ? {isUndefined: true} : doc.longname});
    doc.constructs = find({name: doc.longname, memberof: title === 'Global' ? {isUndefined: true} : doc.longname});
    
    doc.ancestors = doc.augments;
    doc.ancestory = getAllAncestors(doc.name);
    doc.descendants = getAllDescendants(doc.name);

    // Make sure the constructor isn't listed as a 
    // method as JSDOC will by default do.
    if (doc.methods && doc.methods.length) {
        doc.methods = doc.methods.filter(function(m) {
            return m.name != doc.longname;
        });
    }
    // Change the "kind" from a function to a constructor
    if (doc.constructs && doc.constructs.length) {
        doc.constructs.forEach(function(m) { 
            m.kind = "constructs";
        });
    }

    refData.push({title:doc.longname,description:doc.description,kind:'class',url:(doc.name+'.html')});
    if(doc.members) {
        doc.members.forEach(function(member) {
            refData.push({title:member.longname,description:member.description,kind:'member',url:(doc.name+'.html#'+member.name)});
        });
    }
    if(doc.methods) {
        doc.methods.forEach(function(member) {
            refData.push({title:member.longname,description:member.description,kind:'method',url:(doc.name+'.html#'+member.name)});
        });
    }

    if(doc.constructs) {
        doc.constructs.forEach(function(member) {
            refData.push({title:member.longname,description:member.description,kind:'constructor',url:(doc.name+'.html#'+member.name)});
        });
    }
    if(doc.events) {
        doc.events.forEach(function(member) {
            refData.push({title:member.longname,description:member.description,kind:'event',url:(doc.name+'.html#'+member.name)});
        });
    }
    var docData = {
        company:company,
        project:projectname,
        url:projecturl,
        title: title.substring(title.indexOf(":") + 1,title.length).trim(),
        type: title.substring(0,title.indexOf(":")),
        docs: docs,
        doc: docs[0]
    };
    view.company = company;
    view.project = projectname;
    view.url = projecturl;
    var outpath = path.join(outdir, filename), 
        html = view.render('template.html', docData);

    if (resolveLinks)
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

    fs.writeFileSync(outpath, html, 'utf8');
}

//function generateSourceFiles(sourceFiles, encoding) {
    //encoding = encoding || 'utf8';
    //Object.keys(sourceFiles).forEach(function(file) {
        //var source;
        // links are keyed to the shortened path in each doclet's `meta.shortpath` property
        //var sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
        //helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

        //try {
        //    source = {
        //        kind: 'source',
        //        code: helper.htmlsafe( fs.readFileSync(sourceFiles[file].resolved, encoding) )
        //    };
        //}
        //catch(e) {
        //    logger.error('Error while generating source file %s: %s', file, e.message);
        //}

        //generate('Source: ' + sourceFiles[file].shortened, [source], sourceOutfile,
        //    false);
    //});
//}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function(symbol) {
        symbols[symbol.longname] = symbol;
    });

    return modules.map(function(module) {
        if (symbols[module.longname]) {
            module.module = symbols[module.longname];
            module.module.name = module.module.name.replace('module:', '(require("') + '"))';
        }
    });
}

function buildNav(members) {
    return members;
}

function includeStaticFiles(fromDir, outDir) {
    var staticFiles = fs.ls(fromDir, 3);
    staticFiles.forEach(function(fileName) {
        var toDir = fs.toDir( fileName.replace(fromDir, outDir) );
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function(taffyData, opts, tutorials) {
    data = taffyData;

    var conf = env.conf.templates || {};
    conf['default'] = conf['default'] || {};

    var templatePath = opts.template;
    view = new template.Template(templatePath + '');

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    var indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    var globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    // set up templating
    //view.layout = conf['default'].layoutFile ?
    //    path.getResourcePath(path.dirname(conf['default'].layoutFile),
    //        path.basename(conf['default'].layoutFile) ) : 'template.html';

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');
    helper.addEventListeners(data);

    var sourceFiles = {};
    var sourceFilePaths = [];
    data().each(function(doclet) {
         doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function(example) {
                var caption, code;

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code    = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function(seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        var sourcePath;
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            sourceFiles[sourcePath] = {
                resolved: sourcePath,
                shortened: null
            };
            if (sourceFilePaths.indexOf(sourcePath) === -1) {
                sourceFilePaths.push(sourcePath);
            }
        }
    });

    // update outdir if necessary, then create outdir
    var packageInfo = ( find({kind: 'package'}) || [] ) [0];
    if (packageInfo && packageInfo.name) {
        outdir = path.join(outdir, packageInfo.name, packageInfo.version);
    }
    fs.mkPath(outdir);


    //includeStaticFiles(path.join(path.join(templatePath, '..'),'site'), path.join(outdir,''));
    includeStaticFiles(path.join(templatePath, 'images'), path.join(outdir,'images'));
    includeStaticFiles(path.join(templatePath, 'scripts'), path.join(outdir,'scripts'));
    includeStaticFiles(path.join(templatePath, 'style'), path.join(outdir,'style'));
    includeStaticFiles(path.join(templatePath, 'vendor'), path.join(outdir,'vendor'));

    // copy user-specified static files to outdir
    var staticFilePaths;
    var staticFileFilter;
    var staticFileScanner;
    if (conf['default'].staticFiles) {
        staticFilePaths = conf['default'].staticFiles.paths || [];
        staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf['default'].staticFiles);
        staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

        staticFilePaths.forEach(function(filePath) {
            var extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

            extraStaticFiles.forEach(function(fileName) {
                var sourcePath = fs.toDir(filePath);
                var toDir = fs.toDir( fileName.replace(sourcePath, outdir) );
                fs.mkPath(toDir);
                fs.copyFileSync(fileName, toDir);
            });
        });
    }

    if (sourceFilePaths.length)
        sourceFiles = shortenPaths( sourceFiles, path.commonPrefix(sourceFilePaths) );

    data().each(function(doclet) {
        var url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);

        // add a shortened version of the full path
        var docletPath;
        if (doclet.meta) {
            docletPath = getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.shortpath = docletPath;
            }
        }
    });

    data().each(function(doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        }
        else {
            doclet.id = doclet.name;
        }

        if ( needsSignature(doclet) ) {
            addSignatureParams(doclet);
            //addSignatureReturns(doclet);
            addAttribs(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
        }
    });

    var members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // output pretty-printed source files by default
    var outputSourceFiles = conf['default'] && conf['default'].outputSourceFiles !== false ? true : false;

    // add template helpers
    view.find = find;
    view.linkto = linkto;
    view.resolveAuthorLinks = resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;
    view.outputSourceFiles = outputSourceFiles;

    // once for all
    view.nav = buildNav(members);
    attachModuleSymbols( find({ kind: ['class', 'function'], longname: {left: 'module:'} }),
        members.modules );


    if (members.globals.length) { generate('Global', [{kind: 'globalobj'}], globalUrl); }


    // set up the lists that we'll use to generate pages
    var classes = taffy(members.classes);
    var modules = taffy(members.modules);
    var namespaces = taffy(members.namespaces);
    var mixins = taffy(members.mixins);
    var externals = taffy(members.externals);

    // This may seem easily folded into the statement below it, as they
    // both (effectively) loop through the same thing, however before 
    // "generate" can be ran we need to have a complete representation
    // of all types in the system.
    Object.keys(helper.longnameToUrl).forEach(function(longname) {
        var myClasses = helper.find(classes, {longname: longname});
        if (myClasses.length) {
            fullData[myClasses[0].name] = myClasses;
        }

        var myModules = helper.find(modules, {longname: longname});
        if (myModules.length) {
            fullData[myModules[0].name] = myModules;
        }

        var myNamespaces = helper.find(namespaces, {longname: longname});
        if (myNamespaces.length) {
            fullData[myNamespaces[0].name] = myNamespaces;
        }

    });

    Object.keys(helper.longnameToUrl).forEach(function(longname) {
        var myClasses = helper.find(classes, {longname: longname});
        if (myClasses.length)
            generate(myClasses[0].name, myClasses, helper.longnameToUrl[longname]);

        var myModules = helper.find(modules, {longname: longname});
        if (myModules.length)
            generate(myModules[0].name, myModules, helper.longnameToUrl[longname]);

        var myNamespaces = helper.find(namespaces, {longname: longname});
        if (myNamespaces.length)
            generate(myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);

        var myMixins = helper.find(mixins, {longname: longname});
        if (myMixins.length)
            generate(myMixins[0].name, myMixins, helper.longnameToUrl[longname]);

        var myExternals = helper.find(externals, {longname: longname});
        if (myExternals.length)
            generate(myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
    });

    // TODO: move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData = {
            company:company,
            project:projectname,
            url:projecturl,
            title: title,
            type:'Topic',
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children,
            opts: env.opts
        };
        var tutorialPath = path.join(outdir, filename),
            html = view.render('topics.html', tutorialData);
        // yes, you can use {@link} in tutorials too!
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>

        fs.writeFileSync(tutorialPath, html, 'utf8');
    }

    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function(child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
    if(fullData)
    {
        for(var key in fullData) {
            var z = fullData[key];
            if(z && z.members) {
                z.members.forEach(function(e) {
                    e.comment = "";
                });
            }
            if(z && z.methods) z.methods.forEach(function(e) {
                e.comment = "";
            });
            if(z && z.constructs) z.constructs.forEach(function(e) {
                e.comment = "";
            });
            if(z && z.events) z.events.forEach(function(e) {
                e.comment = "";
            });
        }
    }
    fs.writeFileSync(path.join(outdir,'dataLarge.json'), prettify(fullData, null, '  '));
    fs.writeFileSync(path.join(outdir,'data.json'), prettify(refData, null, '  '));
};
