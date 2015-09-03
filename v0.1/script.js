window.app = {
	mouse: {
		x: undefined,
		y: undefined,
		isDown: false,
		downTime: undefined
	},
	grid: {
		origin: {
			x: 0.00,
			y: 0.00
		}
	},
	rects: [],
	newRect: undefined,
	canvas: document.querySelector('canvas')
};

function handleMouseMove(e){
	app.mouse.x = e.clientX;
	app.mouse.y = e.clientY;

	if( app.mouse.isDown ){
		leftMouseDownMove(e);
	}
};

function handleMouseDown(e){
	app.mouse.isDown = true;
	app.mouse.downTime = Date.now();
	app.mouse.downLocation = {
		x: e.clientX,
		y: e.clientY
	};
};

function handleMouseUp(e){
	app.mouse.isDown = false;

	if( app.mode == '+' ){
		//we are adding a rect, commit it
		app.rects.push(new DrawRect(
			app.newRect.x,
			app.newRect.y,
			app.newRect.xBound,
			app.newRect.yBound)
		);

		//remove the new rect, reset the mode
		delete app.newRect;
		app.mode = undefined;
	}
};

function leftMouseDownMove(e){
	//determine if we are already drawing a new rect
	if( app.mode == '+' ){
		//we just need to update the bounds of the new rect
		var curPoint = convertToGridPoint({
			x: e.clientX,
			y: e.clientY
		}, {
			x:app.grid.origin.x,
			y:app.grid.origin.y
		});

		curPoint.snapToGrid();
		app.newRect.updateBounds(curPoint.x, curPoint.y);
	}
	else if( app.mode == undefined ){
		//check if we have moved enough to create a new rect
		if( Math.abs(e.clientX - app.mouse.downLocation.x) + Math.abs(e.clientX - app.mouse.downLocation.x) > 5
		|| Date.now() - app.mouse.downTime > 500 ){
			//create a new rect and throw the app into add mode
			app.mode = '+';
			var curPoint = convertToGridPoint({
				x: app.mouse.downLocation.x,
				y: app.mouse.downLocation.y
			}, {
				x: app.grid.origin.x,
				y: app.grid.origin.y
			});
			curPoint.snapToGrid();
			app.newRect = new GridRect(curPoint.x, curPoint.y);
		}
	}
};

//center is top left of source node
//bound is top left of terminal node
function GridRect(x,y,xBound,yBound){
	this.x = x;
	this.y = y;
	this.xBound = xBound === undefined ? xBound : x;
	this.yBound = yBound === undefined ? yBound : y;
};

GridRect.prototype.updateBounds = function(x,y){
	this.xBound = x;
	this.yBound = y;
};

function DrawRect(x,y,xBound,yBound){
	this.x = x;
	this.y = y;
	this.xBound = xBound;
	this.yBound = yBound;

	//determine the drawing bounds
	var left, right,
		top, bottom;

	if( xBound > x ){
		xBound += 1;
		left = x;
		right = xBound;
	}
	else{
		x += 1;
		left = xBound;
		right = x;
	}

	if( yBound > y ){
		yBound += 1;
		top = y;
		bottom = yBound;
	}
	else{
		y += 1;
		top = yBound;
		bottom = y;
	}

	this.drawBounds = {
		x1: left,
		x2: right,
		y1: top,
		y2: bottom
	};
}

function GridPoint(x,y){
	this.x = x;
	this.y = y;
};
GridPoint.prototype.snapToGrid = function(){
	this.x = this.x - this.x%1;
	this.y = this.y - this.y%1;
};

function ScreenPoint(x,y){
	this.x = x;
	this.y = y;
}

function convertToGridPoint(point,center){
	center = center ? center : {
		x: 0.00,
		y: 0.00
	};

	//screen points = 0.02 grid points
	var gridX = (point.x*0.02)+center.x,
		gridY = (point.y*0.02)+center.y;

	return new GridPoint(gridX,gridY);
};

function convertToScreenPoint(point, center){
	center = center ? center : {
		x: 0.00,
		y: 0.00
	};

	//screen points = 0.02 grid points
	var screenX = (point.x-center.x)*50,
		screenY = (point.y-center.y)*50;

	return new ScreenPoint(screenX,screenY);
};

document.body.onload = function(){
	app.canvas.addEventListener('mousemove', handleMouseMove, false);
	app.canvas.addEventListener('mouseenter', handleMouseMove, false);
	app.canvas.addEventListener('mousedown', handleMouseDown, false);
	app.canvas.addEventListener('mouseup', handleMouseUp, false);
	drawLoop();
}

function drawLoop(){
	requestAnimationFrame(drawLoop);

	var canvas = app.canvas;
	prepCanvas(canvas);
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawCoords(ctx);
	
	//draw existing rects
	drawRects(ctx);

	if( app.mode == '+' && app.newRect ){
		highlightNewRect(ctx);
	}
	else{
		//passive node highlight
		highlightNode(ctx);
	}
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

function drawRects(ctx){
	for( var i=0; i<app.rects.length; i++ ){
		var rectPoint1 = convertToScreenPoint(
				new GridPoint(app.rects[i].drawBounds.x1, app.rects[i].drawBounds.y1),
				new GridPoint(app.grid.origin.x, app.grid.origin.y)
			),
			rectPoint2 = convertToScreenPoint(
				new GridPoint(app.rects[i].drawBounds.x2, app.rects[i].drawBounds.y2),
				new GridPoint(app.grid.origin.x, app.grid.origin.y)
			);

		ctx.fillStyle = 'rgba(200, 200, 200, 1.0)';
		ctx.beginPath();
		ctx.rect(
			rectPoint1.x,
			rectPoint1.y,
			rectPoint2.x-rectPoint1.x,
			rectPoint2.y-rectPoint1.y);
		ctx.fill();
		ctx.strokeStyle = '#777';
		ctx.stroke();
		ctx.closePath();
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

	//determine top left of square
	highlight.x = app.mouse.x - app.mouse.x%50;
	highlight.y = app.mouse.y - app.mouse.y%50;

	//draw the rect outline
	ctx.strokeStyle = '#4282ce';
	ctx.beginPath();
	ctx.rect(highlight.x, highlight.y, 50,50);
	ctx.stroke();
	ctx.closePath();

	//highlight the 4 corners
	ctx.fillStyle = '#4282ce';
	ctx.beginPath();
	ctx.arc(highlight.x, highlight.y, 2, 0, 2*Math.PI);
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctx.arc(highlight.x+50, highlight.y, 2, 0, 2*Math.PI);
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctx.arc(highlight.x, highlight.y+50, 2, 0, 2*Math.PI);
	ctx.fill();
	ctx.closePath();
	ctx.beginPath();
	ctx.arc(highlight.x+50, highlight.y+50, 2, 0, 2*Math.PI);
	ctx.fill();
	ctx.closePath();
};

function highlightNewRect(ctx){
	//#40A089
	//convert rect points to screen points

	var source = convertToScreenPoint(
			new GridPoint(app.newRect.x, app.newRect.y),
			new GridPoint(app.grid.origin.x, app.grid.origin.y)
		),
		bound = convertToScreenPoint(
			new GridPoint(app.newRect.xBound, app.newRect.yBound),
			new GridPoint(app.grid.origin.x, app.grid.origin.y)
		);

	var left, right,
		top, bottom;

	//move the right and bottom corners out one point to draw correctly
	if( bound.x > source.x ){
		bound.x += 50;
		left = source;
		right = bound;
	}
	else{
		source.x += 50;
		left = bound;
		right = source;
	}

	if( bound.y > source.y ){
		bound.y += 50;
		top = source;
		bottom = bound;
	}
	else{
		source.y += 50;
		top = bound;
		bottom = source;
	}

	//fill the rect
	ctx.fillStyle = 'rgba(64, 160, 137, 0.2)';
	ctx.beginPath();
	ctx.rect(left.x, top.y, right.x-left.x,bottom.y-top.y);
	ctx.fill();
	ctx.closePath();

	//draw from the top left to the bottom right
	ctx.strokeStyle = '#40A089';
	ctx.beginPath();
	ctx.rect(left.x, top.y, right.x-left.x,bottom.y-top.y);
	ctx.stroke();
	ctx.closePath();
};