import { NextResponse } from "next/server"
import { collection, getDocs } from "firebase/firestore/lite"

import { serverDb } from "@/lib/firebase-server"

type ResetTarget = "users" | "orders_revenue" | "coupon_used" | "all"

const targetLabels: Record<ResetTarget, string> = {
  users: "Users",
  orders_revenue: "Orders and Revenue",
  coupon_used: "Coupon Used",
  all: "All Dashboard Data",
}

const isResetTarget = (value: unknown): value is ResetTarget =>
  value === "users" ||
  value === "orders_revenue" ||
  value === "coupon_used" ||
  value === "all"

const escapePdfText = (value: string) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")

const collectSnapshot = async (name: string) => {
  const snapshot = await getDocs(collection(serverDb, name))

  return snapshot.docs.map((item) => ({
    id: item.id,
    data: item.data(),
  }))
}

const buildPdf = (lines: string[]) => {
  const pageHeight = 842
  const pageWidth = 595
  const body = lines
    .slice(0, 42)
    .map((line, index) => {
      const y = 790 - index * 17
      return `BT /F1 9 Tf 40 ${y} Td (${escapePdfText(line)}) Tj ET`
    })
    .join("\n")
  const pageStream = `${body}\n`
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n`,
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `5 0 obj << /Length ${Buffer.byteLength(pageStream, "utf8")} >> stream\n${pageStream}endstream endobj\n`,
  ]

  let pdf = "%PDF-1.4\n"
  const offsets = [0]

  objects.forEach((object) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"))
    pdf += object
  })

  const xrefOffset = Buffer.byteLength(pdf, "utf8")
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += "0000000000 65535 f \n"
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  })
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, "utf8")
}

export async function POST(request: Request) {
  try {
    const { target } = await request.json()

    if (!isResetTarget(target)) {
      return NextResponse.json(
        { ok: false, message: "Valid reset target is required." },
        { status: 400 }
      )
    }

    const [orders, users, coupons, invoices, returns] = await Promise.all([
      collectSnapshot("orders"),
      collectSnapshot("users"),
      collectSnapshot("coupons"),
      collectSnapshot("invoices"),
      collectSnapshot("returns"),
    ])
    const paidOrders = orders.filter((order) => {
      const payment = order.data.payment as { status?: string } | undefined
      const status = payment?.status?.toLowerCase()
      return status === "success" || status === "completed" || status === "paid"
    })
    const revenue = paidOrders.reduce((sum, order) => {
      const pricing = order.data.pricing as { total?: number } | undefined
      return sum + Number(pricing?.total || 0)
    }, 0)
    const couponUses = orders.filter((order) => {
      const pricing = order.data.pricing as { couponCode?: string | null } | undefined
      return Boolean(pricing?.couponCode)
    }).length
    const now = new Date()
    const monthName = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(now)
    const fileName = `${monthName.replace(/\s+/g, "-")}-backup.pdf`

    const lines = [
      "THE PADDLER Monthly Backup",
      `Month: ${monthName}`,
      `Generated: ${now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
      `Reset Target: ${targetLabels[target]}`,
      "",
      "Summary Before Reset",
      `Users: ${users.length}`,
      `Orders: ${orders.length}`,
      `Paid Orders: ${paidOrders.length}`,
      `Revenue: Rs ${revenue.toLocaleString("en-IN")}`,
      `Coupon Used: ${couponUses}`,
      `Coupons: ${coupons.length}`,
      `Invoices: ${invoices.length}`,
      `Returns: ${returns.length}`,
      "",
      "Recent Orders",
      ...orders.slice(0, 20).map((order) => {
        const customer = order.data.customer as { name?: string; email?: string } | undefined
        const pricing = order.data.pricing as { total?: number } | undefined
        const payment = order.data.payment as { status?: string } | undefined

        return `${order.id} | ${customer?.name || customer?.email || "Customer"} | Rs ${
          pricing?.total || 0
        } | ${payment?.status || "pending"}`
      }),
    ]
    const pdf = buildPdf(lines)

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Backup-Filename": fileName,
      },
    })
  } catch (error) {
    console.error("ADMIN RESET BACKUP ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to create backup PDF.",
      },
      { status: 500 }
    )
  }
}

