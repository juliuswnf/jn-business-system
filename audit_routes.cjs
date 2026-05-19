const fs = require('fs');
const path = require('path');

const serverJs = fs.readFileSync('backend/server.js', 'utf8');

// 1. Map imports to filenames
const importMap = {};
const importRegex = /import\s+(\w+)\s+from\s+['"]\.\/routes\/([^'"]+)['"]/g;
let match;
while ((match = importRegex.exec(serverJs)) !== null) {
    let fileName = match[2];
    if (!fileName.endsWith('.js')) fileName += '.js';
    importMap[match[1]] = fileName;
}

// 2. Map mount paths to imports and check for protect/authorize
const mounts = [];
const mountRegex = /app\.use\(['"]([^'"]+)['"]\s*,\s*([^)]*)\)/g;
while ((match = mountRegex.exec(serverJs)) !== null) {
    const mountPath = match[1];
    const args = match[2].split(',').map(s => s.trim());
    const routeVar = args[args.length - 1];
    const middleware = args.slice(0, -1).join(' ');
    
    if (importMap[routeVar]) {
        mounts.push({
            path: mountPath.replace(/\/$/, ''),
            file: importMap[routeVar],
            protect: /protect|authenticate/.test(middleware),
            authorize: /authorize|requireRole/.test(middleware)
        });
    }
}

const results = [];

// 3. Process each route file
const routeFiles = fs.readdirSync('backend/routes');
routeFiles.forEach(file => {
    if (!file.endsWith('.js')) return;
    const content = fs.readFileSync(path.join('backend/routes', file), 'utf8');
    
    // File-level middleware (router.use)
    const routerUseRegex = /router\.use\(([^)]*)\)/g;
    let fileProtect = false;
    let fileRequireRole = false;
    while ((match = routerUseRegex.exec(content)) !== null) {
        if (/protect|authenticate/.test(match[1])) fileProtect = true;
        if (/authorize|requireRole/.test(match[1])) fileRequireRole = true;
    }

    // Individual routes
    const routeRegex = /router\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]\s*,([\s\S]*?)\)/gi;
    while ((match = routeRegex.exec(content)) !== null) {
        const method = match[1].toUpperCase();
        const routeSubPath = match[2];
        const routeArgs = match[3].split(',').map(s => s.trim()).join(' ');

        const routeProtect = fileProtect || /protect|authenticate|authMiddleware\.protect|requireAuth/.test(routeArgs);
        const routeRequireRole = fileRequireRole || /requireRole|authorize/.test(routeArgs);
        
        const mountList = mounts.filter(m => m.file === file);
        if (mountList.length === 0) {
            mountList.push({ path: '/unknown', protect: false, authorize: false });
        }

        mountList.forEach(mount => {
            const effectiveProtect = mount.protect || routeProtect;
            const effectiveRequireRole = mount.authorize || routeRequireRole;

            let classification = 'green';
            const fullPath = mount.path + (routeSubPath.startsWith('/') ? routeSubPath : '/' + routeSubPath);
            const isPublicKnown = /auth|public|webhook|widget/i.test(file) || /login|register|forgot|reset|callback|webhook|public/i.test(fullPath);
            
            if (isPublicKnown) {
                classification = 'public-known';
            } else if (!effectiveProtect) {
                classification = 'red';
            } else if (effectiveProtect && !effectiveRequireRole && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
                classification = 'yellow';
            }

            results.push({
                file,
                method,
                path: fullPath,
                mountProtect: mount.protect,
                routeProtect,
                requireRole: effectiveRequireRole,
                classification
            });
        });
    }
});

// Output
console.log('file|method|path|mountProtect|routeProtect|requireRole|classification');
results.forEach(r => {
    console.log(`${r.file}|${r.method}|${r.path}|${r.mountProtect}|${r.routeProtect}|${r.requireRole}|${r.classification}`);
});

console.log('\n--- Summary ---');
const totals = results.reduce((acc, r) => {
    acc[r.classification] = (acc[r.classification] || 0) + 1;
    return acc;
}, {});
['green', 'yellow', 'red', 'public-known'].forEach(cls => {
    console.log(`${cls}: ${totals[cls] || 0}`);
});

console.log('\n--- Red/Yellow Details (Grouped by File) ---');
const problematic = results.filter(r => r.classification === 'red' || r.classification === 'yellow');
const grouped = problematic.reduce((acc, r) => {
    if (!acc[r.file]) acc[r.file] = [];
    acc[r.file].push(r);
    return acc;
}, {});

Object.entries(grouped).forEach(([file, routes]) => {
    console.log(`\n${file}:`);
    routes.sort((a, b) => a.classification.localeCompare(b.classification)).forEach(r => {
        console.log(`  [${r.classification.toUpperCase()}] ${r.method} ${r.path} (m:${r.mountProtect}, r:${r.routeProtect}, role:${r.requireRole})`);
    });
});
