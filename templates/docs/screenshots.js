var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var config = JSON.parse(fs.readFileSync("config.json"));
var data = JSON.parse(fs.readFileSync(path.join(config.opts.destination,"dataLarge.json")));
var basePath = path.join(config.opts.destination,'examples');
var sshCode = fs.readFileSync('src/screenshots_helper.js');
var os = require('os');

var market = "";
var ismac = os.platform().toLowerCase() == "darwin";
if(ismac && os.release().indexOf("12.") > -1) market = "mountainlion";
if(ismac && os.release().indexOf("13.") > -1) market = "mavericks";
if(ismac && os.release().indexOf("14.") > -1) market = "yosemite";

if(!ismac && os.release().indexOf("6.") > -1) market = "win7";
if(!ismac && os.release().indexOf("7.") > -1) market = "win8";

var examplesBase = [];

if(!fs.existsSync(basePath))
  fs.mkdirSync(basePath);

function getControlScreenshot(member) {
  var results = [];
  if(member.tags) {
    for(var z=0; z < member.tags.length; z++) {
      if(member.tags[z].title == "screenshot-control") {
        results.push(member.tags[z].value.replace('{','').replace('}',''));
      }
    }
  }
  return results;
}

function getWindowScreenshot(member) {
  var results = [];
  if(member.tags) {
    for(var z=0; z < member.tags.length; z++) {
      if(member.tags[z].title == "screenshot-window") {
        results.push(member.tags[z].value.replace('{','').replace('}',''));
      }
    }
  }
  return results;
}

function getScreenScreenshot(member) {
  var result = false;
  if(member.tags) {
    for(var z=0; z < member.tags.length; z++) {
      if(member.tags[z].title == "screenshot-screen") {
        result = true;
      }
    }
  }
  return result;
}

function createExamples(prop) {
  for(var key in data) {
    for(var u=0; u < data[key].length; u++) {
      var members = data[key][u][prop];
      for(var i=0; i < members.length; i++) {
        var member = members[i];
        var useExampleForScreenshot = true;
        if(member.tags) {
          for(var z=0; z < member.tags.length; z++) {
            if(member.tags[z].title == "noscreenshot")
              useExampleForScreenshot = false;
          }
        }
        if(member.examples && useExampleForScreenshot) {
          var examples = member.examples;
          for(var j=0; j < examples.length; j++) {
            var example = examples[j];
            var p = path.join(basePath, member.memberof+"-"+member.name+j);
            examplesBase.push(path.join(process.cwd(),p+'.js') );
            
            var index = 0;
            var tsshCode = "";
            var controlScreenshots = getControlScreenshot(member);
            var windowScreenshots = getWindowScreenshot(member);
            var screenShotScreen = getScreenScreenshot(member);
            
            controlScreenshots.forEach(function(e) {
              tsshCode += "\n" + "utils.writeImage(utils.takeSnapshotOfControl("+e+"),outfile+'_'+market+'_"+index+"_"+e+".png');";
              index++;
            });

            windowScreenshots.forEach(function(e) {
              tsshCode += "\n" + "utils.writeImage(utils.takeSnapshotOfWindow("+e+"),outfile+'_'+market+'_"+index+"_window.png');"
              index++;
            });

            if(screenShotScreen) {
              tsshCode += "\n" + "utils.writeImage(utils.takeSnapshotOfActiveScreen(),outfile+'_'+market+'_"+index+"_screen.png');"
              index++;
            }
            fs.writeFileSync(p+'.js',example.code+'\n'+sshCode.toString().replace("@@@CODE_REPLACE@@@",tsshCode));
          }
        }
      }
    }
  }
}

createExamples('members');
createExamples('events');
createExamples('methods');
createExamples('constructs');

var i=0;
console.log('begin',examplesBase);
function run() {
  if(i < examplesBase.length) {
    console.log('running ', examplesBase[i]);
    var s = spawn("tint",[examplesBase[i]],{stdio:'inherit'});
    s.on('close',function(code) {
      i++;
      run();
    });
  } else 
    process.exit(0);
}
run();
