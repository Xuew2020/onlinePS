/**
 * 在线图像处理 -- 图层对象
 * @author 薛望
 * 2020/04/10
 */

(function(window){
	"use strict"  

	/************* 全局共享画布---代理所有图像的操作 --- 不隐藏*************/
	const GLOBAL_CANVAS = document.createElement('canvas');
	const GLOBAL_CXT = GLOBAL_CANVAS.getContext('2d');							
	let isGlobalCanvasInit = false; 					//是否初始化了全局画布
	ImageLayer.globalInfo = {};							//全局信息 --- 外部使用
	
	/********** 图像变换及剪切 *********/
	let operRect = [];							//存放矩形边框顶点信息
	let radius = 5;								//顶点半径
	function operPoint(x,y){
		this.x = x;
		this.y = y;
	}
	operPoint.prototype.draw = function(cxt,isFill = true){
		cxt.beginPath();
		cxt.arc(this.x,this.y,radius,0,2*Math.PI);
		cxt.fillStyle = "gray";
		cxt.closePath();
		if(isFill === true){
			cxt.fill();
		}
		cxt.stroke();
	}
	operPoint.drawRect = function(canvas,gridNum=3){

		/********** 画矩形边顶点 *********/
		let cxt = canvas.getContext('2d');
		cxt.clearRect(0,0,canvas.width,canvas.height);
		for(let i=0;i<operRect.length;i++){
			operRect[i].draw(cxt);
		}

		/********** 画矩形边框 *********/
		cxt.save();
		cxt.beginPath();
		cxt.setLineDash([5]);
		for(let i=0; i<operRect.length; i++){
			cxt.lineTo(operRect[i].x,operRect[i].y);
		}
		cxt.closePath();
		cxt.stroke();

		/********** 划分格子 *********/
		let fistPoint = operRect[0];
		let rectWidth = operRect[1].x - operRect[0].x;
		let rectHeight = operRect[3].y - operRect[0].y;

		// 保存矩形宽度
		ImageLayer.globalInfo.clipRect.x = operRect[0].x;
		ImageLayer.globalInfo.clipRect.y = operRect[0].y;
		ImageLayer.globalInfo.clipRect.width = rectWidth;
		ImageLayer.globalInfo.clipRect.height = rectHeight;

		// console.log(ImageLayer.globalInfo.clipRect);

		// console.log(rectWidth,rectHeight);
		let widthStep = rectWidth/gridNum;
		let heightStep = rectHeight/gridNum;
		for(let i=1;i<gridNum;i++){
			let x = fistPoint.x + widthStep*i;
			cxt.beginPath();
			cxt.moveTo(x,fistPoint.y);
			cxt.lineTo(x,fistPoint.y+rectHeight);
			cxt.stroke();
		}
		for(let i=1;i<gridNum;i++){
			let y = fistPoint.y + heightStep*i;
			cxt.beginPath();
			cxt.moveTo(fistPoint.x,y);
			cxt.lineTo(fistPoint.x+rectWidth,y);
			cxt.stroke();
		}
		cxt.restore();
	}
	operPoint.control = function(oldX,oldY,canvas,scaleCallBack,translateCallBack){
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
					operPoint.drawRect(canvas,5);
					scaleCallBack(canvas);
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
				operPoint.drawRect(canvas,5);
				translateCallBack(canvas);
			}
			return true;
		}
		return false;
	}
	
	/************* 画笔工具 *************/

	const BRUSH = {x:0,y:0,size:3,color:"red",pattern:null}; //笔刷对象 
	BRUSH.draw = function(canvas){
		let cxt = canvas.getContext('2d');
		cxt.clearRect(0,0,canvas.width,canvas.height);
		cxt.save();
		cxt.beginPath();
		cxt.arc(this.x,this.y,this.size,0,2*Math.PI);
		cxt.fillStyle = BRUSH.color;
		cxt.strokeStyle = "gray";
		cxt.fill();
		cxt.stroke();
		cxt.restore();
	}
	BRUSH.move = function(canvas,imageLayer){
		let isDrawPoint = false;
		canvas.onmousemove = function(e){
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;
			BRUSH.x = x;
			BRUSH.y = y;
			BRUSH.draw(canvas);
			if(isDrawPoint){
				imageLayer[PRIVATE.brushLineTo](BRUSH);
			}
		}
		canvas.onmousedown = function(){
			isDrawPoint = true;
			imageLayer[PRIVATE.brushMoveTo](BRUSH);
		}
		canvas.onmouseup = function(){
			isDrawPoint = false;
		}
		canvas.onmouseout = function(){
			isDrawPoint = false;
		}
	}
	ImageLayer.setBrushSize = function(value){ // 设置画笔大小
		value = Number.parseFloat(value);
		if(Number.isNaN(value)) return;
		BRUSH.size = value;
		BRUSH.draw(GLOBAL_CANVAS);
	}
	ImageLayer.setBrushColor = function(color){ // 设置画笔颜色
		BRUSH.color = color;
	}

	

	/************* 尺子工具 *************/

	const RULER = {sx:0,sy:0,dx:0,dy:0}; //尺子对象
	RULER.draw = function(canvas){
		function endPoint(x,y){
			cxt.beginPath();
			cxt.fillRect(x-size/2,y-size/2,size,size);
		}
		let cxt = canvas.getContext('2d');
		let size = 6;

		cxt.clearRect(0,0,canvas.width,canvas.height);
		endPoint(this.sx,this.sy);
		endPoint(this.dx,this.dy);
		cxt.save();
		cxt.beginPath();
		cxt.setLineDash([5]);
		cxt.lineWidth = 2;
		cxt.moveTo(this.sx,this.sy);
		cxt.lineTo(this.dx,this.dy);
		cxt.stroke();
		cxt.restore();
	}
	RULER.measure = function(){
		return Math.sqrt((this.sx-this.dx)*(this.sx-this.dx)+(this.sy-this.dy)*(this.sy-this.dy));
	}
	ImageLayer.ruler = function(imageLayer,callback){
		if(imageLayer[PRIVATE.state] !== ImageLayer.FREEING){
			return;
		}
		imageLayer[PRIVATE.state] = ImageLayer.RULER;
		// GLOBAL_CANVAS.style.display = "inline";
		GLOBAL_CANVAS.onmousedown = function(e){
			e = e || window.event;
			let info = this.getBoundingClientRect();
			RULER.sx = RULER.dx = e.clientX - info.x;
			RULER.sy = RULER.dy = e.clientY - info.y;
			RULER.draw(this);

			this.onmousemove = function(e){
				e = e || window.event;
				RULER.dx = e.clientX - info.x;
				RULER.dy = e.clientY - info.y;
				RULER.draw(this);
				callback(RULER.measure());
			}
			this.onmouseup = function(){
				this.onmousemove = null;
			}
			this.onmouseout = function(){
				this.onmousemove = null;
			}
		}
	}

	/************* 吸管工具 *************/

	ImageLayer.straw = function(imageLayer,imageLayers,callback){
		if(imageLayer[PRIVATE.state] !== ImageLayer.FREEING){
			return;
		}
		imageLayer[PRIVATE.state] = ImageLayer.STRAW;
		imageMerge(imageLayers);
		// GLOBAL_CANVAS.style.display = "inline";

		GLOBAL_CANVAS.onmousedown = function(e){
			e = e || window.event;
			let info = this.getBoundingClientRect();
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;
			let imageData = GLOBAL_CXT.getImageData(x,y,1,1).data;
			let rgba = `rgba(${imageData[0]},${imageData[1]},${imageData[2]},${imageData[3]})`;
			let rgb = [];
			for(let i=0; i<3; i++){
				let s = imageData[i].toString(16);
				if(s.length < 2){
					s+=s;
				}
				rgb[i] = s;
			}
			let HEX = `#${rgb[0]}${rgb[1]}${rgb[2]}`;
			callback(x,y,HEX);
		}
	}

	/************* 合并图层 *************/
	function imageMerge(imageLayers){
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);
		imageLayers.forEach((imageLayer)=>{
			let info = imageLayer[PRIVATE.rectInfo];
			let image = imageLayer.tempArea;
			GLOBAL_CXT.drawImage(image,info.x,info.y);
		});
	}

	/************* 下载合并后图层 *************/
	ImageLayer.download = function(imageLayer,imageLayers){ // toDataUrl存在跨域问题
		if(imageLayer[PRIVATE.state] !== ImageLayer.FREEING){
			return;
		}
		imageMerge(imageLayers);
		let minX=Infinity, minY=Infinity, maxX=0, maxY=0;
		imageLayers.forEach((value)=>{
			let info = value[PRIVATE.rectInfo];
			minX = (minX<info.x?minX:info.x);
			maxX = (maxX>info.x?maxX:info.x);
			minY = (minY<info.y?minY:info.y);
			maxY = (maxY>info.y?maxY:info.y);
			minX = (minX<info.x+info.width?minX:info.x+info.width);
			maxX = (maxX>info.x+info.width?maxX:info.x+info.width);
			minY = (minY<info.y+info.height?minY:info.y+info.height);
			maxY = (maxY>info.y+info.height?maxY:info.y+info.height);
		});
		let width = maxX - minX;
		let height = maxY - minY;
		let canvas = document.createElement('canvas');
		let cxt = canvas.getContext('2d');
		canvas.width = width;
		canvas.height = height; 
		console.log(minX,minY,maxX,maxY,width,height);
		let imageData = GLOBAL_CXT.getImageData(minX,minY,width,height);
		cxt.putImageData(imageData,0,0);
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);

		// let link = document.createElement('a');
		// link.href = canvas.toDataURL("image/png");
		// document.body.appendChild(link);
		// link.click();
		window.location = canvas.toDataURL("image/png");
	}

	/************* 定义滤镜效果 *************/
	const FILTER = {										
		invert:function(imageData){             //反色
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+0] = 255 - data[index];
					data[index+1] = 255 - data[index+1];
					data[index+2] = 255 - data[index+2];
				}
			}
			return true;
		},
		grayscale:function(imageData){          //黑白
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					let value = data[index]*0.3+data[index+1]*0.6+data[index+2]*0.1;
					data[index+0] = value;
					data[index+1] = value;
					data[index+2] = value;
				}
			}
			return true;
		},
		blur:function(imageData,value = 3){               //模糊
			let {data,width,height} = imageData;
			var blurRadius = value; //模糊半径
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let totalR=0,totalG=0,totalB=0;
					let totalNum=0;
					for(let dx=-blurRadius; dx<=blurRadius; dx++){
						for(let dy=-blurRadius; dy<=blurRadius; dy++){
							let x = i + dx;
							let y = j + dy;
							if(x<0 || x>=height || y<0 || y>=width){
								continue;
							}
							let index = (x*width+y)*4;
							totalR += data[index+0];
							totalG += data[index+1];
							totalB += data[index+2];
							totalNum++;
						}
					}
					let index = (i*width+j)*4;
					data[index+0] = totalR/totalNum;
					data[index+1] = totalG/totalNum;
					data[index+2] = totalB/totalNum;
				}
			}
			return true;
		},
		sepia:function(imageData){               //复古
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					let r = data[index+0];
					let g = data[index+1];
					let b = data[index+2];
					data[index] = r*0.39+g*0.76+b*0.18;
					data[index+1] = r*0.35+g*0.68+b*0.16;
					data[index+2] = r*0.27+g*0.53+b*0.13;
				}
			}
			return true;
		},
		mosaic:function(imageData,value=5){
			let {data,width,height} = imageData;
			let size = value;
			console.log(size,width,height);
			for(let i=0; i<height; i+=size){
				for(let j=0; j<width; j+=size){
					let totalR=0,totalG=0,totalB=0;
					let totalNum=0;
					for(let dx=0; dx<size; dx++){
						for(let dy=0; dy<size; dy++){
							let x = dx + i;
							let y = dy + j;
							if(x<0 || x>=height || y<0 || y>=width){
								continue;
							}
							let index = (x*width+y)*4;
							totalR += data[index+0];
							totalG += data[index+1];
							totalB += data[index+2];
							totalNum++;
						}
					}
					let avgR = totalR/totalNum;
					let avgG = totalG/totalNum;
					let avgB = totalB/totalNum;
					for(let dx=0; dx<size; dx++){
						for(let dy=0; dy<size; dy++){
							let x = dx + i;
							let y = dy + j;
							if(x<0 || x>=height || y<0 || y>=width){
								continue;
							}
							let index = (x*width+y)*4;
							data[index+0] = avgR;
							data[index+1] = avgG;
							data[index+2] = avgB;
						}
					}
				}
			}

			return true;
		},
		brightness:function(imageData,value=0){ //亮度
			value = Number.parseFloat(value);
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+0] += value;
					data[index+1] += value;
					data[index+2] += value;
				}
			}
			return true;
		},
		opacity:function(imageData,value=1){       //透明度
			value = Number.parseFloat(value);
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+3] = data[index+3]*value;
				}
			}
			return true;
		},
	}
	/************* 定义图层操作状态 *************/
	ImageLayer.FREEING = "freeing";  			// 空闲状态
	ImageLayer.FILTER = "filter"; 				// 使用滤镜 
	ImageLayer.TRANSFORM = "transform"; 		// 图形变换
	ImageLayer.CLIP = "clip";					// 裁剪图像
	ImageLayer.PANCIL = "pancil";				// 铅笔
	ImageLayer.MOSAIC = "mosaic";				// 马赛克 -- 局部滤镜
	ImageLayer.ERASER = "eraser";				// 橡皮擦
	ImageLayer.RULER =	"ruler";				// 度量工具
	ImageLayer.STRAW = "straw";					// 吸管工具 -- 取色
	ImageLayer.IMAGEMATTING = "imagematting";	// 抠图

	/************* 属性和方法私有化 *************/
	const PRIVATE = {										
		/* 私有属性 */
		state:Symbol("state"),
		history:Symbol("history"),
		width:Symbol("width"),
		height:Symbol('height'),
		x:Symbol('x'),
		y:Symbol('y'),
		isClearImageArea:Symbol("isClearImageArea"),
		scaleFlag:Symbol("scaleFlag"),
		rotateFlag:Symbol("rotateFlag"),
		rectInfo:Symbol("rectInfo"),


		/* 私有方法 */
		init:Symbol('init'),
		reset:Symbol('reset'),
		store:Symbol('store'),
		saveImage:Symbol('saveImage'),
		saveRectInfo:Symbol('saveRectInfo'),
		initPancil:Symbol('initPancil'),
		initMosaic:Symbol('initMosaic'),
		initEraser:Symbol('initEraser'),
		brushMoveTo:Symbol('brushMoveTo'),
		brushLineTo:Symbol('brushLineTo'),


	}

	/************* 定义图层构造函数 *************/
	function ImageLayer(parentNode){ 
		this.parentNode = parentNode;  						//父节点
		this.imageArea = document.createElement('canvas'); 	//图像显示区域
		this.operArea = document.createElement('canvas');  	//图像操作区域
		this.tempArea = document.createElement('canvas');   //临时图像区域
		this.scaleArea = document.createElement('canvas');  //缩放操作保存图像的区域
		this.imageCxt = this.imageArea.getContext('2d'); 	//显示区域画笔
		this.operCxt = this.operArea.getContext('2d');   	//操作区域画笔
		this.tempCxt = this.tempArea.getContext('2d');		//临时图像画笔
		this.baseInfo = {};									//图层外围矩形边框信息、旋转角度 --- 提供图像数据
		this[PRIVATE.history] = [];			   				//操作记录
		this[PRIVATE.rectInfo] = {};						//图层外围矩形边框信息
		this[PRIVATE.state] = ImageLayer.FREEING;			//操作状态
		this[PRIVATE.isClearImageArea] = false;				//是否清空显示区域
		this[PRIVATE.scaleFlag] = true;						//判断在缩放时是否保存图像 --- 避免图片模糊
		this[PRIVATE.rotateFlag] = true;					//判断在旋转时是否保存矩形边框信息 

		Object.defineProperties(this,{ //设置图像和操作区域的长宽及坐标信息
			[PRIVATE.width]:{
				set:function(value){
					this.imageArea.width = value;
					this.operArea.width = value;
				}
			},
			[PRIVATE.height]:{
				set:function(value){
					this.imageArea.height = value;
					this.operArea.height = value;
				}
			},
			[PRIVATE.x]:{
				set:function(value){
					this.imageArea.style.left = `${value}px`;
					this.operArea.style.left = `${value}px`;
				}
			},
			[PRIVATE.y]:{
				set:function(value){
					this.imageArea.style.top = `${value}px`;
					this.operArea.style.top = `${value}px`;
				}
			},
		});
	}

	/************* 定义加载图层相关函数 *************/

	ImageLayer.prototype[PRIVATE.init] = function(rectInfo){ //初始化图层
		this.parentNode.appendChild(this.imageArea);
		this.parentNode.appendChild(this.operArea);
		this.parentNode.appendChild(GLOBAL_CANVAS);
		this.parentNode.style.position = "relative";
		this.parentNode.style.overflow = "hidden";
		this.imageArea.style.position = "absolute";
		this.operArea.style.position = "absolute";
		let parentPos = this.parentNode.getBoundingClientRect();
		let x,y;
		if(rectInfo === null){
			x = (parentPos.width - this.imageArea.width)/2;
			y = (parentPos.height - this.imageArea.height)/2;
		}else{
			x = rectInfo.x;
			y = rectInfo.y;
		}
		this[PRIVATE.x] = x;
		this[PRIVATE.y] = y;
		this[PRIVATE.saveRectInfo](x,y,this.imageArea.width,this.imageArea.height);

		if(isGlobalCanvasInit === false){ //第一次初始化，初始化全局画布
			isGlobalCanvasInit = true;
			let parentInfo = this.parentNode.getBoundingClientRect();
			GLOBAL_CANVAS.width = parentInfo.width;
			GLOBAL_CANVAS.height = parentInfo.height;
			GLOBAL_CANVAS.style.position = "absolute";
			GLOBAL_CANVAS.style.zIndex = "1000";
			// GLOBAL_CANVAS.style.display = "none";
			ImageLayer.globalInfo.clipRect = {
				x:0,
				y:0,
				width:0,
				height:0,
			};
		}
	}

	ImageLayer.prototype[PRIVATE.reset] = function(){ // 重置所有事件及标记

		/*** 重置操作区域的所有事件 ***/
		this.operArea.onmousedown = null;
		this.operArea.onmousemove = null;
		this.operArea.onmouseup = null;
		this.operArea.onmouseout = null;
		this.operCxt.globalCompositeOperation = "source-over" // 恢复默认图像组合效果
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		/*** 重置共享画布的所有事件 ***/
		GLOBAL_CANVAS.onmousedown = null;
		GLOBAL_CANVAS.onmousemove = null;
		GLOBAL_CANVAS.onmouseup = null;
		GLOBAL_CANVAS.onmouseout = null;
		GLOBAL_CANVAS.style.cursor = "default";
		// GLOBAL_CANVAS.style.display = "none"; // 隐藏全局画布
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);
		/*** 重置标记 ***/		
		this[PRIVATE.scaleFlag] = true;						
		this[PRIVATE.rotateFlag] = true;
		this[PRIVATE.isClearImageArea] = false;
		this[PRIVATE.state] = ImageLayer.FREEING;

		/*** 重置旋转角度 ***/
		this.baseInfo.rotateAngle = 0;

		/*** 重置全局信息 ***/
		ImageLayer.globalInfo.clipRect.x = 0;
		ImageLayer.globalInfo.clipRect.y = 0;
		ImageLayer.globalInfo.clipRect.width = 0;
		ImageLayer.globalInfo.clipRect.height = 0;

	}

	ImageLayer.prototype.load = function(source,rectInfo=null){ //加载图片资源
		let img = new Image();
		img.src = source;
		img.onload = ()=>{
			this[PRIVATE.width] = img.width;
			this[PRIVATE.height] = img.height;
			this[PRIVATE.init](rectInfo);
			this.imageCxt.drawImage(img,0,0);
			this[PRIVATE.store]();
		};
	}

	/************* 保存图像信息 *************/

	ImageLayer.prototype[PRIVATE.saveImage] = function(){ // 将当前图像保存在临时区域
		this.tempArea.width = this.imageArea.width;
		this.tempArea.height = this.imageArea.height;
		this.tempCxt.clearRect(0,0,this.tempArea.width,this.tempArea.height);
		this.tempCxt.drawImage(this.imageArea,0,0);
		// let imageData = this.imageCxt.getImageData(0,0,this.imageArea.width,this.imageArea.height);
		// this.tempCxt.putImageData(imageData,0,0);
	}

	ImageLayer.prototype[PRIVATE.saveRectInfo] = function(x,y,width,height){ // 更新长宽及位移信息
		this[PRIVATE.rectInfo].x = x;
		this[PRIVATE.rectInfo].y = y;
		this[PRIVATE.rectInfo].width = width;
		this[PRIVATE.rectInfo].height = height;
		// console.log(this[PRIVATE.rectInfo]);
		this.baseInfo.x = x;
		this.baseInfo.y = y;
		this.baseInfo.width = width;
		this.baseInfo.height = height;
	}

	/************* 定义历史记录相关函数 *************/

	ImageLayer.prototype.getHistoryLength = function(){ //获取操作记录长度
		return this[PRIVATE.history].length;
	}

	ImageLayer.prototype[PRIVATE.store] = function(){ //保存当前图像
		/**
		 *	1、data对象保存当前图像信息及位移
		 *	2、更新当前图像信息并将图像备份到临时区域
		 */
		let data = {
			imageData:this.imageCxt.getImageData(0,0,this.imageArea.width,this.imageArea.height),
			position:{x:this.imageArea.offsetLeft,y:this.imageArea.offsetTop},
		}
		this[PRIVATE.history].push(data);
		this[PRIVATE.saveRectInfo](data.position.x,data.position.y,this.imageArea.width,this.imageArea.height);
		this[PRIVATE.saveImage](); // 将当前图像在临时区域备份
	}

	ImageLayer.prototype.restore = function(index = this[PRIVATE.history].length-1){ //退回到第index次操作
		/**
		 *	1、是否为数字以及边界判断
		 *	2、取出第index次的数据，设置到图像显示区域及操作区域
		 *	3、更新当前图像信息并将图像备份到临时区域
		 *	4、重置所有相关标记
		 */
		if(!Number.isInteger(index) || index<0 || index>= this[PRIVATE.history].length){
			return;
		}
		let data = this[PRIVATE.history][index];
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this[PRIVATE.x] = data.position.x;
		this[PRIVATE.y] = data.position.y;
		this[PRIVATE.width] = data.imageData.width;
		this[PRIVATE.height] = data.imageData.height;
		this.imageCxt.putImageData(data.imageData,0,0);
		this.imageArea.style.display = "inline";
		this[PRIVATE.saveRectInfo](data.position.x,data.position.y,this.imageArea.width,this.imageArea.height);
		this[PRIVATE.saveImage](); // 将当前图像在临时区域备份
		this[PRIVATE.reset](); // 重置
	}


	/************* 保存一次操作 *************/

	ImageLayer.prototype.resolve = function(){  //确认操作
		/**
		 *	1、如果状态为FREEING，说明没有操作图像，直接退出函数
		 *	2、根据isClearImageArea标记判断是否清除图像区域
		 *	3、将操作区域的图像画到图像显示区域并清除操作区域图像
		 *	4、重置操作区域以及共享区域
		 *	5、将当前图像保存，并重置所有相关标记
		 */
		if(this[PRIVATE.state] === ImageLayer.FREEING){
			return;
		}
		if(this[PRIVATE.state] === ImageLayer.CLIP){
			this.saveClipArea();
		}
		if(this[PRIVATE.state] === ImageLayer.IMAGEMATTING){
			console.log("IMAGEMATTING");
			this.saveImageMattingArea();
		}
		if(this[PRIVATE.isClearImageArea] === true){
			this.imageCxt.clearRect(0,0,this.imageArea.width,this.imageArea.height);
		}

		console.log("resolve");

		this.imageCxt.drawImage(this.operArea,0,0);
		this.imageArea.style.display = "inline"; // 显示图像区域
		
		this[PRIVATE.store]();
		this[PRIVATE.reset]();
	}

	/************* 定义滤镜效果相关函数 *************/

	ImageLayer.prototype.filter = function(type,value,isUseInBrush=false){
		/**
		 *	1、判断状态是否为FREEING或FILTER或者用于画笔操作
		 *
		 */
		if(!(this[PRIVATE.state]===ImageLayer.FREEING || this[PRIVATE.state] === ImageLayer.FILTER) && isUseInBrush === false){
			return;
		}
		if(!FILTER.hasOwnProperty(type)){
			return;
		}
		// console.log("filter");
		/**
		 * 缺少路径操作
		 */
		if(isUseInBrush === false){
			this.imageArea.style.display = "none"; // 暂时隐藏图像区域
		}
		let imageData = this.imageCxt.getImageData(0,0,this.imageArea.width,this.imageArea.height);
		if(FILTER[type](imageData,value) === true){
			this.operCxt.putImageData(imageData,0,0);
			if(!isUseInBrush){
				this[PRIVATE.state] = ImageLayer.FILTER;
			}
			if(type === "opacity" && !isUseInBrush){
				this[PRIVATE.isClearImageArea] = true;
			}else{
				this[PRIVATE.isClearImageArea] = false;
			}
		}
	}


	/************* 定义图像变换相关函数 *************/

	function updateRect(imageLayer){	// 根据当前图像重置外接矩形
		let targetInfo = imageLayer[PRIVATE.rectInfo];
		operRect = [
			new operPoint(targetInfo.x,targetInfo.y,radius),									//左上角顶点
			new operPoint(targetInfo.x+targetInfo.width,targetInfo.y,radius),					//右上角顶点
			new operPoint(targetInfo.x+targetInfo.width,targetInfo.y+targetInfo.height,radius),	//左下角顶点
			new operPoint(targetInfo.x,targetInfo.y+targetInfo.height,radius)					//右下角顶点
		];
		operPoint.drawRect(GLOBAL_CANVAS,5);
	}

	ImageLayer.prototype.transform = function(){ // 图像变换
		/**
		 *	通过GLOBAL_CANVAS代理鼠标事件
		 */
		if(this[PRIVATE.state]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.state] = ImageLayer.TRANSFORM;
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);
		// GLOBAL_CANVAS.style.display = "inline";
		
		updateRect(this);

		let pointNum = operRect.length; //顶点数
		let angle = 0;
		let that = this;

		/********定义鼠标事件********/
		GLOBAL_CANVAS.onmousedown = function(e){
			e = e || window.event;
			let rect = this.getBoundingClientRect();
			let oldX = e.clientX - rect.x;
			let oldY = e.clientY - rect.y;
			// let mousemoveFlag = false;    //判断是否定义了鼠标移动事件
			let center = {
				x:that[PRIVATE.rectInfo].x+that[PRIVATE.rectInfo].width/2,
				y:that[PRIVATE.rectInfo].y+that[PRIVATE.rectInfo].height/2
			};
			let trans_angle = 0;

			let mousemoveFlag = operPoint.control(oldX,oldY,this,()=>{ // 缩放或移动
				let rectWidth = operRect[1].x - operRect[0].x;
				let rectHeight = operRect[3].y - operRect[0].y;
				that.scale(operRect[0].x,operRect[0].y,rectWidth,rectHeight);
			},()=>{
				that.translate(operRect[0].x,operRect[0].y);
			});    
			
			if(mousemoveFlag === false){ //如果为真这为旋转操作
				this.onmousemove = function(e){
					e = e || window.event;
					let newX = e.clientX - rect.x;
					let newY = e.clientY - rect.y;
					
					/******* 向量求旋转的角度 --- 不是最优方法*********/

					let vectorA = {x:oldX-center.x,y:oldY-center.y};
					let vectorB = {x:newX-center.x,y:newY-center.y};
					let cos = (vectorA.x*vectorB.x+vectorA.y*vectorB.y)/Math.sqrt((vectorA.x**2+vectorA.y**2)*(vectorB.x**2+vectorB.y**2));
					trans_angle = angle + Math.acos(cos)*180/Math.PI;
					that.rotate(trans_angle);

				}

			}

			this.onmouseup = function(){
				this.onmousemove = null;
				this.style.cursor = "default";
				angle = trans_angle;
			}
			this.onmouseout = function(){
				this.onmousemove = null;
				this.style.cursor = "default";
				angle = trans_angle;
			}
		}
	}

	ImageLayer.prototype.rotate = function(angle = 0){ // 旋转
		/**
		 *  实现思路：  关键属性  tempArea、rectInfo
		 *  1、一次旋转操作的开始先拷贝矩形边框信息，确保一次旋转操作边框信息一致
		 *  2、根据图层信息计算旋转后的最小外接矩形长宽
		 *	3、隐藏图像显示区域，避免旋转过程出现两个图像
		 *	4、根据最小外接矩形设置图像位移及大小
		 *	5、将旋转后的图显示在图像操作区域
		 */
		if(!(this[PRIVATE.state]===ImageLayer.FREEING || this[PRIVATE.state] ===ImageLayer.TRANSFORM)){
			return;
		}
		/***  拷贝矩形边框信息  ***/
		if(this[PRIVATE.rotateFlag]){
			this.info = JSON.parse(JSON.stringify(this[PRIVATE.rectInfo]));
			this[PRIVATE.rotateFlag] = false;
		}

		// 记录旋转角度
		this.baseInfo.rotateAngle = angle;
		// console.log(this.baseInfo);

		/***  计算变换后最小外接矩形的长宽 ***/
		let absAngle = Math.abs(angle%90)*Math.PI/180;
		let oldWidth = this.info.width/2;
		let oldHeight = this.info.height/2;
		let giagonal = Math.sqrt(oldWidth**2+oldHeight**2);
		let radian = Math.atan(oldHeight/oldWidth); //求弧度
		let rad90 = 90*Math.PI/180;
		let newHeight = giagonal*Math.cos(Math.abs(rad90-absAngle-radian))*2;
		let newWidth = giagonal*Math.cos(Math.abs(absAngle-radian))*2;
		if(Math.abs(angle)%180>=90){
			[newHeight,newWidth] = [newWidth,newHeight];
		}

		this.imageArea.style.display = "none";
		this[PRIVATE.width] = newWidth;
		this[PRIVATE.height] = newHeight;
		this[PRIVATE.x] = `${this.info.x+(this.info.width-newWidth)/2}`;
		this[PRIVATE.y] = `${this.info.y+(this.info.height-newHeight)/2}`;
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this.operCxt.save();
		this.operCxt.translate(this.operArea.width/2,this.operArea.height/2);
		this.operCxt.rotate(angle*Math.PI/180);
		this.operCxt.drawImage(this.tempArea,(this.operArea.width-this.info.width)/2-this.operArea.width/2,(this.operArea.height-this.info.height)/2-this.operArea.height/2);
		this.operCxt.restore();

		/******* 确保移动过程能够加滤镜 --- 看情况删除 *********/
		this.imageCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this.imageCxt.drawImage(this.operArea,0,0);

		this[PRIVATE.saveRectInfo](this.operArea.offsetLeft,this.operArea.offsetTop,newWidth,newHeight);
		this[PRIVATE.state] = ImageLayer.TRANSFORM;
		this[PRIVATE.isClearImageArea] = true; 
		this[PRIVATE.scaleFlag] = true; //旋转后需要更新缩放里保存的备份图像
		updateRect(this);
	}

	ImageLayer.prototype.translate = function(x,y){ // 移动
		/**
		 *	将图像左上角移动到(x,y)点
		 */
		if(!(this[PRIVATE.state]===ImageLayer.FREEING || this[PRIVATE.state] ===ImageLayer.TRANSFORM)){
			return;
		}
		this[PRIVATE.x] = x;
		this[PRIVATE.y] = y;
		this[PRIVATE.saveRectInfo](x,y,this.imageArea.width,this.imageArea.height);
		this[PRIVATE.state] = ImageLayer.TRANSFORM;
		this[PRIVATE.rotateFlag] = true;
	}

	ImageLayer.prototype.scale = function(x,y,width,height){ // 缩放
		/**
		 *	1、一次缩放操作的开始先备份图像，确保一次缩放图像一致，避免图像变模糊
		 *  1、根据参数设置图像位移及大小
		 *	2、更新图层信息
		 *	3、将缩放后的图像备份，为旋转操作做准备
		 */
		if(!(this[PRIVATE.state]===ImageLayer.FREEING || this[PRIVATE.state] ===ImageLayer.TRANSFORM)){
			return;
		}
		/****** 备份图像 *******/
		if(this[PRIVATE.scaleFlag]){
			this[PRIVATE.scaleFlag] = false;
			this.scaleArea.width = this.imageArea.width;
			this.scaleArea.height = this.imageArea.height;
			this.scaleArea.getContext('2d').drawImage(this.imageArea,0,0);
		}
		this[PRIVATE.x] = x;
		this[PRIVATE.y] = y;
		this[PRIVATE.width] = width;
		this[PRIVATE.height] = height;
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this.operCxt.drawImage(this.tempArea,0,0,width,height);
		this.imageArea.style.display = "inline";
		this.imageCxt.clearRect(0,0,this.imageArea.width,this.imageArea.height);
		this.imageCxt.drawImage(this.scaleArea,0,0,width,height);
		this[PRIVATE.saveRectInfo](x,y,width,height);			// 更新位置信息
		this[PRIVATE.saveImage](); 								// 将当前图像在临时区域备份
		this[PRIVATE.rotateFlag] = true; 						// 缩放后需要更新旋转中矩形边框信息
		this[PRIVATE.state] = ImageLayer.TRANSFORM;
	}

	/************* 定义图像裁剪相关函数 *************/


	function grayArea(canvas){ // 根据非零绕数原则，绘制灰色区域
		let cxt = canvas.getContext('2d');
		cxt.save();
		cxt.beginPath();
		cxt.moveTo(0,0);
		cxt.lineTo(canvas.width,0);
		cxt.lineTo(canvas.width,canvas.height);
		cxt.lineTo(0,canvas.height);
		cxt.lineTo(0,0);
		cxt.moveTo(operRect[0].x,operRect[0].y);
		for(let i = operRect.length-1; i>=0; i--){
			cxt.lineTo(operRect[i].x,operRect[i].y);
		}
		cxt.fillStyle = "rgba(128,128,128,0.8)";
		cxt.fill();
		cxt.restore();
	}
	function resizeRect(canvas){ // 调整位置及大小
		canvas.onmousedown = function(e){
			e = e || window.event;
			let rect = this.getBoundingClientRect();
			let oldX = e.clientX - rect.x;
			let oldY = e.clientY - rect.y;
			operPoint.control(oldX,oldY,canvas,grayArea,grayArea);
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
	ImageLayer.prototype.saveClipArea = function(){ //确认截取操作
		/**
		 *	1、如果不是剪切的状态直接退出
		 *	2、将剪切后的图像移动到原图像中间
		 */
		if(this[PRIVATE.state] !== ImageLayer.CLIP){
			return;
		}
		let rectWidth = operRect[1].x - operRect[0].x;
		let rectHeight = operRect[3].y - operRect[0].y;
		let imageData = this.imageCxt.getImageData(operRect[0].x-this.operArea.offsetLeft,operRect[1].y-this.operArea.offsetTop,rectWidth,rectHeight);
		let info = this[PRIVATE.rectInfo];
		this[PRIVATE.width] = rectWidth;
		this[PRIVATE.height] = rectHeight;
		this[PRIVATE.x] = info.x + (info.width - rectWidth)/2;
		this[PRIVATE.y] = info.y + (info.height - rectHeight)/2;
		this.operArea.style.display = "inline";
		this.operCxt.putImageData(imageData,0,0);
		// this.resolve(); 
	}

	ImageLayer.prototype.clip = function(){
		/**
		 *	在GLOBAL_CANVAS上确定截取大小
		 */
		if(this[PRIVATE.state]!==ImageLayer.FREEING){
			return;
		}

		this[PRIVATE.state] = ImageLayer.CLIP;
		let that = this;
		GLOBAL_CANVAS.onmousedown = function(e){
			let info = this.getBoundingClientRect();
			console.log("clip");
			e = e || window.event;
			let oldX = e.clientX - info.x;
			let oldY = e.clientY - info.y;
			operRect = [
				new operPoint(oldX,oldY),
				new operPoint(oldX,oldY),
				new operPoint(oldX,oldY),
				new operPoint(oldX,oldY),
			];
			// operPoint.drawRect(this);
			this.onmousemove = function(e){
				e = e || window.event;
				let newX = e.clientX - info.x;
				let newY = e.clientY - info.y;
				operRect[2].x = newX;
				operRect[2].y = newY;
				operRect[1].x = newX;
				operRect[3].y = newY;
				operPoint.drawRect(this,0);
				grayArea(this);
			}
			this.onmouseup = function(){
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this);
			}
			this.onmouseout = function(){
				this.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this);
			}
		}
	}


	/************* 定义画笔相关函数 *************/

	ImageLayer.prototype.pancil = function(){
		/**
		 *	通过GLOBAL_CANVAS代理鼠标事件
		 */
		if(this[PRIVATE.state]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.state] = ImageLayer.PANCIL;
		this[PRIVATE.initPancil]();
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);
		// GLOBAL_CANVAS.style.display = "inline";
		GLOBAL_CANVAS.style.cursor = "none";
		BRUSH.draw(GLOBAL_CANVAS);
		BRUSH.move(GLOBAL_CANVAS,this);

	}
	ImageLayer.prototype.mosaic = function(type='mosaic',value=null){
		/**
		 *	通过GLOBAL_CANVAS代理鼠标事件
		 */
		if(this[PRIVATE.state]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.state] = ImageLayer.MOSAIC;
		this[PRIVATE.initMosaic](type,value);
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);
		// GLOBAL_CANVAS.style.display = "inline";
		GLOBAL_CANVAS.style.cursor = "none";
		BRUSH.draw(GLOBAL_CANVAS);
		BRUSH.move(GLOBAL_CANVAS,this);
	}
	ImageLayer.prototype.eraser = function(value=0){
		/**
		 *	通过GLOBAL_CANVAS代理鼠标事件
		 */
		if(this[PRIVATE.state]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.state] = ImageLayer.ERASER;
		this[PRIVATE.initEraser](value);
		GLOBAL_CXT.clearRect(0,0,GLOBAL_CANVAS.width,GLOBAL_CANVAS.height);
		// GLOBAL_CANVAS.style.display = "inline";
		GLOBAL_CANVAS.style.cursor = "none";
		BRUSH.draw(GLOBAL_CANVAS);
		BRUSH.move(GLOBAL_CANVAS,this);
	}

	ImageLayer.prototype[PRIVATE.initPancil] = function(){ //铅笔涂鸦
		/**
		 *	清空操作区域，将画笔颜色设置为红色 
		 */
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this.operArea.style.display = "inline";
		BRUSH.color = "red";
	}

	ImageLayer.prototype[PRIVATE.initMosaic] = function(type,value){ //马赛克
		/**
		 *	1、调用滤镜函数，操作区域暂时保存滤镜效果
		 *	2、将画笔样式设置为加滤镜的图片，产生“画出”滤镜效果
		 *	3、清除操作区域
		 */
		this.filter(type,value,true);
		console.log("mosaic");
		let pattern = this.operCxt.createPattern(this.operArea,"repeat");
		BRUSH.pattern = pattern;
		BRUSH.color = "transparent";
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
	}

	ImageLayer.prototype[PRIVATE.initEraser] = function(value){ //橡皮擦
		/**
		 *	1、调用滤镜函数，操作区域暂时保存滤镜效果
		 *	2、将画笔样式设置为任意颜色（不能为透明）
		 *	3、将图像显示区域设置为修改透明度后的图
		 *	4、将操作区域设置为原图
		 *	5、将图像合成方式改成destination-out(新图像与旧图像重合部分变透明)
		 */
		this.filter('opacity',value,true);
		BRUSH.pattern = "gray";
		BRUSH.color = "transparent";
		this.imageCxt.clearRect(0,0,this.imageArea.width,this.imageArea.height);
		this.imageCxt.drawImage(this.operArea,0,0);
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this.operCxt.drawImage(this.tempArea,0,0);
		this.operCxt.globalCompositeOperation = "destination-out";
	}

	ImageLayer.prototype[PRIVATE.brushMoveTo] = function(point){ //设置起点
		let info = this[PRIVATE.rectInfo];
		if(point.x<info.x || point.x>info.x+info.width){
			return;
		}
		if(point.y<info.y || point.y>info.y+info.height){
			return;
		}
		this.operCxt.beginPath();
		this.operCxt.moveTo(point.x-info.x,point.y-info.y);
	}
	ImageLayer.prototype[PRIVATE.brushLineTo] = function(point){ //画线
		let info = this[PRIVATE.rectInfo];
		// console.log("drawPoint");
		if(point.x<info.x || point.x>info.x+info.width){
			this.operCxt.beginPath();
			return;
		}
		if(point.y<info.y || point.y>info.y+info.height){
			this.operCxt.beginPath();
			return;
		}
		this.operCxt.lineTo(point.x-info.x,point.y-info.y);
		if(this[PRIVATE.state] === ImageLayer.PANCIL){
			this.operCxt.strokeStyle = point.color;
		}else{
			this.operCxt.strokeStyle = point.pattern;
		}
		this.operCxt.lineWidth = point.size*2;
		this.operCxt.lineCap = "round";
		this.operCxt.lineJoin = "round";
		this.operCxt.stroke();
	}

	/************* 定义抠图相关函数 *************/

	const PATH = []; // 保存路径

	function drawPath(canvas,isClosePath = false){ // 绘制路径
		let cxt = canvas.getContext('2d');
		cxt.clearRect(0,0,canvas.width,canvas.height);
		PATH[0].draw(cxt,false);
		cxt.save();
		cxt.beginPath();
		cxt.setLineDash([5]);
		PATH.forEach((value)=>{
			cxt.lineTo(value.x,value.y);
		});
		if(isClosePath === true){
			cxt.closePath();
		}
		cxt.stroke();
		cxt.restore();
		if(isClosePath === true){
			PATH.forEach((value)=>{ // 画出所有控制点
				value.draw(cxt,false);
			});
		}
	}

	function checkPathClose(canvas,x,y){ // 判断路径是否闭合
		if(PATH.length < 2) return false;
		let cxt = canvas.getContext('2d');
		cxt.beginPath();
		cxt.arc(PATH[0].x,PATH[0].y,radius,0,2*Math.PI);
		if(cxt.isPointInPath(x,y)){
			return true;
		}
		return false;
	}

	function resizePath(canvas){ // 控制路径
		let cxt = canvas.getContext('2d');
		canvas.onmousedown = function(e){
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let oldX = e.clientX - info.x;
			let oldY = e.clientY - info.y;
			let len = PATH.length;
			for(let i=0; i<len; i++){
				cxt.beginPath();
				cxt.arc(PATH[i].x,PATH[i].y,radius,0,2*Math.PI);
				if(cxt.isPointInPath(oldX,oldY)){
					this.style.cursor = "move";
					this.onmousemove = function(e){
						e = e || window.event;
						let newX = e.clientX - info.x;
						let newY = e.clientY - info.y;
						let offsetX = newX - oldX;
						let offsetY = newY - oldY;
						[oldX,oldY] = [newX,newY];
						PATH[i].x += offsetX;
						PATH[i].y += offsetY;
						drawPath(canvas,true);
					}
					break;
				}
			}
			this.onmouseup = function(){
				this.onmousemove = null;
				this.style.cursor = "default";
			}
			this.onmouseout = function(){
				this.onmousemove = null;
				this.style.cursor = "default";
			}
		}
	}

	ImageLayer.prototype.saveImageMattingArea = function(){ // 保存抠图
		if(this[PRIVATE.state] !== ImageLayer.IMAGEMATTING){
			return;
		}
		this.operCxt.clearRect(0,0,this.operArea.width,this.operArea.height);
		this.operCxt.save();
		this.operCxt.beginPath();
		PATH.forEach((value)=>{
			this.operCxt.lineTo(value.x-this.operArea.offsetLeft,value.y-this.operArea.offsetTop);
		});
		this.operCxt.closePath();
		this.operCxt.clip();
		this.operCxt.drawImage(this.imageArea,0,0);
		this.operCxt.restore();
		this[PRIVATE.isClearImageArea] = true;
		// this.resolve();
	}

	ImageLayer.prototype.imageMatting = function(){
		/**
		 *  通过GLOBAL_CANVAS代理鼠标事件
		 *	两种取点模式：
		 *	1、鼠标点击位置保存为控制点，存放在PATH数组
		 *	2、鼠标移动过程鼠标仍为点击状态，每隔interval取一个控制点，存放在PATH数组
		 */
		if(this[PRIVATE.state] !== ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.state] = ImageLayer.IMAGEMATTING;
		PATH.splice(0,PATH.length);					//初始化点集

		GLOBAL_CANVAS.style.cursor = "crosshair";
		let isMouseDown = false;					//标记鼠标是否为按下状态
		let interval = 15;
		let that = this;
		
		function checkPoint(x,y){	// 判断点是否在图像上
			let rectInfo = that[PRIVATE.rectInfo];
			// console.log(x,y,rectInfo);
			if(x<rectInfo.x || x>rectInfo.x+rectInfo.width || y<rectInfo.y || y>rectInfo.y+rectInfo.height){
				return false;
			}
			return true;
		}

		GLOBAL_CANVAS.onmousedown = function(e){
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;
			if(!checkPoint(x,y)){
				return;
			}
			if(checkPathClose(this,x,y) === true){
				drawPath(this,true);
				this.onmousedown = null;
				this.onmousemove = null;
				this.onmouseup = null;
				this.style.cursor = "default";
				resizePath(this);
				return;
			}
			PATH.push(new operPoint(x,y));
			drawPath(this);
			isMouseDown = true;
		}
		GLOBAL_CANVAS.onmousemove = function(e){
			if(PATH.length === 0) return;
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;
			if(!checkPoint(x,y)){
				return;
			}
			if(isMouseDown === true){
				if(checkPathClose(this,x,y) === true){
					drawPath(this,true);
					this.onmousedown = null;
					this.onmousemove = null;
					this.onmouseup = null;
					this.style.cursor = "default";
					resizePath(this);
					return;
				}
				let dist = Math.sqrt((PATH[PATH.length-1].x-x)**2+(PATH[PATH.length-1].y-y)**2);
				console.log(dist);
				if(dist>=interval){
					PATH.push(new operPoint(x,y));
				}
				drawPath(this);
			}
			else{
				drawPath(this);
				GLOBAL_CXT.save();
				GLOBAL_CXT.setLineDash([5]);
				GLOBAL_CXT.lineTo(x,y);
				GLOBAL_CXT.stroke();
				GLOBAL_CXT.restore()

			}
		}
		GLOBAL_CANVAS.onmouseup = function(){
			isMouseDown = false;
		}
	}

	window.ImageLayer = ImageLayer;

})(window);
