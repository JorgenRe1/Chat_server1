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
var chatter = [];
var cid_fb = [];
io.on('connection', function(socket){
  console.log('a user connected');
  
    socket.on('ny_bruker', function(data) {
    	console.log("Ny bruker");
      	var cid = socket.id;
      	var fb_id = data["fb_id"];
      	cid_fb[cid] = fb_id; 
    	if(brukere[fb_id] == null){
         var navn = data["navn"];
         console.log("FB: "+fb_id);
	 brukere[fb_id] = [];
	 brukere[fb_id]["navn"] = navn;
	 brukere[fb_id]["cid"] = cid;
	 brukere[fb_id]["last"] = "keine";
	 brukere[fb_id]["logg"] = "";
    	}
    	 brukere[fb_id]["status"] = true;	
    	
    });
  //Når en melding blir sendt til server
  socket.on('message_all', function(data) {
	  //send til alle tilkoblede brukerne
        io.sockets.emit("message_to_client",{ message: data["message"] });
    });
   //Hente alle brukere som er logget paa
  socket.on('hent_brukere', function(data) {
	  var bruker_liste = "";
	  //Hente alle facebook idean
	  var bruker_ider = Object.keys(brukere);
	  for (var nr = 0; nr < bruker_ider.length+1; nr++){
	  	if (bruker_ider[nr] != cid_fb[socket.id] && bruker_ider[nr] != null && brukere[bruker_ider[nr]]["status"]){
	  		if (bruker_liste == "") {
	  			var bruker_navn = brukere[bruker_ider[nr]]["navn"];
	  			bruker_liste = "<button";
	  			bruker_liste +=" onclick='chat_med(\""+bruker_ider[nr]+"\", \""+bruker_navn+"\", \""+bruker_ider[nr]+"\")' class='chat_med_btn'>"+bruker_navn+"</button>";
	  		} else if (bruker_ider[nr] != null){
	  			var bruker_navn = brukere[bruker_ider[nr]]["navn"];
	  			bruker_liste += "<br><button";
	  			bruker_liste +=" onclick='chat_med(\""+bruker_ider[nr]+"\", \""+bruker_navn+"\", \""+bruker_ider[nr]+"\")' class='chat_med_btn'>"+bruker_navn+"</button>";
	  		}
	  	}
	  }
        io.to(socket.id).emit("bruker_liste",{ message: bruker_liste });
    });
    //Når bruker chatter:
  socket.on('message_to_server', function (data) {
	  var cid = socket.id;
	  var fb_id = cid_fb[cid];
	  var navn = data["navn"];
	  console.log("ID: "+cid);
	  if (brukere[fb_id] == null){
              var msg_t = "ikke_registrert";
	  } else {
	  	var logg = brukere[fb_id]["logg"];
	  	console.log("Naa: "+fb_id+" Last: "+brukere[fb_id]["last"]);
	  	console.log("MSG: "+data["message"]);
	  	if (brukere[fb_id]["last"] == fb_id){
	  	    brukere[fb_id]["logg"] += "<br>&nbsp"+data["message"];	
	  	} else {
	  	   if (logg != "") brukere[fb_id]["logg"] += "<br>";
	  	   brukere[fb_id]["logg"] += "<span style='font-weight: bold; border-bottom: solid black;'>"+brukere[fb_id]["navn"]+"</span><br>&nbsp"+data["message"];
	  	}
	  	var msg_t = brukere[fb_id]["logg"];
	  }
	  brukere[fb_id]["last"] = fb_id;
	  console.log("Sender melding til: "+cid);
	  io.to(cid).emit('message_to_client',{message: msg_t, from: "self"});
	  //Send saa til admin som kan da bli notifisert om at det chattes
	  //io.sockets.emit("notify_admin",{ message: cid });
  });
  
  //når admin chatter så må chatt logg objectet sendes til admin og bruker som hjelpes
  socket.on('admin_to_user',function(data){
  	  var fb_id = data["user_id"];
	  var user_id = brukere[fb_id]["cid"];
	  var admin_id = socket.id;
	  var admin_fb = cid_fb[admin_id];
	  if (brukere[fb_id]["last"] == admin_id){
	        brukere[fb_id]["logg"] += "<br>&nbsp"+data["message"];	
	  } else {
	  	brukere[fb_id]["logg"] += "<br><span style='font-weight: bold; border-bottom: solid black;'>"+brukere[admin_id]["navn"]+"</span><br>&nbsp"+data["message"];
	  }
	  brukere[fb_id]["last"] = admin_fb;
	  var logg = brukere[user_id]["logg"];
          io.to(admin_id).emit('message_to_client',{message: logg, from: "self"});
          io.to(user_id).emit('message_to_client',{message: logg, from: brukere[admin_fb]["navn"]});
  });
  
  socket.on('hent_chat',function(data){
      var user = data["user_id"];
      io.to(socket.id).emit('bruker_chat',{message:brukere[user]["logg"]});
  });
  //Når en bruker logger av
  socket.on('disconnect', function(){
    console.log('user disconnected. ID: '+socket.id);
    var user_id = cid_fb[socket.id];
    if (brukere[user_id] != null ) brukere[user_id]["status"] = false;	
  });
});
