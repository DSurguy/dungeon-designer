/**
* Namespaced variables
*/
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
	nodes: {},
	newRect: undefined,
	paintMode: 'pencil',
	drawMode: undefined,
	canvas: document.querySelector('canvas')
};


/**
* Event Handlers and App Logic
*/
function handleMouseMove(e){
	app.mouse.x = e.offsetX;
	app.mouse.y = e.offsetY;

	if( app.mouse.isDown ){
		leftMouseDownMove(e);
	}
};

function handleMouseDown(e){
	app.mouse.isDown = true;
	app.mouse.downTime = Date.now();
	app.mouse.downLocation = {
		x: e.offsetX,
		y: e.offsetY
	};

	console.log(e);

	if( app.drawMode == undefined ){
		var curPoint = (new ScreenPoint(e.offsetX, e.offsetY)).convertToGridPoint(app.grid.origin.x, app.grid.origin.y);

		curPoint.snapToGrid();
		if( app.paintMode == 'rect' ){
			//create a new rect and throw the app into add mode
			app.drawMode = '+';
			app.newRect = new GridRect(curPoint.x, curPoint.y);
		}
		else if( app.paintMode == 'pencil') {
			app.drawMode = '+';

			if( app.nodes[curPoint.x] === undefined ){
				app.nodes[curPoint.x] = {};
			}

			if( !app.nodes[curPoint.x][curPoint.y] ){
				//create a new node
				var newNode = new FillNode(curPoint.x,curPoint.y);

				//check to see if it's connected to other nodes and update their borders for drawing
				newNode.updateConnections(app.nodes);
				if( !newNode.topBorder ){
					app.nodes[newNode.x][newNode.y-1].updateBorders({bottom: false});
				}
				if( !newNode.bottomBorder ){
					app.nodes[newNode.x][newNode.y+1].updateBorders({top: false});
				}
				if( !newNode.leftBorder ){
					app.nodes[newNode.x-1][newNode.y].updateBorders({right: false});
				}
				if( !newNode.rightBorder ){
					app.nodes[newNode.x+1][newNode.y].updateBorders({left: false});
				}

				//add the node to the grid
				app.nodes[curPoint.x][curPoint.y] = newNode;
			}
		}
	}
};

function handleMouseUp(e){
	app.mouse.isDown = false;

	if( app.drawMode == '+' ){
		if( app.paintMode == 'rect' ){
			//determine the bounds so we can add nodes from top left to bottom right
			var xMin, xMax, yMin, yMax;
			if( app.newRect.x > app.newRect.xBound ){
				xMin = app.newRect.xBound;
				xMax = app.newRect.x;
			}
			else{
				xMin = app.newRect.x;
				xMax = app.newRect.xBound;
			}
			if( app.newRect.y > app.newRect.yBound ){
				yMin = app.newRect.yBound;
				yMax = app.newRect.y;
			}
			else{
				yMin = app.newRect.y;
				yMax = app.newRect.yBound;
			}
			//loop through all nodes, y-first
			for( var x=xMin; x<=xMax; x++ ){
				for( var y=yMin; y<=yMax; y++ ){

					if( app.nodes[x] === undefined ){
						app.nodes[x] = {};
					}

					var newNode = new FillNode(x,y);

					//check the borders if we're on an edge node
					if( newNode.x == xMin || newNode.x == xMax || newNode.y == yMin || newNode.y == yMax ){
						newNode.updateConnections(app.nodes);
						if( !newNode.topBorder ){
							app.nodes[newNode.x][newNode.y-1].updateBorders({bottom: false});
						}
						if( !newNode.bottomBorder ){
							app.nodes[newNode.x][newNode.y+1].updateBorders({top: false});
						}
						if( !newNode.leftBorder ){
							app.nodes[newNode.x-1][newNode.y].updateBorders({right: false});
						}
						if( !newNode.rightBorder ){
							app.nodes[newNode.x+1][newNode.y].updateBorders({left: false});
						}
					}
					else{
						newNode.updateBorders({
							top: false,
							bottom: false,
							left: false,
							right: false
						});
						//modify the nodes above and left
						app.nodes[newNode.x][newNode.y-1].updateBorders({bottom: false});
						app.nodes[newNode.x-1][newNode.y].updateBorders({right: false});
					}

					//add this node to the grid
					app.nodes[newNode.x][newNode.y] = newNode;
				}
			}

			delete app.newRect;
			app.drawMode = undefined;
		}
		else if( app.paintMode == 'pencil' ){
			//just stop drawing
			app.drawMode = undefined;
		}
	}
};

function leftMouseDownMove(e){
	//determine if we are already drawing a new rect
	if( app.drawMode == '+' ){
		//create a new node
		var curPoint = (new ScreenPoint(e.offsetX, e.offsetY)).convertToGridPoint(app.grid.origin.x, app.grid.origin.y);

		curPoint.snapToGrid();
		if( app.paintMode == 'rect' ){
			app.newRect.updateBounds(curPoint.x, curPoint.y);
		}
		else if( app.paintMode == 'pencil' ){
			if( app.nodes[curPoint.x] === undefined ){
				app.nodes[curPoint.x] = {};
			}

			if( !app.nodes[curPoint.x][curPoint.y] ){
				var newNode = new FillNode(curPoint.x, curPoint.y);

				//check to see if it's connected to other nodes and update their borders for drawing
				newNode.updateConnections(app.nodes);
				if( !newNode.topBorder ){
					app.nodes[newNode.x][newNode.y-1].updateBorders({bottom: false});
				}
				if( !newNode.bottomBorder ){
					app.nodes[newNode.x][newNode.y+1].updateBorders({top: false});
				}
				if( !newNode.leftBorder ){
					app.nodes[newNode.x-1][newNode.y].updateBorders({right: false});
				}
				if( !newNode.rightBorder ){
					app.nodes[newNode.x+1][newNode.y].updateBorders({left: false});
				}

				//add the node to the grid
				app.nodes[curPoint.x][curPoint.y] = newNode;
			}
		}
	}
};


/**
* CONSTRUCTS
*/
function GridRect(x,y,xBound,yBound){
	this.x = x;
	this.y = y;
	this.xBound = (xBound !== undefined ? xBound : x);
	this.yBound = (yBound !== undefined ? yBound : y);
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
};

function FillNode(x,y){
	this.x = x;
	this.y = y;
	this.topBorder = true;
	this.leftBorder = true;
	this.rightBorder = true;
	this.bottomBorder = true;
};
FillNode.prototype.updateBorders = function(updates){
	if( updates.top !== undefined ){
		this.topBorder = updates.top;
	}
	if( updates.left !== undefined ){
		this.leftBorder = updates.left;
	}
	if( updates.right !== undefined ){
		this.rightBorder = updates.right;
	}
	if( updates.bottom !== undefined ){
		this.bottomBorder = updates.bottom;
	}
};
FillNode.prototype.updateConnections = function(allNodes){
	this.topBorder = !allNodes[this.x] || !allNodes[this.x][this.y-1];
	this.bottomBorder = !allNodes[this.x] || !allNodes[this.x][this.y+1];

	this.leftBorder = !allNodes[this.x-1] || !allNodes[this.x-1][this.y];
	this.rightBorder = !allNodes[this.x+1] || !allNodes[this.x+1][this.y];
};

function GridPoint(x,y){
	this.x = x;
	this.y = y;
};
GridPoint.prototype.snapToGrid = function(){
	this.x = this.x - this.x%1;
	this.y = this.y - this.y%1;
};
GridPoint.prototype.convertToScreenPoint = function(origin){
	origin = origin ? origin : {
		x: 0.00,
		y: 0.00
	};

	//screen points = 0.02 grid points
	var screenX = (this.x-origin.x)*50,
		screenY = (this.y-origin.y)*50;

	return new ScreenPoint(screenX,screenY);
};

function ScreenPoint(x,y){
	this.x = x;
	this.y = y;
};
ScreenPoint.prototype.snapToGrid = function(offset){
	this.x = this.x - this.x%50 + offset.x;
	this.y = this.y - this.y%50 + offset.y;
};
ScreenPoint.prototype.convertToGridPoint = function(origin){
	origin = origin ? origin : {
		x: 0.00,
		y: 0.00
	};

	//screen points = 0.02 grid points
	var gridX = (this.x*0.02)+origin.x,
		gridY = (this.y*0.02)+origin.y;

	return new GridPoint(gridX,gridY);
};


/**
* RUNTIME
*/
document.body.onload = function(){
	app.canvas.addEventListener('mousemove', handleMouseMove, false);
	app.canvas.addEventListener('mouseenter', handleMouseMove, false);
	app.canvas.addEventListener('mousedown', handleMouseDown, false);
	app.canvas.addEventListener('mouseup', handleMouseUp, false);

	document.querySelector('.toolbar .rectMode').addEventListener('click', function(e){
		app.paintMode = 'rect';
		this.classList.add('-active');
		this.parentElement.querySelector('.pencilMode').classList.remove('-active');
	});
	document.querySelector('.toolbar .pencilMode').addEventListener('click', function(e){
		app.paintMode = 'pencil';
		this.classList.add('-active');
		this.parentElement.querySelector('.rectMode').classList.remove('-active');
	});
	drawLoop();
}


/** 
* DRAWING FUNCTIONS
*/
function drawLoop(){
	requestAnimationFrame(drawLoop);

	var canvas = app.canvas;
	prepCanvas(canvas, 48, 120);
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0,0,canvas.width,canvas.height);
	drawCoords(ctx);
	
	drawNodes(ctx);

	if( app.drawMode == '+' ){
		if( app.newRect ){
			highlightNewRect(ctx);
		}
		else if( app.paintMode == 'pencil' ) {
			highlightMouseNode(ctx, 'new');
		}
	}
	else{
		//passive node highlight
		highlightMouseNode(ctx);
	}
};

function prepCanvas(canvas, top, left){
	top = top ? top : 0;
	left = left ? left : 0;
	canvas.width = document.body.clientWidth-left;
	canvas.height = document.body.clientHeight-top;
};

function drawCoords(ctx){
	var pointString = ctx.canvas.getAttribute('data-origin').split(',');
	var origin = {
		x: parseInt(pointString[0]),
		y: parseInt(pointString[1])
	};

	var offset = {
		x: (origin.x*50)%50,
		y: (origin.y*50)%50
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

function drawNodes(ctx){

	ctx.fillStyle = 'rgba(200, 200, 200, 0.25)';	

	for( var xKey in app.nodes ){
		if( app.nodes.hasOwnProperty(xKey) ){

			for( yKey in app.nodes[xKey] ){
				if( app.nodes[xKey].hasOwnProperty(yKey) ){
					var thisNode = app.nodes[xKey][yKey];

					//paint this node
					ctx.beginPath();

					var rectPoint1 = (new GridPoint(thisNode.x, thisNode.y)).convertToScreenPoint(app.grid.origin.x, app.grid.origin.y),
						rectPoint2 = (new GridPoint(thisNode.x+1, thisNode.y+1)).convertToScreenPoint(app.grid.origin.x, app.grid.origin.y);

					ctx.rect(
						rectPoint1.x,
						rectPoint1.y,
						rectPoint2.x-rectPoint1.x,
						rectPoint2.y-rectPoint1.y
					);
					ctx.fill();
					ctx.closePath();

					//check the borders
					if( thisNode.topBorder ){
						ctx.strokeStyle = '#444';
					}
					else{
						ctx.strokeStyle = '#e5e5e5';
					}
					ctx.beginPath();
					ctx.moveTo(rectPoint1.x, rectPoint1.y);
					ctx.lineTo(rectPoint2.x, rectPoint1.y);
					ctx.stroke();
					ctx.closePath();

					if( thisNode.bottomBorder ){
						ctx.strokeStyle = '#444';
					}
					else{
						ctx.strokeStyle = '#e5e5e5';
					}
					ctx.beginPath();
					ctx.moveTo(rectPoint1.x, rectPoint2.y);
					ctx.lineTo(rectPoint2.x, rectPoint2.y);
					ctx.stroke();
					ctx.closePath();

					if( thisNode.rightBorder ){
						ctx.strokeStyle = '#444';
					}
					else{
						ctx.strokeStyle = '#e5e5e5';
					}
					ctx.beginPath();
					ctx.moveTo(rectPoint2.x, rectPoint1.y);
					ctx.lineTo(rectPoint2.x, rectPoint2.y);
					ctx.stroke();
					ctx.closePath();

					if( thisNode.leftBorder ){
						ctx.strokeStyle = '#444';
					}
					else{
						ctx.strokeStyle = '#e5e5e5';
					}
					ctx.beginPath();
					ctx.moveTo(rectPoint1.x, rectPoint1.y);
					ctx.lineTo(rectPoint1.x, rectPoint2.y);
					ctx.stroke();
					ctx.closePath();

				}
			}

		}
	}
};

function highlightMouseNode(ctx, type){
	var offset = {
		x: (app.grid.origin.x*50)%50,
		y: (app.grid.origin.y*50)%50
	};

	//determine top left of square
	var highlight = {
		x: app.mouse.x - app.mouse.x%50 + offset.x,
		y: app.mouse.y - app.mouse.y%50 + offset.y
	};

	switch(type){
		case 'new':
			//ctx.fillStyle = '#40A089';
			ctx.fillStyle = 'rgba(64, 160, 137, 0.2)';
			ctx.strokeStyle = '#40A089';
		break;
		default:
			ctx.fillStyle = 'rgba(66, 130, 206, 0.2)';
			ctx.strokeStyle = '#4282ce';
		break;
	}
	//highlight the background and draw the outline
	ctx.beginPath();
	ctx.rect(highlight.x, highlight.y, 50,50);
	ctx.fill();
	ctx.stroke();
	ctx.closePath();

	//highlight the 4 corners
	ctx.fillStyle = ctx.strokeStyle;
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
	var source = (new GridPoint(app.newRect.x, app.newRect.y)).convertToScreenPoint(app.grid.origin.x, app.grid.origin.y),
		bound = (new GridPoint(app.newRect.xBound, app.newRect.yBound)).convertToScreenPoint(app.grid.origin.x, app.grid.origin.y);

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