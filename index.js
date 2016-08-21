var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var port = process.env.PORT || 3000;

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
		fileName  = files.file.name;
		file_path = path.join(form.uploadDir, Date.now() + ".stl"); //Genarate new path for file
		fs.rename(files.file.path, path.join(form.uploadDir, fileName)); //move file

		res.end("done");	
	});


});
