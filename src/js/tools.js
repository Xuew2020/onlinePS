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

		// 图像变换
		that.$("#txbh")[0].addEventListener('click',function(){
			that.currentImg.transform();
		});

		// 图像增强

		// 剪切

		// 抠图

		// 拾色器

		// 画笔

		// 橡皮擦

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
			// console.log(Images);
			this.imgAttrListener();
		}
	},

	/* 监听图像属性变化 */
	imgAttrListener:function(){

		Object.defineProperties(this.currentImg.baseInfo,{
			x:{
				set:function(value){
					console.log("x:"+value);
				}
			},
			y:{
				set:function(value){
					console.log("y:"+value);
				}
			},
			width:{
				set:function(value){
					console.log("width:"+value);
				}
			},
			height:{
				set:function(value){
					console.log("height:"+value);
				}
			},
			rotateAngle:{
				set:function(value){
					console.log("rotateAngle:"+value);
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