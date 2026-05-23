import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { confirmOrder } from "../actions";

function getPublicOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("x-forwarded-host");
  if (proto && host) return `${proto}://${host}`;
  return new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("reference") ?? searchParams.get("trxref");
  const origin = getPublicOrigin(request);

  if (!ref) {
    return NextResponse.redirect(`${origin}/checkout`);
  }

  try {
    const { orderId } = await confirmOrder(ref);
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/bag");
    return NextResponse.redirect(`${origin}/orders/${orderId}`);
  } catch (err) {
    const msg = encodeURIComponent(
      err instanceof Error ? err.message : "Order confirmation failed."
    );
    return NextResponse.redirect(`${origin}/checkout?payment_error=${msg}`);
  }
}
