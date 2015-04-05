//-----ThreeJS handling

var camera, scene, renderer;
var effect, controls;
var element, container;

var clock = new THREE.Clock();

var manager = new THREE.LoadingManager();
manager.onProgress = function ( item, loaded, total ) {
	console.log( item, loaded, total );
}
var loader = new THREE.OBJLoader( manager );
var onProgress = function ( xhr ) {
	if ( xhr.lengthComputable ) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		console.log( Math.round(percentComplete, 2) + '% downloaded' );
	}
};
var onError = function ( xhr ) {};
var texture = new THREE.Texture();

init();
animate();

function init() {
  renderer = new THREE.WebGLRenderer();
  element = renderer.domElement;
  container = document.getElementById('example');
  container.appendChild(element);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(90, 1, 0.001, 700);
  camera.position.set(0, 10, 0);
  scene.add(camera);

  controls = new THREE.OrbitControls(camera, element);
  controls.rotateUp(Math.PI / 4);
  controls.target.set(
    camera.position.x + 0.1,
    camera.position.y,
    camera.position.z
  );
  controls.noZoom = true;
  controls.noPan = true;

  function setOrientationControls(e) {
    if (!e.alpha) {
      return;
    }

    controls = new THREE.DeviceOrientationControls(camera, true);
    controls.connect();
    controls.update();

    element.addEventListener('click', fullscreen, false);

    window.removeEventListener('deviceorientation', setOrientationControls, true);
  }
  window.addEventListener('deviceorientation', setOrientationControls, true);


  //var light = new THREE.HemisphereLight(0x777777, 0x000000, 0.6);
  //scene.add(light);

  var ambient = new THREE.AmbientLight( 0xaaaaaa );
  scene.add( ambient );
  var directionalLight = new THREE.DirectionalLight( 0xffeedd );
  directionalLight.position.set( 0, 0, 1 );
  scene.add( directionalLight );  

  var texture = THREE.ImageUtils.loadTexture(
    'textures/patterns/checker.png'
  );
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat = new THREE.Vector2(50, 50);
  texture.anisotropy = renderer.getMaxAnisotropy();

  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    specular: 0xffffff,
    shininess: 20,
    shading: THREE.FlatShading,
    map: texture
  });

  var geometry = new THREE.PlaneGeometry(1000, 1000);

  var mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh);

  window.addEventListener('resize', resize, false);
  setTimeout(resize, 1);
}

function resize() {
  var width = container.offsetWidth;
  var height = container.offsetHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

function update(dt) {
  resize();

  camera.updateProjectionMatrix();

  controls.update(dt);
}

function render(dt) {
  renderer.render(scene, camera);
}

function animate(t) {
  requestAnimationFrame(animate);

  update(clock.getDelta());
  render(clock.getDelta());
}

function fullscreen() {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}


//-------Firebase handling

var fbRef = new Firebase( 'https://cardboard-collab.firebaseio.com/' );
var modelRef = fbRef.child( "models" );
var sessionRef = fbRef.child( "session" );

$(document).ready(function(){


	var models = $("#model-list");
	var sceneModels = $("#scene-list");

	modelRef.limitToLast(10).on( 'child_added', function (snapshot) {
		var data = snapshot.val();
		var name = data.objectname || "unknown";
		var id = data.id;
		var dir = data.filename;

		if ( name ) {
			var modelElement = $("<li>");
			modelElement.click( function() {
				return addToScene( name, id, dir );
			} );
			modelElement.hover( function() {
				modelElement.css( {'color': '#fff'} );
			},
			function(){
				modelElement.css( {'color': '#000'} );
			})
			modelElement.text( name );
			models.append( modelElement );
		}
	} );

	sessionRef.limitToLast(10).on( 'child_added', function (snapshot) {
		var data = snapshot.val();
		var name = data.objectname;
		var id = data.id;
		var filename = data.filename;
		var pos = [ data.x, data.y, data.z ];
		var rotation = [ data.yaw, data.pitch, data.roll ];

		//Add to teacher controls
		if ( name ) {
			var sceneElement = $("<li>");
			sceneElement.text( name );
			sceneModels.append( sceneElement );
		}

		//Add to scene
		var loader = new THREE.ImageLoader( manager );
		loader.load( 'models/UV_Grid_Sm.jpg', function ( image ) {
			texture.image = image;
			texture.needsUpdate = true;
		} );

		var loader = new THREE.OBJLoader( manager );		
		loader.load( 'models/'+filename, function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material.map = texture;
				}
			} );
			object.position.x = 10;
			object.position.y = 10;
			scene.add( object );
		}, onProgress, onError);

	} ); 
});

function addToScene( _name, _id, _filename ) {
	console.log( _name + " added to scene" );
	sessionRef.push( {
		id: _id,
		objectname: _name,
		filename: _filename,
		x: 0,
		y: 0,
		z: 0,
		yaw: 0,
		pitch: 0,
		roll: 0
	});
}