const cleanEnvValue = (value?: string) =>
  (value || "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .trim()

const getRazorpayConfig = () => {
  const keyId = cleanEnvValue(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
  const keySecret = cleanEnvValue(process.env.RAZORPAY_KEY_SECRET)

  if (!keyId || !keySecret) {
    throw new Error("Razorpay key id/secret is missing.")
  }

  return {
    keyId,
    keySecret,
    apiBaseUrl: "https://api.razorpay.com/v1",
  }
}

const createAuthHeader = (keyId: string, keySecret: string) => {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
}

export const razorpayFetch = async <T>(
  path: string,
  init: RequestInit = {}
) => {
  const { keyId, keySecret, apiBaseUrl } = getRazorpayConfig()
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: createAuthHeader(keyId, keySecret),
      ...(init.headers || {}),
    },
  })

  const text = await response.text().catch(() => "")
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    console.error("RAZORPAY API ERROR:", {
      path,
      status: response.status,
      data,
    })
    const razorpayMessage =
      data?.error?.description || data?.error?.reason || "Razorpay request failed."

    throw new Error(
      response.status === 401
        ? "Razorpay authentication failed. Please verify the live/test key id and secret saved in Vercel."
        : razorpayMessage
    )
  }

  return data as T
}

export const getRazorpayKeyId = () => getRazorpayConfig().keyId

export const getRazorpayKeySecret = () => getRazorpayConfig().keySecret
