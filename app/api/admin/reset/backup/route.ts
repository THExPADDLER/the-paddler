import { NextResponse } from "next/server"
import { collection, getDocs } from "firebase/firestore/lite"

import { requireAdminRequest } from "@/lib/admin-auth"
import { serverDb } from "@/lib/firebase-server"

type ResetTarget = "users" | "orders_revenue" | "coupon_used" | "all"

type SnapshotRecord = {
  id: string
  data: Record<string, unknown>
}

type PdfPage = {
  ops: string[]
  y: number
}

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 30
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

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

const collectSnapshot = async (name: string) => {
  const snapshot = await getDocs(collection(serverDb, name))

  return snapshot.docs.map((item) => ({
    id: item.id,
    data: item.data() as Record<string, unknown>,
  }))
}

const cleanText = (value: unknown) =>
  String(value ?? "")
    .replace(/[₹]/g, "Rs ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const escapePdfText = (value: string) =>
  cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")

const text = (
  page: PdfPage,
  value: unknown,
  x: number,
  y: number,
  size = 9,
  font = "F1"
) => {
  page.ops.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(cleanText(value))}) Tj ET`)
}

const line = (page: PdfPage, x1: number, y1: number, x2: number, y2: number) => {
  page.ops.push(`${x1} ${y1} m ${x2} ${y2} l S`)
}

const rect = (
  page: PdfPage,
  x: number,
  y: number,
  width: number,
  height: number,
  fill = false
) => {
  page.ops.push(`${x} ${y} ${width} ${height} re ${fill ? "f" : "S"}`)
}

const wrap = (value: unknown, maxChars: number, maxLines = 3) => {
  const words = cleanText(value).split(" ").filter(Boolean)
  const lines: string[] = []
  let current = ""

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word

    if (next.length > maxChars) {
      if (current) lines.push(current)
      current = word.slice(0, maxChars)
      return
    }

    current = next
  })

  if (current) lines.push(current)

  if (lines.length > maxLines) {
    return [...lines.slice(0, maxLines - 1), `${lines[maxLines - 1].slice(0, maxChars - 3)}...`]
  }

  return lines.length ? lines : [""]
}

const getNested = (source: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined
    return (value as Record<string, unknown>)[key]
  }, source)

const formatDate = (value: unknown) => {
  if (!value) return "-"
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return cleanText(value)

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date)
}

const formatMoney = (value: unknown) =>
  `Rs ${Number(value || 0).toLocaleString("en-IN")}`

const paymentReference = (order: SnapshotRecord) => {
  const payment = (order.data.payment || {}) as Record<string, unknown>
  const candidates = [
    payment.razorpayPaymentId,
    payment.razorpayOrderId,
    payment.transactionReference,
    payment.phonepeTransactionId,
    payment.merchantOrderId,
    payment.orderId,
  ]

  return cleanText(candidates.find(Boolean) || "-")
}

const productSummary = (order: SnapshotRecord) => {
  const items = Array.isArray(order.data.items) ? order.data.items : []

  if (items.length === 0) return "-"

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return ""
      const product = item as Record<string, unknown>
      const name = product.name || product.title || product.slug || "Product"
      const size = product.size ? `Size ${product.size}` : ""
      const color = product.color ? `${product.color}` : ""
      const qty = product.quantity || product.qty || 1

      return `${name} ${color} ${size} x${qty}`.trim()
    })
    .filter(Boolean)
    .join("; ")
}

const addressSummary = (order: SnapshotRecord) => {
  const address = (order.data.address || {}) as Record<string, unknown>
  const parts = [
    address.address,
    address.landmark ? `Landmark: ${address.landmark}` : "",
    address.city,
    address.state,
    address.pincode,
  ].filter(Boolean)

  return parts.length ? cleanText(parts.join(", ")) : "-"
}

const addHeader = (page: PdfPage, pageNumber: number, monthName: string, target: string) => {
  rect(page, 0, PAGE_HEIGHT - 78, PAGE_WIDTH, 78, true)
  page.ops.push("1 1 1 rg")
  text(page, "THE PADDLER", MARGIN, PAGE_HEIGHT - 35, 20, "F2")
  text(page, "Monthly Reset Backup Report", MARGIN, PAGE_HEIGHT - 55, 10, "F1")
  text(page, `Month: ${monthName}`, 365, PAGE_HEIGHT - 35, 9, "F2")
  text(page, `Reset Target: ${target}`, 365, PAGE_HEIGHT - 50, 8, "F1")
  text(page, `Page ${pageNumber}`, 365, PAGE_HEIGHT - 65, 8, "F1")
  page.ops.push("0 0 0 rg")
}

const createPage = (pages: PdfPage[], monthName: string, target: string) => {
  const page: PdfPage = { ops: ["0 0 0 rg", "0.88 0.88 0.88 RG"], y: PAGE_HEIGHT - 105 }
  pages.push(page)
  addHeader(page, pages.length, monthName, target)
  return page
}

const ensureSpace = (
  pages: PdfPage[],
  page: PdfPage,
  needed: number,
  monthName: string,
  target: string
) => {
  if (page.y - needed > 45) return page
  return createPage(pages, monthName, target)
}

const sectionTitle = (
  pages: PdfPage[],
  page: PdfPage,
  monthName: string,
  target: string,
  title: string
) => {
  page = ensureSpace(pages, page, 36, monthName, target)
  text(page, title, MARGIN, page.y, 13, "F2")
  line(page, MARGIN, page.y - 7, PAGE_WIDTH - MARGIN, page.y - 7)
  page.y -= 28
  return page
}

const summaryBox = (
  page: PdfPage,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number
) => {
  rect(page, x, y - 48, width, 48)
  text(page, label, x + 10, y - 18, 8, "F1")
  text(page, value, x + 10, y - 36, 14, "F2")
}

const drawTableHeader = (page: PdfPage, y: number, columns: Array<[string, number]>) => {
  let x = MARGIN
  rect(page, MARGIN, y - 22, CONTENT_WIDTH, 22)
  columns.forEach(([label, width]) => {
    text(page, label, x + 4, y - 14, 7, "F2")
    x += width
    line(page, x, y, x, y - 22)
  })
}

const drawTableRow = (
  page: PdfPage,
  y: number,
  columns: Array<[string[], number]>
) => {
  const rowHeight =
    Math.max(...columns.map(([lines]) => lines.length), 1) * 10 + 12
  let x = MARGIN

  rect(page, MARGIN, y - rowHeight, CONTENT_WIDTH, rowHeight)
  columns.forEach(([cellLines, width]) => {
    cellLines.forEach((cellLine, index) => {
      text(page, cellLine, x + 4, y - 13 - index * 10, 7, "F1")
    })
    x += width
    line(page, x, y, x, y - rowHeight)
  })

  return rowHeight
}

const buildPdf = ({
  monthName,
  target,
  generatedAt,
  orders,
  users,
  coupons,
  invoices,
  returns,
}: {
  monthName: string
  target: string
  generatedAt: string
  orders: SnapshotRecord[]
  users: SnapshotRecord[]
  coupons: SnapshotRecord[]
  invoices: SnapshotRecord[]
  returns: SnapshotRecord[]
}) => {
  const paidOrders = orders.filter((order) => {
    const status = String(getNested(order.data, "payment.status") || "").toLowerCase()
    return status === "success" || status === "completed" || status === "paid"
  })
  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(getNested(order.data, "pricing.total") || 0),
    0
  )
  const couponUses = orders.filter((order) =>
    Boolean(getNested(order.data, "pricing.couponCode"))
  ).length
  const pages: PdfPage[] = []
  let page = createPage(pages, monthName, target)

  text(page, `Generated: ${generatedAt}`, MARGIN, page.y, 9, "F1")
  page.y -= 24
  summaryBox(page, "Users", String(users.length), MARGIN, page.y, 100)
  summaryBox(page, "Orders", String(orders.length), MARGIN + 109, page.y, 100)
  summaryBox(page, "Paid Orders", String(paidOrders.length), MARGIN + 218, page.y, 100)
  summaryBox(page, "Revenue", formatMoney(revenue), MARGIN + 327, page.y, 100)
  summaryBox(page, "Coupon Used", String(couponUses), MARGIN + 436, page.y, 99)
  page.y -= 72

  page = sectionTitle(pages, page, monthName, target, "Order Details")
  const orderColumns: Array<[string, number]> = [
    ["Invoice", 72],
    ["Payment Ref", 93],
    ["Customer", 82],
    ["Product Description", 128],
    ["Amount", 55],
    ["Payment / Status", 105],
  ]

  drawTableHeader(page, page.y, orderColumns)
  page.y -= 22
  ;[...orders]
    .sort((a, b) => String(b.data.createdAt || "").localeCompare(String(a.data.createdAt || "")))
    .forEach((order) => {
      const invoice = cleanText(order.data.invoiceNumber || order.id)
      const customer = (order.data.customer || {}) as Record<string, unknown>
      const pricing = (order.data.pricing || {}) as Record<string, unknown>
      const paymentStatus = cleanText(getNested(order.data, "payment.status") || "pending")
      const status = cleanText(order.data.status || "pending")
      const rowLines = [
        [wrap(invoice, 12, 2), 72] as [string[], number],
        [wrap(paymentReference(order), 15, 3), 93] as [string[], number],
        [
          wrap(`${customer.name || "Customer"} ${customer.phone || ""}`, 13, 3),
          82,
        ] as [string[], number],
        [wrap(productSummary(order), 23, 4), 128] as [string[], number],
        [[formatMoney(pricing.total)], 55] as [string[], number],
        [wrap(`${paymentStatus} / ${status}`, 18, 3), 105] as [string[], number],
      ]
      const rowHeight = Math.max(...rowLines.map(([lines]) => lines.length), 1) * 10 + 12

      page = ensureSpace(pages, page, rowHeight + 44, monthName, target)

      if (page.y > PAGE_HEIGHT - 130) {
        drawTableHeader(page, page.y, orderColumns)
        page.y -= 22
      }

      page.y -= drawTableRow(page, page.y, rowLines)
      text(page, `Ordered: ${formatDate(order.data.createdAt)} | Address: ${addressSummary(order)}`, MARGIN + 4, page.y - 12, 7, "F1")
      page.y -= 24
    })

  page = sectionTitle(pages, page, monthName, target, "Registered Users")
  const userColumns: Array<[string, number]> = [
    ["Name", 130],
    ["Email", 170],
    ["Phone", 95],
    ["Joined / Last Login", 140],
  ]
  drawTableHeader(page, page.y, userColumns)
  page.y -= 22
  users.forEach((user) => {
    const row = [
      [wrap(user.data.name || user.id, 22, 2), 130] as [string[], number],
      [wrap(user.data.email || "-", 28, 2), 170] as [string[], number],
      [wrap(user.data.phone || "-", 14, 1), 95] as [string[], number],
      [
        wrap(
          `${formatDate(user.data.createdAt)} / ${formatDate(user.data.lastLoginAt)}`,
          22,
          2
        ),
        140,
      ] as [string[], number],
    ]
    const rowHeight = Math.max(...row.map(([lines]) => lines.length), 1) * 10 + 12
    page = ensureSpace(pages, page, rowHeight + 22, monthName, target)
    page.y -= drawTableRow(page, page.y, row)
  })

  page = sectionTitle(pages, page, monthName, target, "Coupon Details")
  const couponColumns: Array<[string, number]> = [
    ["Code", 95],
    ["Influencer", 140],
    ["Discount", 70],
    ["Commission", 90],
    ["Active", 60],
    ["Created", 80],
  ]
  drawTableHeader(page, page.y, couponColumns)
  page.y -= 22
  coupons.forEach((coupon) => {
    const row = [
      [wrap(coupon.id, 14, 1), 95] as [string[], number],
      [wrap(coupon.data.influencer || "-", 22, 2), 140] as [string[], number],
      [[`${coupon.data.discountPercent || 0}%`], 70] as [string[], number],
      [[formatMoney(coupon.data.commissionPerOrder)], 90] as [string[], number],
      [[coupon.data.active === false ? "No" : "Yes"], 60] as [string[], number],
      [wrap(formatDate(coupon.data.createdAt), 12, 2), 80] as [string[], number],
    ]
    const rowHeight = Math.max(...row.map(([lines]) => lines.length), 1) * 10 + 12
    page = ensureSpace(pages, page, rowHeight + 22, monthName, target)
    page.y -= drawTableRow(page, page.y, row)
  })

  page = sectionTitle(pages, page, monthName, target, "Invoices and Returns")
  const miscColumns: Array<[string, number]> = [
    ["Type", 70],
    ["Record ID", 140],
    ["Order ID", 140],
    ["Amount", 75],
    ["Status / Date", 110],
  ]
  drawTableHeader(page, page.y, miscColumns)
  page.y -= 22
  ;[
    ...invoices.map((item) => ({ type: "Invoice", item })),
    ...returns.map((item) => ({ type: "Return", item })),
  ].forEach(({ type, item }) => {
    const row = [
      [[type], 70] as [string[], number],
      [wrap(item.id, 24, 2), 140] as [string[], number],
      [wrap(item.data.orderId || "-", 24, 2), 140] as [string[], number],
      [wrap(formatMoney(item.data.total || item.data.refundAmount), 10, 1), 75] as [string[], number],
      [
        wrap(`${item.data.status || item.data.paymentStatus || "-"} / ${formatDate(item.data.createdAt)}`, 18, 2),
        110,
      ] as [string[], number],
    ]
    const rowHeight = Math.max(...row.map(([lines]) => lines.length), 1) * 10 + 12
    page = ensureSpace(pages, page, rowHeight + 22, monthName, target)
    page.y -= drawTableRow(page, page.y, row)
  })

  const pageObjects: string[] = []
  const contentObjects: string[] = []
  const kids: string[] = []

  pages.forEach((pdfPage, index) => {
    const pageObjectNumber = 3 + index * 2
    const contentObjectNumber = pageObjectNumber + 1
    const content = `${pdfPage.ops.join("\n")}\n`

    kids.push(`${pageObjectNumber} 0 R`)
    pageObjects.push(
      `${pageObjectNumber} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 1 0 R /F2 ${3 + pages.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >> endobj\n`
    )
    contentObjects.push(
      `${contentObjectNumber} 0 obj << /Length ${Buffer.byteLength(content, "utf8")} >> stream\n${content}endstream endobj\n`
    )
  })

  const boldFontNumber = 3 + pages.length * 2
  const objects = [
    "1 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    `2 0 obj << /Type /Pages /Kids [${kids.join(" ")}] /Count ${pages.length} >> endobj\n`,
    ...pageObjects.flatMap((pageObject, index) => [
      pageObject,
      contentObjects[index],
    ]),
    `${boldFontNumber} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n`,
    `${boldFontNumber + 1} 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n`,
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
  pdf += `trailer << /Size ${objects.length + 1} /Root ${boldFontNumber + 1} 0 R >>\n`
  pdf += `startxref\n${xrefOffset}\n%%EOF\n`

  return Buffer.from(pdf, "utf8")
}

export async function POST(request: Request) {
  try {
    await requireAdminRequest(request)

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
    const now = new Date()
    const monthName = new Intl.DateTimeFormat("en-IN", {
      month: "long",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(now)
    const fileName = `${monthName.replace(/\s+/g, "-")}-backup.pdf`
    const pdf = buildPdf({
      monthName,
      target: targetLabels[target],
      generatedAt: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      orders,
      users,
      coupons,
      invoices,
      returns,
    })

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
