import './helpers/context_menu.js';
import './helpers/external_links.js';

import { appRenderer } from './core/renderer.js';

var el = document.querySelector('#toggle-render');
el.addEventListener('click', function () {
    if (appRenderer.isProcessInProgress()) {
        appRenderer.killProcess();
    } else {
        appRenderer.render();
    }
});
