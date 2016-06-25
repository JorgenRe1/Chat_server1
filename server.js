var http = require('http'),
    fs = require('fs');
  console.log('start');
var port = Number(process.env.PORT || 3000);
//Kjøres bare når en bruker går til siden
var app = http.createServer(function (request, response) {
    fs.readFile("client.html", 'utf-8', function (error, data) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(data);
        response.end();
    });
}).listen(port, '176.34.102.205');
 
var io = require('socket.io').listen(app);

var brukere = [];

io.on('connection', function(socket){
  console.log('a user connected');
  //Når en melding blir sendt til server
  socket.on('message_to_server', function(data) {
	  //send til alle tilkoblede brukerne
        io.sockets.emit("message_to_client",{ message: data["message"] });
    });
  socket.on('message_to_server3', function (data) {
	  console.log("ID"+socket.id);
	  var cid = socket.id;
	  io.cid.send("message_to_client",{ message: "Hello" });
  });
  socket.on('message_to_server2',function(data){
	  console.log("MSG: "+data["message"]+"ID: "+socket.id);
      io.to(socket.id).emit('message_to_client',{message:data["message"]});
  });
  //Når en bruker logger av
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});
