(function (window) {
	"use strict"

	const PATH = []; 			//存放路径
	let radius = 5;				//顶点半径
	let color = "red";			//默认颜色红色
	function operPoint(x, y) {
		this.x = x;
		this.y = y;
	}
	operPoint.prototype.draw = function (canvas, r = radius, color = "#ffffff") {
		let cxt = canvas.getContext('2d');
		cxt.save();
		cxt.beginPath();
		cxt.arc(this.x, this.y, r, 0, 2 * Math.PI);
		cxt.fillStyle = color;
		cxt.closePath();
		cxt.fill();
		// cxt.stroke();
		cxt.restore();
	}

	operPoint.drawPath = function (canvas) {
		let cxt = canvas.getContext('2d');
		cxt.beginPath();
		PATH.forEach((value) => {
			cxt.lineTo(value.x, value.y);
		});
		cxt.closePath();
		cxt.fillStyle = color;
		cxt.fill();
	}

	function move(canvas, check, draw) {

		canvas.onmousedown = function (e) {
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let oldX = e.clientX - info.x;
			let oldY = e.clientY - info.y;
			if (check(this, oldX, oldY)) {
				this.style.cursor = "move";
				this.onmousemove = function (e) {
					let newX = e.clientX - info.x;
					let newY = e.clientY - info.y;
					let offsetX = newX - oldX;
					let offsetY = newY - oldY;
					[oldX, oldY] = [newX, newY];
					PATH.forEach(function (value, index, array) {
						array[index].x += offsetX;
						array[index].y += offsetY;
					});

					this.getContext('2d').clearRect(0, 0, this.width, this.height);
					draw(); // 绘制
				}
			}
			this.onmouseup = function () {
				this.onmousemove = null;
				this.style.cursor = "default";
			}
			this.onmouseout = function () {
				this.onmousemove = null;
				this.style.cursor = "default";
			}
		}
	}

	function isInPath(canvas, x, y) {

		let cxt = canvas.getContext("2d");
		cxt.beginPath();
		PATH.forEach((value) => {
			cxt.lineTo(value.x, value.y);
		});
		cxt.closePath();
		if (cxt.isPointInPath(x, y)) {
			return true;
		}
		return false;
	}

	function isInCircle(r) {
		return function (canvas, x, y) {
			let cxt = canvas.getContext("2d");
			cxt.beginPath();
			cxt.arc(PATH[0].x, PATH[0].y, r, 0, 2 * Math.PI);
			if (cxt.isPointInPath(x, y)) {
				return true;
			} else {
				return false;
			}
		}
	}

	/************* 属性和方法私有化 *************/
	const PRIVATE = {
		status: Symbol("status"),
	};

	/************* 几何图形构造函数 *************/
	function GraphLayer(parentNode) {
		this.parentNode = parentNode;
		this.container = document.createElement('div'); 	//图像容器
		this.graphArea = document.createElement("canvas");	//画布
		this.graphCxt = this.graphArea.getContext("2d");
		this[PRIVATE.status] = false;  // 画布状态 --- 是否绘制了图形

		/*** 初始化 ***/
		this.parentNode.style.position = "relative";
		let parentInfo = this.parentNode.getBoundingClientRect();
		this.graphArea.width = parentInfo.width;
		this.graphArea.height = parentInfo.height;
		this.graphArea.style.position = "absolute";
		this.graphArea.style.left = "0";
		this.graphArea.style.top = "0";
		this.graphArea.style.zIndex = "1001";
		this.container.appendChild(this.graphArea);
		this.parentNode.appendChild(this.container);


	}

	//************* 绘制几何图形 *************/
	GraphLayer.prototype.rectangle = function () { //矩形
		if (this[PRIVATE.status] === true) {
			return;
		}
		this[PRIVATE.status] = true;
		PATH.splice(0, PATH.length);
		this.graphArea.onmousedown = function (e) {
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;

			PATH.push(new operPoint(x, y));
			PATH.push(new operPoint(x, y));
			PATH.push(new operPoint(x, y));
			PATH.push(new operPoint(x, y));

			this.onmousemove = function (e) {
				e = e || window.event;
				let x = e.clientX - info.x;
				let y = e.clientY - info.y;

				PATH[2].x = x;
				PATH[2].y = y;
				PATH[1].x = x;
				PATH[3].y = y;
				operPoint.drawPath(this);
			}

			let nextOper = () => {
				this.onmousemove = null;
				this.onmousedown = null;
				this.onmouseup = null;
				this.onmouseout = null;
				move(this, isInPath, operPoint.drawPath.bind(null, this));
			}
			this.onmouseup = nextOper;
			this.onmouseout = nextOper;
		}
	}

	GraphLayer.prototype.circle = function () {	// 圆形
		if (this[PRIVATE.status] === true) {
			return;
		}
		this[PRIVATE.status] = true;
		PATH.splice(0, PATH.length);

		this.graphArea.onmousedown = function (e) {
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let oldX = e.clientX - info.x;
			let oldY = e.clientY - info.y;

			PATH.push(new operPoint(oldX, oldY));
			PATH.radius = 0; // 存放半径，输出图形时计算外接矩形

			let dist = 0;
			this.onmousemove = function (e) {
				e = e || window.event;
				let newX = e.clientX - info.x;
				let newY = e.clientY - info.y;
				dist = Math.sqrt((newX - oldX) ** 2 + (newY - oldY) ** 2);
				this.getContext('2d').clearRect(0, 0, this.width, this.height);
				PATH.radius = dist;
				PATH[0].draw(this, dist, color);

			}

			let nextOper = () => {
				this.onmousemove = null;
				this.onmousedown = null;
				this.onmouseup = null;
				this.onmouseout = null;
				move(this, isInCircle(dist), PATH[0].draw.bind(PATH[0], this, dist, color));
			}
			this.onmouseup = nextOper;
			this.onmouseout = nextOper;
		}
	}

	GraphLayer.prototype.curveGraph = function () { //自由绘制曲线图形
		if (this[PRIVATE.status] === true) {
			return;
		}
		this[PRIVATE.status] = true;
		PATH.splice(0, PATH.length);

		let interval = 3; // 间隔
		let that = this;
		this.graphArea.onmousedown = function (e) {
			let info = this.getBoundingClientRect();
			e = e || window.event;
			let x = e.clientX - info.x;
			let y = e.clientY - info.y;

			PATH.push(new operPoint(x, y));

			that.graphCxt.save();
			that.graphCxt.beginPath();

			that.graphCxt.moveTo(x, y);

			this.onmousemove = function (e) {
				e = e || window.event;
				let x = e.clientX - info.x;
				let y = e.clientY - info.y;
				let dist = Math.sqrt((PATH[PATH.length - 1].x - x) ** 2 + (PATH[PATH.length - 1].y - y) ** 2);
				if (dist >= interval) {
					PATH.push(new operPoint(x, y));
					that.graphCxt.lineTo(x, y);
					that.graphCxt.stroke();
				}
			}

			let nextOper = () => {
				this.onmousemove = null;
				this.onmousedown = null;
				this.onmouseup = null;
				this.onmouseout = null;
				that.graphCxt.clearRect(0, 0, this.width, this.height);
				operPoint.drawPath(this);
				move(this, isInPath, operPoint.drawPath.bind(null, this));
			}
			this.onmouseup = nextOper;
			this.onmouseout = nextOper;
		}

	}

	GraphLayer.prototype.pen = function () {	//钢笔工具

	}


	/************* 导出图像信息 *************/

	GraphLayer.prototype.toImageData = function () {
		if (this[PRIVATE.status] !== true) {
			return;
		}

		let margin = 2; //保留边距
		/** 计算外接矩形 **/
		let rectInfo = {};
		if (typeof PATH.radius === "number") {	//圆形的情况
			rectInfo.x = PATH[0].x - PATH.radius;
			rectInfo.y = PATH[0].y - PATH.radius;
			rectInfo.width = 2 * PATH.radius;
			rectInfo.height = 2 * PATH.radius;
			delete PATH.radius;

		} else {								//其他图形
			let minX = this.graphArea.width;
			let minY = this.graphArea.height;
			let maxX = 0, maxY = 0;

			PATH.forEach((point) => {
				minX = minX < point.x ? minX : point.x;
				minY = minY < point.y ? minY : point.y;
				maxX = maxX > point.x ? maxX : point.x;
				maxY = maxY > point.y ? maxY : point.y;
			});
			rectInfo.x = minX;
			rectInfo.y = minY;
			rectInfo.width = maxX - minX;
			rectInfo.height = maxY - minY;
		}
		/** 补充边距 **/
		rectInfo.x -= margin;
		rectInfo.y -= margin;
		rectInfo.width += 2 * margin;
		rectInfo.height += 2 * margin;

		let image = document.createElement('canvas');
		let imageCxt = image.getContext('2d');
		image.width = rectInfo.width;
		image.height = rectInfo.height;
		let imageData = this.graphCxt.getImageData(rectInfo.x, rectInfo.y, rectInfo.width, rectInfo.height);
		imageCxt.putImageData(imageData, 0, 0);

		this.parentNode.removeChild(this.container); //移除图形

		return { url: image.toDataURL("image/png"), rectInfo };

	}

	/************* 图层上浮/下沉 *************/

	GraphLayer.prototype.layerUp = function () {
		this.graphArea.style.zIndex = "1001";
	}

	GraphLayer.prototype.layerDown = function () {
		this.graphArea.style.zIndex = "0";
	}

	/************* 移除图层 *************/
	GraphLayer.prototype.removeLayer = function () {
		this.parentNode.removeChild(this.container);
	}

	window.GraphLayer = GraphLayer;
})(window);