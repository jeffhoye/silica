#!/usr/bin/env node

// Node Provided modules
const  exec  =  require('child_process').exec;
const  http  =  require('http');
const  path  =  require('path');

// Third party dependencies
const  livereload    =  require('livereload');
const  finalhandler  =  require('finalhandler');
const  serveStatic   =  require('node-static');
const  watch         =  require('watch');
const  program       =  require('commander');

var  fileServer    =  new serveStatic.Server('./build');

program
  .option('-p --port [value]', "The port to listen on")
  .option('-s --styles [path]', "Directory of additional style imports relative to the src directory")
  .parse(process.argv);

var styleIncludes = program.styles;

var child_callback = function (error, stdout, stderr) {
  console.log(stdout);
  console.error(stderr);

  if (error !== null) {
    console.error('exec error: ' + error);
  } else {
    console.log("Done!");
  }

};

var wait = false;

var rebuild = function() {
  if (wait) {
    return;
  }
  wait = true;
  setTimeout(function () {
    wait = false;
  }, 1000);
  console.log("Rebuilding...");
  var cmd = 'silica build';
  if (styleIncludes && styleIncludes.length > 0) {
    cmd += " -s " + styleIncludes
  }
  exec(cmd, child_callback);
};

watch.createMonitor('./src', { 'ignoreDotFiles': true}, function (monitor) {
  monitor.on("created", rebuild);
  monitor.on("changed", rebuild);
  monitor.on("removed", rebuild);
});

require('http').createServer(function (request, response) {
  request.addListener('end', function () {
    fileServer.serve(request, response, function (e, res) {
      if (e && (e.status === 404)) {
        // If the file wasn't found
        fileServer.serveFile('/index.html', 404, {}, request, response);
      }
    });
  }).resume();
}).listen(program.port || 8080);

rebuild();

var server = livereload.createServer();
server.watch(path.join(process.cwd(), "/build"));
