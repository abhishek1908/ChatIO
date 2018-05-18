var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users= [];

server.listen(process.env.PORT || 3000);

console.log('server running....');

app.get('/',function(req,res){
     res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection',function(socket){
    console.log('Socket connected.');

    //add new user event
    socket.on('new user',function(data,callback){
        if(data in users){
            callback(false);
        }else{
            callback(true);
            socket.username = data;
            users[socket.username]=socket;
            console.log(users[socket.username].id);
            //usernames.push(socket.username);
            //console.log(socket.username+" is added");
            updateUsernames();
        }
    });

    //update username in user list 
    function updateUsernames(){
        io.sockets.emit('usernames',Object.keys(users));
    }

    //System message of user joining  
    socket.on('join user',function(from,to){
        //onsole.log('Move to client for system message '+from+' '+to);
        io.sockets.emit('system message',{user: from,msg: to});
    });

    //Send Message event
    socket.on('send message',function(data,callback){
        //console.log('Message :'+data);
        var message = data.trim();
        if(message.substr(0,3) === '/w '){
        	   message = message.substr(3);
        	   var index = message.indexOf(' ');
        	   if(index !== -1){
                     
                     var name = message.substring(0,index);
                     var msg = message.substring(index+1);
                     if(name in users){
                     	users[name].emit('whispher',{msg: msg,user:socket.username});
                        users[socket.username].emit('whispher',{msg: msg,user:'Me'});
                        console.log('Whispher!!');
                     }else{
                     	callback('Error! Enter a valid user.');
                     }
                }else{
                    callback('Error! Please enter message for whispher.');
                }     
        }else if(message.substr(0,3) === '/g '){
             message = message.substr(3);
             var index = message.indexOf(' ');
             if(index !== -1){
                   var name=message.substring(0,index).split('|');
                   var msg = message.substring(index+1);
                   for (var i = 0; i < name.length; i++) {
                         var na = name[i];
                         if(na in users){
                              users[na].emit('whispher',{msg: msg,user:socket.username});
                              console.log('Whispher!!');
                         }else{
                            callback('Error! Enter a valid user.');
                         }

                   }
                   users[socket.username].emit('whispher',{msg: msg,user:'Me'});
             }
             else{
                callback('Error! Please enter message for whispher.');
             }
        }
        else{
          io.sockets.emit('new message',{msg: message,user:socket.username});
        }  
    });
    
    //Disconnecting user
    socket.on('disconnect user',function(data){
    	socket.username=data;
    	//console.log(usernames[0]);
    	delete users[socket.username];
        //usernames.splice(usernames.indexOf(socket.username),1);
        updateUsernames();
        socket.disconnect();
    });

    socket.on('disconnect',function(){
         delete users[socket.username];
         updateUsernames();
         console.log('Socket disconnected');
    });
   
});
