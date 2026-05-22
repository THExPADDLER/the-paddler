import { NextResponse } from "next/server"
import { collection, getDocs } from "firebase/firestore/lite"

import { requireAdminRequest } from "@/lib/admin-auth"
import { serverDb } from "@/lib/firebase-server"

type OrderRecord = {
  id: string
  data: Record<string, unknown>
}

type PdfPage = {
  ops: string[]
  y: number
}

const PAGE_WIDTH = 842
const PAGE_HEIGHT = 595
const MARGIN = 24
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const cleanText = (value: unknown) =>
  String(value ?? "")
    .replace(/[₹]/g, "Rs ")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const escapePdfText = (value: unknown) =>
  cleanText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")

const text = (
  page: PdfPage,
  value: unknown,
  x: number,
  y: number,
  size = 7,
  font = "F1"
) => {
  page.ops.push(`BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`)
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

const getNested = (source: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((value, key) => {
    if (!value || typeof value !== "object") return undefined
    return (value as Record<string, unknown>)[key]
  }, source)

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

  return lines.length ? lines : ["-"]
}

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

const normalizeDateStart = (value: unknown) => {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const normalizeDateEnd = (value: unknown) => {
  if (!value) return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  date.setHours(23, 59, 59, 999)
  return date
}

const orderDate = (order: OrderRecord) => {
  const date = new Date(String(order.data.createdAt || order.data.orderedAt || ""))
  return Number.isNaN(date.getTime()) ? null : date
}

const isPaidOrder = (order: OrderRecord) => {
  const status = String(getNested(order.data, "payment.status") || "").toLowerCase()
  return status === "success" || status === "completed" || status === "paid"
}

const paymentReference = (order: OrderRecord) => {
  const payment = (order.data.payment || {}) as Record<string, unknown>
  return cleanText(
    payment.razorpayPaymentId ||
      payment.razorpayOrderId ||
      payment.transactionReference ||
      payment.phonepeTransactionId ||
      payment.merchantOrderId ||
      payment.orderId ||
      "-"
  )
}

const productSummary = (order: OrderRecord) => {
  const items = Array.isArray(order.data.items) ? order.data.items : []
  if (!items.length) return "-"

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return ""
      const product = item as Record<string, unknown>
      return [
        product.name || product.title || product.slug || "Product",
        product.color,
        product.size ? `Size ${product.size}` : "",
        `Qty ${product.quantity || product.qty || 1}`,
      ]
        .filter(Boolean)
        .join(" / ")
    })
    .filter(Boolean)
    .join("; ")
}

const addressSummary = (order: OrderRecord) => {
  const address = (order.data.address || {}) as Record<string, unknown>
  return [
    address.address,
    address.landmark ? `Landmark: ${address.landmark}` : "",
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ")
}

const customerSummary = (order: OrderRecord) => {
  const customer = (order.data.customer || {}) as Record<string, unknown>
  const address = (order.data.address || {}) as Record<string, unknown>
  return [
    customer.name || address.name || "Customer",
    customer.email || address.email,
    customer.phone || address.phone,
  ]
    .filter(Boolean)
    .join(" / ")
}

const addHeader = (
  page: PdfPage,
  pageNumber: number,
  title: string,
  range: string,
  generatedAt: string
) => {
  page.ops.push("0.04 0.04 0.04 rg")
  rect(page, 0, PAGE_HEIGHT - 72, PAGE_WIDTH, 72, true)
  page.ops.push("1 1 1 rg")
  text(page, "THE PADDLER", MARGIN, PAGE_HEIGHT - 30, 20, "F2")
  text(page, title, MARGIN, PAGE_HEIGHT - 50, 9, "F1")
  text(page, `Period: ${range}`, 560, PAGE_HEIGHT - 28, 8, "F2")
  text(page, `Generated: ${generatedAt}`, 560, PAGE_HEIGHT - 43, 7, "F1")
  text(page, `Page ${pageNumber}`, 560, PAGE_HEIGHT - 58, 7, "F1")
  page.ops.push("0 0 0 rg")
}

const createPage = (
  pages: PdfPage[],
  title: string,
  range: string,
  generatedAt: string
) => {
  const page: PdfPage = { ops: ["0 0 0 rg", "0.82 0.82 0.82 RG"], y: PAGE_HEIGHT - 96 }
  pages.push(page)
  addHeader(page, pages.length, title, range, generatedAt)
  return page
}

const ensureSpace = (
  pages: PdfPage[],
  page: PdfPage,
  needed: number,
  title: string,
  range: string,
  generatedAt: string
) => {
  if (page.y - needed > 34) return page
  return createPage(pages, title, range, generatedAt)
}

const drawTableHeader = (page: PdfPage, y: number, columns: Array<[string, number]>) => {
  page.ops.push("0.93 0.93 0.93 rg")
  rect(page, MARGIN, y - 22, CONTENT_WIDTH, 22, true)
  page.ops.push("0 0 0 rg")

  let x = MARGIN
  columns.forEach(([label, width]) => {
    text(page, label, x + 4, y - 14, 7, "F2")
    x += width
    line(page, x, y, x, y - 22)
  })
}

const drawRow = (page: PdfPage, y: number, columns: Array<[string[], number]>) => {
  const height = Math.max(...columns.map(([lines]) => lines.length), 1) * 9 + 12
  let x = MARGIN

  rect(page, MARGIN, y - height, CONTENT_WIDTH, height)
  columns.forEach(([lines, width]) => {
    lines.forEach((cellLine, index) => {
      text(page, cellLine, x + 4, y - 12 - index * 9, 6.5, "F1")
    })
    x += width
    line(page, x, y, x, y - height)
  })

  return height
}

const buildPdf = ({
  orders,
  range,
  generatedAt,
}: {
  orders: OrderRecord[]
  range: string
  generatedAt: string
}) => {
  const pages: PdfPage[] = []
  let page = createPage(pages, "Order Report", range, generatedAt)
  const paidOrders = orders.filter(isPaidOrder)
  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(getNested(order.data, "pricing.total") || 0),
    0
  )

  const summary = [
    ["Total Orders", orders.length.toLocaleString("en-IN")],
    ["Paid Orders", paidOrders.length.toLocaleString("en-IN")],
    ["Revenue", formatMoney(revenue)],
    ["Pending/Failed", String(orders.length - paidOrders.length)],
  ]

  summary.forEach(([label, value], index) => {
    const x = MARGIN + index * 195
    page.ops.push("0.96 0.96 0.96 rg")
    rect(page, x, page.y - 46, 180, 46, true)
    page.ops.push("0 0 0 rg")
    text(page, label, x + 10, page.y - 17, 7, "F1")
    text(page, value, x + 10, page.y - 34, 13, "F2")
  })
  page.y -= 68

  const columns: Array<[string, number]> = [
    ["Date", 62],
    ["Invoice", 82],
    ["Transaction ID", 104],
    ["Customer / Contact", 126],
    ["Address", 150],
    ["Product Info", 142],
    ["Amount", 58],
    ["Status", 70],
  ]

  drawTableHeader(page, page.y, columns)
  page.y -= 22

  if (!orders.length) {
    text(page, "No orders found for the selected period.", MARGIN, page.y - 20, 10, "F2")
  }

  orders.forEach((order) => {
    const pricing = (order.data.pricing || {}) as Record<string, unknown>
    const row: Array<[string[], number]> = [
      [wrap(formatDate(order.data.createdAt || order.data.orderedAt), 11, 2), 62],
      [wrap(order.data.invoiceNumber || order.id, 14, 2), 82],
      [wrap(paymentReference(order), 18, 3), 104],
      [wrap(customerSummary(order), 22, 4), 126],
      [wrap(addressSummary(order), 28, 4), 150],
      [wrap(productSummary(order), 27, 4), 142],
      [wrap(formatMoney(pricing.total), 10, 1), 58],
      [
        wrap(
          `${getNested(order.data, "payment.status") || "Pending"} / ${
            order.data.status || "Pending"
          }`,
          13,
          3
        ),
        70,
      ],
    ]

    const rowHeight = Math.max(...row.map(([lines]) => lines.length), 1) * 9 + 12
    page = ensureSpace(pages, page, rowHeight + 26, "Order Report", range, generatedAt)

    if (page.y > PAGE_HEIGHT - 105) {
      drawTableHeader(page, page.y, columns)
      page.y -= 22
    }

    page.y -= drawRow(page, page.y, row)
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
    ...pageObjects.flatMap((pageObject, index) => [pageObject, contentObjects[index]]),
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

    const { from, to } = (await request.json()) as {
      from?: string
      to?: string
    }
    const fromDate = normalizeDateStart(from)
    const toDate = normalizeDateEnd(to)
    const snapshot = await getDocs(collection(serverDb, "orders"))
    const orders = snapshot.docs
      .map((item) => ({ id: item.id, data: item.data() as Record<string, unknown> }))
      .filter((order) => {
        const date = orderDate(order)
        if (!date) return !fromDate && !toDate
        if (fromDate && date < fromDate) return false
        if (toDate && date > toDate) return false
        return true
      })
      .sort((a, b) => {
        const aDate = orderDate(a)?.getTime() || 0
        const bDate = orderDate(b)?.getTime() || 0
        return bDate - aDate
      })

    const generatedAt = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })
    const range =
      fromDate || toDate
        ? `${from ? formatDate(fromDate?.toISOString()) : "Beginning"} to ${
            to ? formatDate(toDate?.toISOString()) : "Today"
          }`
        : "All Time"
    const filePart =
      from || to
        ? `${from || "start"}-to-${to || "today"}`
        : "all-time"
    const fileName = `the-paddler-order-report-${filePart}.pdf`
    const pdf = buildPdf({ orders, range, generatedAt })

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Report-Filename": fileName,
      },
    })
  } catch (error) {
    console.error("ADMIN ORDER REPORT ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to create order report.",
      },
      { status: 500 }
    )
  }
}
