/**
 * Motor 3D com suporte a múltiplos renderizadores
 */
class Advanced3DEngine {
    constructor() {
        this.renderer = null;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.objects = new Map();
        this.physicsWorld = null;
        this.characters = new Map();
        this.interactiveObjects = new Map();
        
        this.initEngine();
    }

    initEngine() {
        // Inicializar Three.js com renderizador avançado
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: true
        });
        
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // Configurar câmera
        this.camera = new THREE.PerspectiveCamera(
            60, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        this.camera.position.set(10, 5, 10);
        
        // Configurar física
        this.initPhysics();
        
        // Configurar iluminação
        this.setupLighting();
        
        // Configurar pós-processamento
        this.setupPostProcessing();
    }

    initPhysics() {
        // Inicializar física com Ammo.js ou Cannon.js
        this.physicsWorld = new CANNON.World();
        this.physicsWorld.gravity.set(0, -9.82, 0);
        this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);
        this.physicsWorld.defaultContactMaterial.restitution = 0.3;
        
        // Materiais de física
        this.physicsMaterials = {
            concrete: new CANNON.Material('concrete'),
            wood: new CANNON.Material('wood'),
            metal: new CANNON.Material('metal'),
            glass: new CANNON.Material('glass'),
            character: new CANNON.Material('character')
        };
        
        // Configurar contatos entre materiais
        this.setupContactMaterials();
    }

    addImportedModel(modelData) {
        // Converter modelo importado para Three.js
        const threeModel = this.convertToThreeJS(modelData);
        
        // Adicionar física
        this.addPhysicsToModel(threeModel);
        
        // Adicionar interatividade
        this.makeInteractive(threeModel);
        
        // Adicionar à cena
        this.scene.add(threeModel);
        this.objects.set(threeModel.uuid, threeModel);
        
        return threeModel;
    }

    addPhysicsToModel(threeObject) {
        // Criar corpo físico baseado na geometria
        let physicsBody;
        
        if (threeObject.geometry) {
            // Para objetos complexos, usar mesh ou convex hull
            const vertices = threeObject.geometry.attributes.position.array;
            
            if (this.isConvex(vertices)) {
                const shape = new CANNON.ConvexPolyhedron({
                    vertices: this.extractVertices(vertices),
                    faces: this.extractFaces(threeObject.geometry)
                });
                physicsBody = new CANNON.Body({
                    mass: this.calculateMass(threeObject),
                    shape: shape,
                    material: this.getPhysicsMaterial(threeObject.userData.material)
                });
            } else {
                // Usar Trimesh para geometrias complexas
                const shape = new CANNON.Trimesh(
                    vertices,
                    threeObject.geometry.index?.array || null
                );
                physicsBody = new CANNON.Body({
                    mass: 0, // Massa 0 = objeto estático
                    shape: shape,
                    material: this.getPhysicsMaterial(threeObject.userData.material)
                });
            }
            
            // Sincronizar posição
            physicsBody.position.copy(threeObject.position);
            physicsBody.quaternion.copy(threeObject.quaternion);
            
            // Adicionar ao mundo físico
            this.physicsWorld.addBody(physicsBody);
            
            // Vincular ao objeto visual
            threeObject.userData.physicsBody = physicsBody;
        }
    }

    makeInteractive(threeObject) {
        // Tornar objetos interativos (portas, janelas, interruptores)
        if (threeObject.userData.type === 'door') {
            this.setupDoorInteraction(threeObject);
        } else if (threeObject.userData.type === 'window') {
            this.setupWindowInteraction(threeObject);
        } else if (threeObject.userData.type === 'light_switch') {
            this.setupLightSwitch(threeObject);
        } else if (threeObject.userData.type === 'elevator') {
            this.setupElevator(threeObject);
        } else if (threeObject.userData.type === 'stairs') {
            this.setupStairs(threeObject);
        }
        
        // Adicionar ao registro de objetos interativos
        this.interactiveObjects.set(threeObject.uuid, threeObject);
    }

    setupDoorInteraction(doorObject) {
        doorObject.userData = {
            ...doorObject.userData,
            isOpen: false,
            isLocked: false,
            hingePosition: 'left', // left, right, double
            openAngle: 90, // graus
            animationSpeed: 2, // segundos para abrir/fechar
            interactionType: 'door',
            onInteract: (character) => {
                this.animateDoor(doorObject, !doorObject.userData.isOpen);
            },
            onExamine: () => {
                return `Porta de ${doorObject.userData.material}`;
            }
        };
        
        // Adicionar trigger para detecção de proximidade
        this.addInteractionTrigger(doorObject);
    }

    animateDoor(doorObject, open) {
        const targetRotation = open ? doorObject.userData.openAngle : 0;
        const hinge = doorObject.userData.hingePosition;
        
        // Animação suave da porta
        const animation = {
            startRotation: doorObject.rotation.y,
            targetRotation: THREE.MathUtils.degToRad(targetRotation * (hinge === 'left' ? 1 : -1)),
            startTime: Date.now(),
            duration: doorObject.userData.animationSpeed * 1000
        };
        
        doorObject.userData.currentAnimation = animation;
        doorObject.userData.isAnimating = true;
        doorObject.userData.isOpen = open;
    }

    update(deltaTime) {
        // Atualizar física
        this.physicsWorld.step(deltaTime);
        
        // Sincronizar objetos físicos com visuais
        this.syncPhysicsWithGraphics();
        
        // Atualizar animações
        this.updateAnimations(deltaTime);
        
        // Atualizar personagens
        this.updateCharacters(deltaTime);
        
        // Atualizar pós-processamento
        this.composer.render(deltaTime);
    }
}