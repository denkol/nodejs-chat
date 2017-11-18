// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.


//Logs module
var log4js = require('log4js');
var logger = log4js.getLogger();

// Export a function, so that we can pass 
// the app and io instances from the app.js file:

module.exports = function(app) {

  app.get('/', function(req, res) {
    logger.info(req.connection.remoteAddress, req.method, req.url, req.headers['user-agent']);

    // Render views/home.html
    res.render('home');
  });

  app.get('/create', function(req, res) {

    // Generate unique id for the room
    var id = Math.round((Math.random() * 1000000));

    // Redirect to the random room
    res.redirect('/chat/' + id);
  });

  app.get('/chat/:id', function(req, res) {
    logger.info(req.connection.remoteAddress, req.method, req.url, req.headers['user-agent']);
    // Render the chant.html view
    res.render('chat');
  });

  app.get('/feedback', function(req, res) {

    // Redirect to the discussion page
    res.render('feedback');
  });

};

