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
		operRect:Symbol("operRect"),

		drawText:Symbol("drawText"),
	};



	/************* 文字工具构造函数 *************/
	function TextLayer(parentNode){
		this.parentNode = parentNode;
		this.textArea = document.createElement('canvas');
		this.textCxt = this.textArea.getContext('2d');
		this[PRIVATE.words] = "";		//文字信息
		this[PRIVATE.operRect] = [];	//存放文本矩形边框顶点信息

		/* 初始化 */
		this.parentNode.style.position = "relative";
		let parentInfo = this.parentNode.getBoundingClientRect();
		this.textArea.width = parentInfo.width;
		this.textArea.height = parentInfo.height;
		this.textArea.style.position = "absolute";
		this.textArea.style.left = "0";
		this.textArea.style.top = "0";
		this.textArea.style.zIndex = "1001";

		this.parentNode.appendChild(TEXT_PROXY);
		this.parentNode.appendChild(this.textArea);


		let that = this;
		let isMouseMove = false; //鼠标是否在点击后移动

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
				isMouseMove = true;
				that[PRIVATE.drawText](true);
			}

			let nextOper = ()=>{
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;

				if(!isMouseMove){	// 如果没有手动规划出矩形框，就使用自动设置
					let offset = 100;
					that[PRIVATE.operRect][2].x += offset;
					that[PRIVATE.operRect][2].y += offset;
					that[PRIVATE.operRect][1].x += offset;
					that[PRIVATE.operRect][3].y += offset;
					that[PRIVATE.drawText](true);
				}

				// this.onmouseenter = ()=>{
				// 	console.log("onmouseenter");
				// 	that[PRIVATE.drawText](true);
				// }
				// this.onmouseleave = ()=>{
				// 	// console.log("onmouseleave");
				// 	that[PRIVATE.drawText](false);
				// }
				resizeRect(this,that);
			};
			this.onmouseup = nextOper;
			this.onmouseout = nextOper;

		}
		
		TEXT_PROXY.oninput = function(){
			that[PRIVATE.words] = this.value;
			that[PRIVATE.drawText]();
		}
	}
	/************* 文字工具相关配置 *************/

	let fontWeight = 400;				// 文字粗细
	let fontSize = '20px';				// 文字大小
	let fontFamily = 'sans-serif';		// 字体
	let fontColor = "black";			// 字体颜色
	let isFill = true;					// 是否填充文字
	let padding = 10;					// 内边距


	TextLayer.setFontWeight = (textLayer,value)=>{
		if(!(textLayer instanceof TextLayer)){
			return;
		}
		value = Number.parseInt(value);
		if(Number.isNaN(value)){
			return;
		}
		fontWeight = value;
		textLayer[PRIVATE.drawText](true);
	}
	TextLayer.setFontSize = (textLayer,value)=>{
		if(!(textLayer instanceof TextLayer)){
			return;
		}
		value = Number.parseInt(value);
		if(Number.isNaN(value)){
			return;
		}
		fontSize = `${value}px`;
		textLayer[PRIVATE.drawText](true);
	}
	TextLayer.setFontFamliy = (textLayer,style)=>{
		if(!(textLayer instanceof TextLayer)){
			return;
		}
		fontFamily = style;
		textLayer[PRIVATE.drawText](true);
	}
	TextLayer.setFontColor = (textLayer,color)=>{
		if(!(textLayer instanceof TextLayer)){
			return;
		}
		fontColor = color;
		textLayer[PRIVATE.drawText](true);
	}
	TextLayer.setFontStyle = (textLayer,flag)=>{
		if(!(textLayer instanceof TextLayer)){
			return;
		}
		isFill = !!Number.parseInt(flag);
		textLayer[PRIVATE.drawText](true);
	}
	TextLayer.getFontWeight = ()=>fontWeight;
	TextLayer.getFontSize = ()=>fontWeight;
	TextLayer.getFontFamile = ()=>fontFamily;
	TextLayer.getFontColor = ()=>fontColor;


	/************* 打印文字 *************/
	TextLayer.prototype[PRIVATE.drawText] = function(isDrawRect = true){
		this.textCxt.clearRect(0,0,this.textArea.width,this.textArea.height);

		let operRect = this[PRIVATE.operRect];
		if(isDrawRect){
			operPoint.drawRect(this.textArea,operRect);
		}

		/*** 限制显示范围 ***/
		this.textCxt.save();
		this.textCxt.beginPath();
		operRect.forEach((value)=>{
			this.textCxt.lineTo(value.x,value.y);
		})
		this.textCxt.closePath();
		this.textCxt.clip();

		let x = operRect[0].x+padding;
		let y = operRect[0].y+padding;
		let rectWidth = operRect[1].x-operRect[0].x-2*padding;
		// console.log(rectWidth);

		this.textCxt.font = `${fontWeight} ${fontSize} ${fontFamily}`;
		this.textCxt.textBaseline = "top";
		this.textCxt.fillStyle = fontColor;
		this.textCxt.strokeStyle = fontColor;

		let draw_text = null;
		if(isFill){	// 填充类型
			draw_text = this.textCxt.fillText.bind(this.textCxt);
		}else{
			draw_text = this.textCxt.strokeText.bind(this.textCxt);
		}
		let words = this[PRIVATE.words];
		let len = words.length;
		let text = "";
		for(let i=0; i<len; i++){
			if(this.textCxt.measureText(text+words[i]).width <= rectWidth){
				text+=words[i];
			}
			else{
				draw_text(text,x,y);
				y+=Number.parseInt(fontSize);
				text = words[i];
			}
		}
		if(text!=""){
			draw_text(text,x,y);
		}
		if(isDrawRect){
			// this.textCxt.font = `100 ${fontSize} ${fontFamily}`;
			this.textCxt.fillText('|',x+this.textCxt.measureText(text).width,y);
		}

		this.textCxt.restore();
	}

	/************* 导出图像信息 *************/

	TextLayer.prototype.toImageData = function(){
		this[PRIVATE.drawText](false);
		let rectInfo = {};
		rectInfo.x = this[PRIVATE.operRect][0].x;
		rectInfo.y = this[PRIVATE.operRect][0].y;
		rectInfo.width = this[PRIVATE.operRect][1].x - this[PRIVATE.operRect][0].x;
		rectInfo.height = this[PRIVATE.operRect][2].y - this[PRIVATE.operRect][0].y;

		let image = document.createElement('canvas');
		let imageCxt = image.getContext('2d');
		image.width = rectInfo.width;
		image.height = rectInfo.height;
		let imageData = this.textCxt.getImageData(rectInfo.x,rectInfo.y,rectInfo.width,rectInfo.height);
		imageCxt.putImageData(imageData,0,0);

		this.parentNode.removeChild(this.textArea); //移除文本

		return {url:image.toDataURL("image/png"),rectInfo};
	}

	window.TextLayer = TextLayer;
})(window);