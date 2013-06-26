
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

var server = http.createServer(app);

// socket.io
var socket = require('socket.io').listen(server);
var colors = ['white','yellow','deeppink'];
var count = 0;
socket.on('connection', function(client) {
  // connected
  count++;
  client.emit('connected', colors[count%colors.length]);
  client.on('msg send', function(msg) {
    // message
    console.log(msg);
    client.broadcast.emit('msg push', msg);
  });
  client.on('disconnect', function() {
    // dissconect
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

