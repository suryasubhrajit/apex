import { NextResponse } from "next/server";
import { CRM_DATABASE } from "@/data/crm-data";

export async function POST() {
  try {
    // Reset all order refund states back to un-refunded
    CRM_DATABASE.forEach(customer => {
      customer.orders.forEach(order => {
        order.isAlreadyRefunded = false;
        order.status = "Delivered";
        order.items.forEach(item => {
          item.isAlreadyRefunded = false;
        });
      });
    });

    // Special edge case statuses
    const c1011 = CRM_DATABASE.find(c => c.customerId === "CUST-1011");
    if (c1011 && c1011.orders[0]) c1011.orders[0].status = "In Transit";

    return NextResponse.json({
      success: true,
      message: "CRM Database state reset successfully. All 15 customer order profiles are ready for demo evaluation."
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
