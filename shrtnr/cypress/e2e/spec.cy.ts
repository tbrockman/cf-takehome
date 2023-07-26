describe('shrtnr', () => {

  before(() => {
    const { urls } = require('../fixtures/data.json')
    urls.forEach((url) => {
      cy.request({ method: 'POST', url: 'localhost:3000/api/links', followRedirect: false, retryOnStatusCodeFailure: false, body: { url } })
    })
  })

  after(() => {
    cy.request('POST', 'localhost:3000/api/admin/clean')
  })

  context('search', () => {

  })

  it('loads the home page', () => {
    cy.visit('localhost:3000/')
    const label = cy.contains('🔍 Find or 🩳 shorten a 🔗 link')
    label.click()
    const form = cy.get('#find-or-shorten-form')
    form.should('be.focused')
    form.click()
    form.type('https://www.google.com')
  })
})