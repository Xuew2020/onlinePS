/**
 * 在线图像处理页面配置
 * @author 薛望
 * 2020/07/21
 */

 let tools = {
 	imgArray:[],			//图层数组
 	currentImg:null,		//当前选中的图层
 	currentOper:null,

 	$ : function(el){
		return document.querySelectorAll(el);
	},

	bindEvent:function(){
		this.currentImgListerner();

		let that = this;

		let workplace = that.$("#contains")[0];
		workplace.style.width = workplace.getBoundingClientRect().width+"px";
		workplace.style.height = workplace.getBoundingClientRect().height+"px";
		that.$('#image-size')[0].textContent = `${workplace.getBoundingClientRect().width}*${workplace.getBoundingClientRect().height}px`;

		// 左侧快捷菜单栏
		that.$('#main-nav>ul>li').forEach((el,index,arrays)=>{
			el.addEventListener('click',function(){
				that.currentImg.restore();
				that.currentOper = index;
			});
		});
		

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
		that.$("#cz")[0].addEventListener('click',function(){
			
			initRoot();

			let cz_panel = root.querySelector('#cz-panel');

			if(!cz_panel){
				let template = that.$("#cz-template")[0];
				root.appendChild(template.content);
				template.remove();				

				let cz_start = root.querySelector("#cz-start");
				let cz_end = root.querySelector("#cz-end");
				that.rulerPosListerner(cz_start,cz_end);

			}else{
				cz_panel.style.display = "block";
			}
			let cz_dist = root.querySelector("#cz-dist");
			ImageLayer.ruler(that.currentImg,(dist)=>{
				cz_dist.value = dist.toFixed(4);
			});
			
		});

		// 滤镜

		let base_dir = "./pic/";
		let lj_styles = ["invert","grayscale","blur","sepia","mosaic"];
		let lj_names = ["反色","黑白","模糊","复古","马赛克"];
		let lj_imgsrc = ["nb.jpg","nb.jpg","nb.jpg","nb.jpg","nb.jpg"];
		that.$("#lj")[0].addEventListener('click',function(){
			
			initRoot();

			let lj_panel = root.querySelector('#lj-panel');

			if(!lj_panel){
				let template = that.$("#lj-template")[0];
				root.appendChild(template.content);
				template.remove();				

				lj_panel = root.querySelector('#lj-panel');
				lj_panel.querySelectorAll(".lj-style").forEach((el,index)=>{
					let img = el.querySelector("img");
					let name = el.querySelector("p");
					img.src = base_dir+lj_imgsrc[index];
					img.alt = lj_names[index];
					name.textContent = lj_names[index];
					el.addEventListener('click',function(){
						that.currentImg.filter(lj_styles[index]);
					});
				});

			}else{
				lj_panel.style.display = "block";
			}
			
		});

		// 模糊
		let mh_styles = ["blur","mosaic"];
		that.$("#mh")[0].addEventListener('click',function(){
			
			initRoot();

			let mh_panel = root.querySelector('#mh-panel');

			if(!mh_panel){
				let template = that.$("#mh-template")[0];
				root.appendChild(template.content);
				template.remove();				

				let mh_size = root.querySelector("#mh-size");
				mh_size.addEventListener('input',function(){
					ImageLayer.setBrushSize(this.value);
				});

				let mhs = root.querySelectorAll('#mh-panel>div:nth-of-type(n+3)');
				mhs.forEach((el,index,arrays)=>{
					el.addEventListener('click',function(){
						Array.prototype.some.call(arrays,(el,index)=>{
							if(el.classList.contains('active')){
								el.classList.remove('active');
								return true;
							}
						});
						el.classList.add("active");
						let value = Number.parseInt(root.querySelector("#mh-kernel").value);
						that.currentImg.mosaic(mh_styles[index],value);
					});
				});
			}else{
				mh_panel.style.display = "block";
			}
			
		});

		// 文本工具
		that.$("#wbgj")[0].addEventListener('click',function(){

			initRoot();
			let wbgj_panel = root.querySelector('#wbgj-panel');

			if(!wbgj_panel){
				let template = that.$("#wbgj-template")[0];
				root.appendChild(template.content);
				template.remove();	

				let wbgj_create = root.querySelector("#wbgj-create");	
				let wbgj_font_family = root.querySelector("#wbgj-font-family");	
				let wbgj_font_weight = root.querySelector("#wbgj-font-weight");
				let wbgj_text_style = root.querySelector("#wbgj-text-style");
				let wbgj_text_size = root.querySelector("#wbgj-text-size");
				let wbgj_text_color = root.querySelector("#wbgj-text-color");

				wbgj_create.addEventListener('click',function(){
					that.textLoad(workplace);
				});
				wbgj_font_family.addEventListener('change',function(){
					TextLayer.setFontFamliy(that.currentImg,this.value);
				});
				wbgj_font_weight.addEventListener('change',function(){
					TextLayer.setFontWeight(that.currentImg,this.value);
				});
				wbgj_text_style.addEventListener('change',function(){
					TextLayer.setFontStyle(that.currentImg,this.value);
				});
				wbgj_text_size.addEventListener('input',function(){
					TextLayer.setFontSize(that.currentImg,this.value);
				});
				wbgj_text_color.addEventListener('input',function(){
					TextLayer.setFontColor(that.currentImg,this.value);
				});

			}else{
				wbgj_panel.style.display = "block";
			}
		
		});

		// 绘图工具
		let htgj_styles = ["rectangle","circle","curveGraph"];
		that.$("#htgj")[0].addEventListener('click',function(){
			
			initRoot();
			let htgj_panel = root.querySelector('#htgj-panel');

			if(!htgj_panel){
				let template = that.$("#htgj-template")[0];
				root.appendChild(template.content);
				template.remove();	

				root.querySelectorAll('#htgj-panel>div').forEach((el,index)=>{
					el.addEventListener('click',function(){
						that.graphLoad(workplace,htgj_styles[index]);
					});
				});

			}else{
				htgj_panel.style.display = "block";
			}
			
		});


	},

	/* 添加图层列表 */
	addLayer:function(name,mode){
		let workplace = this.$("#contains")[0];
		let info = workplace.getBoundingClientRect();

		let imglist = this.$('#layer-content>ul')[0];

		// 创建节点
		let li = document.createElement('li');
		li.setAttribute("data-index",this.imgArray.length-1);
		let showspan = document.createElement("span");
		showspan.className = "iconfont show-canvas icon-yanjing";
		let canvas = document.createElement('canvas');
		canvas.width = 42;
		canvas.height = 26;
		if(mode === 1){
			this.imageChangeListerner(canvas,info.width,info.height);
		}else{
			let cxt = canvas.getContext('2d');
			let img = new Image();
			let padding = 3;
			if(mode === 2){
				img.src = "./src/images/wb.png";
			}else{
				img.src = "./src/images/ht.png";
			}
			img.onload = function(){
				cxt.drawImage(img,padding,padding,canvas.width-2*padding,canvas.height-2*padding);
			}
		}
		let div = document.createElement("div");
		div.className = "canvas-name";
		div.textContent = name;
		let delspan = document.createElement("span");
		delspan.className = "iconfont del-canvas icon-lajitong";

		li.appendChild(showspan);
		li.appendChild(canvas);
		li.appendChild(div);
		li.appendChild(delspan);
		imglist.insertBefore(li,imglist.firstElementChild);

		// 添加事件
		let that = this;
		li.addEventListener('click',function(){
			that.$('#layer-content>ul>li').forEach((el)=>{
				el.classList.remove('active');
			});
			this.classList.add('active');
			that.currentImg = that.imgArray[this.getAttribute('data-index')];
		});
		showspan.addEventListener('click',function(e){
			e = e || window.event;
			e.stopPropagation();
			let container = that.imgArray[this.parentElement.getAttribute("data-index")].container;
			if(container.style.display !== "none"){
				container.style.display = "none";
				this.style.color = "#9E9E9E";
			}else{
				container.style.display = "block";
				this.style.color = "white";
			}
		});
		delspan.addEventListener('click',function(e){
			e = e || window.event;
			e.stopPropagation();
			that.$('#warning')[0].showModal();
		});
		li.click();
	},

	/* 添加操作记录 */
	addHistory:function(history){
		// <li><span>截图</span><span class="iconfont">&#xe634;</span></li>
		let historyList = this.$('#history-content>ul')[0];
		let currentHistory = this.$('#history-content>ul>li');
		let historyLength = history.length;
		let currentHistoryLength = currentHistory.length;
	
		let opers = {
			"freeing":{"name":"创建图层","icon":"icon-jiahaozengjia"},
			"filter":{"name":"滤镜","icon":"icon-lvjing1"},
			"transform":{"name":"图像变换","icon":"icon-yidong"},
			"clip":{"name":"裁剪","icon":"icon-jietu"},
			"pancil":{"name":"画笔","icon":"icon-huabi1"},
			"mosaic":{"name":"模糊","icon":"icon-lvjing"},
			"eraser":{"name":"橡皮擦","icon":"icon-xiangpica"},
			"ruler":{"name":"尺子","icon":"icon-chizi"},
			"straw":{"name":"拾色器","icon":"icon-xiguan"},
			"imagematting":{"name":"抠图","icon":"icon-koutu"},
			"1":{"name":"图像增强","icon":"icon-tiaozheng"}, // 图像增强
		};

		let that = this;

		// 创建记录
		function create(data,index){

			let li = document.createElement("li");
			let spanName = document.createElement("span");
			let spanIcon = document.createElement("span");
			if(that.currentOper === 1){
				spanName.textContent = opers["1"].name;
				spanIcon.className = `iconfont ${opers["1"].icon}`;
			}else{
				spanName.textContent = opers[data.state].name;
				spanIcon.className = `iconfont ${opers[data.state].icon}`;
			}

			li.appendChild(spanName);
			li.appendChild(spanIcon);
			historyList.appendChild(li);

			// 添加事件
			// 选择 this.$('history-content>ul>li')

			li.addEventListener('click',function(){
				that.$('#history-content>ul>li').forEach((el)=>{
					el.classList.remove('active');
				});
				this.classList.add('active');

				that.currentImg.restore(index);

			});
		}

		if(historyLength<currentHistoryLength){ // 清除多余历史记录
			for(let i=historyLength; i<currentHistoryLength; i++){
				currentHistory[i].remove();
			}
		}else{
			for(let i=currentHistoryLength; i<historyLength; i++){
				create(history[i],i);
				if(i == historyLength-1){
					this.$('#history-content>ul>li')[i].click();
					this.$('#history-content>ul>li')[i].scrollIntoViewIfNeeded();
				}
			}
		}

	},

	clearHistoryList:function(){
		let historyList = this.$('#history-content>ul')[0];
		while(historyList.hasChildNodes()) 
	　　{
			historyList.removeChild(historyList.firstChild);
	　　}
	},

	/* 加载图片到工作区 */
	imgLoad:function(el,src){

		let reader = new FileReader();
		reader.readAsDataURL(src);
		reader.onload = ()=>{
			this.currentImg = new ImageLayer(el);
			this.currentImg.load(reader.result);
			this.imgArray.push(this.currentImg);
			this.addLayer(src.name,1);
			this.clearHistoryList();
			this.historyListerner();
		}
	},
	textLoad:function(el){
		this.currentImg = new TextLayer(el);
		this.imgArray.push(this.currentImg);
		this.addLayer("文本",2);
	},
	graphLoad:function(el,type){
		if(!GraphLayer.prototype.hasOwnProperty(type)){
			return;
		}
		this.currentImg = new GraphLayer(el);
		this.currentImg[type]();
		this.imgArray.push(this.currentImg);
		this.addLayer("绘图",3);
	},

	/* 监听当前选中图层变化 */
	currentImgListerner:function(){

		let that = this;
		Object.defineProperty(that,'currentImg',{
			set:function(value){

				if(that.currentImg !== undefined && value !== that.currentImg){
					if(that.currentImg instanceof ImageLayer){
						that.currentImg.restore();
					}else{
						that.currentImg.layerDown();
					}
				}
				this._value = value;
				that.clearHistoryList();
				if(that.currentImg instanceof ImageLayer){
					// that.clearHistoryList();
					that.addHistory(that.currentImg.getHistory());
				}else{
					that.currentImg.layerUp();
				}
			},
			get:function(){
				return this._value;
			}
		})
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

	/* 监听尺子坐标变换 */
	rulerPosListerner:function(pos_st,pos_ed){
		Object.defineProperties(ImageLayer.globalInfo.rulerInfo,{
			sx:{
				set:function(value){
					this._value = value;
					pos_st.value = pos_st.value.replace(/(?<=\()\d+(?=,)/,value);
				},
				get:function(){
					return this._value;
				}
			},
			sy:{
				set:function(value){
					this._value = value;
					pos_st.value = pos_st.value.replace(/(?<=,)\d+(?=\))/,value);
				},
				get:function(){
					return this._value;
				}
			},
			dx:{
				set:function(value){
					this._value = value;
					pos_ed.value = pos_ed.value.replace(/(?<=\()\d+(?=,)/,value);
				},
				get:function(){
					return this._value;
				}
			},
			dy:{
				set:function(value){
					this._value = value;
					pos_ed.value = pos_ed.value.replace(/(?<=,)\d+(?=\))/,value);
				},
				get:function(){
					return this._value;
				}
			},
		});
	},

	// 监听图像变化
	imageChangeListerner:function(el,width,height){
		let canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		let cxt = canvas.getContext("2d");
		let el_cxt = el.getContext("2d");
		Object.defineProperty(this.currentImg.baseInfo,'imageData',{
			set:function(value){
				// console.log(value);
				cxt.clearRect(0,0,width,height);
				cxt.putImageData(value.imageData,value.position.x,value.position.y);
				el_cxt.clearRect(0,0,el.width,el.height);
				el_cxt.drawImage(canvas,0,0,el.width,el.height);
			}
		});
	},

	// 监听操作记录
	historyListerner:function(){
		let that = this;
		Object.defineProperty(this.currentImg.baseInfo,'historyLength',{
			set:function(value){
				// console.log(value);
				that.addHistory(that.currentImg.getHistory());
			}
		});
	},

 };