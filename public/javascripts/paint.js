$(function() {
  var socket = io.connect('/');

  var canvas = document.getElementById('myCanvas');
  var context = canvas.getContext('2d');
  context.lineWidth = 5;
  context.lineCap = "round";

  var paths = new Array();
  var drawFlag = false;
  var color = 'white';
  var old = {'x': 0, 'y': 0};
  const maxLife = 100;
  const lifeDecay = 0.96;

  var timer;
  
  socket.on('connected', function(msg) {
    color = msg;
  });

  socket.on('msg push', function(msg) {
    paths.push(msg);
  });


  // PC用
  $('#myCanvas').bind({
    'mousedown': function(e) {
      drawFlag = true;
      old = {'x': e.pageX, 'y': e.pageY};
    },
    'mousemove': function(e) {
      if (!drawFlag) return;
      var cur = {'x': e.pageX, 'y': e.pageY};
      var p = {'from': old, 'to': cur, 'life': maxLife, 'color': color};
      paths.push(p);
      socket.json.emit('msg send', p);
      old = cur;
    }
  });
  $(document).bind({
    'mouseup' : function() {
      drawFlag = false;
    }
  });

  // iPad用
  $('#myCanvas').bind({
    'touchstart': function(e) {
      e.preventDefault();
      drawFlag = true;
      var t = e.originalEvent.touches[0];
      old = {'x': t.pageX, 'y': t.pageY};
    },
    'touchmove': function(e) {
      if (!drawFlag) return;
      e.preventDefault();
      var t = e.originalEvent.touches[0];
      var cur = {'x': t.pageX, 'y': t.pageY};
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
      
      // 消しゴム
      // 重なりが汚くなるのを防ぐため
      context.beginPath();
      context.globalCompositeOperation = 'destination-out';
      context.globalAlpha = 1;
      context.moveTo(p.from.x, p.from.y);
      context.lineTo(p.to.x, p.to.y);
      context.stroke();
      
      // pathを描く
      context.beginPath();
      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = p.life / maxLife;
      context.strokeStyle = p.color;
      context.moveTo(p.from.x, p.from.y);
      context.lineTo(p.to.x, p.to.y);
      context.stroke();

      // lifeを更新
      p.life *= lifeDecay;
      if (p.life <= 1) {
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

    // 10FPS
    clearTimeout(timer);
    timer = setTimeout(loop,100);
  };

  loop();
});
