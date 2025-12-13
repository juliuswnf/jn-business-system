// ==================== EXPORT MVP MODELS ONLY ====================

export { default as User } from './User.js';
export { default as Salon } from './Salon.js';
export { default as Service } from './Service.js';
export { default as Booking } from './Booking.js';
export { default as Payment } from './Payment.js';
export { default as EmailQueue } from './EmailQueue.js';
export { default as EmailLog } from './EmailLog.js';

// ==================== CEO MANAGEMENT MODELS ====================
export { default as SupportTicket } from './SupportTicket.js';
export { default as AuditLog } from './AuditLog.js';
export { default as FeatureFlag } from './FeatureFlag.js';
export { default as Backup } from './Backup.js';

// ==================== DEFAULT EXPORT ====================

export default {
  User: () => import('./User.js'),
  Salon: () => import('./Salon.js'),
  Service: () => import('./Service.js'),
  Booking: () => import('./Booking.js'),
  Payment: () => import('./Payment.js'),
  EmailQueue: () => import('./EmailQueue.js'),
  EmailLog: () => import('./EmailLog.js'),
  SupportTicket: () => import('./SupportTicket.js'),
  AuditLog: () => import('./AuditLog.js'),
  FeatureFlag: () => import('./FeatureFlag.js'),
  Backup: () => import('./Backup.js')
};
