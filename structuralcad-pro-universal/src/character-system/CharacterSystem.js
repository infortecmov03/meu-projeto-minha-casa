/**
 * Sistema completo de personagens e navegação
 */
class CharacterSystem {
    constructor(engine) {
        this.engine = engine;
        this.characters = new Map();
        this.activeCharacter = null;
        this.controllers = new Map();
        
        // Modos de controle
        this.controlModes = {
            'FIRST_PERSON': 'firstPerson',
            'THIRD_PERSON': 'thirdPerson',
            'TOP_DOWN': 'topDown',
            'FLY': 'fly',
            'DRIVE': 'drive'
        };
        
        this.currentControlMode = this.controlModes.THIRD_PERSON;
        
        this.initInputSystem();
    }

    createCharacter(options = {}) {
        const characterId = `character_${Date.now()}`;
        
        const character = {
            id: characterId,
            name: options.name || 'Personagem',
            type: options.type || 'human',
            
            // Propriedades físicas
            height: options.height || 1.8,
            radius: options.radius || 0.3,
            mass: options.mass || 70,
            speed: options.speed || 5,
            jumpForce: options.jumpForce || 7,
            
            // Modelo 3D
            model: this.createCharacterModel(options),
            
            // Controle
            controller: null,
            input: {
                moveForward: false,
                moveBackward: false,
                moveLeft: false,
                moveRight: false,
                jump: false,
                run: false,
                crouch: false
            },
            
            // Estado
            state: 'idle',
            health: 100,
            inventory: [],
            currentFloor: 0,
            inElevator: false,
            onStairs: false,
            
            // Animações
            animations: {
                idle: this.loadAnimation('idle'),
                walk: this.loadAnimation('walk'),
                run: this.loadAnimation('run'),
                jump: this.loadAnimation('jump'),
                crouch: this.loadAnimation('crouch'),
                openDoor: this.loadAnimation('open_door'),
                climbStairs: this.loadAnimation('climb_stairs')
            },
            
            // Habilidades
            abilities: {
                canOpenDoors: true,
                canUseElevator: true,
                canClimbStairs: true,
                canCrouch: true,
                canJump: true,
                canRun: true
            }
        };
        
        // Criar corpo físico
        character.physicsBody = this.createCharacterPhysics(character);
        
        // Criar controlador
        character.controller = this.createController(character);
        
        // Adicionar à cena
        this.engine.scene.add(character.model);
        this.engine.physicsWorld.addBody(character.physicsBody);
        
        // Registrar
        this.characters.set(characterId, character);
        
        // Definir como personagem ativo se for o primeiro
        if (!this.activeCharacter) {
            this.setActiveCharacter(characterId);
        }
        
        return character;
    }

    createCharacterPhysics(character) {
        // Criar corpo físico em forma de cápsula
        const shape = new CANNON.Capsule(
            character.radius,
            character.height - 2 * character.radius
        );
        
        const body = new CANNON.Body({
            mass: character.mass,
            shape: shape,
            material: this.engine.physicsMaterials.character,
            fixedRotation: true,
            linearDamping: 0.9,
            angularDamping: 0.9
        });
        
        body.position.set(0, character.height / 2, 0);
        
        // Configurar colisões
        body.addEventListener('collide', (event) => {
            this.handleCharacterCollision(character, event);
        });
        
        return body;
    }

    createController(character) {
        const controller = {
            character: character,
            
            update: (deltaTime) => {
                this.updateCharacterMovement(character, deltaTime);
                this.updateCharacterAnimation(character, deltaTime);
                this.updateCharacterState(character);
                this.handleInteractions(character);
            },
            
            handleInput: (input) => {
                character.input = { ...character.input, ...input };
            },
            
            teleport: (position, rotation) => {
                this.teleportCharacter(character, position, rotation);
            },
            
            interact: () => {
                return this.performInteraction(character);
            }
        };
        
        this.controllers.set(character.id, controller);
        return controller;
    }

    updateCharacterMovement(character, deltaTime) {
        const body = character.physicsBody;
        
        // Calcular direção do movimento
        const direction = new THREE.Vector3(0, 0, 0);
        
        if (character.input.moveForward) direction.z -= 1;
        if (character.input.moveBackward) direction.z += 1;
        if (character.input.moveLeft) direction.x -= 1;
        if (character.input.moveRight) direction.x += 1;
        
        // Normalizar e aplicar velocidade
        if (direction.length() > 0) {
            direction.normalize();
            
            // Rotacionar direção baseado na rotação da câmera
            const cameraDirection = this.getCameraDirection();
            direction.applyEuler(new THREE.Euler(0, cameraDirection.y, 0));
            
            // Aplicar velocidade
            const speed = character.input.run ? character.speed * 1.5 : character.speed;
            const velocity = direction.multiplyScalar(speed);
            
            // Manter velocidade Y (gravidade)
            velocity.y = body.velocity.y;
            
            // Aplicar ao corpo físico
            body.velocity.set(velocity.x, velocity.y, velocity.z);
            
            // Atualizar estado
            character.state = character.input.run ? 'running' : 'walking';
            
            // Rotacionar personagem na direção do movimento
            if (direction.length() > 0.1) {
                const targetRotation = Math.atan2(direction.x, direction.z);
                character.model.rotation.y = THREE.MathUtils.lerp(
                    character.model.rotation.y,
                    targetRotation,
                    0.1
                );
            }
        } else {
            // Parar movimento horizontal
            body.velocity.x = 0;
            body.velocity.z = 0;
            character.state = 'idle';
        }
        
        // Pulo
        if (character.input.jump && this.canJump(character)) {
            body.velocity.y = character.jumpForce;
            character.state = 'jumping';
        }
        
        // Agachar
        if (character.input.crouch) {
            this.crouch(character, true);
        } else {
            this.crouch(character, false);
        }
    }

    handleInteractions(character) {
        // Verificar objetos interativos próximos
        const interactiveObjects = this.getNearbyInteractiveObjects(character);
        
        // Ordenar por proximidade
        interactiveObjects.sort((a, b) => 
            this.getDistance(character, a) - this.getDistance(character, b)
        );
        
        // Destacar objeto mais próximo
        if (interactiveObjects.length > 0) {
            const closestObject = interactiveObjects[0];
            this.highlightInteractiveObject(closestObject);
            
            // Se o jogador pressionar botão de interação
            if (character.input.interact) {
                this.interactWithObject(character, closestObject);
            }
        }
    }

    interactWithObject(character, object) {
        const objectData = object.userData;
        
        switch(objectData.interactionType) {
            case 'door':
                if (objectData.isLocked) {
                    this.showMessage('Porta trancada');
                    // Tentar usar chave do inventário
                    if (this.hasKey(character, objectData.lockId)) {
                        objectData.isLocked = false;
                        this.showMessage('Porta destrancada');
                    }
                } else {
                    objectData.onInteract(character);
                }
                break;
                
            case 'elevator':
                if (objectData.state === 'idle') {
                    this.callElevator(character, object);
                } else if (objectData.state === 'open') {
                    this.enterElevator(character, object);
                }
                break;
                
            case 'light_switch':
                objectData.onToggle();
                break;
                
            case 'stairs':
                this.useStairs(character, object);
                break;
                
            case 'furniture':
                if (objectData.isMovable) {
                    this.startMovingFurniture(character, object);
                }
                break;
                
            case 'window':
                objectData.onOpenClose();
                break;
                
            case 'cabinet':
                objectData.onOpen();
                break;
        }
    }

    useStairs(character, stairs) {
        const stairsData = stairs.userData;
        
        // Verificar se personagem está na base das escadas
        if (this.isAtStairsBase(character, stairs)) {
            character.onStairs = true;
            character.currentStairs = stairs;
            
            // Modificar física para subir escadas
            character.physicsBody.velocity.y = stairsData.ascentSpeed || 2;
            
            // Animação de subir escadas
            this.playAnimation(character, 'climbStairs');
            
            // Atualizar andar
            character.currentFloor = stairsData.leadsToFloor;
            
            // Quando chegar ao topo
            setTimeout(() => {
                character.onStairs = false;
                character.currentStairs = null;
                character.state = 'idle';
            }, stairsData.climbTime || 3000);
        }
    }

    callElevator(character, elevator) {
        const elevatorData = elevator.userData;
        
        // Verificar qual andar o elevador está
        if (elevatorData.currentFloor !== character.currentFloor) {
            // Chamar elevador
            elevatorData.state = 'moving';
            elevatorData.targetFloor = character.currentFloor;
            
            // Animação do elevador se movendo
            this.animateElevatorMovement(elevator);
            
            this.showMessage(`Elevador a caminho do andar ${character.currentFloor}`);
        } else {
            // Elevador já está no mesmo andar
            elevatorData.state = 'opening';
            this.animateElevatorDoors(elevator, true);
        }
    }

    enterElevator(character, elevator) {
        const elevatorData = elevator.userData;
        
        // Colocar personagem dentro do elevador
        character.inElevator = true;
        character.currentElevator = elevator;
        
        // Parenteia o personagem ao elevador
        elevatorData.passengers.push(character);
        
        // Fechar portas
        setTimeout(() => {
            this.animateElevatorDoors(elevator, false);
            elevatorData.state = 'closed';
            
            // Selecionar andar
            this.showElevatorPanel(character, elevator);
        }, 1000);
    }

    showElevatorPanel(character, elevator) {
        // Interface para selecionar andar
        const panel = this.createElevatorPanel(elevator.userData.floors);
        
        panel.onFloorSelected = (floorNumber) => {
            // Mover elevador para o andar selecionado
            elevator.userData.targetFloor = floorNumber;
            elevator.userData.state = 'moving';
            
            // Animação
            this.animateElevatorToFloor(elevator, floorNumber);
            
            // Quando chegar
            setTimeout(() => {
                elevator.userData.state = 'opening';
                this.animateElevatorDoors(elevator, true);
                
                // Personagem sai do elevador
                character.inElevator = false;
                character.currentElevator = null;
                character.currentFloor = floorNumber;
                
                elevator.userData.passengers = 
                    elevator.userData.passengers.filter(p => p.id !== character.id);
            }, Math.abs(elevator.userData.currentFloor - floorNumber) * 2000);
        };
    }
}