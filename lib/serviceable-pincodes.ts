export type ServiceablePincode = {
  city: string
  state: string
  estimatedDeliveryDays: number
}

export const serviceablePincodes: Record<string, ServiceablePincode> = {
  "110001": { city: "New Delhi", state: "Delhi", estimatedDeliveryDays: 5 },
  "122001": { city: "Gurugram", state: "Haryana", estimatedDeliveryDays: 5 },
  "201301": { city: "Noida", state: "Uttar Pradesh", estimatedDeliveryDays: 5 },
  "400001": { city: "Mumbai", state: "Maharashtra", estimatedDeliveryDays: 6 },
  "411001": { city: "Pune", state: "Maharashtra", estimatedDeliveryDays: 6 },
  "452001": { city: "Indore", state: "Madhya Pradesh", estimatedDeliveryDays: 4 },
  "456001": { city: "Ujjain", state: "Madhya Pradesh", estimatedDeliveryDays: 4 },
  "462001": { city: "Bhopal", state: "Madhya Pradesh", estimatedDeliveryDays: 3 },
  "462022": { city: "Bhopal", state: "Madhya Pradesh", estimatedDeliveryDays: 3 },
  "462038": { city: "Bhopal", state: "Madhya Pradesh", estimatedDeliveryDays: 3 },
  "450001": { city: "Khandwa", state: "Madhya Pradesh", estimatedDeliveryDays: 4 },
  "450331": { city: "Burhanpur", state: "Madhya Pradesh", estimatedDeliveryDays: 4 },
  "560001": { city: "Bengaluru", state: "Karnataka", estimatedDeliveryDays: 6 },
  "600001": { city: "Chennai", state: "Tamil Nadu", estimatedDeliveryDays: 6 },
  "700001": { city: "Kolkata", state: "West Bengal", estimatedDeliveryDays: 6 },
}

export const getFallbackPincode = (pincode: string) => {
  return serviceablePincodes[pincode] || null
}

