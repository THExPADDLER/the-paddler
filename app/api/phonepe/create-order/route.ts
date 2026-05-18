import { NextResponse } from "next/server"

const getPhonePeConfig = () => {
  const clientId = process.env.PHONEPE_CLIENT_ID
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET
  const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1"
  const apiBaseUrl =
    process.env.PHONEPE_API_BASE_URL ||
    "https://api-preprod.phonepe.com/apis/pg-sandbox"
  const redirectUrl =
    process.env.NEXT_PUBLIC_PHONEPE_REDIRECT_URL ||
    "http://localhost:3000/orders"

  if (!clientId || !clientSecret) {
    throw new Error("PhonePe client id/secret is missing.")
  }

  return {
    clientId,
    clientSecret,
    clientVersion,
    apiBaseUrl,
    redirectUrl,
  }
}

async function getAccessToken() {
  const { clientId, clientSecret, clientVersion, apiBaseUrl } = getPhonePeConfig()

  const body = new URLSearchParams({
    client_id: clientId,
    client_version: clientVersion,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  })

  const response = await fetch(`${apiBaseUrl}/v1/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    console.error("PHONEPE AUTH ERROR:", data)
    throw new Error("Unable to authenticate with PhonePe.")
  }

  const token = data?.access_token || data?.accessToken || data?.token

  if (!token) {
    console.error("PHONEPE AUTH TOKEN MISSING:", data)
    throw new Error("PhonePe auth token missing.")
  }

  return token
}

export async function POST(request: Request) {
  try {
    const { merchantOrderId, amount, customer } = await request.json()

    if (!merchantOrderId || !amount) {
      return NextResponse.json(
        {
          ok: false,
          message: "merchantOrderId and amount are required.",
        },
        { status: 400 }
      )
    }

    const { apiBaseUrl } = getPhonePeConfig()
    const accessToken = await getAccessToken()
    const amountInPaise = Math.round(Number(amount) * 100)
    const origin =
      request.headers.get("origin") ||
      `${request.headers.get("x-forwarded-proto") || "http"}://${request.headers.get("host")}`
    const redirectUrl = `${origin}/payment-status?orderId=${encodeURIComponent(
      merchantOrderId
    )}`

    const paymentResponse = await fetch(`${apiBaseUrl}/checkout/v2/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        merchantOrderId,
        amount: amountInPaise,
        expireAfter: 1200,
        metaInfo: {
          udf1: customer?.email || "",
          udf2: customer?.phone || "",
          udf3: "THE PADDLER",
          udf4: merchantOrderId,
          udf5: "website-checkout",
        },
        paymentFlow: {
          type: "PG_CHECKOUT",
          message: `THE PADDLER order ${merchantOrderId}`,
          merchantUrls: {
            redirectUrl,
          },
        },
      }),
    })

    const paymentData = await paymentResponse.json().catch(() => null)

    if (!paymentResponse.ok) {
      console.error("PHONEPE PAY ERROR:", paymentData)

      return NextResponse.json(
        {
          ok: false,
          message: "Unable to create PhonePe payment.",
          details: paymentData,
        },
        { status: 502 }
      )
    }

    const redirect =
      paymentData?.redirectUrl ||
      paymentData?.data?.redirectUrl ||
      paymentData?.paymentUrl ||
      paymentData?.data?.paymentUrl

    if (!redirect) {
      console.error("PHONEPE REDIRECT URL MISSING:", paymentData)

      return NextResponse.json(
        {
          ok: false,
          message: "PhonePe did not return a redirect URL.",
          details: paymentData,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      merchantOrderId,
      redirectUrl: redirect,
      phonepe: paymentData,
    })
  } catch (error) {
    console.error("PHONEPE CREATE ORDER ERROR:", error)

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to create PhonePe order.",
      },
      { status: 500 }
    )
  }
}
