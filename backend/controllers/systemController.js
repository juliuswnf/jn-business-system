import logger from '../utils/logger.js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * System Controller
 * Manages starting/stopping of WebApp services from CEO Dashboard
 * Optimized for Windows
 */

// Service configurations
const SERVICES = {
  mongodb: {
    name: 'MongoDB Atlas',
    port: 27017,
    type: 'cloud', // We use MongoDB Atlas (cloud)
    containerName: 'jn-business-system-mongodb',
    image: 'mongo:latest'
  },
  redis: {
    name: 'Redis',
    port: 6379,
    type: 'optional', // Redis is optional - not needed for basic functionality
    containerName: 'jn-business-system-redis',
    image: 'redis:alpine'
  },
  backend: {
    name: 'Backend',
    port: 5000,
    type: 'node',
    cwd: path.join(PROJECT_ROOT, 'backend')
  },
  frontend: {
    name: 'Frontend',
    port: 3000,
    type: 'node',
    cwd: path.join(PROJECT_ROOT, 'frontend')
  }
};

// Store running processes
const runningProcesses = {};

// ==================== HELPER FUNCTIONS ====================

// Check if port is in use using netstat (non-blocking, doesn't interfere with ports)
const checkPortInUse = async (port) => {
  try {
    const isWindows = process.platform === 'win32';
    if (isWindows) {
      // Use PowerShell for language-independent check (works on German/English Windows)
      // Check for both LISTENING (English) and ABHÖREN (German)
      const { stdout } = await execAsync(
        `powershell -Command "netstat -ano | Select-String ':${port}' | Select-String 'LISTENING|ABHÖREN'"`,
        { timeout: 5000 }
      );
      return stdout.trim().length > 0;
    } else {
      const { stdout } = await execAsync(`lsof -i:${port} -t 2>/dev/null`, { timeout: 5000 });
      return stdout.trim().length > 0;
    }
  } catch {
    return false; // Port not in use or command failed
  }
};

// Check Docker container status
const checkDockerContainer = async (containerName) => {
  try {
    const { stdout } = await execAsync(`docker inspect -f "{{.State.Running}}" ${containerName}`, { timeout: 10000 });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
};

// Start Docker container
const startDockerContainer = async (service) => {
  // First check if port is already in use (maybe by local service or another container)
  const portInUse = await checkPortInUse(service.port);
  if (portInUse) {
    // Port is in use - check if it's our container
    const containerRunning = await checkDockerContainer(service.containerName);
    if (containerRunning) {
      return { success: true, message: 'Container already running' };
    }
    // Port is used by something else - that's fine, service is available
    return { success: true, message: `${service.name} is already available on port ${service.port}` };
  }

  try {
    // First try to start existing container
    await execAsync(`docker start ${service.containerName}`, { timeout: 30000 });
    return { success: true, message: 'Container started' };
  } catch {
    // Container doesn't exist, create and run it
    try {
      // First remove any stopped container with same name
      try {
        await execAsync(`docker rm ${service.containerName}`, { timeout: 10000 });
      } catch {
        // Container doesn't exist, that's fine
      }

      let runCommand;
      if (service.containerName === 'jn-business-system-mongodb') {
        runCommand = `docker run -d --name ${service.containerName} -p ${service.port}:27017 ${service.image}`;
      } else if (service.containerName === 'jn-business-system-redis') {
        runCommand = `docker run -d --name ${service.containerName} -p ${service.port}:6379 ${service.image}`;
      }

      await execAsync(runCommand, { timeout: 60000 });
      return { success: true, message: 'Container created and started' };
    } catch (error) {
      // If port is already allocated, service is already running (maybe local install)
      if (error.message.includes('port is already allocated')) {
        return { success: true, message: `${service.name} is already running locally` };
      }
      return { success: false, message: error.message };
    }
  }
};

// Stop Docker container
const stopDockerContainer = async (containerName) => {
  try {
    await execAsync(`docker stop ${containerName}`, { timeout: 30000 });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Start Node.js service (Frontend) - Windows optimized
const startNodeService = async (service, serviceId) => {
  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // Windows: use spawn with an argument array — avoids shell interpolation of service.cwd
      const child = spawn('cmd.exe', ['/c', 'start', service.name, 'cmd', '/k', `cd /d "${service.cwd}" && npm run dev`], {
        cwd: service.cwd,
        detached: true,
        stdio: 'ignore',
        shell: false
      });
      child.unref();
      return { success: true, message: 'Process started in new window' };
    } else {
      // Unix: Use nohup
      const child = spawn('nohup', ['npm', 'run', 'dev'], {
        cwd: service.cwd,
        detached: true,
        stdio: 'ignore',
        env: { ...process.env }
      });

      child.unref();
      runningProcesses[serviceId] = child.pid;

      return { success: true, pid: child.pid };
    }
  } catch (error) {
    logger.error(`startNodeService error: ${error.message}`);
    return { success: false, message: error.message };
  }
};

// Stop Node.js service by port - Windows optimized
const stopNodeService = async (port) => {
  const isWindows = process.platform === 'win32';

  try {
    if (isWindows) {
      // Windows: Find all PIDs on this port and kill them (works on German/English Windows)
      try {
        const { stdout } = await execAsync(
          `powershell -Command "netstat -ano | Select-String ':${port}' | Select-String 'LISTENING|ABHÖREN'"`,
          { timeout: 5000 }
        );
        const lines = stdout.trim().split('\n');

        const pidsKilled = new Set();
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && !isNaN(parseInt(pid)) && !pidsKilled.has(pid)) {
            pidsKilled.add(pid);
            try {
              await execAsync(`taskkill /F /PID ${pid}`, { timeout: 5000 });
              logger.log(`Killed process ${pid} on port ${port}`);
            } catch {
              // Ignore if process already dead
            }
          }
        }
      } catch {
        // No process found on port
      }
      return { success: true };
    } else {
      await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, { timeout: 5000 });
      return { success: true };
    }
  } catch {
    return { success: true, message: 'Process not running' };
  }
};

// ==================== GET SERVICE STATUS ====================

async function resolveServiceStatus(service) {
  if (service.type === 'cloud') return 'running';
  if (service.type === 'optional') return 'disabled';
  if (service.type === 'docker') return (await checkDockerContainer(service.containerName)) ? 'running' : 'stopped';
  return (await checkPortInUse(service.port)) ? 'running' : 'stopped';
}

async function doStartService(service, serviceId) {
  if (service.type === 'cloud') return { status: 200, body: { success: true, message: `${service.name} is a cloud service and is always running`, status: 'running' } };
  if (service.type === 'optional') return { status: 200, body: { success: true, message: `${service.name} is optional and not required for basic functionality`, status: 'disabled' } };
  if (service.type === 'docker') {
    if (await checkDockerContainer(service.containerName)) return { status: 200, body: { success: true, message: `${service.name} is already running`, status: 'running' } };
    const result = await startDockerContainer(service);
    return result.success
      ? { status: 200, body: { success: true, message: `${service.name} started successfully`, status: 'running' } }
      : { status: 500, body: { success: false, message: `Failed to start ${service.name}: ${result.message}` } };
  }
  // Node.js service
  if (await checkPortInUse(service.port)) return { status: 200, body: { success: true, message: `${service.name} is already running`, status: 'running' } };
  if (serviceId === 'backend') return { status: 200, body: { success: true, message: 'Backend is the current process', status: 'running' } };
  const result = await startNodeService(service, serviceId);
  if (!result.success) return { status: 500, body: { success: false, message: `Failed to start ${service.name}: ${result.message}` } };
  logger.log(`? Started ${service.name}`);
  await new Promise(resolve => setTimeout(resolve, 4000));
  const nowRunning = await checkPortInUse(service.port);
  return { status: 200, body: { success: true, message: `${service.name} ${nowRunning ? 'started successfully' : 'is starting...'}`, status: nowRunning ? 'running' : 'starting', pid: result.pid } };
}

async function doStopService(service, serviceId) {
  if (serviceId === 'backend') return { status: 400, body: { success: false, message: 'Cannot stop backend server while it is handling requests' } };
  if (service.type === 'cloud') return { status: 400, body: { success: false, message: `${service.name} is a cloud service and cannot be stopped from here` } };
  if (service.type === 'optional') return { status: 200, body: { success: true, message: `${service.name} is optional and not running`, status: 'disabled' } };
  if (service.type === 'docker') {
    const result = await stopDockerContainer(service.containerName);
    return result.success
      ? { status: 200, body: { success: true, message: `${service.name} stopped successfully`, status: 'stopped' } }
      : { status: 500, body: { success: false, message: `Failed to stop ${service.name}: ${result.message}` } };
  }
  await stopNodeService(service.port);
  delete runningProcesses[serviceId];
  logger.log(`? Stopped ${service.name}`);
  return { status: 200, body: { success: true, message: `${service.name} stopped successfully`, status: 'stopped' } };
}

export const getServiceStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }
    const { serviceId } = req.params;
    const service = SERVICES[serviceId];
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    const status = await resolveServiceStatus(service);
    res.status(200).json({ success: true, service: serviceId, status, port: service.port, type: service.type });
  } catch (error) {
    logger.error('GetServiceStatus Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== START SERVICE ====================
export const startService = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    const { serviceId } = req.params;
    const service = SERVICES[serviceId];
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    const { status, body } = await doStartService(service, serviceId);
    return res.status(status).json(body);
  } catch (error) {
    logger.error('StartService Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== STOP SERVICE ====================
export const stopService = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    const { serviceId } = req.params;
    const service = SERVICES[serviceId];
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    const { status, body } = await doStopService(service, serviceId);
    return res.status(status).json(body);
  } catch (error) {
    logger.error('StopService Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== START ALL SERVICES ====================
export const startAllServices = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') return res.status(403).json({ success: false, message: 'Access denied - CEO only' });

    const results = [];
    const startOrder = ['mongodb', 'redis', 'backend', 'frontend'];

    for (const serviceId of startOrder) {
      const service = SERVICES[serviceId];
      try {
        if (service.type === 'cloud') { results.push({ service: serviceId, success: true, message: 'Cloud service (always running)', status: 'running' }); continue; }
        if (service.type === 'optional') { results.push({ service: serviceId, success: true, message: 'Optional (not required)', status: 'disabled' }); continue; }

        const isRunning = service.type === 'docker'
          ? await checkDockerContainer(service.containerName)
          : await checkPortInUse(service.port);
        if (isRunning) { results.push({ service: serviceId, success: true, message: 'Already running', status: 'running' }); continue; }

        const { body } = await doStartService(service, serviceId);
        results.push({ service: serviceId, ...body });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to start ${serviceId}:`, error);
        results.push({ service: serviceId, success: false, message: error.message, status: 'error' });
      }
    }

    logger.log('?? Start all services completed');
    res.status(200).json({ success: true, message: 'Services started', results });
  } catch (error) {
    logger.error('StartAllServices Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== STOP ALL SERVICES ====================
export const stopAllServices = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }

    const results = [];
    const stopOrder = ['frontend', 'redis', 'mongodb']; // Don't stop backend

    for (const serviceId of stopOrder) {
      const service = SERVICES[serviceId];

      try {
        // Skip cloud services
        if (service.type === 'cloud') {
          results.push({
            service: serviceId,
            success: true,
            message: 'Cloud service (cannot be stopped)',
            status: 'running'
          });
          continue;
        }

        // Skip optional services
        if (service.type === 'optional') {
          results.push({
            service: serviceId,
            success: true,
            message: 'Optional (not running)',
            status: 'disabled'
          });
          continue;
        }

        if (service.type === 'docker') {
          const result = await stopDockerContainer(service.containerName);
          results.push({
            service: serviceId,
            success: true,
            message: result.success ? 'Stopped successfully' : 'Not running',
            status: 'stopped'
          });
        } else {
          await stopNodeService(service.port);
          results.push({
            service: serviceId,
            success: true,
            message: 'Stopped successfully',
            status: 'stopped'
          });
        }
      } catch (error) {
        results.push({
          service: serviceId,
          success: true, // Consider it success if not running
          message: 'Not running or already stopped',
          status: 'stopped'
        });
      }
    }

    // Note about backend
    results.push({
      service: 'backend',
      success: true,
      message: 'Backend not stopped (required for this request)',
      status: 'running'
    });

    logger.log('? Stop all services completed');

    res.status(200).json({
      success: true,
      message: 'Services stopped (except backend)',
      results
    });
  } catch (error) {
    logger.error('StopAllServices Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== GET ALL SERVICES STATUS ====================
export const getAllServicesStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }

    const statuses = {};

    for (const [serviceId, service] of Object.entries(SERVICES)) {
      let status = 'unknown';

      try {
        if (service.type === 'cloud') {
          // Cloud services are always running if we can respond to this request
          status = 'running';
        } else if (service.type === 'optional') {
          // Optional services (Redis) - not required
          status = 'disabled';
        } else if (service.type === 'docker') {
          const isRunning = await checkDockerContainer(service.containerName);
          status = isRunning ? 'running' : 'stopped';
        } else {
          const portInUse = await checkPortInUse(service.port);
          status = portInUse ? 'running' : 'stopped';
        }
      } catch {
        status = 'error';
      }

      statuses[serviceId] = {
        name: service.name,
        status,
        port: service.port,
        type: service.type
      };
    }

    res.status(200).json({
      success: true,
      services: statuses
    });
  } catch (error) {
    logger.error('GetAllServicesStatus Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export default {
  getServiceStatus,
  startService,
  stopService,
  startAllServices,
  stopAllServices,
  getAllServicesStatus
};
