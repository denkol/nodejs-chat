module.exports = function (io) {

  // Initialize a new socket.io application, named 'chat'

  var chat = io.on('connection', function (socket) {
    
    // When the client emits the 'load' event, reply with the 
    // number of people in this chat room

    socket.on('load', function (data) {

      var room = findClientsSocket(io, data);

      if (room.length === 0) {
        
        socket.emit('peopleinchat', {
          number: 0
        });

      } else if (room.length === 1) {
        
        socket.emit('peopleinchat', {
          number: 1,
          user: room[0].username,
          id: data
        });

      } else if (room.length >= 2) {

        chat.emit('tooMany', {
          boolean: true
        });
      }
    });

    // When the client emits 'login', save his name and lang,
    // and add them to the room
    socket.on('login', function (data) {
      console.log(data)
      var room = findClientsSocket(io, data.id);
      console.log("room: ", room)

      // Only two people per room are allowed
      if (room.length < 2) {

        // Use the socket object to store data. Each client gets
        // their own unique socket object
        socket.lang = data.lang;
        socket.username = data.user;
        socket.room = data.id;

        // Add the client to the room
        socket.join(data.id);

        if (room.length == 1) {

          var usernames = [],
            langs = [];

          usernames.push(room[0].username);
          usernames.push(socket.username);

          langs.push(room[0].lang);
          langs.push(socket.lang);

          // Send the startChat event to all the people in the
          // room, along with a list of people that are in it.

          chat.in(data.id).emit('startChat', {
            boolean: true,
            id: data.id,
            users: usernames,
            langs: langs
          });
        }
      } else {
        socket.emit('tooMany', {
          boolean: true
        });
      }

      //Logs into terminal
      console.log("ROOM: " + socket.room + ", NAME: " + socket.username + ", LANG: " + socket.lang);

    });

    // Somebody left the chat
    socket.on('disconnect', function () {

      // Notify the other person in the chat room
      // that his partner has left

      socket.broadcast.to(this.room).emit('leave', {
        boolean: true,
        room: this.room,
        user: this.username
      });

      // leave the room
      socket.leave(socket.room);
    });


    // Handle the sending of messages
    socket.on('msg', function (data) {

      // When the server receives a message, it sends it to the other person in the room.
      socket.broadcast.to(socket.room).emit('receive', {
        msg: data.msg,
        user: data.user
      });
    });
  });
}



function findClientsSocket(io, roomId, namespace) {
  var res = [],
    ns = io.of(namespace || "/"); // the default namespace is "/"

  if (ns) {
    for (var id in ns.connected) {
      if (roomId) {
        var index = ns.connected[id].rooms.indexOf(roomId);
        if (index !== -1) {
          res.push(ns.connected[id]);
        }
      } else {
        res.push(ns.connected[id]);
      }
    }
  }
  return res;
}