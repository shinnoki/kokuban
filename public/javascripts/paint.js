$(function() {
  var socket = io.connect('/');

  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');

  var paths = new Array();
  var drawFlag = false;
  var color = 'white';
  var old = {'x': 0, 'y': 0};
  const maxLife = 30;

  var timer;
  
  socket.on('connected', function(msg) {
    color = msg;
  });

  socket.on('msg push', function(msg) {
    paths.push(msg);
  });

  
  $('#myCanvas').mousedown(function(e) {
    drawFlag = true;
    old = {'x': e.pageX, 'y': e.pageY};
  }).mousemove(function(e) {
    if (!drawFlag) return;
    var cur = {'x': e.pageX, 'y': e.pageY};
    var p = {'from': old, 'to': cur, 'life': maxLife, 'color': color};
    paths.push(p);
    socket.json.emit('msg send', p);
    old = cur;
  });
  
  $(document).mouseup(function() {
    drawFlag = false;
  });


  // ipad用
  $('#myCanvas').bind({
    'touchstart': function(e) {
      e.preventDefault();
      drawFlag = true;
      old = {'x': e.touches[0].pageX, 'y': e.touches[0].pageY};
    },
    'touchmove': function(e) {
      if (!drawFlag) return;
      e.preventDefault();
      alert('touchmove');
      var cur = {'x': e.touches[0].pageX, 'y': e.touches[0].pageY};
      var p = {'from': old, 'to': cur, 'life': maxLife, 'color': color};
      paths.push(p);
      socket.json.emit('msg send', p);
      old = cur;
    }
  });
  $(document).bind({
    'touchend': function() {
      drawFlag = false;
    }
  });

  var loop = function() {
    context.save();

    // キャンバスをクリア
    context.beginPath();
    context.clearRect(0,0,canvas.width,canvas.height);

    var i = 0;
    while (i < paths.length) {
      var p = paths[i];
      
      // pathを描く
      context.beginPath();
      context.globalAlpha = p.life / maxLife;
      context.strokeStyle = p.color;
      context.lineWidth = 5;
      context.moveTo(p.from.x, p.from.y);
      context.lineTo(p.to.x, p.to.y);
      context.stroke();

      // lifeを更新
      p.life--;
      if (p.life <= 0) {
        // lifeが0だったら要素を消す
        paths.splice(i,1);
      } else {
        // 更新して次へ
        paths[i] = p;
        i++;
      }
    }

    // 更新
    context.restore();

    clearTimeout(timer);
    timer = setTimeout(loop,100);
  };

  loop();
});
