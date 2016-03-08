require('Common');
var fs = require('fs');
var path = require('path');
var utils = require('../../Tint/test/tools/utilities.js');


var tests = [
	{},
	{backgroundColor:'transparent',frame:false},
	{frame:false},
	{frame:false,resizable:false},
	{textured:true},
	{textured:true,resizable:false}
];

var queue = [];

function test(outfile, settings) {
	var win = new Window();
	for(var key in settings) {
		win[key] = settings[key];
	}
	var btn = new Button();
	btn.left = btn.top = 0;
	btn.width = 200;
	btn.height = 50;
	btn.title = "Window Test";
	win.appendChild(btn);
	win.visible = true;

	setTimeout(function() {
		utils.writeImage(utils.takeSnapshotOfActiveScreen(),outfile);
		console.log('a');
		win.visible = false;
	//	win.destroy();

		console.log('b');
		if(queue.length > 0) {
				var next = queue.shift();
				next();
		}
	},250);

}

for(var i=0; i < tests.length; i++) {
	queue.push(test.bind(this,'window_'+i+'.png',tests[i]));
}

var begin = queue.shift();
begin();


//