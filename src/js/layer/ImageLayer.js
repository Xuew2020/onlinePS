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
	BRUSH.draw = function(canvas){ // 画笔位置
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
		BRUSH.draw(GLOBAL_CANVAS);
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
		if(imageLayer[PRIVATE.status] !== ImageLayer.FREEING){
			return;
		}
		imageLayer[PRIVATE.status] = ImageLayer.RULER;
		// GLOBAL_CANVAS.style.display = "inline";
		GLOBAL_CANVAS.onmousedown = function(e){
			e = e || window.event;
			let info = this.getBoundingClientRect();
			RULER.sx = RULER.dx = e.clientX - info.x;
			RULER.sy = RULER.dy = e.clientY - info.y;
			RULER.draw(this);

			ImageLayer.globalInfo.rulerInfo.sx = RULER.sx;
			ImageLayer.globalInfo.rulerInfo.sy = RULER.sy;
			ImageLayer.globalInfo.rulerInfo.dx = RULER.dx;
			ImageLayer.globalInfo.rulerInfo.dy = RULER.dy;


			this.onmousemove = function(e){
				e = e || window.event;
				RULER.dx = e.clientX - info.x;
				RULER.dy = e.clientY - info.y;
				RULER.draw(this);

				ImageLayer.globalInfo.rulerInfo.dx = RULER.dx;
				ImageLayer.globalInfo.rulerInfo.dy = RULER.dy;
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
		if(imageLayer[PRIVATE.status] !== ImageLayer.FREEING){
			return;
		}
		imageLayer[PRIVATE.status] = ImageLayer.STRAW;
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
			if(imageLayer instanceof ImageLayer){
				let info = imageLayer[PRIVATE.rectInfo];
				let image = imageLayer.tempArea;
				GLOBAL_CXT.drawImage(image,info.x,info.y);
			}
		});
	}

	/************* 获取合并图层最小区域信息 *************/
	ImageLayer.getLayersInfo = function(imageLayer,imageLayers,type = "image/png",quality = 1){ // toDataUrl存在跨域问题
		if(imageLayer[PRIVATE.status] !== ImageLayer.FREEING){
			return;
		}
		imageMerge(imageLayers);
		quality = Number.parseInt(quality,10)/100;
		console.log(quality);
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

		let base64 = null;
		if(type === "image/png"){
			base64 = canvas.toDataURL(type);
		}else{
			base64 = canvas.toDataURL(type,quality);
		}
		return {src:base64,width:width,height:height};
	}

	/************* 下载 *************/
	ImageLayer.download = function(imageLayer,imageLayers,width,height,type = "image/png",quality = 1){

		let data = ImageLayer.getLayersInfo(imageLayer,imageLayers,type,quality);
		let url = data.src;
		if(data.width !== width || data.height !== height){
			let canvas = document.createElement('canvas');
			let cxt = canvas.getContext('2d');
			canvas.width = width;
			canvas.height = height; 
			let img = new Image();
			img.src = data.src;
			img.onload = function(){
				cxt.drawImage(img,0,0,width,height);
				url = canvas.toDataURL(type);
				window.location = url;
			}
		}else{
			window.location = url;
		}
	}


	/************* 定义滤镜效果 *************/
	function rgbToGray(r,g,b){ // 计算灰度值
		return r*0.299+g*0.587+b*0.114;
	}
	function rgbToHsv(r,g,b){
		let h,s,v;
		v = Math.max(r,g,b);
		let min = Math.min(r,g,b);
		if(v === 0){
			s = 0;
		}else{
			s = (v-min)/v;
		}
		switch(v){
			case min:
				h = 0;
				break;
			case r:
				h = (60*(g-b))/(v-min);
				break;
			case g:
				h = 120 + (60*(b-r))/(v-min);
				break;
			case b:
				h = 240 + (60*(r-g))/(v-min);
				break;
		}
		if(h<0){
			h += 360;
		}
		return [h,s,v];
	}
	function hsvToRgb(h,s,v){
		let r,g,b;
		let hi = Math.floor(h/60)%6;
		let f = h/60-hi;
		let p = v*(1-s);
		let q = v*(1-f*s);
		let t = v*(1-(1-f)*s);
		switch(hi){
			case 0:
				[r,g,b] = [v,t,p];
				break;
			case 1:
				[r,g,b] = [q,v,p];
				break;
			case 2:
				[r,g,b] = [p,v,t];
				break;
			case 3:
				[r,g,b] = [p,q,v];
				break;
			case 4:
				[r,g,b] = [t,p,v];
				break;
			case 5:
				[r,g,b] = [v,p,q];
		}
		return [r,g,b];
	}
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
		sepia:function(imageData){               //复古 -- 老照片
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					let r = data[index+0];
					let g = data[index+1];
					let b = data[index+2];
					data[index+0] = r*0.39+g*0.76+b*0.18;
					data[index+1] = r*0.35+g*0.68+b*0.16;
					data[index+2] = r*0.27+g*0.53+b*0.13;
				}
			}
			return true;
		},
		grayScale:function(imageData){          //灰度图
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					let value = rgbToGray(data[index],data[index+1],data[index+2]);
					data[index+0] = value;
					data[index+1] = value;
					data[index+2] = value;
				}
			}
			return true;
		},
		binary:function(imageData){ //二值图像
			let {data,width,height} = imageData;
			let color,index,grayColor;
			let threshold = 127;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					index = (i*width+j)*4;
					grayColor = data[index]*0.3+data[index+1]*0.6+data[index+2]*0.1;
					if(grayColor <= threshold){
						color = 0;
					}else{
						color = 255;
					}
					data[index+0] = color;
					data[index+1] = color;
					data[index+2] = color;
				}
			}
			return true;
		},
		blackAndWhiteInverse:function(imageData){	//黑白底片
			/* 先进行反色操作，再进行灰度处理 */
			this.invert(imageData);
			this.grayScale(imageData);
			return true;
		},
		casting:function(imageData){            // 熔铸
			/*
				r = r*128/(g+b+1);
				g = g*128/(r+b+1);
				b = b*128/(r+g+1);
			*/
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+0] = data[index+0]*128/(data[index+1]+data[index+2]+1);
					data[index+1] = data[index+1]*128/(data[index+0]+data[index+2]+1);
					data[index+2] = data[index+2]*128/(data[index+0]+data[index+1]+1);
				}
			}
			return true;
		},
		freezing:function(imageData){            // 冰冻
			/*
				r = (r-b-g)*(3/2);
				g = (g-b-r)*(3/2);
				b = (b-g-r)*(3/2);
			*/
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+0] = (data[index+0]-data[index+1]-data[index+2])*(3/2);
					data[index+1] = (data[index+1]-data[index+2]-data[index+0])*(3/2);
					data[index+2] = (data[index+2]-data[index+1]-data[index+0])*(3/2);
				}
			}
			return true;
		},
		colorChannel:function(imageData,value = {r:1,g:1,b:1}){	// 颜色通道
			let {data,width,height} = imageData;
			let {r,g,b} = value;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+0]*=r;
					data[index+1]*=g;
					data[index+2]*=b;
				}
			}
			return true;
		},
		pancil:function(imageData,value = 15){ //铅笔画
			/* 当前像素与周围像素对比，
			   判断是否有一点差值绝对值大于等于阈值，
			   若有，则为轮廓当前设为白色，反之设为黑色 */
			console.log(value);
			let {data,width,height} = imageData;
			let threshold = value;
			let nextPixels = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]; // 周围8个位置
			let current_pixel,next_pixel,current_index,next_index;
			let is_outline,color;
			let tmpData = new Uint8ClampedArray(height*width*4);

			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					current_index = (i*width+j)*4;
					current_pixel = rgbToGray(data[current_index+0],data[current_index+1],data[current_index+2]);
					is_outline = false;
					for(let k = 0; k<8; k++){
						let x = i + nextPixels[k][0];
						let y = j + nextPixels[k][1];
						if(x<0 || x>=height || y<0 || y>=width){
							continue;
						}
						next_index = (x*width+y)*4;
						next_pixel = rgbToGray(data[next_index+0],data[next_index+1],data[next_index+2]);
						if(Math.abs(current_pixel-next_pixel)>=threshold){
							is_outline = true;
							break;
						}
					}
					if(is_outline === true){
						color = 0;
					}else{
						color = 255;
					}
					tmpData[current_index+0] = color;
					tmpData[current_index+1] = color;
					tmpData[current_index+2] = color;
					tmpData[current_index+3] = data[current_index+3];
				}
			}
			data.forEach((value,index,array)=>{
				array[index] = tmpData[index];
			});
			return true;
		},
		woodcarving:function(imageData,value = 1){ //木雕效果
			/*
				利用Sobel边缘检测算法实现
				Sobel算子：
				kernelX=[[-1,0,1],   kernelY=[[-1,-2,-1], 
				 		 [-2,0,2],			  [ 0, 0, 0],
				 		 [-1,0,1]]		      [ 1, 2, 1]]
				Scharr算子：
				kernelX=[[-3 ,0,3 ],   kernelY=[[-3,-10,-3], 
				 		 [-10,0,10],		  	[ 0, 0 , 0],
				 		 [-3 ,0,3 ]]		  	[ 3, 10, 3]]
				Gx = kerelX※src, Gy = kerelY※src // 卷积
				G = sqrt(Gx^2+Gy^2)
				提高效率：G = |Gx|+|Gy|
			*/
			let {data,width,height} = imageData;
			let kernelX,kernelY;
			if(value === 1){					// Sobel算子  [x,y,value]
				kernelX = [[-1,-1,-1],[-1,1,1],[0,-1,-2],[0,1,2],[1,-1,-1],[1,1,1]];
				kernelY = [[-1,-1,-1],[-1,0,-2],[-1,1,-1],[1,-1,1],[1,0,2],[1,1,1]];
			}else{								// Scharr算子
				kernelX = [[-1,-1,-3],[-1,1,3],[0,-1,-10],[0,1,10],[1,-1,-3],[1,1,3]];
				kernelY = [[-1,-1,-3],[-1,0,-10],[-1,1,-3],[1,-1,3],[1,0,10],[1,1,3]];
			}
			let tmpData = new Uint8ClampedArray(height*width*4);
			let index,Gx,Gy,G;
			this.grayScale(imageData);	//转成灰度图
			function calc(i,j,k,kernel){ 
				let x,y,index;
				x = i + kernel[k][0];
				y = j + kernel[k][1];
				index = (x*width+y)*4;
				return data[index]*kernel[k][2];
			}
			for(let i=1; i<height-1; i++){
				for(let j=1; j<width-1; j++){
					Gx = Gy = 0;
					for(let k=0; k<6; k++){
						Gx += calc(i,j,k,kernelX);
						Gy += calc(i,j,k,kernelY);
					}
					index = (i*width+j)*4;
					G = Math.abs(Gx)+Math.abs(Gy);
					// G = Math.sqrt(Gx*Gx+Gy*Gy);
					tmpData[index+0] = G;
					tmpData[index+1] = G;
					tmpData[index+2] = G;
					tmpData[index+3] = data[index+3];
				}
			}
			data.forEach((value,index,array)=>{
				array[index] = tmpData[index];
			});
			return true;
		},
		sharpen:function(imageData,value = {rate:1,type:0}){ // type:1 锐化结果 type：其他 只显示边缘信息
			/*
				利用laplacian边缘检测算法实现
				laplacian算子：
				kernel = [[-1,-1,-1], 或 [[ 0,-1, 0],
						  [-1, 8,-1],	  [-1, 4,-1],
						  [-1,-1,-1]] 	  [ 0,-1, 0]]
				原图像加上原图像与laplacian算子卷积结果完成锐化
			*/
			let {data,width,height} = imageData;
			let kernel = [[-1,-1,-1],[-1,0,-1],[-1,1,-1],[0,-1,-1],[0,0,8],[0,1,-1],[1,-1,-1],[1,0,-1],[1,1,-1]];
			// let kernel = [[-1,0,-1],[0,-1,-1],[0,0,4],[0,1,-1],[0,1,-1]];
			let tmpData = new Uint8ClampedArray(height*width*4);
			let index,x,y,G;
			let kernel_size = kernel.length;
			for(let i=1; i<height-1; i++){
				for(let j=1; j<width-1; j++){
					G = 0;
					for(let k=0; k<kernel_size; k++){
						x = i + kernel[k][0];
						y = j + kernel[k][1];
						index = (x*width+j)*4;
						G += rgbToGray(data[index+0],data[index+1],data[index+2])*kernel[k][2];
					}
					index = (i*width+j)*4;
					tmpData[index+0] = G;
					tmpData[index+1] = G;
					tmpData[index+2] = G;
					tmpData[index+3] = data[index+3];
				}
			}
			if(value.type === 0){
				data.forEach((value,index,array)=>{
					array[index] = tmpData[index];
				});
			}else{
				for(let i=1; i<height-1; i++){
					for(let j=1; j<width-1; j++){
						index = (i*width+j)*4;
						data[index+0] += tmpData[index+0]*value.rate;
						data[index+1] += tmpData[index+1]*value.rate;
						data[index+2] += tmpData[index+2]*value.rate;
					}
				}
			}
			return true;
		},
		blur:function(imageData,value = 1){             //均值模糊 -- 柔化
			let {data,width,height} = imageData;
			let blurRadius = value; //模糊半径
			let tmpData = new Uint8ClampedArray(height*width*4);
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
					tmpData[index+0] = totalR/totalNum;
					tmpData[index+1] = totalG/totalNum;
					tmpData[index+2] = totalB/totalNum;
					tmpData[index+3] = data[index+3];
				}
			}
			data.forEach((value,index,array)=>{
				array[index] = tmpData[index];
			});
			return true;
		},
		medianBlur:function(imageData,value = 3){ // 中值滤波 -- 去噪声
			let {data,width,height} = imageData;
			let blurRadius = value; 
			let totalNum,index;
			let colors = [],midIndex;
			let tmpData = new Uint8ClampedArray(height*width*4);
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					totalNum=0;
					colors.splice(0,colors.length);
					for(let dx=-blurRadius; dx<=blurRadius; dx++){
						for(let dy=-blurRadius; dy<=blurRadius; dy++){
							let x = i + dx;
							let y = j + dy;
							if(x<0 || x>=height || y<0 || y>=width){
								continue;
							}
							index = (x*width+y)*4;
							totalNum++;
							colors.push({
								r:data[index+0],
								g:data[index+1],
								b:data[index+2],
								grayColor:data[index]*0.3+data[index+1]*0.6+data[index+2]*0.1,
							});
						}
					}
					colors.sort((x,y)=>x.grayColor-y.grayColor);
					midIndex = Math.floor((totalNum-1)/2);
					index = (i*width+j)*4;
					tmpData[index+0] = colors[midIndex].r;
					tmpData[index+1] = colors[midIndex].g;
					tmpData[index+2] = colors[midIndex].b;
					tmpData[index+3] = data[index+3];
				}
			}
			data.forEach((value,index,array)=>{
				array[index] = tmpData[index];
			});
			return true;
		},
		gaussianBlur:function(imageData,value=5){ // 高斯模糊 -- 分离实现提高效率
			let {data,width,height} = imageData;
			let tmpData = new Uint8ClampedArray(height*width*4);
			// 计算一维高斯核  --- 正态分布：f(x) = [1/(sigma*sqrt(2pi))]*e^[(-(x-origin)^2)/(2*sigma^2)];
			let ksize = value*2+1;
			let sigma = 0.3*[(ksize-1)*0.5-1]+0.8; // 利用opencv中的sigma算法
			let origin = value;
			let gauss_sum = 0;
			let kernel = [];
			let divisor = -2*Math.pow(sigma,2);
			for(let x=0; x<ksize; x++){
				kernel[x] = Math.exp(Math.pow(x-origin,2)/divisor);  // 结果需要归一化处理，e之前的可忽略
				// gauss_sum += kernel[x];
			}
			// for(let x=0; x<ksize; x++){ 
			// 	kernel[x] /= gauss_sum;
			// }
			// 图像卷积运算方法
			function convolution(n,m,getIndex){
				let gauss_sum = 0;
				let r,g,b;
				let x,image_index,kernel_index;
				for(let i=0; i<n; i++){
					for(let j=0; j<m; j++){
						r = g = b = gauss_sum = 0;
						for(let k=-origin; k<=origin; k++){
							x = j + k;
							if(x<0 || x>=m){
								continue;
							}
							image_index = getIndex(i,x);
							kernel_index = k + origin;
							r += data[image_index+0]*kernel[kernel_index];
							g += data[image_index+1]*kernel[kernel_index];
							b += data[image_index+2]*kernel[kernel_index];
							gauss_sum += kernel[kernel_index];
						}
						image_index = getIndex(i,j);
						tmpData[image_index+0] = r/gauss_sum;
						tmpData[image_index+1] = g/gauss_sum;
						tmpData[image_index+2] = b/gauss_sum;
						tmpData[image_index+3] = data[image_index+3];
					}
				}
				data.forEach((value,index,array)=>{
					array[index] = tmpData[index];
				});
			}
			// 对水平和垂直方向进行卷积计算 -- 高斯函数的可分离性
			convolution(height,width,(x,y)=>(x*width+y)*4); // 水平方向
			convolution(width,height,(x,y)=>(y*width+x)*4); // 垂直方向
			return true;
		},
		bilateralFilter:function(imageData,value = 10){	//双边滤波
			/*
				再高斯模糊的基础上加入灰度值的考虑
			*/
			let {data,width,height} = imageData;
			let tmpData = new Uint8ClampedArray(height*width*4);
			let grayDate = {data:new Uint8ClampedArray(data),width,height};
			this.grayScale(grayDate);
			let ksize = value*2+1;
			// let sigma_space = 0.3*[(ksize-1)*0.5-1]+0.8; 
			let origin = value;
			let sigma_space = 5;
			let sigma_color = 35;
			let divisor_color = -2*Math.pow(sigma_color,2);
			let divisor_space = -2*Math.pow(sigma_space,2);
			let color_weight = [];
			let gauss_kernel = [];
			for(let i=0; i<=255; i++){	 		// 灰度值预处理
				color_weight[i] = Math.exp(i*i/divisor_color);
			}
			for(let i=0; i<ksize; i++){			// 高斯模板
				for(let j=0; j<ksize; j++){
					gauss_kernel.push({
						x:i-origin,
						y:j-origin,
						value:Math.exp((Math.pow(i-origin,2)+Math.pow(j-origin,2))/divisor_space)
					});
				}	
			}
			let kernel_size = gauss_kernel.length;
			let image_index,kernel_index,x,y;
			let bilateral_sum = {r:0,g:0,b:0};
			let r,g,b,rw,gw,bw;
			for(let i=0; i<height; i++){	// 卷积
				for(let j=0; j<width; j++){
					bilateral_sum.r = 0;
					bilateral_sum.g = 0;
					bilateral_sum.b = 0;
					r = g = b = 0;
					image_index = (i*width+j)*4;
					for(let k=0; k<kernel_size; k++){
						x = i + gauss_kernel[k].x;
						y = j + gauss_kernel[k].y;
						if(x<0 || x>=height || y<0 || y>=width){
							continue;
						}
						kernel_index = (x*width+y)*4;
						rw = gauss_kernel[k].value*color_weight[Math.abs(data[image_index+0]-data[kernel_index+0])];
						gw = gauss_kernel[k].value*color_weight[Math.abs(data[image_index+1]-data[kernel_index+1])];
						bw = gauss_kernel[k].value*color_weight[Math.abs(data[image_index+2]-data[kernel_index+2])];
						r += data[kernel_index+0]*rw;
						g += data[kernel_index+1]*gw;
						b += data[kernel_index+2]*bw;
						bilateral_sum.r += rw;
						bilateral_sum.g += gw;
						bilateral_sum.b += bw;
					}
					tmpData[image_index+0] = r/bilateral_sum.r;
					tmpData[image_index+1] = g/bilateral_sum.g;
					tmpData[image_index+2] = b/bilateral_sum.b;
					tmpData[image_index+3] = data[image_index+3];
				}
			}
			console.log(data);
			data.forEach((value,index,array)=>{
				array[index] = tmpData[index];
			});
			console.log(data);
			return true;
		},
		mosaic:function(imageData,value=5){		//马赛克
			let {data,width,height} = imageData;
			let size = value;
			let tmpData = new Uint8ClampedArray(height*width*4);
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
							tmpData[index+0] = avgR;
							tmpData[index+1] = avgG;
							tmpData[index+2] = avgB;
							tmpData[index+3] = data[index+3];
						}
					}
				}
			}
			data.forEach((value,index,array)=>{
				array[index] = tmpData[index];
			});
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
		contrast:function(imageData,value=1){ //对比度
			/*
				对比度：保持图像平均亮度不变，使亮的更亮，暗的更暗。
				rgb = threshold + (rgb - threshold) * contrast
				减少运算量threshold取127
			*/
			value = Number.parseFloat(value);
			let {data,width,height} = imageData;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					data[index+0] = 127 + (data[index+0] - 127) * value;
					data[index+1] = 127 + (data[index+1] - 127) * value;
					data[index+2] = 127 + (data[index+2] - 127) * value;
				}
			}
			return true;
		},
		hsv:function(imageData,value = {rate:1,type:1}){	//色调、饱和度、亮度
			let {data,width,height} = imageData;
			let {rate,type} = value;
			let r,g,b,h,s,v;
			for(let i=0; i<height; i++){
				for(let j=0; j<width; j++){
					let index = (i*width+j)*4;
					r = data[index+0];
					g = data[index+1];
					b = data[index+2];
					[h,s,v] = rgbToHsv(r,g,b);
					if(type === 1){
						h = h*rate;
						h = h<=360?h:h-360;
					}else if(type === 2){
						s = (s*rate);
						s = s<=1?s:s-1;
					}else{
						v = (v*rate);
						v = v<=255?v:v-255;
					}
					[r,g,b] = hsvToRgb(h,s,v);
					data[index+0] = r;
					data[index+1] = g;
					data[index+2] = b;
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
	ImageLayer.PAINTBUCKET = "paintBucket";		// 油漆桶 -- 颜色替换

	/************* 属性和方法私有化 *************/
	const PRIVATE = {										
		/* 私有属性 */
		status:Symbol("status"),
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
		this.container = document.createElement('div'); 	//图像容器
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
		this[PRIVATE.status] = ImageLayer.FREEING;			//操作状态
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
		this.container.appendChild(this.imageArea);
		this.container.appendChild(this.operArea);
		this.parentNode.appendChild(this.container);
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

		this.baseInfo.historyLength = 0;

		if(isGlobalCanvasInit === false){ //第一次初始化，初始化全局画布
			this.parentNode.appendChild(GLOBAL_CANVAS);
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
			ImageLayer.globalInfo.rulerInfo = {
				sx:0,
				sy:0,
				dx:0,
				dy:0,
			};

		}
	}

	ImageLayer.prototype[PRIVATE.reset] = function(){ // 重置所有事件及标记

		/*** 重置操作区域的所有事件 ***/
		// this.operArea.onmousedown = null;
		// this.operArea.onmousemove = null;
		// this.operArea.onmouseup = null;
		// this.operArea.onmouseout = null;
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
		this[PRIVATE.status] = ImageLayer.FREEING;

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
		img.crossOrigin = 'anonymous'; // 跨域资源共享
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
	/************* 获取当前状态 *************/

	ImageLayer.prototype.getStatus = function(){
		return this[PRIVATE.status];
	}

	/************* 定义历史记录相关函数 *************/
	ImageLayer.prototype.getHistory = function(){
		return this[PRIVATE.history];
	}

	ImageLayer.prototype.getHistoryLength = function(){ //获取操作记录长度
		return this[PRIVATE.history].length;
	}

	ImageLayer.prototype.removeHistory = function(index = -1){ //删除历史记录
		if(!Number.isInteger(index) || index<-1 || index>= this[PRIVATE.history].length){
			return;
		}
		this[PRIVATE.history].splice(index+1,this.getHistoryLength());
		this.baseInfo.historyLength = this.getHistoryLength();
		this.baseInfo.imageData = this[PRIVATE.history][this.getHistoryLength()-1];
	}

	ImageLayer.prototype[PRIVATE.store] = function(){ //保存当前图像
		/**
		 *	1、data对象保存当前图像信息及位移
		 *	2、更新当前图像信息并将图像备份到临时区域
		 */
		let status = this[PRIVATE.status];
		
		let data = {
			imageData:this.imageCxt.getImageData(0,0,this.imageArea.width,this.imageArea.height),
			position:{x:this.imageArea.offsetLeft,y:this.imageArea.offsetTop},
			status:status,
		}
		this[PRIVATE.history].push(data);
		this[PRIVATE.saveRectInfo](data.position.x,data.position.y,this.imageArea.width,this.imageArea.height);
		this[PRIVATE.saveImage](); // 将当前图像在临时区域备份

		this.baseInfo.historyLength = this.getHistoryLength();
		this.baseInfo.imageData = this[PRIVATE.history][this.getHistoryLength()-1];
	}

	ImageLayer.prototype.restore = function(index = this[PRIVATE.history].length-1, remove = false){ //退回到第index次操作
		/**
		 *	1、是否为数字以及边界判断
		 *	2、取出第index次的数据，设置到图像显示区域及操作区域
		 *	3、更新当前图像信息并将图像备份到临时区域
		 *	4、重置所有相关标记
		 */
		if(!Number.isInteger(index) || index<0 || index>= this[PRIVATE.history].length){
			return;
		}
		
		if(remove === true){ // 清除多余记录
			this.removeHistory(index);
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
		if(this[PRIVATE.status] === ImageLayer.FREEING){
			return;
		}
		if(this[PRIVATE.status] === ImageLayer.CLIP){
			this.saveClipArea();
		}
		if(this[PRIVATE.status] === ImageLayer.IMAGEMATTING){
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
		if(!(this[PRIVATE.status]===ImageLayer.FREEING || this[PRIVATE.status] === ImageLayer.FILTER) && isUseInBrush === false){
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
				this[PRIVATE.status] = ImageLayer.FILTER;
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
		if(this[PRIVATE.status]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.status] = ImageLayer.TRANSFORM;
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
		if(!(this[PRIVATE.status]===ImageLayer.FREEING || this[PRIVATE.status] ===ImageLayer.TRANSFORM)){
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
		this[PRIVATE.status] = ImageLayer.TRANSFORM;
		this[PRIVATE.isClearImageArea] = true; 
		this[PRIVATE.scaleFlag] = true; //旋转后需要更新缩放里保存的备份图像
		updateRect(this);
	}

	ImageLayer.prototype.translate = function(x,y){ // 移动
		/**
		 *	将图像左上角移动到(x,y)点
		 */
		if(!(this[PRIVATE.status]===ImageLayer.FREEING || this[PRIVATE.status] ===ImageLayer.TRANSFORM)){
			return;
		}
		this[PRIVATE.x] = x;
		this[PRIVATE.y] = y;
		this[PRIVATE.saveRectInfo](x,y,this.imageArea.width,this.imageArea.height);
		this[PRIVATE.status] = ImageLayer.TRANSFORM;
		this[PRIVATE.rotateFlag] = true;
	}

	ImageLayer.prototype.scale = function(x,y,width,height){ // 缩放
		/**
		 *	1、一次缩放操作的开始先备份图像，确保一次缩放图像一致，避免图像变模糊
		 *  1、根据参数设置图像位移及大小
		 *	2、更新图层信息
		 *	3、将缩放后的图像备份，为旋转操作做准备
		 */
		if(!(this[PRIVATE.status]===ImageLayer.FREEING || this[PRIVATE.status] ===ImageLayer.TRANSFORM)){
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
		this[PRIVATE.status] = ImageLayer.TRANSFORM;
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
		if(this[PRIVATE.status] !== ImageLayer.CLIP){
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
		if(this[PRIVATE.status]!==ImageLayer.FREEING){
			return;
		}

		this[PRIVATE.status] = ImageLayer.CLIP;
		let that = this;
		GLOBAL_CANVAS.style.cursor = "crosshair";
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
				GLOBAL_CANVAS.style.cursor = "default";
				this.onmousedown = null;
				this.onmousemove = null;
				resizeRect(this);
			}
			this.onmouseout = function(){
				this.style.cursor = "default";
				GLOBAL_CANVAS.style.cursor = "default";
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
		if(this[PRIVATE.status]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.status] = ImageLayer.PANCIL;
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
		if(this[PRIVATE.status]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.status] = ImageLayer.MOSAIC;
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
		if(this[PRIVATE.status]!==ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.status] = ImageLayer.ERASER;
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
		if(this[PRIVATE.status] === ImageLayer.PANCIL){
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
		if(this[PRIVATE.status] !== ImageLayer.IMAGEMATTING){
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
		if(this[PRIVATE.status] !== ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.status] = ImageLayer.IMAGEMATTING;
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

	/************* 油漆桶 *************/
	function replaceColor(imageData,x,y,replace_color,offset){ 
		let re = /^#[a-fA-F\d]{6}$/;
		if(!re.test(replace_color)){
			return false;
		}
		let {width,height,data} = imageData;
		x = Math.floor(x);
		y = Math.floor(y);
		let [R,G,B] = replace_color.substring(1).match(/[a-fA-F\d]{2}/g); 
		R = Number.parseInt(R,16);
		G = Number.parseInt(G,16);
		B = Number.parseInt(B,16);
		let index = (y*width+x)*4;
		let grayColor = rgbToGray(data[index],data[index+1],data[index+2]); // 点击处灰度值
		let vis = Array.from({length:height},x=>Array.from({length:width}, y=>0)); // 访问标记
		let move_dir = [[0,1],[1,0],[0,-1],[-1,0]]; // 广搜方向
		let dir_nums = move_dir.length;
		let queue = [{x,y}];
		vis[y][x] = 1;
		
		while(queue.length > 0){
			let pos = queue.shift();
			// 替换颜色
			index = (pos.y*width+pos.x)*4;
			data[index] = R;
			data[index+1] = G;
			data[index+2] = B;

			for(let i=0; i<dir_nums; i++){
				let x = pos.x + move_dir[i][0];
				let y = pos.y + move_dir[i][1];
				index = (y*width+x)*4;
				let color = rgbToGray(data[index],data[index+1],data[index+2]);
				if(x>=0 && x<width && y>=0 && y<height && vis[y][x] !== 1 && color-offset<=grayColor && color+offset >= grayColor){
					queue.push({x,y});
					vis[y][x] = 1; // 打标记
				}
			}
		}
		return true;
	}

	ImageLayer.prototype.paintBucket = function(replace_color="#FFFFFF",offset=30){
		/**
		 *  通过GLOBAL_CANVAS代理鼠标事件
		 *	获取点击区域灰度值，利用广搜替换掉所有相似颜色
		 */
		if(this[PRIVATE.status] !== ImageLayer.FREEING){
			return;
		}
		this[PRIVATE.status] = ImageLayer.PAINTBUCKET;
		// console.log(replace_color,offset);
		offset = Number.parseInt(offset,10);
		this.operCxt.drawImage(this.imageArea,0,0);
		this.imageArea.style.display = "none";

		let that = this;
		let rectInfo = this[PRIVATE.rectInfo];
		function checkPoint(x,y){	// 判断点是否在图像上
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
			let imageData = that.operCxt.getImageData(0,0,rectInfo.width,rectInfo.height);

			if(replaceColor(imageData,x-rectInfo.x,y-rectInfo.y,replace_color,offset)){
				that.operCxt.putImageData(imageData,0,0);
			}
		}
	}

	/************* 移除图层 *************/
	ImageLayer.prototype.removeLayer = function(){
		this.parentNode.removeChild(this.container);
	}

	window.ImageLayer = ImageLayer;

})(window);
