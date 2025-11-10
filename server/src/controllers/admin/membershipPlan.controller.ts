import { Response } from 'express';
import { AuthRequest } from '../../types';
import MembershipPlan from '../../models/MembershipPlan';

/**
 * Get all membership plans
 */
export async function getAllPlans(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { active } = req.query;

    const filter: any = {};
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const plans = await MembershipPlan.find(filter).sort({ displayOrder: 1, createdAt: -1 });

    res.json({ plans, count: plans.length });
  } catch (error) {
    console.error('Error getting membership plans:', error);
    res.status(500).json({ error: 'Failed to get membership plans' });
  }
}

/**
 * Get a specific membership plan
 */
export async function getPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      res.status(404).json({ error: 'Membership plan not found' });
      return;
    }

    res.json({ plan });
  } catch (error) {
    console.error('Error getting membership plan:', error);
    res.status(500).json({ error: 'Failed to get membership plan' });
  }
}

/**
 * Create a new membership plan
 */
export async function createPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?._id;

    const plan = await MembershipPlan.create({
      ...req.body,
      createdBy: userId,
      updatedBy: userId
    });

    res.status(201).json({
      message: 'Membership plan created successfully',
      plan
    });
  } catch (error: any) {
    console.error('Error creating membership plan:', error);

    if (error.code === 11000) {
      res.status(400).json({ error: 'A plan with this name already exists' });
      return;
    }

    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to create membership plan' });
  }
}

/**
 * Update a membership plan
 */
export async function updatePlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      res.status(404).json({ error: 'Membership plan not found' });
      return;
    }

    Object.assign(plan, req.body);
    plan.updatedBy = userId;
    await plan.save();

    res.json({
      message: 'Membership plan updated successfully',
      plan
    });
  } catch (error: any) {
    console.error('Error updating membership plan:', error);

    if (error.name === 'ValidationError') {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: 'Failed to update membership plan' });
  }
}

/**
 * Delete a membership plan
 */
export async function deletePlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const plan = await MembershipPlan.findById(id);

    if (!plan) {
      res.status(404).json({ error: 'Membership plan not found' });
      return;
    }

    // Soft delete - just deactivate the plan
    plan.active = false;
    await plan.save();

    res.json({
      message: 'Membership plan deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    res.status(500).json({ error: 'Failed to delete membership plan' });
  }
}

/**
 * Get public membership plans (active plans only, for customer-facing pages)
 */
export async function getPublicPlans(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const plans = await MembershipPlan.find({ active: true })
      .select('-createdBy -updatedBy -stripePriceId -stripeProductId')
      .sort({ displayOrder: 1 });

    res.json({ plans, count: plans.length });
  } catch (error) {
    console.error('Error getting public membership plans:', error);
    res.status(500).json({ error: 'Failed to get membership plans' });
  }
}
