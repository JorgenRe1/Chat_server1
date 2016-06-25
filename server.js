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
}).listen(port);
 
var io = require('socket.io').listen(app);

var brukere = [];

io.on('connection', function(socket){
  console.log('a user connected');
  //Når en melding blir sendt til server
  socket.on('message_all', function(data) {
	  //send til alle tilkoblede brukerne
        io.sockets.emit("message_to_client",{ message: data["message"] });
    });
  socket.on('message_to_server', function (data) {
	  var cid = socket.id;
	  var navn = data["navn"];
	  console.log("ID: "+cid);
	  if (brukere[cid] == null){
	  	console.log("Ny bruker");
	  	brukere[cid] = [];
	  	brukere[cid]["last"] = cid;
	  	brukere[cid]["logg"] = "<span style='font-weight: bold; border-bottom: solid black;'>"+navn+"</span><br> "+data["message"];
	  } else {
	  	console.log("Naa: "+cid+" Last: "+brukere[cid]["last"]);
	  	console.log("MSG: "+data["message"]);
	  	if (brukere[cid]["last"] == cid){
	  	    brukere[cid]["logg"] += "<br>&nbsp"+data["message"];	
	  	} else {
	  	   brukere[cid]["logg"] += "<br><span style='font-weight: bold; border-bottom: solid black;'>"+navn+"</span><br>"+data["message"];
	  	}
	  }
	  brukere[cid]["last"] = cid;
	  console.log("Sender melding til: "+cid);
	  io.to(cid).emit('message_to_client',{message: brukere[cid]["logg"]});
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
