import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.IO server
    * @param {string|null} token - Optional JWT access token for backward compatibility
   */
    connect(token = null) {
    if (this.socket && this.connected) {
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const SOCKET_URL = API_URL.replace('/api', ''); // Remove /api suffix

    const authPayload = {};
    if (token) {
      authPayload.token = token;
    }

    this.socket = io(SOCKET_URL, {
      auth: authPayload,
      withCredentials: true,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;

      // Reconnect is handled by socket.io itself. Ignore expected client-side disconnects.
      if (reason === 'io client disconnect') {
        return;
      }
    });

    this.socket.on('connect_error', () => {
      this.connected = false;
    });

    // Re-attach all existing listeners when reconnecting
    this.socket.on('reconnect', () => {
      this.listeners.forEach((callback, event) => {
        this.socket.on(event, callback);
      });
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  /**
   * Subscribe to a Socket.IO event
   * @param {string} event - Event name
   * @param {function} callback - Callback function
   */
  on(event, callback) {
    if (!this.socket) {
      return;
    }

    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  /**
   * Unsubscribe from a Socket.IO event
   * @param {string} event - Event name
   */
  off(event) {
    if (!this.socket) {
      return;
    }

    const callback = this.listeners.get(event);
    if (callback) {
      this.socket.off(event, callback);
      this.listeners.delete(event);
    }
  }

  /**
   * Emit a Socket.IO event (note: server only handles client-initiated events if configured)
   * @param {string} event - Event name
   * @param {any} data - Data to send
   */
  emit(event, data) {
    if (!this.socket || !this.connected) {
      return;
    }

    this.socket.emit(event, data);
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }
}

// Export singleton instance
export default new SocketService();
