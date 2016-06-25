var http = require('http'),
    fs = require('fs');
	
var users = {};
var counter = 0;
var app = http.createServer(function (request, response) {
    fs.readFile("chatClient.html", 'utf-8', function (error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
}).listen(1337);
 
var io = require('socket.io').listen(app);
 
io.sockets.on('connection', function(socket) {
	console.log("User entered!");
	socket.on("disconnect", function(){
		console.log("User left");
	});
    socket.on('message_to_server', function(data) {
		if (data["message"] == "new"){
			//create new ID
			var newID = (Math.floor(Math.random() * 1000));
			while (users[newID] != null){
			   newID = (Math.floor(Math.random() * 1000));	
			}
			//console.log("newID: "+newID);
			io.sockets.emit("message_to_client",{ message: newID});
		} else {
			//console.log(data["username"]+": "+data["message"]);
            io.sockets.emit("message_to_client",{ pID: data["pID"], xPos: data["xPos"], yPos: data["yPos"], angle: data["angle"]});
		}
    });
});