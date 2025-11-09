import { BillingAccount } from '../models/BillingAccount';
import MembershipPlan, { BillingInterval, PlanType } from '../models/MembershipPlan';
import { UsageRecord } from '../models/UsageRecord';
import SystemSettings from '../models/SystemSettings';
import { IBillingAccount } from '../types';

/**
 * Calculate the next billing date based on billing interval
 */
export function calculateNextBillingDate(
  startDate: Date,
  interval: BillingInterval,
  intervalCount: number = 1
): Date {
  const nextDate = new Date(startDate);

  switch (interval) {
    case BillingInterval.DAILY:
      nextDate.setDate(nextDate.getDate() + intervalCount);
      break;
    case BillingInterval.WEEKLY:
      nextDate.setDate(nextDate.getDate() + (7 * intervalCount));
      break;
    case BillingInterval.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + intervalCount);
      break;
    case BillingInterval.QUARTERLY:
      nextDate.setMonth(nextDate.getMonth() + (3 * intervalCount));
      break;
    case BillingInterval.SEMI_ANNUAL:
      nextDate.setMonth(nextDate.getMonth() + (6 * intervalCount));
      break;
    case BillingInterval.YEARLY:
      nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
      break;
  }

  return nextDate;
}

/**
 * Create or update a subscription for a billing account
 */
export async function createSubscription(
  billingAccountId: string,
  membershipPlanId: string,
  startImmediately: boolean = true
): Promise<IBillingAccount | null> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount) {
      throw new Error('Billing account not found');
    }

    const plan = await MembershipPlan.findById(membershipPlanId);
    if (!plan || !plan.active) {
      throw new Error('Membership plan not found or inactive');
    }

    const now = new Date();
    let subscriptionStartDate = now;
    let subscriptionEndDate: Date;
    let nextBillingDate: Date | undefined;
    let trialEndDate: Date | undefined;
    let status: 'active' | 'trial' = 'active';

    // Handle trial period
    if (plan.trialEnabled && plan.trialDays && plan.trialDays > 0) {
      status = 'trial';
      trialEndDate = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
      subscriptionEndDate = trialEndDate;
    } else {
      // Calculate subscription end date based on plan type
      if (plan.planType === PlanType.TIME_BASED || plan.planType === PlanType.HYBRID) {
        if (!plan.billingInterval) {
          throw new Error('Billing interval required for time-based or hybrid plans');
        }

        subscriptionEndDate = calculateNextBillingDate(
          subscriptionStartDate,
          plan.billingInterval,
          plan.intervalCount
        );

        if (plan.autoRenew) {
          nextBillingDate = subscriptionEndDate;
        }
      } else {
        // Usage-based or free plans don't have a strict end date
        // Set far future date
        subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      }
    }

    // Update billing account
    billingAccount.membershipPlanId = membershipPlanId;
    billingAccount.subscriptionStatus = status;
    billingAccount.subscriptionStartDate = subscriptionStartDate;
    billingAccount.subscriptionEndDate = subscriptionEndDate;
    billingAccount.nextBillingDate = nextBillingDate;
    billingAccount.trialEndDate = trialEndDate;
    billingAccount.currentPeriodUsage = new Map();

    await billingAccount.save();

    return billingAccount;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Renew a subscription
 */
export async function renewSubscription(
  billingAccountId: string
): Promise<IBillingAccount | null> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount || !billingAccount.membershipPlanId) {
      throw new Error('Billing account or membership plan not found');
    }

    const plan = await MembershipPlan.findById(billingAccount.membershipPlanId);
    if (!plan || !plan.active) {
      throw new Error('Membership plan not found or inactive');
    }

    // Calculate new subscription period
    const now = new Date();
    const subscriptionStartDate = billingAccount.subscriptionEndDate || now;

    let subscriptionEndDate: Date;
    let nextBillingDate: Date | undefined;

    if (plan.planType === PlanType.TIME_BASED || plan.planType === PlanType.HYBRID) {
      if (!plan.billingInterval) {
        throw new Error('Billing interval required for time-based or hybrid plans');
      }

      subscriptionEndDate = calculateNextBillingDate(
        subscriptionStartDate,
        plan.billingInterval,
        plan.intervalCount
      );

      if (plan.autoRenew) {
        nextBillingDate = subscriptionEndDate;
      }
    } else {
      subscriptionEndDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }

    // Update billing account
    billingAccount.subscriptionStatus = 'active';
    billingAccount.subscriptionStartDate = subscriptionStartDate;
    billingAccount.subscriptionEndDate = subscriptionEndDate;
    billingAccount.nextBillingDate = nextBillingDate;
    billingAccount.gracePeriodEndDate = undefined;
    billingAccount.suspendedAt = undefined;
    billingAccount.suspensionReason = undefined;
    billingAccount.currentPeriodUsage = new Map(); // Reset usage for new period

    await billingAccount.save();

    return billingAccount;
  } catch (error) {
    console.error('Error renewing subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  billingAccountId: string,
  immediate: boolean = false
): Promise<IBillingAccount | null> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount) {
      throw new Error('Billing account not found');
    }

    if (immediate) {
      billingAccount.subscriptionStatus = 'cancelled';
      billingAccount.subscriptionEndDate = new Date();
      billingAccount.nextBillingDate = undefined;
    } else {
      // Cancel at end of current period
      billingAccount.subscriptionStatus = 'cancelled';
      billingAccount.nextBillingDate = undefined;
    }

    await billingAccount.save();

    return billingAccount;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Check and update expired subscriptions
 * This should be run as a scheduled job (e.g., every hour or daily)
 */
export async function processExpiredSubscriptions(): Promise<void> {
  try {
    const now = new Date();

    // Find all subscriptions that have ended
    const expiredAccounts = await BillingAccount.find({
      subscriptionStatus: { $in: ['active', 'trial'] },
      subscriptionEndDate: { $lte: now },
      billingEnabled: true, // Only process if billing is enabled
      freeAccessGranted: false // Skip if free access is granted
    });

    console.log(`Found ${expiredAccounts.length} expired subscriptions to process`);

    for (const account of expiredAccounts) {
      const plan = account.membershipPlanId
        ? await MembershipPlan.findById(account.membershipPlanId)
        : null;

      if (!plan) {
        // No plan, suspend immediately
        account.subscriptionStatus = 'suspended';
        account.suspendedAt = now;
        account.suspensionReason = 'Subscription expired - no active plan';
        await account.save();
        continue;
      }

      // Check if auto-renew is enabled
      if (plan.autoRenew && account.nextBillingDate) {
        try {
          // Attempt to renew
          await renewSubscription(account._id.toString());
          console.log(`Auto-renewed subscription for account ${account._id}`);
        } catch (error) {
          console.error(`Failed to auto-renew subscription for account ${account._id}:`, error);
          // Enter grace period if renewal fails
          await enterGracePeriod(account._id.toString(), plan.gracePeriodDays);
        }
      } else {
        // No auto-renew, enter grace period
        await enterGracePeriod(account._id.toString(), plan.gracePeriodDays);
      }
    }
  } catch (error) {
    console.error('Error processing expired subscriptions:', error);
  }
}

/**
 * Enter grace period for a subscription
 */
export async function enterGracePeriod(
  billingAccountId: string,
  gracePeriodDays: number
): Promise<void> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount) {
      throw new Error('Billing account not found');
    }

    const now = new Date();
    const gracePeriodEndDate = new Date(now.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);

    billingAccount.subscriptionStatus = 'grace_period';
    billingAccount.gracePeriodEndDate = gracePeriodEndDate;

    await billingAccount.save();

    console.log(`Account ${billingAccountId} entered grace period until ${gracePeriodEndDate}`);
  } catch (error) {
    console.error('Error entering grace period:', error);
    throw error;
  }
}

/**
 * Process accounts in grace period that have expired
 */
export async function processExpiredGracePeriods(): Promise<void> {
  try {
    const now = new Date();

    const gracePeriodAccounts = await BillingAccount.find({
      subscriptionStatus: 'grace_period',
      gracePeriodEndDate: { $lte: now }
    });

    console.log(`Found ${gracePeriodAccounts.length} grace periods that have expired`);

    for (const account of gracePeriodAccounts) {
      account.subscriptionStatus = 'suspended';
      account.suspendedAt = now;
      account.suspensionReason = 'Grace period expired';
      await account.save();

      console.log(`Suspended account ${account._id} after grace period expiry`);
    }
  } catch (error) {
    console.error('Error processing expired grace periods:', error);
  }
}

/**
 * Check if a user has access based on their subscription status
 */
export async function hasActiveSubscription(billingAccountId: string): Promise<boolean> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount) {
      return false;
    }

    // Free access granted by admin
    if (billingAccount.freeAccessGranted) {
      // Check if free access has expired
      if (billingAccount.freeAccessExpiresAt) {
        return new Date() < billingAccount.freeAccessExpiresAt;
      }
      return true;
    }

    // Billing disabled for this account
    if (!billingAccount.billingEnabled) {
      return true;
    }

    // Check subscription status
    const activeStatuses = ['active', 'trial', 'grace_period'];
    return activeStatuses.includes(billingAccount.subscriptionStatus);
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
}

/**
 * Track usage for a billing account
 */
export async function trackUsage(
  billingAccountId: string,
  metric: string,
  amount: number,
  unit: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount) {
      throw new Error('Billing account not found');
    }

    // Update current period usage
    const currentUsage = billingAccount.currentPeriodUsage?.get(metric) || 0;
    billingAccount.currentPeriodUsage?.set(metric, currentUsage + amount);
    await billingAccount.save();

    // Create usage record
    await UsageRecord.create({
      userId: billingAccount.userId,
      billingAccountId: billingAccountId,
      type: metric as any,
      amount,
      unit,
      cost: 0, // Cost calculation can be done separately
      metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
}

/**
 * Check if usage limit has been exceeded
 */
export async function checkUsageLimit(
  billingAccountId: string,
  metric: string
): Promise<{ exceeded: boolean; current: number; limit?: number; hardLimit?: boolean }> {
  try {
    const billingAccount = await BillingAccount.findById(billingAccountId);
    if (!billingAccount || !billingAccount.membershipPlanId) {
      return { exceeded: false, current: 0 };
    }

    const plan = await MembershipPlan.findById(billingAccount.membershipPlanId);
    if (!plan) {
      return { exceeded: false, current: 0 };
    }

    // Find the usage limit for this metric
    const usageLimit = plan.usageLimits.find(limit => limit.metric === metric);
    if (!usageLimit) {
      return { exceeded: false, current: 0 };
    }

    const currentUsage = billingAccount.currentPeriodUsage?.get(metric) || 0;

    return {
      exceeded: currentUsage >= usageLimit.limit,
      current: currentUsage,
      limit: usageLimit.limit,
      hardLimit: usageLimit.hardLimit
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return { exceeded: false, current: 0 };
  }
}
