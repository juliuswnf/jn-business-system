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
    name: 'MongoDB',
    port: 27017,
    type: 'docker',
    containerName: 'jn-automation-mongodb',
    image: 'mongo:latest'
  },
  redis: {
    name: 'Redis',
    port: 6379,
    type: 'docker',
    containerName: 'jn-automation-redis',
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
      const { stdout } = await execAsync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { timeout: 5000 });
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
      if (service.containerName === 'jn-automation-mongodb') {
        runCommand = `docker run -d --name ${service.containerName} -p ${service.port}:27017 ${service.image}`;
      } else if (service.containerName === 'jn-automation-redis') {
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
      // Windows: Start in a new PowerShell window that stays open
      const escapedPath = service.cwd.replace(/'/g, "''");
      const psScript = `
        cd '${escapedPath}'
        Write-Host 'Starting ${service.name}...' -ForegroundColor Cyan
        npm run dev
      `;

      // Use Start-Process to create a completely independent process
      const startCommand = `Start-Process powershell -ArgumentList '-NoExit', '-Command', "${psScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}" -WindowStyle Normal`;

      await execAsync(`powershell -Command "${startCommand}"`, { timeout: 10000 });

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
      // Windows: Find all PIDs on this port and kill them
      try {
        const { stdout } = await execAsync(`netstat -ano | findstr ":${port}" | findstr "LISTENING"`, { timeout: 5000 });
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
export const getServiceStatus = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }

    const { serviceId } = req.params;
    const service = SERVICES[serviceId];

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    let status = 'unknown';

    if (service.type === 'docker') {
      const isRunning = await checkDockerContainer(service.containerName);
      status = isRunning ? 'running' : 'stopped';
    } else {
      const portInUse = await checkPortInUse(service.port);
      status = portInUse ? 'running' : 'stopped';
    }

    res.status(200).json({
      success: true,
      service: serviceId,
      status,
      port: service.port
    });
  } catch (error) {
    logger.error('GetServiceStatus Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== START SERVICE ====================
export const startService = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }

    const { serviceId } = req.params;
    const service = SERVICES[serviceId];

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (service.type === 'docker') {
      // Check if already running
      const isRunning = await checkDockerContainer(service.containerName);
      if (isRunning) {
        return res.status(200).json({
          success: true,
          message: `${service.name} is already running`,
          status: 'running'
        });
      }

      const result = await startDockerContainer(service);
      if (result.success) {
        logger.log(`✅ Started Docker container: ${service.containerName}`);
        return res.status(200).json({
          success: true,
          message: `${service.name} started successfully`,
          status: 'running'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Failed to start ${service.name}: ${result.message}`
        });
      }
    } else {
      // Node.js service
      const portInUse = await checkPortInUse(service.port);
      if (portInUse) {
        return res.status(200).json({
          success: true,
          message: `${service.name} is already running`,
          status: 'running'
        });
      }

      // Can't start backend from here (it's already running)
      if (serviceId === 'backend') {
        return res.status(200).json({
          success: true,
          message: 'Backend is the current process',
          status: 'running'
        });
      }

      const result = await startNodeService(service, serviceId);
      if (result.success) {
        logger.log(`✅ Started ${service.name}`);

        // Wait a bit for the service to start
        await new Promise(resolve => setTimeout(resolve, 4000));

        const nowRunning = await checkPortInUse(service.port);

        return res.status(200).json({
          success: true,
          message: `${service.name} ${nowRunning ? 'started successfully' : 'is starting...'}`,
          status: nowRunning ? 'running' : 'starting',
          pid: result.pid
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Failed to start ${service.name}: ${result.message}`
        });
      }
    }
  } catch (error) {
    logger.error('StartService Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== STOP SERVICE ====================
export const stopService = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }

    const { serviceId } = req.params;
    const service = SERVICES[serviceId];

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Don't stop backend
    if (serviceId === 'backend') {
      return res.status(400).json({
        success: false,
        message: 'Cannot stop backend server while it is handling requests'
      });
    }

    if (service.type === 'docker') {
      const result = await stopDockerContainer(service.containerName);
      if (result.success) {
        logger.log(`⏹ Stopped Docker container: ${service.containerName}`);
        return res.status(200).json({
          success: true,
          message: `${service.name} stopped successfully`,
          status: 'stopped'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Failed to stop ${service.name}: ${result.message}`
        });
      }
    } else {
      await stopNodeService(service.port);
      delete runningProcesses[serviceId];
      logger.log(`⏹ Stopped ${service.name}`);

      return res.status(200).json({
        success: true,
        message: `${service.name} stopped successfully`,
        status: 'stopped'
      });
    }
  } catch (error) {
    logger.error('StopService Error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// ==================== START ALL SERVICES ====================
export const startAllServices = async (req, res) => {
  try {
    if (req.user.role !== 'ceo') {
      return res.status(403).json({ success: false, message: 'Access denied - CEO only' });
    }

    const results = [];
    const startOrder = ['mongodb', 'redis', 'backend', 'frontend'];

    for (const serviceId of startOrder) {
      const service = SERVICES[serviceId];

      try {
        // Check if already running
        let isRunning = false;
        if (service.type === 'docker') {
          isRunning = await checkDockerContainer(service.containerName);
        } else {
          isRunning = await checkPortInUse(service.port);
        }

        if (isRunning) {
          results.push({
            service: serviceId,
            success: true,
            message: 'Already running',
            status: 'running'
          });
          continue;
        }

        // Start service
        if (service.type === 'docker') {
          const result = await startDockerContainer(service);
          results.push({
            service: serviceId,
            success: result.success,
            message: result.success ? 'Started successfully' : result.message,
            status: result.success ? 'running' : 'error'
          });
        } else {
          // Skip backend since it's already running
          if (serviceId === 'backend') {
            results.push({
              service: serviceId,
              success: true,
              message: 'Already running (current process)',
              status: 'running'
            });
            continue;
          }

          const result = await startNodeService(service, serviceId);
          results.push({
            service: serviceId,
            success: result.success,
            message: result.success ? 'Started successfully' : result.message,
            status: result.success ? 'starting' : 'error',
            pid: result.pid
          });
        }

        // Wait between starts
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        logger.error(`Failed to start ${serviceId}:`, error);
        results.push({
          service: serviceId,
          success: false,
          message: error.message,
          status: 'error'
        });
      }
    }

    logger.log('🚀 Start all services completed');

    res.status(200).json({
      success: true,
      message: 'Services started',
      results
    });
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

    logger.log('⏹ Stop all services completed');

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
        if (service.type === 'docker') {
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
