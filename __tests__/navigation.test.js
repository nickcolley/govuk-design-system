const devices = require('puppeteer/DeviceDescriptors')
const iPhone = devices['iPhone 6']

const { setupPage } = require('../lib/jest-utilities.js')
const configPaths = require('../lib/paths.js')
const PORT = configPaths.testPort

let page
const baseUrl = 'http://localhost:' + PORT

const mobileNav = '.app-navigation'
const mobileNavToggler = '.js-app-navigation__toggler'

beforeAll(async () => {
  page = await setupPage(iPhone)
})

afterAll(async () => {
  await page.close()
})

describe('Homepage', () => {
  describe('when JavaScript is unavailable or fails', () => {
    it('falls back to making the navigation visible', async () => {
      await page.setJavaScriptEnabled(false)
      await page.goto(baseUrl, { waitUntil: 'load' })
      const isAppNavigationVisible = await page.waitForSelector('.js-app-navigation', { visible: true, timeout: 1000 })
      expect(isAppNavigationVisible).toBeTruthy()
    })
  })

  describe('when JavaScript is available', () => {
    describe('when menu button is pressed', () => {
      it('should apply the corresponding open state class to the menu button', async () => {
        await page.setJavaScriptEnabled(true)
        await page.goto(baseUrl, { waitUntil: 'load' })
        await page.click(mobileNavToggler)

        const toggleButtonIsOpen = await page.evaluate((mobileNavToggler) =>
          document.body.querySelector(mobileNavToggler).classList.contains('govuk-header__menu-button--open'),
        mobileNavToggler)

        expect(toggleButtonIsOpen).toBeTruthy()
      })

      it('should indicate the expanded state of the toggle button using aria-expanded', async () => {
        await page.setJavaScriptEnabled(true)
        await page.goto(baseUrl, { waitUntil: 'load' })
        await page.click(mobileNavToggler)

        const toggleButtonAriaExpanded = await page.evaluate((mobileNavToggler) =>
          document.body.querySelector(mobileNavToggler).getAttribute('aria-expanded'),
        mobileNavToggler)

        expect(toggleButtonAriaExpanded).toBe('true')
      })

      it('should indicate the open state of the navigation', async () => {
        await page.goto(baseUrl, { waitUntil: 'load' })
        await page.click(mobileNavToggler)

        const navigationIsOpen = await page.evaluate((mobileNav) =>
          document.body.querySelector(mobileNav).classList.contains('app-navigation--active'),
        mobileNav)

        expect(navigationIsOpen).toBeTruthy()
      })

      it('should indicate the visible state of the navigation using the hidden attribute', async () => {
        await page.goto(baseUrl, { waitUntil: 'load' })
        await page.click(mobileNavToggler)

        const navigationIsHidden = await page.evaluate((mobileNav) =>
          document.body.querySelector(mobileNav).hasAttribute('hidden'),
        mobileNav)

        expect(navigationIsHidden).toBe(false)
      })
    })
  })
})
