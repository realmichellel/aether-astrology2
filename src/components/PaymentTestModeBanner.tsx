const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/40 bg-destructive/10 px-4 py-2 text-center text-xs text-destructive-foreground">
        Production checkout is not configured yet. Complete go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-[10px] uppercase tracking-[0.2em] text-accent">
        All payments made in the preview are in test mode
      </div>
    );
  }
  return null;
}
