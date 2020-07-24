/**
 * 在线图像处理页面配置
 * @author 薛望
 * 2020/07/21
 */

 let tools = {
 	imgArray:[],			//图层数组
 	currentImg:null,		//当前选中的图层

 	$ : function(el){
		return document.querySelectorAll(el);
	},

	bindEvent:function(){

		let that = this;

		let workplace = that.$("#contains")[0];
		workplace.style.width = workplace.getBoundingClientRect().width+"px";
		workplace.style.height = workplace.getBoundingClientRect().height+"px";
		

		// 打开本地图片
		that.$("input[name=imageFile]")[0].addEventListener('change',function(){
			that.imgLoad(workplace,this.files[0]);
		});

		//	撤销/确定 
		that.$('#main-panel-oper>button')[0].addEventListener('click',function(){
			that.currentImg.restore();
		});

		that.$('#main-panel-oper>button')[1].addEventListener('click',function(){
			that.currentImg.resolve();
		});


		// 影子根初始化 --- 面板内容
		let root = that.$("#main-panel-content")[0].attachShadow({mode:'open'});
		let link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "src/css/template.css";
		root.appendChild(link);
		link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = "src/css/iconfont.css";
		root.appendChild(link);

		// 清理面板
		function initRoot(){
			console.log(root.querySelectorAll('.panel'));
			root.querySelectorAll('.panel').forEach((el)=>{
				el.style.display = "none";
			});
		}

		// 图像变换

		that.$("#txbh")[0].addEventListener('click',function(){
			that.currentImg.transform();

			// 设置面板内容
			initRoot();

			let txhb_pannel = root.querySelector("#txhb-panel");
			let info = that.currentImg.baseInfo; // 图像基本信息
			if(!txhb_pannel){
				let template = that.$("#txbh-template")[0];
				root.appendChild(template.content);
				template.remove();

				let img_width = root.querySelector("#img-width");
				let img_height = root.querySelector("#img-height");
				let rotateAngle = root.querySelector("#rotateAngle");
				let img_posX = root.querySelector("#img-posX");
				let img_posY = root.querySelector("#img-posY");

				that.imgAttrListener(img_posX,img_posY,img_width,img_height,rotateAngle);

			}else{
				txhb_pannel.style.display = "block";
			}
			// console.log(info);
			// root.querySelector("#img-width").value = info.width;
			// root.querySelector("#img-height").value = info.height;
			// root.querySelector("#rotateAngle").value = info.rotateAngle;
			// root.querySelector("#img-posX").value = info.x;
			// root.querySelector("#img-posY").value = info.y;
		});

		// 图像增强
		that.$("#txzq")[0].addEventListener('click',function(){

			initRoot();

			let txzq_panel = root.querySelector('#txzq-panel');
			if(!txzq_panel){
				let template = that.$("#txzq-template")[0];
				root.appendChild(template.content);
				template.remove();

				// 亮度
				root.querySelector("#brightness").addEventListener('input',function(){
					that.currentImg.filter('brightness',this.value);
				});

				// 透明度
				root.querySelector("#opacity").addEventListener('input',function(){
					that.currentImg.filter('opacity',this.value);
				});

			}else{
				txzq_panel.style.display = "block";
			}
		});

		// 剪切
		that.$("#jq")[0].addEventListener('click',function(){

			that.currentImg.clip();

			initRoot();
			let jq_panel = root.querySelector('#jq-panel');

			if(!jq_panel){
				let template = that.$("#jq-template")[0];
				root.appendChild(template.content);
				template.remove();

				let jq_width = root.querySelector("#jq-width");
				let jq_height = root.querySelector("#jq-height");
				let jq_posX = root.querySelector("#jq-posX");
				let jq_posY = root.querySelector("#jq-posY");
				that.clipAreaListerner(jq_posX,jq_posY,jq_width,jq_height);
			}else{
				jq_panel.style.display = "block";
			}
		});

		// 抠图
		that.$("#kt")[0].addEventListener('click',function(){
			
			initRoot();
			let jq_panel = root.querySelector('#kt-panel');

			if(!jq_panel){
				let template = that.$("#kt-template")[0];
				root.appendChild(template.content);
				template.remove();

				let kts = root.querySelectorAll('#kt-panel>div');
				let opers = ["imageMatting"];
				kts.forEach((el,index,arrays)=>{
					el.addEventListener('click',function(){
						Array.prototype.some.call(arrays,(el)=>{
							if(el.classList.contains('active')){
								el.classList.remove('active');
								return true;
							}
						});
						el.classList.add("active");
						that.currentImg[opers[index]]();
					});

				});

			}else{
				jq_panel.style.display = "block";
			}
		});

		// 拾色器
		that.$("#ssq")[0].addEventListener('click',function(){
			
			initRoot();
			let ssq_panel = root.querySelector('#ssq-panel');

			if(!ssq_panel){
				let template = that.$("#ssq-template")[0];
				root.appendChild(template.content);
				template.remove();				

			}else{
				ssq_panel.style.display = "block";
			}
			let ssq_posX = root.querySelector("#ssq-posX");
			let ssq_posY = root.querySelector("#ssq-posY");
			let ssq_color = root.querySelector("#ssq-color");
			ImageLayer.straw(that.currentImg,that.imgArray,(x,y,hex)=>{
				ssq_posX.value = x;
				ssq_posY.value = y;
				ssq_color.value = hex;
			});
		});
		// 画笔
		that.$("#hb")[0].addEventListener('click',function(){
			
			that.currentImg.pancil();
			initRoot();

			let hb_panel = root.querySelector('#hb-panel');

			if(!hb_panel){
				let template = that.$("#hb-template")[0];
				root.appendChild(template.content);
				template.remove();				

				let hb_size = root.querySelector("#hb-size");
				let hb_color = root.querySelector("#hb-color");
				hb_size.addEventListener('input',function(){
					ImageLayer.setBrushSize(this.value);
				});
				hb_color.addEventListener('input',function(){
					ImageLayer.setBrushColor(this.value);
				});

			}else{
				hb_panel.style.display = "block";
			}
			
		});

		// 橡皮擦
		that.$("#xpc")[0].addEventListener('click',function(){
			
			that.currentImg.eraser(0.3);
			initRoot();

			let xpc_panel = root.querySelector('#xpc-panel');

			if(!xpc_panel){
				let template = that.$("#xpc-template")[0];
				root.appendChild(template.content);
				template.remove();				

				let xpc_size = root.querySelector("#xpc-size");
				let xpc_power = root.querySelector("#xpc-power");
				xpc_size.addEventListener('input',function(){
					ImageLayer.setBrushSize(this.value);
				});
				xpc_power.addEventListener('change',function(){
					that.currentImg.resolve();
					that.currentImg.eraser(1 - this.value);
				});

			}else{
				xpc_panel.style.display = "block";
			}
			
		});

		// 尺子

		// 滤镜

		// 模糊

		// 文本工具

		// 绘图工具


	},

	/* 加载图片到工作区 */
	imgLoad:function(el,src){
		let reader = new FileReader();
		reader.readAsDataURL(src);
		reader.onload = ()=>{
			this.currentImg = new ImageLayer(el);
			this.currentImg.load(reader.result);
			this.imgArray.push(this.currentImg);
		
		}
	},

	/* 监听图像属性变化 */

	imgAttrListener:function(el_x,el_y,el_width,el_height,el_rotate){

		Object.defineProperties(this.currentImg.baseInfo,{
			x:{
				set:function(value){
					this._value = value;
					el_x.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			y:{
				set:function(value){
					this._value = value;
					el_y.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			width:{
				set:function(value){
					this._value = value;
					el_width.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			height:{
				set:function(value){
					this._value = value;
					el_height.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			rotateAngle:{
				set:function(value){
					this._value = value;
					el_rotate.value = value;
				},
				get:function(){
					return this._value;
				}
			}
		});
	},

	//监听截图区域属性变换
	clipAreaListerner:function(el_x,el_y,el_width,el_height){
		Object.defineProperties(ImageLayer.globalInfo.clipRect,{
			x:{
				set:function(value){
					this._value = value;
					el_x.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			y:{
				set:function(value){
					this._value = value;
					el_y.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			width:{
				set:function(value){
					this._value = value;
					el_width.value = value;
				},
				get:function(){
					return this._value;
				}
			},
			height:{
				set:function(value){
					this._value = value;
					el_height.value = value;
				},
				get:function(){
					return this._value;
				}
			}
		});
	},

	// 监听控件样式变换
	styleListener:function(el,callback){
		let MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
		let observer = new MutationObserver(callback);
		observer.observe(el,{attributes:true,attributeFilter:['style'],attributeOldValue:true});
	}
 };