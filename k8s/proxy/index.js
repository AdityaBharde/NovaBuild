const express = require('express');
const http = require('http');
const httpProxy = require('http-proxy');

const app = express();
const proxy = httpProxy.createProxyServer({
    ws: true,
    changeOrigin: true
});

const PREVIEW_NAMESPACE = process.env.PREVIEW_NAMESPACE || 'novabuild-preview';
const PREVIEW_PORT = process.env.RUNNER_PORT || 5173;
const PORT = process.env.PORT || 3000;

function resolveTarget(hostHeader) {
    if (!hostHeader) return null;

    // Strips off port if present and gets the leftmost subdomain
    const cleanHost = hostHeader.split(':')[0];
    const parts = cleanHost.split('.');
    const subdomain = parts[0];

    if (!subdomain) return null;

    // Resolves to the internal ClusterIP service created for that project runner
    return `http://${subdomain}.${PREVIEW_NAMESPACE}.svc.cluster.local:${PREVIEW_PORT}`;
}

// 1. Handle HTTP Requests
app.use((req, res) => {
    const target = resolveTarget(req.headers.host);

    if (!target) {
        return res.status(400).send('Invalid preview host header.');
    }

    proxy.web(req, res, { target }, (err) => {
        console.error(`[Proxy Error] Unable to route to ${target}: ${err.message}`);
        if (!res.headersSent) {
            res.status(502).send(
                '<h3>Preview container is booting up or currently unavailable.</h3>' +
                '<p>Please wait a moment and refresh the page.</p>'
            );
        }
    });
});

const server = http.createServer(app);

// 2. Handle WebSocket Connections (Required for Vite HMR)
server.on('upgrade', (req, socket, head) => {
    const target = resolveTarget(req.headers.host);

    if (!target) {
        socket.destroy();
        return;
    }

    proxy.ws(req, socket, head, { target }, (err) => {
        console.error(`[WebSocket Proxy Error] Failed upgrading socket to ${target}: ${err.message}`);
        socket.destroy();
    });
});

proxy.on('error', (err, req, res) => {
    console.error('[HTTP-Proxy General Error]:', err.message);
});

server.listen(PORT, () => {
    console.log(`[NovaBuild Proxy] Listening on port ${PORT}`);
    console.log(`[NovaBuild Proxy] Routing traffic to namespace: ${PREVIEW_NAMESPACE}:${PREVIEW_PORT}`);
});