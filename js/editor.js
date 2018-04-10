/**
 * Created by 礼 on 2018/4/4.
 */

var editor = {
    container : null,
    camera : null,
    renderer : null,
    brush : null,
    projector : null,
    plane : null,
    scene : null,
    grid : null,
    mouse2D : null,
    mouse3D : null,
    raycaster : null,
    objectHovered : null,
    isMouseDown : false,
    onMouseDownPosition : new THREE.Vector2(0, 0),
    onMouseDownPhi : 60,
    onMouseDownTheta : 45,
    radius : 1600,
    theta : 90,
    phi : 60,
    target : new THREE.Vector3( 0, 200, 0 ),


    init: function() {
        this.initThree();
        this.initCamera();
        this.initScene();
        this.initLight();
        this.initObject();
        this.addListner();
        this.animate(this);
    },

    initThree: function() {
        this.container = document.getElementById('canvas3d');
        var hasWebGL =  ( function () { try { return !! window.WebGLRenderingContext && !! document.createElement( 'canvas' ).getContext( 'experimental-webgl' ); } catch( e ) { return false; } } )()
        if (hasWebGL)
            this.renderer = new THREE.WebGLRenderer({antialias: true});
        else
            this.renderer = new THREE.CanvasRenderer();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.container.appendChild(this.renderer.domElement)
    },

    initCamera: function() {
        this.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
        this.camera.position.x = this.radius * Math.sin( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
        this.camera.position.y = this.radius * Math.sin( this.phi * Math.PI / 360 );
        this.camera.position.z = this.radius * Math.cos( this.theta * Math.PI / 360 ) * Math.cos( this.phi * Math.PI / 360 );
    },

    initScene: function() {
        this.scene = new THREE.Scene();
        window.scene = this.scene;
    },

    initLight: function() {
        var ambientLight = new THREE.AmbientLight( 0x606060 );
        this.scene.add( ambientLight );

        var directionalLight = new THREE.DirectionalLight( 0xffffff );
        directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
        this.scene.add( directionalLight );
    },

    initObject: function() {
        // Grid
        var size = 500, step = 50;
        var geometry = new THREE.Geometry();

        for ( var i = - size; i <= size; i += step ) {
            geometry.vertices.push( new THREE.Vector3( - size, 0, i ) );
            geometry.vertices.push( new THREE.Vector3(   size, 0, i ) );

            geometry.vertices.push( new THREE.Vector3( i, 0, - size ) );
            geometry.vertices.push( new THREE.Vector3( i, 0,   size ) );
        }

        var material = new THREE.LineBasicMaterial( { color: 0x000000, opacity: 0.2 } );

        var line = new THREE.Line( geometry, material );
        line.type = THREE.LinePieces;
        this.grid = line;
        this.scene.add( line );

        // Plane
        this.projector = new THREE.Projector();
        this.plane = new THREE.Mesh( new THREE.PlaneGeometry( 1000, 1000 ), new THREE.MeshBasicMaterial() );
        this.plane.rotation.x = - Math.PI / 2;
        this.plane.visible = true;
        this.plane.isPlane = true;
        this.scene.add( this.plane );

        this.mouse2D = new THREE.Vector3( 0, 10000, 0.5 );
    },

    render: function() {
        this.camera.lookAt(this.target);
        this.raycaster = this.projector.pickingRay(this.mouse2D.clone(), this.camera);
        this.renderer.render(this.scene, this.camera);
    },

    animate: function(self) {
        window.requestAnimationFrame(function () {
            self.animate(self);
        });
        self.render();
    },

    addListner: function() {
        this.renderer.domElement.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
        this.renderer.domElement.addEventListener( 'mousedown', this.onDocumentMouseDown, false );
        this.renderer.domElement.addEventListener( 'mouseup', this.onDocumentMouseUp, false );
        window.addEventListener( 'resize', this.onWindowResize, false );
        window.addEventListener('DOMMouseScroll', this.onMouseWheel, false);
        window.addEventListener('mousewheel', this.onMouseWheel, false);
    },
    onDocumentMouseDown: function(event) {
        event.preventDefault();
        editor.isMouseDown = true;
        editor.onMouseDownTheta = editor.theta;
        editor.onMouseDownPhi = editor.phi;
        editor.onMouseDownPosition.x = event.clientX;
        editor.onMouseDownPosition.y = event.clientY;
    },

    onDocumentMouseUp: function(event) {
        event.preventDefault();
        editor.isMouseDown = false;
        editor.onMouseDownPosition.x = event.clientX - editor.onMouseDownPosition.x;
        editor.onMouseDownPosition.y = event.clientY - editor.onMouseDownPosition.y;
        var length = editor.onMouseDownPosition.length();
        if (length > 5 ) return;

        /* var intersect = this.getIntersecting();

         if ( intersect ) {

         }*/
    },

    onDocumentMouseMove: function(event) {
        event.preventDefault();
        if ( editor.isMouseDown ) {
            editor.theta = -((event.clientX - editor.onMouseDownPosition.x) * 0.5) + editor.onMouseDownTheta;
            editor.phi = ((event.clientY - editor.onMouseDownPosition.y) * 0.5) + editor.onMouseDownPhi;

            editor.phi = Math.min(180, Math.max(0, editor.phi));

            editor.camera.position.x = editor.radius * Math.sin(editor.theta * Math.PI / 360) * Math.cos(editor.phi * Math.PI / 360);
            editor.camera.position.y = editor.radius * Math.sin(editor.phi * Math.PI / 360);
            editor.camera.position.z = editor.radius * Math.cos(editor.theta * Math.PI / 360) * Math.cos(editor.phi * Math.PI / 360);

            editor.camera.matrix.setPosition( editor.camera.position );
            if ( editor.camera.useQuaternion === false )  {
                editor.camera.matrix.setRotationFromEuler( editor.camera.rotation, editor.camera.eulerOrder );
            } else {
                editor.camera.matrix.setRotationFromQuaternion( editor.camera.quaternion );
            }
            if ( editor.camera.scale.x !== 1 || editor.camera.scale.y !== 1 || editor.camera.scale.z !== 1 ) {
                editor.camera.matrix.scale( editor.camera.scale );
            }
            editor.camera.matrixWorldNeedsUpdate = true;

            editor.mouse2D.x = (event.clientX / window.innerWidth) * 2 - 1;
            editor.mouse2D.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
    },

    onMouseWheel: function(event) {
        var delta = event.wheelDeltaY || event.detail;
        var origin = {x: 0, y: 0, z: 0};
        var distance = editor.camera.position.distanceTo(origin);
        var tooFar = distance  > 3000;
        var tooClose = distance < 300;
        if (delta > 0 && tooFar) return;
        if (delta < 0 && tooClose) return;
        editor.radius = distance; // for mouse drag calculations to be correct
        editor.camera.translateZ( delta )
    },

    onDocumentTouchStart: function(event) {
        event.preventDefault();
        var touch = event.touches[0];
        editor.touchX = touch.screenX;
        editor.touchY = touch.screenY;
    },

    onDocumentTouchMove: function(event) {
        event.preventDefault();
        var touch = event.touches[0];
        editor.lon -= (touch.screenX - editor.touchX) * 0.1;
        editor.lat += (touch.screenY - editor.touchY) * 0.1;
        editor.touchX = touch.screenX;
        editor.touchY = touch.screenY;
    },

    onWindowResize: function() {
        editor.camera.aspect = window.innerWidth / window.innerHeight;
        editor.camera.updateProjectionMatrix();

        editor.renderer.setSize( window.innerWidth, window.innerHeight );
    }

};