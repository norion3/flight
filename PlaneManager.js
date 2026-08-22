export class PlaneManager {
    constructor(scene, globeGroup, routeManager) {
        this.scene = scene;
        this.globeGroup = globeGroup;
        this.routeManager = routeManager;
        
        this.planes = [];
        this.planeGroup = new THREE.Group();
        this.globeGroup.add(this.planeGroup);

        this.baseGeometry = this._createPlaneGeometry();
        this.planeMaterial = new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide }); 
    }

    _createPlaneGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(0, 0.4);       
        shape.lineTo(0.08, 0.2);    
        shape.lineTo(0.35, -0.1);   
        shape.lineTo(0.1, -0.15);   
        shape.lineTo(0.05, -0.4);   
        shape.lineTo(0.15, -0.45);  
        shape.lineTo(0, -0.5);      
        shape.lineTo(-0.15, -0.45); 
        shape.lineTo(-0.05, -0.4);  
        shape.lineTo(-0.1, -0.15);  
        shape.lineTo(-0.35, -0.1);  
        shape.lineTo(-0.08, 0.2);   
        shape.lineTo(0, 0.4);       

        const geometry = new THREE.ShapeGeometry(shape);
        geometry.rotateX(Math.PI / 2);
        return geometry;
    }

    addPlane(sizeType) {
        const spawnAirportId = this.routeManager.getRandomConnectedAirport();
        if (!spawnAirportId) return false; 

        const routeData = this.routeManager.getRandomRouteFrom(spawnAirportId);
        if (!routeData) return false;

        const mesh = new THREE.Mesh(this.baseGeometry, this.planeMaterial);
        
        let scale = 0.05;
        let speed = 0.5; 
        if (sizeType === 'small') { scale = 0.04; speed = 0.6; }
        else if (sizeType === 'medium') { scale = 0.06; speed = 0.5; }
        else if (sizeType === 'large') { scale = 0.08; speed = 0.4; }
        else if (sizeType === 'super') { scale = 0.11; speed = 0.3; }

        mesh.scale.set(scale, scale, scale);
        
        this.planeGroup.add(mesh);

        this.planes.push({
            mesh: mesh,
            currentAirportId: spawnAirportId,
            currentRoute: routeData,
            progress: 0,
            baseSpeed: speed
        });

        return true;
    }

    update(delta) {
        for (let i = 0; i < this.planes.length; i++) {
            const plane = this.planes[i];
            
            if (!plane.currentRoute) continue;

            const curve = plane.currentRoute.curve;
            const length = plane.currentRoute.length;
            
            const speedFactor = plane.baseSpeed / length;
            plane.progress += speedFactor * delta;

            if (plane.progress >= 1.0) {
                const nextAirportId = plane.currentRoute.id;
                const nextRoute = this.routeManager.getRandomRouteFrom(nextAirportId);
                
                if (nextRoute) {
                    plane.currentAirportId = nextAirportId;
                    plane.currentRoute = nextRoute;
                    plane.progress = 0;
                } else {
                    plane.progress = 1.0; 
                }
            } else {
                const position = curve.getPointAt(plane.progress);
                plane.mesh.position.copy(position);

                const tangent = curve.getTangentAt(plane.progress).normalize();
                const up = position.clone().normalize();
                const right = new THREE.Vector3().crossVectors(tangent, up).normalize();
                const forward = new THREE.Vector3().crossVectors(up, right).normalize();
                forward.negate(); 

                const matrix = new THREE.Matrix4().makeBasis(right, up, forward);
                plane.mesh.quaternion.setFromRotationMatrix(matrix);
            }
        }
    }
}


