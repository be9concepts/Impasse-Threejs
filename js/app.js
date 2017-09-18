var debug = 0;

var scene, camera, renderer, controls;

var size, geometry, material;

var player, ground;

var levelTitle;
var font;
var moveSound, doorSound, hitSound;

var allowMove = true;

var clock = new THREE.Clock();
var speed = 10; //units a second
var delta = 0;

var cubes = [];
var colors = [0x000ff0, 0xffffff, 0x00ff00, 0x0A0A0A, 0xFF4500, 0x9932CC, 0xADD8E6, 0xADD8E6, 0xffff00, 0x0000ff, 0x556b2f, 0xff0000];
var map_size = {x:50,y:.5,z:15};
var levels = ['motion', 'pathway', 'wrap', 'surprise', 'going up', 'phase', 'weave', 'lock', 'bridge', 'flash', 'deception', 'sidestep', 'offbeat', 'hurdle', 'backdoor', 'axis', 'sweep', 'gate', 'unzip', 'twins', 'machine', 'reduction', 'lure', 'final dance']
init();
animate();


function init() {

	moveSound = new sound("sounds/move.mp3");
	doorSound = new sound("sounds/door.mp3");
	hitSound = new sound("sounds/baloon.mp3");

	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 100 );
	camera.position.set(45,30,15);
	camera.lookAt({x:0,y:0,z:0})

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// Plane
	size = {x:50,y:.5,z:15};
	geometry = new THREE.BoxGeometry( size.x, size.y, size.z );
	material = new THREE.MeshBasicMaterial( {color: 0xD3D3D3} );
	ground = new THREE.Mesh( geometry, material );
	ground.size = size;
	ground.position.y = size.y/2;
	scene.add( ground );

	// Ground
	size = {x:59,y:1,z:25};
	geometry = new THREE.BoxGeometry( size.x, size.y, size.z );
	material = new THREE.MeshBasicMaterial( {color: 0x9A9A9A} );
	var plane = new THREE.Mesh( geometry, material );
	plane.size = size;
	plane.position.y = -size.y/2;
	scene.add( plane );

	var ambient = new THREE.AmbientLight( 0x555555 );
	scene.add(ambient);

	var light = new THREE.DirectionalLight( 0xffffff );
	light.position = camera.position;
	scene.add(light);

	if (debug) {
		var gridHelper = new THREE.GridHelper( 100, 10 );
		scene.add( gridHelper );

		var axisHelper = new THREE.AxisHelper( 5 );
		scene.add( axisHelper );
	}

	controls = new THREE.OrbitControls( camera, renderer.domElement );
	controls.enableDamping = true;
	controls.dampingFactor = 0.25;
	controls.enableKeys = false;
	controls.minPolarAngle = (Math.PI*13.75)/180
	controls.maxPolarAngle = (Math.PI*90)/180

	var loader = new THREE.FontLoader();

	loader.load( 'fonts/font.json', function ( data ) {
		font = data;
		loadMap(current_map);
	} );

	document.addEventListener( 'keydown', onKeyDown );
	document.addEventListener( 'resize', onWindowResize );
}
var client = {};

// GUI
client.gui = {
	visible:false,
	element:null,
	toggle:function(element){
		this.visible = !this.visible;
		if (!this.visible) document.getElementById(element).style.visibility='hidden';
		else document.getElementById(element).style.visibility='visible';
	}
}
function onKeyDown ( event ) {
	if (event.key == '1'){
		controls.autoRotate=!controls.autoRotate;
	}
	if (allowMove){
		allowMove = false;
	

		event.preventDefault();
		var direction = '';

		if (event.keyCode === 187){ // +
			current_map++;
			loadMap(current_map);
		}	
		if (event.keyCode === 189){ // -
			current_map += -1;
			loadMap(current_map);
		}

		if (event.keyCode === 87){ //w
			direction = 'forward'
		}	
		if (event.keyCode === 83){ //s
			direction = 'reverse'
		}	
		if (event.keyCode === 65){ //a
			direction = 'right'
		}	
		if (event.keyCode === 68){ //d
			direction = 'left';
		}
		move(player, direction)
		for (var i = 0; i < cubes.length; i++) {
			if (cubes[i].type == 4){
				if (direction == 'left' || direction == 'right'){
					move(cubes[i], 'right')
				}
			}
			if (cubes[i].type == 5){
				if (direction == 'left' || direction == 'right'){
					move(cubes[i], 'left')
				}
			}
			if (cubes[i].type == 6){
				if (direction == 'left' || direction == 'right'){
					cubes[i].material.wireframe = !cubes[i].material.wireframe;
				}
			}
			if (cubes[i].type == 7){
				if (direction == 'left' || direction == 'right'){
					cubes[i].material.wireframe = !cubes[i].material.wireframe;
				}
			}
			if (cubes[i].type == 8){
				if (direction == 'forward' || direction == 'reverse'){
					move(cubes[i], 'right')
				}
			}
			if (cubes[i].type == 9){
				if (direction == 'forward' || direction == 'reverse'){
					move(cubes[i], 'left')
				}
			}
		}
	}

}
function moveFrame(object){
	if (object.moving){
		if (object.frame > 0){
			object.frame += -1;
			object.position.x += (object.size.x*object.dir.x)/object.max_frames;
			object.position.z += (object.size.z*object.dir.z)/object.max_frames;

			if (object.position.z > - (ground.size.z/2) + (object.size.z/2) + (object.size.z*(object.coords.z+1))) {
				object.position.z = - (ground.size.z/2) + (object.size.z/2) + (object.size.z*(0-1));
			}
			else if (object.position.z < -(ground.size.z/2) + (object.size.z/2) + (object.size.z*(object.coords.z-1))) {
				object.position.z = - (ground.size.z/2) + (object.size.z/2) + (object.size.z*(3));
			}
		}
		else {
			object.position.x = - (ground.size.x/2) + (object.size.x/2) + (object.size.x*(object.coords.x));
			object.position.z = - (ground.size.z/2) + (object.size.z/2) + (object.size.z*(object.coords.z));
			object.frame = object.max_frames;
			object.moving = false;
			checkCollisions();
			allowMove = true;
		}
	}
}

function move(object, direction){
	object.moving = true;
	object.dir = {
		x:0,
		z:0
	}
	if (direction == 'forward'){
		object.dir.x =1
	}
	if (direction == 'reverse'){
		object.dir.x = -1
	}
	if (direction == 'left'){
		object.dir.z = 1
	}
	if (direction == 'right'){
		object.dir.z = -1;
	}

	object.origin.coords = {
		x:object.coords.x,
		z:object.coords.z
	};

	object.coords.x += object.dir.x; object.coords.z += object.dir.z;
	if (object.coords.z > 2) object.coords.z = 0;
	if (object.coords.z < 0) object.coords.z = 2;
	if (object.coords.x > 9) object.coords.x = 9;
	if (object.coords.x < 0) object.coords.x = 0;

}

function checkCollisions(){
	// Check Collisions with player
	var collision = false;
	for (var i = 0; i < cubes.length; i++) {
		if (cubes[i] != player){
			if ((cubes[i].coords.x == player.coords.x)&&(cubes[i].coords.z == player.coords.z)){
				if (cubes[i].type == 2){
					// alert("You've completed a level. Congrats")
					current_map += 1;
					collision = true;
					doorSound.play();
				}
				else if (cubes[i].type == 10){
					cubes[i].material.visible = false;
					for (var a = 0; a < cubes.length; a++) {
						if (cubes[a].type == 11){
							cubes[a].material.wireframe = !cubes[a].material.wireframe;
						}
					}
				}
				else {
					if (!cubes[i].material.wireframe){
						collision = true;
						hitSound.play()
					}
					
				}
			}
		}
	}


	if (collision){
		loadMap(current_map);
	}
	else {
		moveSound.play();
	}
}

function placeObject(x,z,type){

	size = {x:5,y:5,z:5};
	geometry = new THREE.BoxGeometry( size.x, size.y, size.z );
	geometry = new THREE.SphereGeometry( size.x/2 );
	material = new THREE.MeshBasicMaterial( { color: colors[type] } );
	material = new THREE.MeshLambertMaterial({color: colors[type], transparent: true, opacity: 0.99});

	var temp_cube = new THREE.Mesh( geometry, material );
	temp_cube.size = size;
	temp_cube.coords = {x:x,z:z};
	temp_cube.type = type;
	temp_cube.max_frames = 20;
	temp_cube.frame = temp_cube.max_frames;
	temp_cube.position.y = size.y/2 + ground.position.y*2;
	temp_cube.position.x = - (ground.size.x/2) + (temp_cube.size.x/2) + (temp_cube.size.x*x);
	temp_cube.position.z = - (ground.size.z/2) + (temp_cube.size.z/2) + (temp_cube.size.z*z);
	temp_cube.origin = {x:temp_cube.position.x,y:temp_cube.position.y,z:temp_cube.position.z}
	if (temp_cube.type == 1){
		player = temp_cube;
	}
	if (temp_cube.type == 7){
		temp_cube.material.wireframe = true;
	}
	cubes.push(temp_cube)
	scene.add( temp_cube );

}
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

function loadMap(map_num){
	for (var i = 0; i < cubes.length; i++) {
		scene.remove(cubes[i]);
	}
	cubes = [];
	var map = MAPS[map_num];
	if (map){
		for (var i = 0; i < map.length; i++) {
			for (var b = 0; b < map[i].length; b++) {
				var tile = map[i][b];
				if (tile != 0){
					// console.log(tile);
					placeObject(b,i,tile);
				}
			}
		}
		scene.remove(levelTitle);
		levelTitle = null;

			var textgeometry = new THREE.TextGeometry( levels[map_num], {
				font: font,
				size: 80,
				height: 10,
			} );
			material = new THREE.MeshBasicMaterial( {color: 0xffffff} );

			levelTitle = new THREE.Mesh( textgeometry, material );
			levelTitle.geometry.computeBoundingBox();
			levelTitle.position.z = -12.5;
			levelTitle.position.y = 7.5;
			levelTitle.position.x = (levelTitle.geometry.boundingBox.min.x-levelTitle.geometry.boundingBox.max.x)/2/20
			levelTitle.scale.x=1/20
			levelTitle.scale.y=1/20
			levelTitle.scale.z=1/20
			scene.add(levelTitle);
			allowMove = true;
	}
	else {
		// alert('no more maps to loads; I guess you win!')
		current_map = 0;
		loadMap(0)
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.handleResize();
	render();
}

function animate() {
	requestAnimationFrame( animate );
	controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
	delta = clock.getDelta();
	for (var i = 0; i < cubes.length; i++) {
		moveFrame(cubes[i]);
	}
	render();
}

function render() {
	renderer.render( scene, camera );
}