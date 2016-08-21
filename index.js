var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var port = process.env.PORT || 3000;
var originalFileName,
	filePath;

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

		res.end("done");	
	});


});

var server = app.listen(port, function(){
	console.log("Server listening on port " + port);
});