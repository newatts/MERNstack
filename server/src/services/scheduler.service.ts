import cron from 'node-cron';
import {
  processExpiredSubscriptions,
  processExpiredGracePeriods
} from './subscription.service';

/**
 * Initialize scheduled jobs for subscription management
 */
export function initializeScheduledJobs(): void {
  console.log('Initializing scheduled jobs...');

  // Process expired subscriptions every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running subscription expiry check...');
    try {
      await processExpiredSubscriptions();
      console.log('[CRON] Subscription expiry check completed');
    } catch (error) {
      console.error('[CRON] Error processing expired subscriptions:', error);
    }
  });

  // Process expired grace periods every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running grace period expiry check...');
    try {
      await processExpiredGracePeriods();
      console.log('[CRON] Grace period expiry check completed');
    } catch (error) {
      console.error('[CRON] Error processing expired grace periods:', error);
    }
  });

  // Process expired free access grants daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Running free access expiry check...');
    try {
      await processExpiredFreeAccess();
      console.log('[CRON] Free access expiry check completed');
    } catch (error) {
      console.error('[CRON] Error processing expired free access:', error);
    }
  });

  console.log('Scheduled jobs initialized successfully');
}

/**
 * Process expired free access grants
 */
async function processExpiredFreeAccess(): Promise<void> {
  try {
    const { BillingAccount } = await import('../models/BillingAccount');
    const now = new Date();

    const expiredAccounts = await BillingAccount.find({
      freeAccessGranted: true,
      freeAccessExpiresAt: { $lte: now, $ne: null }
    });

    console.log(`Found ${expiredAccounts.length} expired free access grants to process`);

    for (const account of expiredAccounts) {
      account.freeAccessGranted = false;
      account.freeAccessReason = undefined;
      account.freeAccessGrantedBy = undefined;
      account.freeAccessGrantedAt = undefined;
      account.freeAccessExpiresAt = undefined;

      // If account has no active subscription, suspend it
      if (!['active', 'trial'].includes(account.subscriptionStatus)) {
        account.subscriptionStatus = 'suspended';
        account.suspendedAt = now;
        account.suspensionReason = 'Free access expired';
      }

      await account.save();
      console.log(`Revoked expired free access for account ${account._id}`);
    }
  } catch (error) {
    console.error('Error processing expired free access:', error);
  }
}

/**
 * Stop all scheduled jobs (useful for testing or graceful shutdown)
 */
export function stopScheduledJobs(): void {
  cron.getTasks().forEach(task => task.stop());
  console.log('All scheduled jobs stopped');
}
