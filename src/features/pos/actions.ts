"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/actions/types";
import { getSession } from "@/lib/auth/session";
import { toErrorMessage } from "@/lib/errors";
import { prisma } from "@/server/db/prisma";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  priceCents: z.coerce.number().min(0, "Price must be positive"),
  stockLevel: z.coerce.number().min(0, "Stock cannot be negative"),
  sku: z.string().optional(),
});

export async function createProductAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = createProductSchema.parse(raw);
    
    const product = await prisma.product.create({
      data: {
        businessId,
        name: input.name,
        description: input.description,
        priceCents: input.priceCents,
        stockLevel: input.stockLevel,
        sku: input.sku,
      },
    });

    revalidatePath("/app/sales/inventory");
    return { ok: true, data: { id: product.id } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1)
  })).min(1)
});

export async function checkoutAction(
  businessId: string,
  raw: unknown
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const session = await getSession();
    if (!session?.user) throw new Error("Unauthorized");
    
    const input = checkoutSchema.parse(raw);
    
    const orderId = await prisma.$transaction(async (tx) => {
      // 1. Calculate totals and verify stock
      let totalCents = 0;
      const verifiedItems = [];
      
      for (const item of input.items) {
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        if (product.stockLevel < item.quantity) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
        
        const lineTotal = product.priceCents * item.quantity;
        totalCents += lineTotal;
        
        verifiedItems.push({
          productId: product.id,
          quantity: item.quantity,
          priceCents: product.priceCents
        });
        
        // Decrement stock
        await tx.product.update({
          where: { id: product.id },
          data: { stockLevel: { decrement: item.quantity } }
        });
      }
      
      // 2. Create the Order
      const order = await tx.posOrder.create({
        data: {
          businessId,
          totalCents,
          status: "COMPLETED",
          items: {
            create: verifiedItems
          }
        }
      });
      
      // 3. Create the Payment
      const payment = await tx.payment.create({
        data: {
          businessId,
          amountCents: totalCents,
          status: "COMPLETED",
          method: "CASH", // Defaulting to cash for POS MVP
          reference: `POS-${order.id}`
        }
      });
      
      // 4. Update Cashbook
      let cashbook = await tx.cashbookAccount.findFirst({
        where: { businessId, type: "CASH" }
      });
      
      if (!cashbook) {
        cashbook = await tx.cashbookAccount.create({
          data: { businessId, name: "Main Till", type: "CASH" }
        });
      }
      
      await tx.accountingTransaction.create({
        data: {
          businessId,
          accountId: cashbook.id,
          type: "INCOME",
          amountCents: totalCents,
          category: "POS Sales",
          description: "POS Checkout",
          paymentId: payment.id
        }
      });
      
      return order.id;
    });

    revalidatePath("/app/sales/pos");
    revalidatePath("/app/accounting");
    revalidatePath("/app/sales/inventory");
    
    return { ok: true, data: { orderId } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

