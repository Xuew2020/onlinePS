(function(window){
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
		cxt.beginPath();
		cxt.arc(this.x,this.y,radius,0,2*Math.PI);
		cxt.fillStyle = "#ffffff";
		cxt.closePath();
		cxt.fill();
		cxt.stroke();
	}
	operPoint.drawRect = function(canvas,operRect){

		let cxt = canvas.getContext('2d');
		cxt.clearRect(0,0,canvas.width,canvas.height);
		

		/********** 画矩形边框 *********/
		cxt.save();
		cxt.beginPath();
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
	operPoint.control = function(oldX,oldY,canvas,operRect){
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
					operPoint.drawRect(canvas,operRect);
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
			// console.log("translate");
			canvas.style.cursor = "move";
			canvas.onmousemove = function(e){
				e = e || window.event;
				let rect = canvas.getBoundingClientRect();
				let newX = e.clientX - rect.x;
				let newY = e.clientY - rect.y;
				let offsetX = newX - oldX;
				let offsetY = newY - oldY;
				// console.log(offsetX,offsetY);
				[oldX,oldY] = [newX,newY];
				operRect.forEach(function(value,index,array){
					array[index].x += offsetX;
					array[index].y += offsetY;
				});
				operPoint.drawRect(canvas,operRect);
			}
			return true;
		}
		return false;
	}

	function resizeRect(canvas,operRect){ // 调整位置及大小
		canvas.onmousedown = function(e){
			e = e || window.event;
			let rect = this.getBoundingClientRect();
			let oldX = e.clientX - rect.x;
			let oldY = e.clientY - rect.y;
			operPoint.control(oldX,oldY,canvas,operRect);
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

	const PRIVATE = {
		words:Symbol("words"),
		rectInfo:Symbol("rectInfo"),
		operRect:Symbol("operRect"),
	};


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
				operPoint.drawRect(this,that[PRIVATE.operRect]);
			}
			this.onmouseup = function(){
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this,that[PRIVATE.operRect]);
			}
			this.onmouseout = function(){
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this,that[PRIVATE.operRect]);
			}

		}
		
		TEXT_PROXY.oninput = function(){
			that[PRIVATE.words] = this.value;
			that.drawText();
		}
	}

	TextLayer.prototype.drawText = function(){
		this.textCxt.clearRect(0,0,this.textArea.width,this.textArea.height);
		this.textCxt.fillText(this[PRIVATE.words],50,50);
	}

	window.TextLayer = TextLayer;
})(window);