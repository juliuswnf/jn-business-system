import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import securityMiddleware from '../middleware/securityMiddleware.js';
import ceoMiddleware from '../middleware/ceoMiddleware.js';
import ceoController from '../controllers/ceoController.js';
import ceoSubscriptionController from '../controllers/ceoSubscriptionController.js';
import * as systemController from '../controllers/systemController.js';
import * as ceoAnalyticsController from '../controllers/ceoAnalyticsController.js';
import * as ceoEmailController from '../controllers/ceoEmailController.js';
import * as ceoPaymentsController from '../controllers/ceoPaymentsController.js';
import * as ceoSupportController from '../controllers/ceoSupportController.js';
import * as ceoAuditController from '../controllers/ceoAuditController.js';
import * as ceoFeatureFlagsController from '../controllers/ceoFeatureFlagsController.js';
import * as ceoBackupsController from '../controllers/ceoBackupsController.js';

const router = express.Router();

// Apply auth middleware
router.use(authMiddleware.protect);
router.use(authMiddleware.authorize('ceo'));

// ==================== NEW CEO DASHBOARD ENDPOINTS ====================

// Get CEO Stats (fÃ¼r neues Dashboard)
router.get('/stats', ceoMiddleware.verifyCEOAuth, ceoController.getCEOStats);

// Get All Customers (Unternehmen)
router.get('/customers', ceoMiddleware.verifyCEOAuth, ceoController.getAllCustomers);

// Get CEO Subscriptions (fÃ¼r Abonnements Tab)
router.get('/ceo-subscriptions', ceoMiddleware.verifyCEOAuth, ceoController.getCEOSubscriptions);

// Error Log Management
router.get('/errors', ceoMiddleware.verifyCEOAuth, ceoController.getErrorLogs);
router.post('/errors', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoController.createErrorLog);
router.patch('/errors/:errorId/resolve', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoController.resolveError);

// User Management
router.get('/users', ceoMiddleware.verifyCEOAuth, ceoController.getAllUsers);
router.post('/users/:userId/ban', ceoMiddleware.verifyCEOAuth, ceoController.banUser);
router.post('/users/:userId/unban', ceoMiddleware.verifyCEOAuth, ceoController.unbanUser);

// ==================== EXISTING ENDPOINTS ====================

// CEO Dashboard
router.get('/dashboard', ceoMiddleware.verifyCEOAuth, ceoController.getCEODashboard);
router.get('/dashboard/overview', ceoMiddleware.verifyCEOAuth, ceoController.getSystemOverview);

// Businesses Management (Salons)
router.get('/businesses', ceoMiddleware.validateCEOBusinessAccess, ceoController.getAllBusinesses);
router.post('/businesses', securityMiddleware.validateContentType, ceoController.createBusiness);
router.put('/businesses/:businessId', securityMiddleware.validateContentType, ceoController.updateBusiness);
router.delete('/businesses/:businessId', securityMiddleware.validateContentType, ceoController.deleteBusiness);
router.post('/businesses/:businessId/suspend', securityMiddleware.validateContentType, ceoController.suspendBusiness);
router.post('/businesses/:businessId/reactivate', securityMiddleware.validateContentType, ceoController.reactivateBusiness);

// ==================== MVP SUBSCRIPTION MANAGEMENT ====================

// Get all subscriptions with filtering
router.get('/subscriptions', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getAllSubscriptions);

// Get subscription statistics
router.get('/subscriptions/stats', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getSubscriptionStats);

// Get salons expiring soon
router.get('/subscriptions/expiring', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getExpiringSoon);

// Get single salon subscription details
router.get('/subscriptions/:salonId', ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.getSalonSubscription);

// Toggle salon active status
router.patch('/subscriptions/:salonId/toggle', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.toggleSalonStatus);

// Manually update subscription status (admin override)
router.patch('/subscriptions/:salonId/status', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSubscriptionController.updateSubscriptionStatus);

// ==================== LEGACY ROUTES ====================

// Old subscription route (kept for compatibility)
router.get('/subscription-info', ceoMiddleware.verifyCEOAuth, ceoController.getSubscriptionInfo);

// Revenue reporting
router.get('/revenue', ceoMiddleware.verifyCEOAuth, ceoController.getRevenueReport);

// System Settings (Email Templates, etc)
router.get('/settings', ceoMiddleware.verifyCEOAuth, ceoController.getSystemSettings);
router.put('/settings', securityMiddleware.validateContentType, ceoController.updateSystemSettings);

// ==================== CEO HIDDEN LOGIN ROUTE ====================
// Nur über spezielle URL erreichbar
router.get('/hidden-login', (req, res) => {
  return res.json({
    success: true,
    message: 'CEO Login bereit. Bitte Token eingeben.',
    route: '/api/ceo/login'
  });
});

// ==================== CEO STATUS ROUTE ====================
// Für System-Überwachung
router.get('/status', ceoMiddleware.verifyCEOAuth, (req, res) => {
  return res.json({
    success: true,
    status: 'Online',
    version: '2.0.0',
    uptime: process.uptime()
  });
});

// ==================== SYSTEM CONTROL ROUTES ====================
// FÃ¼r das System Control Tab im CEO Dashboard

// Get status of all services
router.get('/system/status', ceoMiddleware.verifyCEOAuth, systemController.getAllServicesStatus);

// Get status of a specific service
router.get('/system/status/:serviceId', ceoMiddleware.verifyCEOAuth, systemController.getServiceStatus);

// Start a specific service
router.post('/system/start/:serviceId', ceoMiddleware.verifyCEOAuth, systemController.startService);

// Stop a specific service
router.post('/system/stop/:serviceId', ceoMiddleware.verifyCEOAuth, systemController.stopService);

// Start all services
router.post('/system/start-all', ceoMiddleware.verifyCEOAuth, systemController.startAllServices);

// Stop all services
router.post('/system/stop-all', ceoMiddleware.verifyCEOAuth, systemController.stopAllServices);

// ==================== ANALYTICS ROUTES ====================
router.get('/analytics/overview', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getAnalyticsOverview);
router.get('/analytics/revenue-chart', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getRevenueChart);
router.get('/analytics/customer-growth', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getCustomerGrowthChart);
router.get('/analytics/cohorts', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getCohortAnalysis);
router.get('/analytics/churn', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getChurnAnalysis);
router.get('/analytics/at-risk', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getAtRiskStudios);
router.get('/analytics/lifecycle-emails', ceoMiddleware.verifyCEOAuth, ceoAnalyticsController.getLifecycleEmailStats);

// ==================== EMAIL CAMPAIGNS ROUTES ====================
router.get('/email/campaigns', ceoMiddleware.verifyCEOAuth, ceoEmailController.getAllCampaigns);
router.post('/email/campaigns', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoEmailController.createCampaign);
router.get('/email/campaigns/:campaignId', ceoMiddleware.verifyCEOAuth, ceoEmailController.getCampaignDetails);
router.post('/email/campaigns/:campaignId/send', ceoMiddleware.verifyCEOAuth, ceoEmailController.sendCampaign);
router.post('/email/campaigns/:campaignId/cancel', ceoMiddleware.verifyCEOAuth, ceoEmailController.cancelCampaign);
router.delete('/email/campaigns/:campaignId', ceoMiddleware.verifyCEOAuth, ceoEmailController.deleteCampaign);
router.get('/email/templates', ceoMiddleware.verifyCEOAuth, ceoEmailController.getEmailTemplates);
router.get('/email/stats', ceoMiddleware.verifyCEOAuth, ceoEmailController.getEmailStats);

// ==================== PAYMENTS ROUTES ====================
router.get('/payments/transactions', ceoMiddleware.verifyCEOAuth, ceoPaymentsController.getAllTransactions);
router.get('/payments/overview', ceoMiddleware.verifyCEOAuth, ceoPaymentsController.getPaymentOverview);
router.get('/payments/transactions/:transactionId', ceoMiddleware.verifyCEOAuth, ceoPaymentsController.getTransactionDetails);
router.post('/payments/transactions/:transactionId/refund', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoPaymentsController.processRefund);
router.get('/payments/payouts', ceoMiddleware.verifyCEOAuth, ceoPaymentsController.getPayoutSchedule);
router.get('/payments/by-plan', ceoMiddleware.verifyCEOAuth, ceoPaymentsController.getRevenueByPlan);

// ==================== SUPPORT TICKETS ROUTES ====================
router.get('/support/tickets', ceoMiddleware.verifyCEOAuth, ceoSupportController.getAllTickets);
router.post('/support/tickets', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSupportController.createTicket);
router.get('/support/tickets/stats', ceoMiddleware.verifyCEOAuth, ceoSupportController.getTicketStats);
router.get('/support/tickets/:ticketId', ceoMiddleware.verifyCEOAuth, ceoSupportController.getTicketDetails);
router.patch('/support/tickets/:ticketId', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSupportController.updateTicket);
router.post('/support/tickets/:ticketId/reply', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoSupportController.addReply);

// ==================== AUDIT LOG ROUTES ====================
router.get('/audit/logs', ceoMiddleware.verifyCEOAuth, ceoAuditController.getAuditLogs);
router.get('/audit/logs/:logId', ceoMiddleware.verifyCEOAuth, ceoAuditController.getLogDetails);
router.get('/audit/stats', ceoMiddleware.verifyCEOAuth, ceoAuditController.getAuditStats);
router.get('/audit/alerts', ceoMiddleware.verifyCEOAuth, ceoAuditController.getSecurityAlerts);
router.get('/audit/export', ceoMiddleware.verifyCEOAuth, ceoAuditController.exportAuditLogs);

// ==================== FEATURE FLAGS ROUTES ====================
router.get('/feature-flags', ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.getAllFlags);
router.post('/feature-flags', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.createFlag);
router.get('/feature-flags/:flagId', ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.getFlagDetails);
router.patch('/feature-flags/:flagId', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.updateFlag);
router.post('/feature-flags/:flagId/toggle', ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.toggleFlag);
router.delete('/feature-flags/:flagId', ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.deleteFlag);
router.post('/feature-flags/:flagId/customer', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.updateCustomerFlag);
router.get('/feature-flags/check/:flagKey/:salonId', ceoMiddleware.verifyCEOAuth, ceoFeatureFlagsController.checkFlagForCustomer);

// ==================== BACKUPS ROUTES ====================
router.get('/backups', ceoMiddleware.verifyCEOAuth, ceoBackupsController.getAllBackups);
router.post('/backups', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoBackupsController.createBackup);
router.get('/backups/schedule', ceoMiddleware.verifyCEOAuth, ceoBackupsController.getBackupSchedule);
router.put('/backups/schedule', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoBackupsController.updateBackupSchedule);
router.get('/backups/:backupId', ceoMiddleware.verifyCEOAuth, ceoBackupsController.getBackupDetails);
router.delete('/backups/:backupId', ceoMiddleware.verifyCEOAuth, ceoBackupsController.deleteBackup);
router.post('/backups/:backupId/restore', securityMiddleware.validateContentType, ceoMiddleware.verifyCEOAuth, ceoBackupsController.restoreBackup);
router.get('/backups/:backupId/download', ceoMiddleware.verifyCEOAuth, ceoBackupsController.downloadBackup);

export default router;
