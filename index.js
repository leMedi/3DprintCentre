var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var port = process.env.PORT || 3000;
var originalFileName,
	filePath;

var slic3rPath = path.join(__dirname, "/Slic3r/slic3r-console.exe"); // for windows
var gcoderPath = "gcoder.py";

var configurationPath = "config.ini"; // static for now

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/upload', function(req, res){
	var form = new formidable.IncomingForm(); // manage incomming data with Formidable

	// put uploaded files in 'upload' directory
	form.uploadDir = path.join(__dirname, '/uploads');

	form.parse(req, function(err, fields, files){
		if(err){
			console.log(err);
			res.end("Error");
			return;
		}

		// move file to 'upload' folder and give it a unique name
		originalFileName  = files.file.name;
		filePath = path.join(form.uploadDir, Date.now() + ".stl"); //Genarate new path for file
		fs.rename(files.file.path, filePath); //move file

		runSlic3r(filePath,configurationPath,function(estimatedTime, estimatedLength){
			console.log("Estimated time: " + estimatedTime);

			var estimatedWeight = calculateWeight(estimatedLength, 1.75, "ABS");

			console.log("Estimated Weight: " + estimatedWeight + " g");

			res.end("Estimated time: " + estimatedTime + "<br/>" + "Estimated Weight: " + estimatedWeight + " g");
		});	
	});


});

var server = app.listen(port, function(){
	console.log("Server listening on port " + port);
});

function runSlic3r(filePath,configuration,callback,error){
	const exec = require('child_process').exec;

	var gcodePath = filePath.slice(0, filePath.length - 3) + "gcode"; // generate path for .gcode file

	// slic3r command: slic3r example.stl --load example.ini --output example.gcode 
	var command = slic3rPath + " " + filePath + " --load " + configuration + " --output " + gcodePath; // silce .stl using slic3r

	exec(command,function(error, stdout, stderr){
		if (error) {
			console.log("error runslicer");
			console.log(error);
			return;
		}
		runGcoder(gcodePath,callback); // send .gcode file to Gcoder.py
	});
}

function runGcoder(filePath,callback,error){
	const exec = require('child_process').exec;
	var command = "python  " + gcoderPath + " " + filePath;

	exec(command,function(error, stdout, stderr){
		if (error) {
			console.log("error Gcoder");
			console.log(error);
			return;
		}
		parseGcoderOutput(stdout, callback); //parse gcoder.py output
	});
}

function parseGcoderOutput(gcoderOutput, callback){
	lines = gcoderOutput.split("\n");
	var estimatedTime = lines[9].substr(20); // get estimated print time
	var estimatedFilamentLength = lines[7].slice(3,lines[7].length-2); // get estimated filament to be used for printing object
	
	callback(estimatedTime, estimatedFilamentLength)
}

// get density for plastic used to print the object
function getDensity(fillType){ // en g/cm3 (metric system is cool)
	fillType = fillType.toString().toUpperCase();
	switch(fillType){
		case "ABS":
			return 1.4;
		case "PLA":
			return 1.25;
	}
}

function calculateWeight(fillLength, fillDiameter, fillType){ // en g
	var fillLength = typeof fillLength !== 'undefined' ?  parseInt(fillLength) : 0;
	var fillDiameter = typeof fillDiameter !== 'undefined' ?  parseInt(fillDiameter) : 0;
	var fillType = typeof fillType !== 'undefined' ?  fillType : "ABS";

	var fillradius = fillDiameter/2,
		section = fillradius * fillradius * Math.PI,
		volume = section * fillLength; // in mm3

	var volumeCmCube = volume * 0.001; // convert volume to cm3
	
	return volumeCmCube * getDensity(fillType); // weight in g
}