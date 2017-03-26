// General
const printf = require('printf');
const os = require('os');
const ip = require('ip');
const fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

// Image
// https://github.com/zhangyuanwei/node-images -- for glueing images together

// Network
const net = require('net');
const Socket = net.Socket;

// SSH -- https://github.com/mscdex/ssh2
const sshClient = require('ssh2').Client;
const sshServer = require('ssh2').Server;

// Machines
const machines = [];
const currentMachine = {
    os: '',
    host: '',
    hostname: '',
    userinfo: {},
    username: '',
    password: '',
    identity_file: '',
    blender_exec: '',
}

// Blender settings
// http://blender.stackexchange.com/questions/3082/specify-tile-size-for-blender-cycles-rendering-via-command-line
// https://arachnoid.com/python/blender_network_render/
// https://docs.blender.org/api/blender_python_api_2_77_0/bpy.types.RenderSettings.html
// https://docs.blender.org/manual/it/dev/render/workflows/command_line.html
let blenderSettings = {
    output_path:  __dirname,
    format: 'PNG',
    engine: 'CYCLES',
}
let tmpDir = os.tmpdir();
let blenderTmpScriptPath = tmpDir + '/tmp_script.py';
let blenderTmpScript = `import bpy
for scene in bpy.data.scenes:
    scene.render.use_border = True
    #scene.render.use_crop_to_border = True
    scene.render.border_min_x = %.4f
    scene.render.border_max_x = %.4f
    scene.render.border_min_y = %.4f
    scene.render.border_max_y = %.4f
    #scene.render.tile_x = 32
    #scene.render.tile_y = 32
bpy.ops.render.render()`;

/***** Prepare current machine *****/
function prepareCurrentMachine() {
    currentMachine.os = os.platform();
    currentMachine.host = ip.address();
    currentMachine.hostname = os.hostname();
    currentMachine.userinfo = os.userInfo();
    currentMachine.username = currentMachine.userinfo.username;
    currentMachine.password = 'kamikaze';
    currentMachine.identity_file = '~/.ssh/id_dsa.pub';
    currentMachine.blender_exec = currentMachine.os === 'linux'
        ? 'blender'
        : (currentMachine.os === 'darwin'
            ? '/Applications/blender.app/Contents/MacOS/blender'
            : (currentMachine.os === 'win32'
                ? 'C:\Program Files\Blender Foundation\Blender\Blender.exe'
                : ''
            ));
}
prepareCurrentMachine();

/***** Scan the port for available local machines *****/
function scanPort(port, host, callback) {
    const client = new Socket();
    let timeout = 1500;
    
    client.setTimeout(timeout);
    client.on('connect', function() {
        callback(port, host);
        client.end();
    });
    client.on('data', function(data) { });
    client.on('timeout', function() { client.destroy(); });
    client.on('error', function(exception) { });
    client.on('close', function(exception) { });
    
    client.connect(port, host);
}
for (var i = 1; i < 256; i++) {
    scanPort(22, '192.168.1.' + i, function(port, host) {
        console.log('Port ' + port + ' for host ' + host + ' is open.');
    });
}

/***** Connect to those machines and check if we can use them *****/
// TODO

/***** Do render *****/
function doRender() {
    // Prepare tmp script
    const log = [];
    const minX = 0;
    const maxX = 1;
    const minY = 0;
    const maxY = 1;
    
    fs.writeFileSync(
        blenderTmpScriptPath,
        printf(
            blenderTmpScript,
            minX, maxX,
            minY, maxY
        )
    );
    
    // Do actual execution
    // https://docs.blender.org/manual/en/dev/advanced/command_line/arguments.html
    const blenderExecution = spawn(
        currentMachine.blender_exec,
        [
            '--background', 'test.blend',
            '--engine', blenderSettings.engine,
            '--python', blenderTmpScriptPath,
            '--render-output', printf('%s/frame_###', blenderSettings.output_path),
            '--render-format', blenderSettings.format,
            '--render-frame', '1',
        ]
    );
    
    blenderExecution.stdout.on('data', function(data) {
        data = ''+data;
        lines = data.split("\n");
        
        for (var i = 0; i < lines.length; i++) {
            const row = lines[i].trim();
            if (row) {
                log.push(row);
            }
        }
        
        var index = log.length-1;
        if (index >= 0) {
            var line = log[index];
            console.log(line);
        }
    });
}
doRender();
