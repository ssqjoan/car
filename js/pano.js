
$(function(){
	$(".video-btn").on("click",function(){
		$(".video").fadeIn();
	});
	$(".video-close").on("click",function(){
		$(".video").fadeOut();
	});
	$(".tabs span").on("click",function(){
		$(".tabs").find("span").removeClass('on');
		$(this).addClass("on");
		changeTabs($(this).attr("type"));
	});
});

let value = 0;
setLoadingText();
function setLoadingText(){
	value++;
	if(value > 99){
		return false;
	}else{
		$(".loading .bar b").html(value+"%");
		$(".loading .bar span i").css({"width":value+'%'});
		setTimeout(()=>{
			setLoadingText();
		},50);
	}
}

// three
import * as THREE from './three/three.module.js';

import { OrbitControls } from './three/OrbitControls.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { DRACOLoader } from './three/DRACOLoader.js';
import { RGBELoader } from './three/RGBELoader.js';

import { TWEEN } from './three/tween.module.min.js';
let down,move,up,isdrag,addpoint,helperArr=[],modelobj=[];//用于设置标点，和实际功能没有关系
let camera, scene, renderer;
let controls;
let pointArr = [],pointobj=null;//存储标点对象
let mixers = [],action=[],actionstatus=[],clock = new THREE.Clock(),play=false;//车门动画
let cmarr = ['zhcm','zqcm','yhcm','yqcm'];
let type = "wg";//外观wg,性能xn,空间kj,内饰ns
let bodyMaterial,detailsMaterial,glassMaterial;

const wheels = [];
function init() {

	const container = document.getElementById( 'car' );

	renderer = new THREE.WebGLRenderer( { antialias: true} );
	renderer.setPixelRatio( window.devicePixelRatio );
	let vmax = window.innerWidth;
	let vmin = window.innerHeight;
	if(vmax < vmin){
		vmax = window.innerHeight;
		vmin = window.innerWidth;
	}
	renderer.setSize( vmax, vmin );
	renderer.setAnimationLoop( render );
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 0.85;
	container.appendChild( renderer.domElement );

	camera = new THREE.PerspectiveCamera( 40, vmax / vmin, 0.1, 100 );
	// camera.position.set( 4.25, 1.4, -4.5 );
	camera.position.set( -3.800, 1.329, -4.897 );


	controls = new OrbitControls( camera, container );
	controls.enableDamping = true;
	// controls.enableRotate = false; //禁止旋转
	controls.enablePan = false; //禁止平移
	// controls.enableZoom = false；//禁止缩放
	// control.addEventListener('change', render);
	// 上下旋转范围
	controls.minPolarAngle = 0;
	controls.maxPolarAngle = Math.PI/2;
	// 左右旋转范围
	// controls.minAzimuthAngle = -Math.PI * (100 / 180);
	// controls.maxAzimuthAngle = Math.PI * (100 / 180);
	controls.minDistance = 4;//相机距离观察目标点极小距离——模型最大状态
	controls.maxDistance = 9;//相机距离观察目标点极大距离——模型最小状态
	controls.target.set( 0, 0.8, 0 );
	controls.update();

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x000000 );

	// scene.environment = new RGBELoader().load( 'obj/venice_sunset_1k.hdr' );
	// scene.environment.mapping = THREE.EquirectangularReflectionMapping;
	// scene.fog = new THREE.Fog( 0x333333, 10, 15 );


	const pmremGenerator = new THREE.PMREMGenerator(renderer); // 使用hdr作为背景色
	pmremGenerator.compileEquirectangularShader();
	new RGBELoader()
    .load('obj/venice_sunset_1k.hdr', function (texture) {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        //envMap.isPmremTexture = true;
        pmremGenerator.dispose();

        scene.environment = envMap; // 给场景添加环境光效果
        //scene.background = envMap; // 给场景添加背景图
    });

	// materials

	bodyMaterial = new THREE.MeshPhysicalMaterial( {
		color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5
	} );

	detailsMaterial = new THREE.MeshStandardMaterial( {
		color: 0xffffff, metalness: 1.0, roughness: 0.5
	} );

	glassMaterial = new THREE.MeshPhysicalMaterial( {
		color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
	} );


	loadBackground('images/pano.jpg',renderer);

	initMouseControl();
	// Car


	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath( './three/gltf/' );

	const loader = new GLTFLoader();
	loader.setDRACOLoader( dracoLoader );

	let promiseArr = [
		loadGlb('zhcm',loader,0),
		loadGlb('zqcm',loader,1),
		loadGlb('yhcm',loader,2),
		loadGlb('yqcm',loader,3),
		loadGlb('zqlt',loader,4),
		loadGlb('zqlt',loader,5,{x:1.335, y:0.373239219, z:0.800189555}),
		loadGlb('zqlt',loader,6,{x:-1.43928957,y:0.373239219,z:-0.812},{x:0,y:3.14,z:0}),
		loadGlb('zqlt',loader,7,{x:1.335,y:0.373239219,z:-0.812},{x:0,y:3.14,z:0}),
		loadGlb('hbx',loader,8),
		loadGlb('ck',loader,9),
		//loadGlb('bg',loader,11),
		// loadBody(loader,shadow),
		// loadIn(loader,shadow),
		// loadWheels(loader,shadow)
	];
	Promise.all(promiseArr).then((values) => {
      let valid = values.indexOf(false) == -1;
      if(valid){
      	$(".loading .bar b").html("99%");
      	if(pointData){
      		for(var key in pointData){
      			let thistype = pointData[key].type;
      			let status = thistype == type ? true : false;
      			loadPoint(pointData[key],status);
      		};
		}
		console.log("mixers:::::",mixers);
      	setTimeout(()=>{
      		$(".loading").hide();
      	},100);
      }
      console.log(valid);
    });
}

function loadGlb(name,loader,index,position,rotation){
	return new Promise((resolve, reject) => {
		loader.load( 'obj/'+name+'.glb', function ( gltf ) {
			const carModel = gltf.scene.children[ 0 ];
			// console.log("polySurface288::::",carModel.getObjectByName( 'polySurface288' ));
			// if(carModel.getObjectByName( 'polySurface288' )){
			// 	gltf.scene.traverse( function ( child ) {
			// 	    if ( child.isMesh ) {
			// 	    	// color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5
			// 	        child.frustumCulled = false;
			// 	        //模型阴影
			// 	        child.castShadow = true;
			// 	        //模型自发光
			// 	        child.material.emissive =  child.material.color;
			// 	        child.material.metalness =  1.0;
			// 	        child.material.roughness =  0.5;
			// 	        child.material.clearcoat =  1.0;
			// 	        child.material.clearcoatRoughness = 0.03;
			// 	        child.material.sheen = 0.5;
			// 	        child.material.emissiveMap = child.material.map ;
			// 	    }
			// 	});
			// 	// carModel.getObjectByName( 'polySurface288' ).material = bodyMaterial;
			// }
			// gltf.scene.traverse( function ( child ) {
			//     if ( child.isMesh ) {
			//         child.frustumCulled = false;
			//         //模型阴影
			//         child.castShadow = true;
			//         //模型自发光
			//         child.material.emissive =  child.material.color;
			//         child.material.emissiveMap = child.material.map ;
			//     }
			// });

			if(index < 4){
				let mixer = new THREE.AnimationMixer( gltf.scene );
				mixers.push( mixer );
				action[index] = mixer.clipAction( gltf.animations[ 0 ] );
				action[index].setDuration(1);
				action[index].loop = THREE.LoopOnce;//THREE.LoopOnce
				action[index].clampWhenFinished = true;
				// action[index].time = 1;
				// action[index].timeScale = 1;
				actionstatus[index] = false;
				mixer.addEventListener( 'finished',finishedAction);
			}
			if(position){
				carModel.position.set(position.x,position.y,position.z);
			}
			if(rotation){
				carModel.rotation.set(rotation.x,rotation.y,rotation.z);
			}

			modelobj.push(carModel);
			scene.add( carModel );
			resolve(true);
		} );
	});
}

function startAnimate(actionindex,pindex,pkey){
	let thispointobj = pointArr[pindex];
	if(actionindex || actionindex == 0){
		play = true;
		action[actionindex].reset();
		let time = 8,time2=-8;
		if(pkey == 'zhcm'){
			time = 1;
			time2=1;
		}

		if(actionstatus[actionindex]){
			action[actionindex].time = time2;
			action[actionindex].timeScale = -1;//值为0会导致动画暂停。 负值会导致动画向后播放。 缺省值是1。
			actionstatus[actionindex] = false;
		}else{
			action[actionindex].timeScale = 1;
			action[actionindex].time = time;
			actionstatus[actionindex] = true;
		}
		action[actionindex].play();
	}
}
function finishedAction(){
	play = false;
	console.log(1234);
}

function loadBackground(path,renderer){
	var pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();
	new THREE.TextureLoader().load( path, function ( texture ) {
		var background = pmremGenerator.fromEquirectangular( texture );
		scene.background = background.texture;
	});
}

function loadPoint(obj,status){
	var group = new THREE.Group();
	let index = pointArr.length;

	if(obj.p2){
		var arrowpath = "images/arrow.png";
		var texture = new THREE.TextureLoader().load(arrowpath);
		// 创建精灵材质对象SpriteMaterial
		var spriteMaterial = new THREE.SpriteMaterial({
		  color:0xffffff,//设置精灵矩形区域颜色
		  //rotation:Math.PI/4,//旋转精灵对象45度，弧度值
		  map: texture,//设置精灵纹理贴图
		});
		// 创建精灵模型对象，不需要几何体geometry参数
		var sprite = new THREE.Sprite(spriteMaterial);
		
		sprite.position.x = obj.position.x;
		sprite.position.y = obj.position.y;
		sprite.position.z = obj.position.z;
		sprite.scale.set(0.25, 0.25, 1); //// 只需要设置x、y两个分量就可以
		sprite.pkey = obj.key;
		sprite.pindex = index;
		group.add(sprite);
		if(obj.type == "kj" && index > 4){
			status = false;
		}
	}

	if(obj.type !== 'kj'){

		var textpath = "images/pic/"+obj.key+"-icon.png";
		var texturetext = new THREE.TextureLoader().load(textpath);
		var spritetextMaterial = new THREE.SpriteMaterial({
		  color:0xffffff,
		  map: texturetext,
		});
		var spritetext = new THREE.Sprite(spritetextMaterial);
		
		spritetext.position.x = obj.position.x;
		spritetext.position.y = obj.position.y;
		spritetext.position.z = obj.position.z;
		if(obj.scale){
			spritetext.scale.set(obj.scale.x, obj.scale.y, obj.scale.z);
		}else{
			spritetext.scale.set(0.6, 0.2, 1);
			spritetext.translateY(0.3);
		}
		spritetext.pkey = obj.key;
		spritetext.pindex = index;

		group.add(spritetext);
	}

	
	group.pkey = obj.key;
	group.pindex = index;
	group.visible = status;
	

	scene.add( group );

	pointArr.push(group);
	// console.log("pointArr::::",pointArr);
	// updatedragControls();
}

function changeVisiblePoint(){
	let len = pointArr.length;
	for(var i=0;i<len;i++){
		if(pointData[pointArr[i].pkey].type == type){
			pointArr[i].visible = true;
			pointArr[i].scale.set(1,1,1);
		}else{
			pointArr[i].visible = false;
			pointArr[i].scale.set(0.000001,0.000001,0.000001);
		}
	};
}

function changeTabs(thistype){
	type = thistype;
	changeVisiblePoint();
	hideDetail();
	let p1 = {x: camera.position.x,y: camera.position.y,z: camera.position.z};
	let p2 = {x:-3.800, y:1.329, z:-4.897};
	if(type == 'xn'){
		//性能
		p2 = {x:-6.182, y:1.403, z:0.279};
	}
	// TWEEN.Easing.Cubic.InOut
	// TWEEN.Easing.Sinusoidal.InOut
	// TWEEN.Easing.Linear.None
	// TWEEN.Easing.Quadratic.InOut
	var tween = new TWEEN.Tween(p1).to(p2, 500).easing(TWEEN.Easing.Linear.None);
	tween.onUpdate(() => {
	   // 修改相机位置
	   camera.position.set(p1.x, p1.y, p1.z);
	   camera.lookAt(0, 0, 0);
	   // camera.lookAt(data.lookat.x, data.lookat.y, data.lookat.z);
	   controls.target.set(0, 0.8, 0) // 确保镜头移动后，视觉中心还在圆点处
	   controls.update();
	}).onComplete(function(){
		//console.log("动画完成");
	}).start();
}

function onWindowResize() {
	let vmax = window.innerWidth;
	let vmin = window.innerHeight;
	if(vmax < vmin){
		vmax = window.innerHeight;
		vmin = window.innerWidth;
	}
	camera.aspect = vmax / vmin;
	camera.updateProjectionMatrix();
	renderer.setSize( vmax, vmin );
}

function render() {
	controls.update();
	const time = - performance.now() / 1000;
	for ( let i = 0; i < wheels.length; i ++ ) {
		wheels[ i ].rotation.x = time * Math.PI * 2;
	}
	renderer.render( scene, camera );
}

function animate() {
	requestAnimationFrame( animate );
	if (play) {
		var mixers_count = mixers.length;
		if ( mixers_count > 0 ) {
			for ( var i = 0; i < mixers_count; i ++ ) {
				mixers[ i ].update( clock.getDelta() );
			}
		}
	}
	TWEEN.update();
}

init();
animate();

// 设置标点=============================
function initMouseControl(){
	window.addEventListener( 'resize', onWindowResize, false );
	down = 'ontouchstart' in document ? 'touchstart' : 'mousedown';
	move = 'ontouchmove' in document ? 'touchmove' : 'mousemove';
	up = 'ontouchend' in document ? 'touchend' : 'mouseup';
	var $obj = renderer.domElement;
	$obj.addEventListener(down, onDocumentMouseDown, false );
	$obj.addEventListener(move, onDocumentMouseMove, false );
	$obj.addEventListener(up, onDocumentMouseUp, false );
}

function onDocumentMouseDown(event){
	isdrag=true;
	var isClickPointtype = isClickPoint(event);
	console.log("isClickPointtype:::",isClickPointtype.pkey);
	if(isClickPointtype){
		//点中标点
		let pkey = isClickPointtype.pkey;
		let pindex = isClickPointtype.pindex;
		let data = pointData[pkey];
		let thispointobj = pointArr[pindex];
		//isClickPointtype.material.color.set("#00aa00");ee7030
		// thispointobj.children[0].material.color.set("#f55808");
		// thispointobj.children[1].material.color.set("#f55808");
		pointobj = thispointobj;
		if(data.index || data.index == 0){
			startAnimate(data.index,pindex,pkey);
			// pointobj.visible = false;
		}else if(data.p2 && thispointobj.visible){
			var mxy = getMousePosition(event);
			let p1 = {x: camera.position.x,y: camera.position.y,z: camera.position.z};
			let p2 = {x:data.p2.x, y:data.p2.y, z:data.p2.z};
			var tween = new TWEEN.Tween(p1).to(p2, 500).easing(TWEEN.Easing.Quadratic.InOut);
			tween.onUpdate(() => {
			   // 修改相机位置
			   camera.position.set(p1.x, p1.y, p1.z);
			   // camera.lookAt(data.lookat.x, data.lookat.y, data.lookat.z);
			   controls.target.set(0, 0.5, 0) // 确保镜头移动后，视觉中心还在圆点处
			   controls.update();
			}).onComplete(function(){
				//console.log("动画完成");
				// $(".pagetitle").animate({'top':'-100px'});
				// $(".oper").animate({'bottom':'-100px'});
				$(".detail .img img").attr("src",'images/pic/'+data.key+'.png');
				$(".detail .title").html(data.title);
				$(".detail .des").html(data.des);
				$(".detail").fadeIn();
				//$(".detail").css({left:(mxy[0]-15)+'px',top:(mxy[1]-50)+'px',display:'block'});
				
			}).start();
		}
	}
}
function onDocumentMouseMove(event){
	hideDetail();
	clearTimeout(addpoint);
}
function onDocumentMouseUp(event){
	isdrag = false;
	hideDetail();
	// 模型初始位置设置camera.position和controls.target
	// console.log("camera:",camera.position);
	// $(".demo").html("x:"+camera.position.x+",y:"+camera.position.y+",z:"+camera.position.z);
	// console.log("controls:",controls.target);
}

function hideDetail(){
	// if(pointobj){
	// 	// pointobj.children[0].material.color.set("#aaa");
	// 	// pointobj.children[1].material.color.set("#aaa");
	// 	pointobj = null;
	// 	let value = (renderer.domElement.clientWidth/750)*0.2*100;
	// 	$(".pagetitle").animate({'top':value+'px'});
	// 	$(".oper").animate({'bottom':value+'px'});
	// }
	$(".detail").fadeOut();
}

//是否点击到标点
function isClickPoint(event){
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	var mxy = getMousePosition(event);
	mouse.x = ( mxy[0] / renderer.domElement.clientWidth ) * 2 - 1;
	mouse.y = - ( mxy[1] / renderer.domElement.clientHeight ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera);
	var intersects = raycaster.intersectObjects(pointArr,true);
	if ( intersects.length > 0 ) {
		return intersects[0].object;
	}
	return false;
}

function getMousePosition(event){
	var thisMouseDownMouseX = event.clientY;
	var thisMouseDownMouseY = event.clientX;
	var thiseventtype = event.type;
	if(thiseventtype.indexOf("touch") != -1){
		thisMouseDownMouseX = event.targetTouches[0].pageY;
		thisMouseDownMouseY = event.targetTouches[0].pageX;
	}
	thisMouseDownMouseY = renderer.domElement.clientHeight - thisMouseDownMouseY;
	return [thisMouseDownMouseX,thisMouseDownMouseY];
}





