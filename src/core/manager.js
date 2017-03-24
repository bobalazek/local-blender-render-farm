import os from 'os';
import ip from 'ip';

export class AppManager {
    constructor() {
        this.machines = [];
        this.localMachines = [];
        this.currentMachine = {};
    }
    
    /**
     * @return array Get the list of all our saved machines.
     */
    getMachines() {
        return this.machines;
    }
    
    /**
     * @return array Get the machines in our local network.
     */
    getLocalMachines() {
        return this.localMachines;
    }
    
    /**
     * @return object Get out current machine.
     */
    getCurrentMachine() {
        this.prepareCurrentMachine();
        
        return this.currentMachine;
    }
    
    /**
     * Prepares/hydrates the current machine data.
     */
    prepareCurrentMachine() {
        this.currentMachine.os = os.platform();
        this.currentMachine.host = ip.address();
        this.currentMachine.hostname = os.hostname();
        this.currentMachine.userinfo = os.userInfo();
        this.currentMachine.username = this.currentMachine.userinfo.username;
        this.currentMachine.password  = '';
        this.currentMachine.identityFile = '~/.ssh/id_dsa.pub';
        this.currentMachine.blenderExecutionPath = this.currentMachine.os === 'linux'
            ? 'blender'
            : (this.currentMachine.os === 'darwin'
                ? '/Applications/blender.app/Contents/MacOS/blender'
                : (this.currentMachine.os === 'win32'
                    ? 'C:\Program Files\Blender Foundation\Blender\Blender.exe'
                    : ''
                ));
        this.currentMachine.cpuSpeed = null; // TODO
    
        return this.currentMachine;
    }
}

export let appManager = new AppManager();
