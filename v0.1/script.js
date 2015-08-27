window.app = {
	mouse: {
		x: undefined,
		y: undefined
	}
};

document.addEventListener('mousemove', updateMousePosition, false);
document.addEventListener('mouseenter', updateMousePosition, false);
function updateMousePosition(e){
	app.mouse.x = e.clientX;
	app.mouse.y = e.clientY;
};

document.body.onload = function(){
	drawLoop();
}


function drawLoop(){
	requestAnimationFrame(drawLoop);

	var canvas = document.querySelector('canvas');
	prepCanvas(canvas);
	var ctx = canvas.getContext('2d');
	drawCoords(ctx);
	highlightNode(ctx);
};


function prepCanvas(canvas){
	canvas.width = document.body.clientWidth;
	canvas.height = document.body.clientHeight;
};

function drawCoords(ctx){
	var pointString = ctx.canvas.getAttribute('data-center').split(',');
	var center = {
		x: parseInt(pointString[0]),
		y: parseInt(pointString[1])
	};

	var offset = {
		x: (center.x*50)%50,
		y: (center.y*50)%50
	};

	var cMax = {
		x: ctx.canvas.width,
		y: ctx.canvas.height
	};

	ctx.fillStyle = '#aaa';
	for( var i=offset.x; i<cMax.x; i+=50 ){
		for( var j=offset.y; j<cMax.y; j+=50 ){
			ctx.beginPath();
			ctx.arc(i,j,2,0,2*Math.PI);
			ctx.fill();
			ctx.closePath();
		}
	}
	
};

function highlightNode(ctx){
	var pointString = ctx.canvas.getAttribute('data-center').split(',');
	var center = {
		x: parseInt(pointString[0]),
		y: parseInt(pointString[1])
	};

	var offset = {
		x: (center.x*50)%50,
		y: (center.y*50)%50
	};

	var canvCenter = {
		x: parseInt(ctx.canvas.width/2),
		y: parseInt(ctx.canvas.height/2)
	};

	var highlight = {
		x: undefined,
		y: undefined
	};

	//determine x highlight
	if( app.mouse.x%50 >= 25 ){
		highlight.x = app.mouse.x + 50-app.mouse.x%50;
	}
	else if( app.mouse.x%50 < 25 ){
		highlight.x = app.mouse.x - app.mouse.x%50;
	}
	else {
		return;
	}

	//determine y highlight
	if( app.mouse.y%50 >= 25 ){
		highlight.y = app.mouse.y + 50-app.mouse.y%50;
	}
	else if( app.mouse.y%50 < 25 ){
		highlight.y = app.mouse.y - app.mouse.y%50;
	}
	else {
		return;
	}

	ctx.beginPath();
	ctx.arc(highlight.x, highlight.y, 4, 0, 2*Math.PI);
	ctx.fillStyle = '#4282ce';
	ctx.fill();
	ctx.closePath();
};