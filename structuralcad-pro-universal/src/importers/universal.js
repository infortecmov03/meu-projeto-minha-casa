/**
 * Importador Universal - Suporta TODOS formatos 3D/2D
 */
class UniversalImporter {
    constructor() {
        this.supportedFormats = this.getAllSupportedFormats();
        this.converters = this.initializeConverters();
        this.cache = new Map();
    }

    getAllSupportedFormats() {
        return {
            // FORMATOS 3D
            '3D_MODELS': {
                'BLENDER': ['.blend', '.dae', '.abc', '.ply', '.stl', '.obj', '.fbx', '.x3d', '.wrl'],
                'AUTOCAD_3D': ['.dwg', '.dxf', '.dwt', '.sat'],
                'SKETCHUP': ['.skp', '.dae'],
                'REVIT': ['.rvt', '.rfa', '.ifc'],
                '3DS_MAX': ['.3ds', '.max', '.ase'],
                'MAYA': ['.mb', '.ma'],
                'SWEET_HOME_3D': ['.sh3d', '.obj'],
                'RHINOCEROS': ['.3dm'],
                'SOLIDWORKS': ['.sldprt', '.sldasm', '.step', '.iges'],
                'INVENTOR': ['.ipt', '.iam'],
                'ARCHICAD': ['.pla'],
                'LUMION': ['.ls', '.lsf'],
                'UNITY': ['.unitypackage', '.fbx'],
                'UNREAL': ['.uasset', '.fbx'],
                'COLLADA': ['.dae'],
                'GLTF/GLB': ['.gltf', '.glb'],
                'USDZ': ['.usdz'],
                'PLY': ['.ply'],
                'STL': ['.stl'],
                'OBJ': ['.obj'],
                'FBX': ['.fbx'],
                'X3D': ['.x3d'],
                'VRML': ['.wrl', '.vrml']
            },

            // FORMATOS 2D
            '2D_CAD': {
                'AUTOCAD_2D': ['.dwg', '.dxf', '.dwt', '.dws'],
                'DRAFTSIGHT': ['.dwg', '.dxf'],
                'LIBRECAD': ['.dxf'],
                'QCAD': ['.dxf'],
                'VECTORWORKS': ['.mcd'],
                'MICROSTATION': ['.dgn'],
                'PDF_VECTOR': ['.pdf']
            },

            // FORMATOS DE IMAGEM/TEXTURA
            'TEXTURES': {
                'STANDARD': ['.jpg', '.jpeg', '.png', '.bmp', '.tga', '.tiff', '.tif', '.hdr', '.exr'],
                'PHOTOSHOP': ['.psd', '.psb'],
                'GIMP': ['.xcf'],
                'SUBSTANCE': ['.sbsar', '.sbs'],
                'MATERIAL': ['.mtl']
            },

            // FORMATOS DE PROJETO
            'PROJECT_FILES': {
                'SWEET_HOME_3D': ['.sh3d'],
                'HOMESTYLER': ['.json'],
                'PLANNER_5D': ['.json'],
                'ROOMSAKETCHER': ['.rks'],
                'PIXLR': ['.pxd']
            },

            // FORMATOS DE DADOS
            'DATA': {
                'SPREADSHEET': ['.xlsx', '.xls', '.csv'],
                'JSON': ['.json'],
                'XML': ['.xml'],
                'SQLITE': ['.sqlite', '.db']
            }
        };
    }

    async importFile(file) {
        const extension = this.getFileExtension(file.name);
        const formatInfo = this.detectFormat(extension);
        
        try {
            // Verificar cache
            const cacheKey = `${file.name}_${file.lastModified}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Ler arquivo
            const fileData = await this.readFile(file);
            
            // Converter para formato interno
            const internalModel = await this.convertToInternalFormat(fileData, formatInfo);
            
            // Processar texturas e materiais
            await this.processMaterials(internalModel, file);
            
            // Otimizar geometria
            const optimizedModel = this.optimizeGeometry(internalModel);
            
            // Cache
            this.cache.set(cacheKey, optimizedModel);
            
            console.log(`✅ Arquivo ${file.name} importado com sucesso!`);
            console.log(`📊 Estatísticas:`);
            console.log(`   • Vértices: ${optimizedModel.vertices.length}`);
            console.log(`   • Faces: ${optimizedModel.faces.length}`);
            console.log(`   • Texturas: ${optimizedModel.materials.length}`);
            console.log(`   • Objetos: ${optimizedModel.objects.length}`);
            
            return optimizedModel;
            
        } catch (error) {
            console.error(`❌ Erro ao importar ${file.name}:`, error);
            throw new Error(`Falha na importação: ${error.message}`);
        }
    }

    async convertToInternalFormat(fileData, formatInfo) {
        switch(formatInfo.type) {
            case 'BLENDER':
                return await this.convertBlender(fileData);
            case 'AUTOCAD_3D':
                return await this.convertAutoCAD3D(fileData);
            case 'SKETCHUP':
                return await this.convertSketchup(fileData);
            case 'REVIT':
                return await this.convertRevit(fileData);
            case 'SWEET_HOME_3D':
                return await this.convertSweetHome3D(fileData);
            case 'GLTF/GLB':
                return await this.convertGLTF(fileData);
            case 'OBJ':
                return await this.convertOBJ(fileData);
            case 'FBX':
                return await this.convertFBX(fileData);
            default:
                return await this.convertGeneric(fileData, formatInfo);
        }
    }

    async convertBlender(blendData) {
        // Usar WebAssembly para processar arquivos .blend
        const blendParser = await import('./blender/blend-parser.wasm');
        return await blendParser.parse(blendData);
    }

    async convertSweetHome3D(sh3dData) {
        // Sweet Home 3D usa XML com recursos embutidos
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(
            new TextDecoder().decode(sh3dData), 
            'application/xml'
        );
        
        return {
            metadata: {
                name: xmlDoc.querySelector('name')?.textContent || 'Untitled',
                version: xmlDoc.querySelector('version')?.textContent,
                creator: xmlDoc.querySelector('creator')?.textContent
            },
            walls: this.extractWalls(xmlDoc),
            furniture: this.extractFurniture(xmlDoc),
            floors: this.extractFloors(xmlDoc),
            textures: this.extractTextures(xmlDoc)
        };
    }

    async convertAutoCAD3D(dwgData) {
        // Usar Teigha ou OpenDesign para DWG
        const teigha = await this.loadTeigha();
        return teigha.convert(dwgData, {
            includeTextures: true,
            includeLayers: true,
            convertToMesh: true
        });
    }
}