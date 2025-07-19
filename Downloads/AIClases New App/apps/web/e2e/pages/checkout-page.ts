import { Page, Locator } from '@playwright/test'

export class CheckoutPage {
  readonly page: Page
  readonly creditPackages: Locator
  readonly selectedPackage: Locator
  readonly packagePrice: Locator
  readonly packageCredits: Locator
  readonly paymentMethods: Locator
  readonly stripeOption: Locator
  readonly mercadoPagoOption: Locator
  readonly paypalOption: Locator
  readonly cardNumberInput: Locator
  readonly expiryInput: Locator
  readonly cvcInput: Locator
  readonly cardHolderInput: Locator
  readonly billingAddress: Locator
  readonly countrySelect: Locator
  readonly stateSelect: Locator
  readonly cityInput: Locator
  readonly zipCodeInput: Locator
  readonly emailInput: Locator
  readonly termsCheckbox: Locator
  readonly privacyCheckbox: Locator
  readonly payButton: Locator
  readonly backButton: Locator
  readonly orderSummary: Locator
  readonly discountCode: Locator
  readonly applyDiscountButton: Locator
  readonly totalAmount: Locator
  readonly taxAmount: Locator
  readonly discountAmount: Locator
  readonly paymentSpinner: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator
  readonly retryButton: Locator

  constructor(page: Page) {
    this.page = page
    this.creditPackages = page.locator('[data-testid="credit-packages"]')
    this.selectedPackage = page.locator('[data-testid="selected-package"]')
    this.packagePrice = page.locator('[data-testid="package-price"]')
    this.packageCredits = page.locator('[data-testid="package-credits"]')
    this.paymentMethods = page.locator('[data-testid="payment-methods"]')
    this.stripeOption = page.locator('[data-testid="stripe-option"]')
    this.mercadoPagoOption = page.locator('[data-testid="mercadopago-option"]')
    this.paypalOption = page.locator('[data-testid="paypal-option"]')
    this.cardNumberInput = page.locator('[data-testid="card-number-input"]')
    this.expiryInput = page.locator('[data-testid="expiry-input"]')
    this.cvcInput = page.locator('[data-testid="cvc-input"]')
    this.cardHolderInput = page.locator('[data-testid="cardholder-input"]')
    this.billingAddress = page.locator('[data-testid="billing-address"]')
    this.countrySelect = page.locator('[data-testid="country-select"]')
    this.stateSelect = page.locator('[data-testid="state-select"]')
    this.cityInput = page.locator('[data-testid="city-input"]')
    this.zipCodeInput = page.locator('[data-testid="zipcode-input"]')
    this.emailInput = page.locator('[data-testid="email-input"]')
    this.termsCheckbox = page.locator('[data-testid="terms-checkbox"]')
    this.privacyCheckbox = page.locator('[data-testid="privacy-checkbox"]')
    this.payButton = page.locator('[data-testid="pay-button"]')
    this.backButton = page.locator('[data-testid="back-button"]')
    this.orderSummary = page.locator('[data-testid="order-summary"]')
    this.discountCode = page.locator('[data-testid="discount-code"]')
    this.applyDiscountButton = page.locator('[data-testid="apply-discount-button"]')
    this.totalAmount = page.locator('[data-testid="total-amount"]')
    this.taxAmount = page.locator('[data-testid="tax-amount"]')
    this.discountAmount = page.locator('[data-testid="discount-amount"]')
    this.paymentSpinner = page.locator('[data-testid="payment-spinner"]')
    this.successMessage = page.locator('[data-testid="success-message"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
    this.retryButton = page.locator('[data-testid="retry-button"]')
  }

  async navigateToCheckout() {
    await this.page.goto('/checkout')
    await this.page.waitForLoadState('networkidle')
  }

  async selectCreditPackage(packageType: 'basic' | 'standard' | 'premium' | 'enterprise') {
    const packageOption = this.page.locator(`[data-testid="package-${packageType}"]`)
    await packageOption.click()
    await this.page.waitForTimeout(500)
  }

  async getSelectedPackageInfo() {
    const credits = await this.packageCredits.textContent()
    const price = await this.packagePrice.textContent()
    return {
      credits: parseInt(credits?.replace(/\D/g, '') || '0'),
      price: parseFloat(price?.replace(/[^\d.]/g, '') || '0')
    }
  }

  async selectPaymentMethod(method: 'stripe' | 'mercadopago' | 'paypal') {
    switch (method) {
      case 'stripe':
        await this.stripeOption.click()
        break
      case 'mercadopago':
        await this.mercadoPagoOption.click()
        break
      case 'paypal':
        await this.paypalOption.click()
        break
    }
    await this.page.waitForTimeout(1000)
  }

  async fillCardDetails(cardNumber: string, expiry: string, cvc: string, cardHolder: string) {
    await this.cardNumberInput.fill(cardNumber)
    await this.expiryInput.fill(expiry)
    await this.cvcInput.fill(cvc)
    await this.cardHolderInput.fill(cardHolder)
  }

  async fillBillingAddress(address: {
    country: string
    state?: string
    city: string
    zipCode: string
    email: string
  }) {
    await this.countrySelect.selectOption(address.country)
    
    if (address.state) {
      await this.stateSelect.selectOption(address.state)
    }
    
    await this.cityInput.fill(address.city)
    await this.zipCodeInput.fill(address.zipCode)
    await this.emailInput.fill(address.email)
  }

  async acceptTerms() {
    await this.termsCheckbox.check()
  }

  async acceptPrivacyPolicy() {
    await this.privacyCheckbox.check()
  }

  async applyDiscountCode(code: string) {
    await this.discountCode.fill(code)
    await this.applyDiscountButton.click()
    await this.page.waitForTimeout(2000)
  }

  async getTotalAmount() {
    const totalText = await this.totalAmount.textContent()
    return parseFloat(totalText?.replace(/[^\d.]/g, '') || '0')
  }

  async getTaxAmount() {
    const taxText = await this.taxAmount.textContent()
    return parseFloat(taxText?.replace(/[^\d.]/g, '') || '0')
  }

  async getDiscountAmount() {
    const discountText = await this.discountAmount.textContent()
    return parseFloat(discountText?.replace(/[^\d.]/g, '') || '0')
  }

  async processPayment() {
    await this.payButton.click()
    await this.paymentSpinner.waitFor({ state: 'visible' })
  }

  async waitForPaymentSuccess() {
    await this.successMessage.waitFor({ state: 'visible', timeout: 30000 })
    return await this.successMessage.textContent()
  }

  async waitForPaymentError() {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 30000 })
    return await this.errorMessage.textContent()
  }

  async retryPayment() {
    await this.retryButton.click()
    await this.page.waitForTimeout(1000)
  }

  async goBack() {
    await this.backButton.click()
    await this.page.waitForLoadState('networkidle')
  }

  async completeStripePayment(cardDetails: {
    cardNumber: string
    expiry: string
    cvc: string
    cardHolder: string
  }) {
    await this.selectPaymentMethod('stripe')
    await this.fillCardDetails(cardDetails.cardNumber, cardDetails.expiry, cardDetails.cvc, cardDetails.cardHolder)
    await this.acceptTerms()
    await this.acceptPrivacyPolicy()
    await this.processPayment()
  }

  async completeMercadoPagoPayment(cardDetails: {
    cardNumber: string
    expiry: string
    cvc: string
    cardHolder: string
  }) {
    await this.selectPaymentMethod('mercadopago')
    await this.fillCardDetails(cardDetails.cardNumber, cardDetails.expiry, cardDetails.cvc, cardDetails.cardHolder)
    await this.acceptTerms()
    await this.acceptPrivacyPolicy()
    await this.processPayment()
  }

  async isPaymentFormValid() {
    const termsChecked = await this.termsCheckbox.isChecked()
    const privacyChecked = await this.privacyCheckbox.isChecked()
    const payButtonEnabled = await this.payButton.isEnabled()
    
    return termsChecked && privacyChecked && payButtonEnabled
  }

  async getOrderSummary() {
    const summaryText = await this.orderSummary.textContent()
    return summaryText
  }

  async isDiscountApplied() {
    const discountAmount = await this.getDiscountAmount()
    return discountAmount > 0
  }

  async validateCardNumber(cardNumber: string) {
    await this.cardNumberInput.fill(cardNumber)
    await this.cardNumberInput.blur()
    
    const errorElement = this.page.locator('[data-testid="card-number-error"]')
    if (await errorElement.isVisible()) {
      return await errorElement.textContent()
    }
    return null
  }

  async validateEmail(email: string) {
    await this.emailInput.fill(email)
    await this.emailInput.blur()
    
    const errorElement = this.page.locator('[data-testid="email-error"]')
    if (await errorElement.isVisible()) {
      return await errorElement.textContent()
    }
    return null
  }

  async simulateNetworkError() {
    // Simulate network failure during payment
    await this.page.route('**/api/payments/**', route => {
      route.abort('failed')
    })
  }

  async clearNetworkSimulation() {
    await this.page.unroute('**/api/payments/**')
  }
}