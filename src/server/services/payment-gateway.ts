export type ChargeInput = {
  amountCents: number;
  currency?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
};

export type RefundInput = {
  paymentId: string;
  amountCents: number;
  currency?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
};

export type GatewayResult = {
  ok: true;
  provider: string;
  externalId: string;
  metadata: Record<string, unknown>;
};

export interface PaymentGateway {
  charge(input: ChargeInput): Promise<GatewayResult>;
  refund(input: RefundInput): Promise<GatewayResult>;
}

/** Records charges/refunds locally without calling an external provider. */
export class ManualGateway implements PaymentGateway {
  async charge(input: ChargeInput): Promise<GatewayResult> {
    const externalId = `manual_chg_${Date.now()}`;
    return {
      ok: true,
      provider: "manual",
      externalId,
      metadata: {
        ...input.metadata,
        amountCents: input.amountCents,
        currency: input.currency ?? "NPR",
        reference: input.reference,
        recordedAt: new Date().toISOString(),
      },
    };
  }

  async refund(input: RefundInput): Promise<GatewayResult> {
    const externalId = `manual_ref_${Date.now()}`;
    return {
      ok: true,
      provider: "manual",
      externalId,
      metadata: {
        ...input.metadata,
        paymentId: input.paymentId,
        amountCents: input.amountCents,
        currency: input.currency ?? "NPR",
        reference: input.reference,
        recordedAt: new Date().toISOString(),
      },
    };
  }
}

export function createPaymentGateway(): PaymentGateway {
  return new ManualGateway();
}
