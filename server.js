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

function check_message(melding){
   if(melding.indexOf("sex") > -1) return false;
   if(melding.indexOf("penis") > -1) return false;
   if(melding.indexOf("kill") > -1) return false;
   if(melding.indexOf("død") > -1) return false;
   if(melding.indexOf("faen") > -1) return false;
   if(melding.indexOf("drepe") > -1) return false;
}

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
  //Når en melding skal sendes til alle
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
	  			bruker_liste = "<button id='btn_"+bruker_ider[nr]+"'";
	  			bruker_liste +=" onclick='chat_med(\""+bruker_ider[nr]+"\", \""+bruker_navn+"\", \""+bruker_ider[nr]+"\")' class='chat_med_btn'>"+bruker_navn+"</button>";
	  		} else if (bruker_ider[nr] != null){
	  			var bruker_navn = brukere[bruker_ider[nr]]["navn"];
	  			bruker_liste += "<br><button id='btn_"+bruker_ider[nr]+"'";
	  			bruker_liste +=" onclick='chat_med(\""+bruker_ider[nr]+"\", \""+bruker_navn+"\", \""+bruker_ider[nr]+"\")' class='chat_med_btn'>"+bruker_navn+"</button>";
	  		}
	  	}
	  }
        io.to(socket.id).emit("bruker_liste",{ message: bruker_liste });
    });
    //Når bruker chatter:
  socket.on('message_to_server', function (data) {
  	var stop = false;
  	if (!check_message(data["message"])) stop = true;
	  var cid = socket.id;
	  var fb_id = cid_fb[cid];
	  var navn = data["navn"];
	  console.log("ID: "+cid);
	  if (brukere[fb_id] == null){
              var msg_t = "ikke_registrert";
	  } else if(!stop) {
	  	//Dersom bruker har blitt auto logget av
	  	brukere[fb_id]["status"] = true;
	  	var logg = brukere[fb_id]["logg"];
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
	  if(!stop) io.to(cid).emit('message_to_client',{message: msg_t, from: "self"});
	  //Send saa til admin som kan da bli notifisert om at det chattes
	  if(!stop) io.sockets.emit("notify_admin",{ message: fb_id });
  });
  
  //når admin chatter så må chatt logg objectet sendes til admin og bruker som hjelpes
  socket.on('admin_to_user',function(data){
  	  var user_fb = data["user_fb"];
	  var user_id = brukere[user_fb]["cid"];
	  var admin_id = socket.id;
	  var admin_fb = cid_fb[admin_id];
	  if (brukere[user_fb]["last"] == admin_fb){
	        brukere[user_fb]["logg"] += "<br>&nbsp"+data["message"];	
	  } else {
	  	brukere[user_fb]["logg"] += "<br><span style='font-weight: bold; border-bottom: solid black;'>"+brukere[admin_fb]["navn"]+"</span><br>&nbsp"+data["message"];
	  }
	  brukere[user_fb]["last"] = admin_fb;
	  var logg = brukere[user_fb]["logg"];
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
    var user_fb = cid_fb[socket.id];
    if (brukere[user_fb] != null ) brukere[user_fb]["status"] = false;	
  });
});
