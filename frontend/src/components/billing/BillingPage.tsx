import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CreditCard,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Subscription, Plan } from '../../types';
import {
  getSubscription,
  syncCheckoutSession,
  getPlans,
  createCheckoutSession,
  createCustomerPortalSession,
} from '../../api/client';
import { Badge } from '../common/Badge';

interface BillingPageProps {
  subscription: Subscription | null;
  onSubscriptionUpdated: (sub: Subscription) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({
  subscription,
  onSubscriptionUpdated,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<number | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [canceledBanner, setCanceledBanner] = useState<boolean>(false);

  useEffect(() => {
    loadPlans();
    checkReturnParams();
  }, []);

  const loadPlans = async () => {
    setIsLoadingPlans(true);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (e) {
      console.error('Failed to load plans', e);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const checkReturnParams = async () => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success === 'true' || sessionId) {
      setSuccessBanner(
        'Payment successful! Activating your upgraded subscription...'
      );
      searchParams.delete('success');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });

      // Synchronize session and refresh subscription from authoritative backend
      try {
        const freshSub = await syncCheckoutSession(sessionId || undefined);
        if (freshSub && freshSub.plan && freshSub.plan.id > 0) {
          onSubscriptionUpdated(freshSub);
          setSuccessBanner(
            `Payment successful! Your account is now upgraded to ${freshSub.plan.name}.`
          );
        } else {
          // Poll up to 4 times (every 1.5s) in case webhooks or Stripe processing take a few moments
          let attempts = 0;
          const interval = setInterval(async () => {
            attempts++;
            const sub = await getSubscription();
            if (sub && sub.plan && sub.plan.id > 0) {
              onSubscriptionUpdated(sub);
              setSuccessBanner(
                `Payment successful! Your account is now upgraded to ${sub.plan.name}.`
              );
              clearInterval(interval);
            } else if (attempts >= 4) {
              clearInterval(interval);
              if (sub) onSubscriptionUpdated(sub);
            }
          }, 1500);
        }
      } catch (e) {
        console.warn('Could not immediately refresh subscription:', e);
      }
    } else if (canceled === 'true') {
      setCanceledBanner(true);
      searchParams.delete('canceled');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
    }
  };

  const handleCheckout = async (planId: number) => {
    setIsProcessingCheckout(planId);
    setErrorMessage(null);

    try {
      const res = await createCheckoutSession(planId);
      if (res && res.checkoutUrl) {
        // Real Stripe redirect
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned by backend.');
      }
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      setErrorMessage(
        err.message || 'Failed to initiate Stripe Checkout session. Please check connection.'
      );
      setIsProcessingCheckout(null);
    }
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    setErrorMessage(null);

    try {
      const res = await createCustomerPortalSession();
      if (res && res.portalUrl) {
        // Redirect to Stripe Customer Portal
        window.location.href = res.portalUrl;
      } else {
        throw new Error('No customer portal URL returned by backend.');
      }
    } catch (err: any) {
      console.error('Customer portal error:', err);
      setErrorMessage(
        err.message ||
          'Unable to access Stripe Customer Portal. You may need an active paid subscription first.'
      );
      setIsOpeningPortal(false);
    }
  };

  const currentPlan = subscription?.plan;
  const currentPlanId = currentPlan ? currentPlan.id : 0;
  const currentStatus = subscription?.status || 'ACTIVE';
  const isPaidUser = currentPlanId > 0;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page Title */}
      <div className="pb-4 border-b border-border/60">
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Subscription & Billing
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Manage your subscription tier, billing cycle, payment methods, and invoices via Stripe.
        </p>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-[#7950e8]/15 border border-[#7950e8]/30 flex items-start gap-3 text-[#c4b5fd] animate-slide-up">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[#a78bfa]" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-sm">Payment Confirmed</h4>
            <p className="mt-0.5 text-text-secondary">{successBanner}</p>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-text-secondary hover:text-text-primary text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Canceled Notification */}
      {canceledBanner && (
        <div className="p-4 rounded-xl bg-surface border border-border flex items-start gap-3 text-text-secondary animate-slide-up">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-text-primary text-sm">Checkout Canceled</h4>
            <p className="mt-0.5">
              Your Stripe Checkout session was cancelled. No charges were made to your account.
            </p>
          </div>
          <button
            onClick={() => setCanceledBanner(false)}
            className="text-text-secondary hover:text-text-primary text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-3 text-rose-400 animate-slide-up">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-semibold text-sm">Billing Operation Failed</h4>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-300 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase font-semibold tracking-wider text-text-secondary">
                Current Plan
              </span>
              <Badge variant={isPaidUser ? 'violet' : 'default'} size="sm">
                {currentStatus}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold text-text-primary">
              {currentPlan?.name || 'Starter Plan'}
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {currentPlan?.price || (isPaidUser ? '₹499/month' : '₹0 - Free forever')}
              {subscription?.currentPeriodEnd && (
                <span>
                  {' '}
                  · Next renewal:{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isPaidUser && (
              <button
                disabled={isOpeningPortal}
                onClick={handleOpenPortal}
                className="flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface border border-border rounded-lg text-xs font-medium text-text-primary transition-colors disabled:opacity-50"
              >
                {isOpeningPortal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5" />
                )}
                <span>Manage Billing in Stripe</span>
              </button>
            )}
          </div>
        </div>

        {/* Quota breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/50 text-xs">
          <div className="p-3 rounded-lg bg-surface-elevated border border-border/60">
            <span className="text-text-secondary text-[11px] block mb-1">
              Max Active Projects
            </span>
            <span className="font-semibold text-text-primary text-sm">
              {currentPlan?.maxProjects || 3} Projects
            </span>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated border border-border/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-[11px] block">
                Daily AI Capacity
              </span>
              <span className="text-[11px] text-[#c4b5fd] font-medium">
                {currentPlan?.unlimitedAi ? 'Unlimited' : 'Active'}
              </span>
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="w-full bg-[var(--bg-card)] h-1.5 rounded-full overflow-hidden border border-border/50">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-300"
                  style={{ width: currentPlan?.unlimitedAi ? '100%' : '75%' }}
                />
              </div>
              <span className="text-[10px] text-text-secondary block">
                {currentPlan?.unlimitedAi ? 'Unlimited iterations' : 'Allowance allocated'}
              </span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-surface-elevated border border-border/60">
            <span className="text-text-secondary text-[11px] block mb-1">
              Container Previews
            </span>
            <span className="font-semibold text-text-primary text-sm">
              {currentPlan?.maxPreviews || 1} Sandbox Pods
            </span>
          </div>
        </div>
      </div>

      {/* Plans & Pricing Comparison */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-text-primary">
            Available Plans & Upgrades
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Select the plan that matches your project scale and AI development velocity.
          </p>
        </div>

        {isLoadingPlans ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-surface border border-border animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const isCurrent = currentPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between p-6 rounded-2xl bg-surface border transition-all ${
                    isCurrent
                      ? 'border-accent shadow-sm'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base text-text-primary">
                        {plan.name}
                      </h3>
                      {isCurrent && (
                        <Badge variant="violet" size="sm">
                          Current Plan
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary min-h-[32px] leading-relaxed">
                      {plan.description ||
                        'Designed for developers building software with AI.'}
                    </p>

                    <div className="my-5">
                      <span className="text-3xl font-extrabold text-text-primary">
                        {plan.price || (plan.id === 0 ? '₹0' : plan.id === 1 ? '₹499' : '₹1,499')}
                      </span>
                      {plan.id > 0 && (
                        <span className="text-xs text-text-secondary ml-1">/month</span>
                      )}
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs text-text-secondary pt-3 border-t border-border/50">
                      {(
                        plan.features || [
                          `Up to ${plan.maxProjects} active projects`,
                          plan.unlimitedAi ? 'Unlimited AI agent iterations' : 'Dedicated daily AI generation capacity',
                          `${plan.maxPreviews || 1} preview container sandboxes`,
                          'Monaco full code editing',
                        ]
                      ).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[#a78bfa] shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  <div className="mt-8 pt-4 border-t border-border/50">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-surface-elevated border border-border text-text-secondary cursor-default"
                      >
                        Current Plan
                      </button>
                    ) : plan.id === 0 ? (
                      <button
                        onClick={handleOpenPortal}
                        className="w-full py-2 px-3 text-xs font-medium rounded-lg border border-border hover:bg-surface-elevated text-text-primary transition-colors cursor-pointer"
                      >
                        Downgrade via Portal
                      </button>
                    ) : (
                      <button
                        disabled={isProcessingCheckout !== null}
                        onClick={() => handleCheckout(plan.id)}
                        className="w-full py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all bg-accent hover:bg-accent-hover text-white shadow-sm shadow-accent/20 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingCheckout === plan.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Redirecting to Stripe...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Upgrade to {plan.name}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security & Webhook Information */}
      <div className="p-4 rounded-xl bg-surface border border-border/60 flex items-center gap-3 text-xs text-text-secondary">
        <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
        <p>
          Payments are securely processed via <strong>Stripe Checkout</strong>. Webhook signatures
          verify all subscription lifecycle events. NovaBuild does not store payment cards or secret keys.
        </p>
      </div>
    </div>
  );
};
