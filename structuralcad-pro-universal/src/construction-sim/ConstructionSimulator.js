/**
 * Simulador de construção passo-a-passo
 */
class ConstructionSimulator {
    constructor(engine) {
        this.engine = engine;
        this.project = null;
        this.phases = [];
        this.currentPhase = 0;
        this.isSimulating = false;
        this.simulationSpeed = 1.0;
        this.workers = [];
        this.equipment = [];
        this.timeline = [];
        
        this.initSimulation();
    }

    initSimulation() {
        // Definir fases padrão de construção
        this.phases = [
            {
                id: 'site_preparation',
                name: 'Preparação do Terreno',
                duration: 15, // dias
                tasks: [
                    'Limpeza do terreno',
                    'Nivelamento',
                    'Demarcação',
                    'Instalação do canteiro'
                ],
                animations: this.createSitePrepAnimations()
            },
            {
                id: 'excavation',
                name: 'Escavação',
                duration: 10,
                tasks: [
                    'Escavação de valas para fundações',
                    'Retirada de material excedente',
                    'Compactação do fundo da escavação'
                ],
                animations: this.createExcavationAnimations()
            },
            {
                id: 'foundations',
                name: 'Fundações',
                duration: 20,
                tasks: [
                    'Armadura das sapatas',
                    'Formas para fundações',
                    'Concretagem',
                    'Cura do concreto'
                ],
                animations: this.createFoundationAnimations()
            },
            {
                id: 'structure',
                name: 'Estrutura',
                duration: 45,
                tasks: [
                    'Elevação de pilares',
                    'Montagem de vigas',
                    'Lajes de piso',
                    'Escadas estruturais'
                ],
                animations: this.createStructureAnimations()
            },
            {
                id: 'closing',
                name: 'Fechamento',
                duration: 30,
                tasks: [
                    'Alvenaria',
                    'Instalação de esquadrias',
                    'Cobertura',
                    'Impermeabilização'
                ],
                animations: this.createClosingAnimations()
            },
            {
                id: 'installations',
                name: 'Instalações',
                duration: 40,
                tasks: [
                    'Instalações elétricas',
                    'Instalações hidráulicas',
                    'Instalações de gás',
                    'Sistema de ar condicionado'
                ],
                animations: this.createInstallationAnimations()
            },
            {
                id: 'finishes',
                name: 'Acabamentos',
                duration: 60,
                tasks: [
                    'Reboco e chapisco',
                    'Pisos e azulejos',
                    'Pintura',
                    'Marcenaria',
                    'Instalação de sanitários'
                ],
                animations: this.createFinishAnimations()
            },
            {
                id: 'finalization',
                name: 'Finalização',
                duration: 15,
                tasks: [
                    'Limpeza final',
                    'Instalação de mobiliário',
                    'Testes dos sistemas',
                    'Entrega da obra'
                ],
                animations: this.createFinalizationAnimations()
            }
        ];
    }

    loadProject(projectData) {
        this.project = projectData;
        
        // Analisar projeto para criar timeline detalhada
        this.analyzeProject();
        
        // Criar timeline de simulação
        this.createTimeline();
        
        // Inicializar trabalhadores e equipamentos
        this.initWorkersAndEquipment();
        
        console.log(`📋 Projeto carregado: ${this.project.name}`);
        console.log(`🏗️  Fases: ${this.phases.length}`);
        console.log(`📅 Duração total: ${this.getTotalDuration()} dias`);
    }

    startSimulation() {
        this.isSimulating = true;
        this.currentPhase = 0;
        
        console.log('🚧 Iniciando simulação de construção...');
        
        // Iniciar primeira fase
        this.startPhase(this.phases[0]);
        
        // Iniciar loop de simulação
        this.simulationLoop();
    }

    simulationLoop() {
        if (!this.isSimulating) return;
        
        // Atualizar tempo da simulação
        this.updateSimulationTime();
        
        // Executar tarefas atuais
        this.executeCurrentTasks();
        
        // Atualizar trabalhadores e equipamentos
        this.updateWorkersAndEquipment();
        
        // Verificar se fase foi concluída
        if (this.isPhaseComplete()) {
            this.completeCurrentPhase();
        }
        
        // Continuar loop
        requestAnimationFrame(() => this.simulationLoop());
    }

    startPhase(phase) {
        console.log(`🏁 Iniciando fase: ${phase.name}`);
        
        // Mostrar interface da fase
        this.showPhaseInterface(phase);
        
        // Iniciar animações da fase
        this.playPhaseAnimations(phase);
        
        // Iniciar trabalhadores
        this.assignWorkersToPhase(phase);
        
        // Atualizar timeline visual
        this.updateTimeline(phase);
    }

    createExcavationAnimations() {
        return {
            terrainDeformation: {
                type: 'shader',
                vertexShader: `
                    uniform float progress;
                    varying vec2 vUv;
                    
                    void main() {
                        vUv = uv;
                        
                        // Deformar vértices baseado no progresso
                        vec3 newPosition = position;
                        
                        if (position.y < 0.0) {
                            // Afundar terreno gradualmente
                            newPosition.y -= progress * 5.0;
                        }
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                    }
                `,
                uniforms: {
                    progress: { value: 0.0 }
                }
            },
            
            excavatorAnimation: {
                model: 'excavator.glb',
                animations: [
                    {
                        name: 'dig',
                        timeline: [
                            { time: 0, action: 'move_to_position' },
                            { time: 1, action: 'lower_arm' },
                            { time: 2, action: 'dig_soil' },
                            { time: 3, action: 'lift_arm' },
                            { time: 4, action: 'dump_soil' },
                            { time: 5, action: 'return_to_start' }
                        ],
                        loop: true
                    }
                ]
            },
            
            soilParticles: {
                count: 1000,
                texture: 'soil_particle.png',
                emissionRate: 50,
                gravity: 9.8,
                lifetime: 3.0
            }
        };
    }

    createStructureAnimations() {
        return {
            columnRising: {
                type: 'growth',
                objects: ['columns'],
                duration: 2.0,
                effect: 'grow_from_bottom'
            },
            
            beamAssembly: {
                type: 'assembly',
                objects: ['beams'],
                sequence: [
                    'place_formwork',
                    'install_rebar',
                    'pour_concrete',
                    'remove_formwork'
                ],
                duration: 4.0
            },
            
            concretePouring: {
                type: 'fluid',
                source: 'concrete_mixer',
                target: 'formwork',
                flowRate: 0.5,
                texture: 'concrete_flow.png'
            },
            
            rebarInstallation: {
                type: 'procedural',
                pattern: 'rebar_grid',
                spacing: 0.15,
                diameter: 0.01,
                material: 'steel'
            }
        };
    }

    playPhaseAnimations(phase) {
        const animations = phase.animations;
        
        Object.entries(animations).forEach(([animationName, animationData]) => {
            switch(animationData.type) {
                case 'shader':
                    this.applyShaderAnimation(animationData);
                    break;
                    
                case 'growth':
                    this.playGrowthAnimation(animationData);
                    break;
                    
                case 'assembly':
                    this.playAssemblyAnimation(animationData);
                    break;
                    
                case 'fluid':
                    this.playFluidAnimation(animationData);
                    break;
                    
                case 'particle':
                    this.playParticleAnimation(animationData);
                    break;
            }
        });
    }

    playGrowthAnimation(animationData) {
        // Animação de crescimento (pilares subindo, paredes crescendo)
        const objects = this.getObjectsByType(animationData.objects);
        
        objects.forEach(object => {
            // Salvar altura original
            const originalHeight = object.scale.y;
            object.scale.y = 0.01; // Começar quase invisível
            
            // Animação de crescimento
            const growthAnimation = {
                object: object,
                targetHeight: originalHeight,
                currentHeight: 0.01,
                duration: animationData.duration,
                startTime: Date.now(),
                
                update: function(currentTime) {
                    const elapsed = (currentTime - this.startTime) / 1000;
                    const progress = Math.min(elapsed / this.duration, 1.0);
                    
                    // Curva de crescimento suave
                    const easeProgress = this.easeOutCubic(progress);
                    this.object.scale.y = easeProgress * this.targetHeight;
                    
                    // Atualizar posição para crescer do chão
                    this.object.position.y = (this.object.scale.y * this.object.userData.originalHeight) / 2;
                    
                    return progress < 1.0;
                },
                
                easeOutCubic: function(t) {
                    return 1 - Math.pow(1 - t, 3);
                }
            };
            
            this.activeAnimations.push(growthAnimation);
        });
    }

    createTimeline() {
        // Criar timeline detalhada baseada no projeto
        const elements = this.project.elements;
        
        elements.forEach(element => {
            const constructionSteps = this.getConstructionStepsForElement(element);
            
            constructionSteps.forEach(step => {
                this.timeline.push({
                    element: element,
                    step: step,
                    startTime: this.calculateStepStartTime(step),
                    duration: this.calculateStepDuration(step),
                    dependencies: this.getStepDependencies(step),
                    workersRequired: this.getWorkersRequired(step),
                    equipmentRequired: this.getEquipmentRequired(step)
                });
            });
        });
        
        // Ordenar timeline por dependências
        this.sortTimelineByDependencies();
        
        console.log(`📅 Timeline criada com ${this.timeline.length} etapas`);
    }

    exportSimulationVideo() {
        // Configurar captura de vídeo
        const videoConfig = {
            fps: 30,
            quality: 'high',
            resolution: '4K',
            duration: this.getTotalDuration() * 24 * 60 * 60, // segundos
            includeUI: false,
            cameraPaths: this.createCameraPaths(),
            timeLapseSpeed: 24 // 24x speed para timelapse
        };
        
        // Iniciar captura
        const videoRecorder = new VideoRecorder(this.engine.renderer, videoConfig);
        
        // Processar vídeo
        return videoRecorder.record()
            .then(videoBlob => {
                console.log('🎥 Vídeo de simulação exportado!');
                return videoBlob;
            });
    }
}