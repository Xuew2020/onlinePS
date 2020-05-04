(function(window){
	"use strict"  
	const TEXT_PROXY = document.createElement('textarea');

	/* 代理输入初始化 */
	TEXT_PROXY.style.resize = "none";
	TEXT_PROXY.style.opacity = "0";
	TEXT_PROXY.style.position = "absolute";
	TEXT_PROXY.style.zIndex = "-1";

	let radius = 5;								//顶点半径
	function operPoint(x,y){
		this.x = x;
		this.y = y;
	}
	operPoint.prototype.draw = function(cxt){
		cxt.save();
		cxt.beginPath();
		cxt.arc(this.x,this.y,radius,0,2*Math.PI);
		cxt.fillStyle = "#ffffff";
		cxt.closePath();
		cxt.fill();
		cxt.stroke();
		cxt.restore();
	}
	operPoint.drawRect = function(canvas,operRect){

		let cxt = canvas.getContext('2d');
		// cxt.clearRect(0,0,canvas.width,canvas.height);
		
		// console.log("drawRect");
		/********** 画矩形边框 *********/
		cxt.save();
		cxt.beginPath();
		cxt.setLineDash([5]);
		for(let i=0; i<operRect.length; i++){
			cxt.lineTo(operRect[i].x,operRect[i].y);
		}
		cxt.closePath();
		cxt.stroke();
		cxt.restore();

		/********** 画矩形边顶点 *********/
		for(let i=0;i<operRect.length;i++){
			operRect[i].draw(cxt);
		}
	}
	operPoint.control = function(oldX,oldY,canvas,textLayer){
		let operRect = textLayer[PRIVATE.operRect];
		let pointNum = operRect.length; //顶点数
		// console.log(operRect);
		let cxt = canvas.getContext('2d');
		let dir = ["nw-resize","ne-resize"];
		for(let i=0; i<pointNum; i++){ //判断鼠标是否落在矩形四个顶点上 --- 缩放
			cxt.beginPath();
			cxt.arc(operRect[i].x,operRect[i].y,radius,0,2*Math.PI);
			if(cxt.isPointInPath(oldX,oldY)){
				canvas.style.cursor = dir[i&1];
				canvas.onmousemove = function(e){
					e = e || window.event;
					let rect = canvas.getBoundingClientRect();
					let newX = e.clientX - rect.x;
					let newY = e.clientY - rect.y;
					let offsetX = newX - oldX;
					let offsetY = newY - oldY;
					[oldX,oldY] = [newX,newY];
					let prevIndex = (i-1)%pointNum;
					let nextIndex = (i+1)%pointNum;
					if(prevIndex<0) prevIndex+=pointNum;
					operRect[i].x+=offsetX;
					operRect[i].y+=offsetY;
					if(i&1){
						operRect[prevIndex].y+=offsetY;
						operRect[nextIndex].x+=offsetX;
					}else{
						operRect[prevIndex].x+=offsetX;
						operRect[nextIndex].y+=offsetY;
					}
					// operPoint.drawRect(canvas,operRect);
					textLayer[PRIVATE.drawText]();
				}
				return true;
			}
		}
		cxt.beginPath();
		for(let i=0; i<pointNum; i++){	//判断是否在矩形框内部 ---- 移动
			cxt.lineTo(operRect[i].x,operRect[i].y);
		}
		cxt.closePath();
		if(cxt.isPointInPath(oldX,oldY)){

			canvas.style.cursor = "move";
			canvas.onmousemove = function(e){
				e = e || window.event;
				let rect = canvas.getBoundingClientRect();
				let newX = e.clientX - rect.x;
				let newY = e.clientY - rect.y;
				let offsetX = newX - oldX;
				let offsetY = newY - oldY;
				[oldX,oldY] = [newX,newY];
				operRect.forEach(function(value,index,array){
					array[index].x += offsetX;
					array[index].y += offsetY;
				});
				textLayer[PRIVATE.drawText]();
			}
			return true;
		}
		return false;
	}

	function resizeRect(canvas,textLayer){ // 调整位置及大小
		canvas.onmousedown = function(e){
			e = e || window.event;
			let rect = this.getBoundingClientRect();
			let oldX = e.clientX - rect.x;
			let oldY = e.clientY - rect.y;
			operPoint.control(oldX,oldY,canvas,textLayer);
			canvas.onmouseup = function(){
				this.onmousemove = null;
				this.style.cursor = "default";
			}
			canvas.onmouseout = function(){
				this.onmousemove = null;
				this.style.cursor = "default";
			}
		}
	}

	/************* 属性和方法私有化 *************/
	const PRIVATE = {
		words:Symbol("words"),
		rectInfo:Symbol("rectInfo"),
		operRect:Symbol("operRect"),

		drawText:Symbol("drawText"),
	};



	/************* 文字工具构造函数 *************/
	function TextLayer(parentNode){
		this.parentNode = parentNode;
		this.textArea = document.createElement('canvas');
		this.textCxt = this.textArea.getContext('2d');
		this[PRIVATE.words] = "";		//文字信息
		this[PRIVATE.rectInfo] = [];	//文本矩形框
		this[PRIVATE.operRect] = [];	//存放文本矩形边框顶点信息

		/* 初始化 */
		this.parentNode.style.position = "relative";
		let parentInfo = this.parentNode.getBoundingClientRect();
		this.textArea.width = parentInfo.width;
		this.textArea.height = parentInfo.height;
		this.textArea.style.position = "absolute";
		this.textArea.style.left = "0";
		this.textArea.style.top = "0";

		this.parentNode.appendChild(TEXT_PROXY);
		this.parentNode.appendChild(this.textArea);


		let that = this;
		this.textArea.addEventListener('click',(e)=>{
			e = e || window.event;
			let x = e.clientX - this.textArea.offsetLeft;
			let y = e.clientY - this.textArea.offsetTop;
			console.log(x,y);
			TEXT_PROXY.style.left = `${50}px`;
			TEXT_PROXY.style.top = `${50}px`;
			TEXT_PROXY.value = this[PRIVATE.words];
			TEXT_PROXY.focus();
		});
		this.textArea.onmousedown = function(e){
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;
			that[PRIVATE.operRect] = [
				new operPoint(x,y),
				new operPoint(x,y),
				new operPoint(x,y),
				new operPoint(x,y),
			];
			this.style.cursor = "crosshair";
			this.onmousemove = function(e){
				e = e || window.event;
				let newX = e.clientX - info.x;
				let newY = e.clientY - info.y;
				that[PRIVATE.operRect][2].x = newX;
				that[PRIVATE.operRect][2].y = newY;
				that[PRIVATE.operRect][1].x = newX;
				that[PRIVATE.operRect][3].y = newY;
				// operPoint.drawRect(this,that[PRIVATE.operRect]);
				that[PRIVATE.drawText]();
			}
			this.onmouseup = function(){
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this,that);
			}
			this.onmouseout = function(){
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this,that);
			}

		}
		
		TEXT_PROXY.oninput = function(){
			that[PRIVATE.words] = this.value;
			that[PRIVATE.drawText]();
		}
	}
	/************* 文字工具相关属性和方法 *************/

	let fontSize = '20px';				// 文字大小
	let fontFamily = 'sans-serif';		// 字体
	let textAlign = 'left';				// 对齐方式
	let padding = 10;

	TextLayer.setFontSize = (value)=>{
		value = Number.parseInt(value);
		if(Number.isNaN(value)){
			return;
		}
		fontSize = `${value}px`;
	}
	TextLayer.setFontFamliy = (style)=>{
		fontFamily = style;
	}


	TextLayer.prototype[PRIVATE.drawText] = function(isDrawRect = true){
		this.textCxt.clearRect(0,0,this.textArea.width,this.textArea.height);

		let operRect = this[PRIVATE.operRect];
		if(isDrawRect){
			operPoint.drawRect(this.textArea,operRect);
		}
		let x = operRect[0].x+padding;
		let y = operRect[0].y+padding;
		let rectWidth = operRect[1].x-operRect[0].x-2*padding;
		// console.log(rectWidth);

		this.textCxt.font = `${fontSize} ${fontFamily}`;
		this.textCxt.textBaseline = "top";
		let words = this[PRIVATE.words];
		let len = words.length;
		let text = "";
		for(let i=0; i<len; i++){
			if(this.textCxt.measureText(text+words[i]).width <= rectWidth){
				text+=words[i];
			}
			else{
				this.textCxt.fillText(text,x,y);
				y+=Number.parseInt(fontSize);
				text = words[i];
			}
		}
		if(text!=""){
			this.textCxt.fillText(text,x,y);
		}
		if(isDrawRect){
			this.textCxt.fillText('|',x+this.textCxt.measureText(text).width,y);
		}
	}

	window.TextLayer = TextLayer;
})(window);