import { app, remote, ipcRenderer } from 'electron';
import fs from 'fs';
import printf from 'printf';
import { appManager } from './manager';
import { exec, spawn } from 'child_process';

export class AppRenderer {
    constructor() {
        let electronApp = app;
        if (electronApp === undefined) {
            electronApp = remote.app;
        }
        
        this.tmpDir = electronApp.getPath('temp');
        this.renderOutput = electronApp.getPath('userData') + '/renders';
        this.pythonScriptPath = this.tmpDir + '/tmp_python.py';
        this.pythonScript = `import bpy
for scene in bpy.data.scenes:
    scene.render.use_border = %s
    scene.render.use_crop_to_border = %s
    scene.render.border_min_x = %.4f
    scene.render.border_max_x = %.4f
    scene.render.border_min_y = %.4f
    scene.render.border_max_y = %.4f
    scene.render.tile_x = %d
    scene.render.tile_y = %d
    scene.render.resolution_percentage = %.4f
    scene.render.resolution_x = %d
    scene.render.resolution_y = %d
bpy.ops.render.render()`;
        
        this.blender = {
            engine: 'CYCLES',
            renderFormat: 'PNG',
            renderFrame: 1,
        };

        this.sceneOptions = {
            useBorder: true,
            useCropToBorder: true,
            minX: 0,
            maxX: 1,
            minY: 0,
            maxY: 1,
            tileX: 32,
            tileY: 32,
            resolutionPercentage: 100,
            resolutionX: 1920,
            resolutionY: 1080,
        };
        
        // Process
        this.process = null;
        this.processLog = [];
    }
    
    render() {
        this.saveTmpPythonFile();
        this.executeBlender();
    }
    
    saveTmpPythonFile() {
        fs.writeFileSync(
            this.pythonScriptPath,
            printf(
                this.pythonScript,
                this.sceneOptions.useBorder ? 'True' : 'False',
                this.sceneOptions.useCropToBorder ? 'True' : 'False',
                this.sceneOptions.minX,
                this.sceneOptions.maxX,
                this.sceneOptions.minY,
                this.sceneOptions.maxY,
                this.sceneOptions.tileX,
                this.sceneOptions.tileY,
                this.sceneOptions.resolutionPercentage,
                this.sceneOptions.resolutionX,
                this.sceneOptions.resolutionY,
            )
        );
    }
    
    executeBlender() {
        this.process = spawn(
            appManager.getCurrentMachine().blenderExecutionPath,
            [
                '--background', 'data/test.blend',
                '--engine', this.blender.engine,
                '--python', this.pythonScriptPath,
                '--render-output', printf(
                    '%s/frame_###',
                    this.renderOutput
                ),
                '--render-format', this.blender.renderFormat,
                '--render-frame', this.blender.renderFrame,
            ],
            {
                detached: true,
            }
        );
        
        const self = this;
        let data = '';
        let lines = [];

        this.process.stdout.on('data', (data) => {
            data = ''+data;
            lines = data.split("\n");
            
            for (var i = 0; i < lines.length; i++) {
                const row = lines[i].trim();
                if (row) {
                    self.processLog.push(row);
                }
            }
            
            var index = self.processLog.length-1;
            if (index >= 0) {
                var line = self.processLog[index];
                console.log(line);
            }
        });
        
        // When it's done or closed unexpected, then close the process
        this.process.on('close', () => { self.killProcess(); });
        this.process.on('exit', () => { self.killProcess(); });
        
        // Send the process to the main thread
        ipcRenderer.send('new-pid', this.process.pid);
    }
    
    isProcessInProgress() {
        return this.process !== null
            && this.process !== undefined;
    }
    
    killProcess() {
        if (this.isProcessInProgress()) {
            this.process.kill();
            this.process = null;
        }
        
        return true;
    }
}

export let appRenderer = new AppRenderer();
