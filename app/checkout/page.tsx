"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, Lock, ChevronDown, ChevronUp } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function CheckoutPage() {
  const { items, totalPrice } = useCart()
  const [showOrderSummary, setShowOrderSummary] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
  })

  const shipping = 0
  const tax = totalPrice * 0.08 // 8% tax
  const total = totalPrice + shipping + tax

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle checkout submission
    alert("Order placed successfully! (Demo)")
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-background pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <h1 className="text-2xl font-bold mb-4">NO ITEMS TO CHECKOUT</h1>
              <p className="text-muted-foreground mb-8">
                Add some items to your cart first.
              </p>
              <Link
                href="/#shop"
                className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                SHOP NOW
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Order Summary Toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="w-full flex items-center justify-between p-4 bg-secondary/30 border border-border"
            >
              <span className="flex items-center gap-2 text-sm">
                <span>Show order summary</span>
                {showOrderSummary ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
              <span className="font-bold">${total.toFixed(2)}</span>
            </button>

            {showOrderSummary && (
              <div className="p-4 bg-secondary/30 border border-t-0 border-border">
                {items.map((item) => (
                  <div key={`${item.id}-${item.size}`} className="flex gap-4 mb-4">
                    <div className="relative w-16 h-16 bg-neutral-100 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                      <span className="absolute -top-2 -right-2 w-5 h-5 bg-muted-foreground text-background text-xs rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                    </div>
                    <span className="text-sm font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Checkout Form */}
            <div className="order-2 lg:order-1">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to cart
              </Link>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact */}
                <div>
                  <h2 className="text-lg font-bold mb-4">CONTACT</h2>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                  />
                </div>

                {/* Shipping */}
                <div>
                  <h2 className="text-lg font-bold mb-4">SHIPPING ADDRESS</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      name="address"
                      placeholder="Address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                    />
                    <input
                      type="text"
                      name="apartment"
                      placeholder="Apartment, suite, etc. (optional)"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                    />
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                      <input
                        type="text"
                        name="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                      <input
                        type="text"
                        name="zipCode"
                        placeholder="ZIP code"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h2 className="text-lg font-bold mb-4">PAYMENT</h2>
                  <div className="p-4 border border-border bg-secondary/30 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">Credit Card</span>
                      <div className="flex gap-2">
                        <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>
                        <div className="w-10 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="Card number"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                      <input
                        type="text"
                        name="nameOnCard"
                        placeholder="Name on card"
                        value={formData.nameOnCard}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM / YY"
                          value={formData.expiryDate}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                        />
                        <input
                          type="text"
                          name="cvv"
                          placeholder="CVV"
                          value={formData.cvv}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-accent text-background py-4 text-sm font-bold hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  PAY ${total.toFixed(2)}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                  Your payment info is secured with SSL encryption
                </p>
              </form>
            </div>

            {/* Order Summary - Desktop */}
            <div className="order-1 lg:order-2 hidden lg:block">
              <div className="bg-secondary/30 border border-border p-6 sticky top-24">
                <h2 className="text-lg font-bold mb-6">ORDER SUMMARY</h2>

                {/* Items */}
                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-4">
                      <div className="relative w-16 h-16 bg-neutral-100 flex-shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-muted-foreground text-background text-xs rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">Size: {item.size}</p>
                      </div>
                      <span className="text-sm font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Promo Code */}
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="flex-1 px-4 py-3 bg-transparent border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors text-sm"
                  />
                  <button className="px-6 py-3 border border-border text-sm font-medium hover:bg-secondary transition-colors">
                    Apply
                  </button>
                </div>

                {/* Totals */}
                <div className="space-y-3 text-sm border-t border-border pt-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-accent">FREE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
