import { Response } from 'express';
import { AuthRequest } from '../../types';
import { BillingAccount } from '../../models/BillingAccount';
import User from '../../models/User';
import {
  createSubscription,
  cancelSubscription,
  renewSubscription
} from '../../services/subscription.service';

/**
 * Get all billing accounts (admin view)
 */
export async function getAllBillingAccounts(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const filter: any = {};
    if (status) {
      filter.subscriptionStatus = status;
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const [accounts, total] = await Promise.all([
      BillingAccount.find(filter)
        .populate('userId', 'email profile')
        .populate('membershipPlanId', 'name planType price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      BillingAccount.countDocuments(filter)
    ]);

    res.json({
      accounts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error getting billing accounts:', error);
    res.status(500).json({ error: 'Failed to get billing accounts' });
  }
}

/**
 * Get a specific billing account
 */
export async function getBillingAccount(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const account = await BillingAccount.findById(id)
      .populate('userId', 'email profile roles')
      .populate('membershipPlanId');

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    res.json({ account });
  } catch (error) {
    console.error('Error getting billing account:', error);
    res.status(500).json({ error: 'Failed to get billing account' });
  }
}

/**
 * Grant free access to a user
 */
export async function grantFreeAccess(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const adminId = req.user?._id;
    const { reason, expiresAt } = req.body;

    const account = await BillingAccount.findById(id);

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    account.freeAccessGranted = true;
    account.freeAccessReason = reason || 'Granted by administrator';
    account.freeAccessGrantedBy = adminId;
    account.freeAccessGrantedAt = new Date();

    if (expiresAt) {
      account.freeAccessExpiresAt = new Date(expiresAt);
    }

    // If account was suspended, reactivate it
    if (account.subscriptionStatus === 'suspended') {
      account.subscriptionStatus = 'active';
      account.suspendedAt = undefined;
      account.suspensionReason = undefined;
    }

    await account.save();

    res.json({
      message: 'Free access granted successfully',
      account
    });
  } catch (error) {
    console.error('Error granting free access:', error);
    res.status(500).json({ error: 'Failed to grant free access' });
  }
}

/**
 * Revoke free access from a user
 */
export async function revokeFreeAccess(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const account = await BillingAccount.findById(id);

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    account.freeAccessGranted = false;
    account.freeAccessReason = undefined;
    account.freeAccessGrantedBy = undefined;
    account.freeAccessGrantedAt = undefined;
    account.freeAccessExpiresAt = undefined;

    await account.save();

    res.json({
      message: 'Free access revoked successfully',
      account
    });
  } catch (error) {
    console.error('Error revoking free access:', error);
    res.status(500).json({ error: 'Failed to revoke free access' });
  }
}

/**
 * Enable or disable billing for a user
 */
export async function toggleBilling(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { billingEnabled } = req.body;

    if (billingEnabled === undefined) {
      res.status(400).json({ error: 'billingEnabled field is required' });
      return;
    }

    const account = await BillingAccount.findById(id);

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    account.billingEnabled = billingEnabled;

    // If enabling billing and account was suspended, keep it suspended
    // If disabling billing and account was suspended, reactivate it
    if (!billingEnabled && account.subscriptionStatus === 'suspended') {
      account.subscriptionStatus = 'active';
      account.suspendedAt = undefined;
      account.suspensionReason = undefined;
    }

    await account.save();

    res.json({
      message: `Billing ${billingEnabled ? 'enabled' : 'disabled'} successfully`,
      account
    });
  } catch (error) {
    console.error('Error toggling billing:', error);
    res.status(500).json({ error: 'Failed to toggle billing' });
  }
}

/**
 * Override subscription status
 */
export async function overrideSubscriptionStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'inactive', 'trial', 'cancelled', 'suspended', 'grace_period'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid subscription status' });
      return;
    }

    const account = await BillingAccount.findById(id);

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    const oldStatus = account.subscriptionStatus;
    account.subscriptionStatus = status;

    if (status === 'suspended') {
      account.suspendedAt = new Date();
      account.suspensionReason = reason || 'Manually suspended by administrator';
    } else if (status === 'active' || status === 'trial') {
      account.suspendedAt = undefined;
      account.suspensionReason = undefined;
      account.gracePeriodEndDate = undefined;
    }

    await account.save();

    res.json({
      message: `Subscription status changed from ${oldStatus} to ${status}`,
      account
    });
  } catch (error) {
    console.error('Error overriding subscription status:', error);
    res.status(500).json({ error: 'Failed to override subscription status' });
  }
}

/**
 * Assign membership plan to a billing account
 */
export async function assignMembershipPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { membershipPlanId, startImmediately = true } = req.body;

    if (!membershipPlanId) {
      res.status(400).json({ error: 'membershipPlanId is required' });
      return;
    }

    const account = await createSubscription(id, membershipPlanId, startImmediately);

    if (!account) {
      res.status(404).json({ error: 'Billing account or membership plan not found' });
      return;
    }

    res.json({
      message: 'Membership plan assigned successfully',
      account
    });
  } catch (error: any) {
    console.error('Error assigning membership plan:', error);
    res.status(500).json({ error: error.message || 'Failed to assign membership plan' });
  }
}

/**
 * Cancel a user's subscription
 */
export async function adminCancelSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { immediate = false } = req.body;

    const account = await cancelSubscription(id, immediate);

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    res.json({
      message: `Subscription ${immediate ? 'cancelled immediately' : 'scheduled for cancellation'}`,
      account
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
}

/**
 * Manually renew a subscription
 */
export async function adminRenewSubscription(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const account = await renewSubscription(id);

    if (!account) {
      res.status(404).json({ error: 'Billing account or membership plan not found' });
      return;
    }

    res.json({
      message: 'Subscription renewed successfully',
      account
    });
  } catch (error: any) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({ error: error.message || 'Failed to renew subscription' });
  }
}

/**
 * Get usage statistics for a billing account
 */
export async function getUsageStatistics(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const account = await BillingAccount.findById(id).populate('membershipPlanId');

    if (!account) {
      res.status(404).json({ error: 'Billing account not found' });
      return;
    }

    // Convert Map to object for JSON response
    const usageObj: Record<string, number> = {};
    if (account.currentPeriodUsage) {
      account.currentPeriodUsage.forEach((value, key) => {
        usageObj[key] = value;
      });
    }

    res.json({
      billingAccountId: account._id,
      currentPeriodUsage: usageObj,
      subscriptionStatus: account.subscriptionStatus,
      subscriptionStartDate: account.subscriptionStartDate,
      subscriptionEndDate: account.subscriptionEndDate,
      membershipPlan: account.membershipPlanId
    });
  } catch (error) {
    console.error('Error getting usage statistics:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
}
