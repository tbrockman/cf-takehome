import { Interception } from "cypress/types/net-stubbing"

describe('shrtnr', () => {

  context('home', () => {
    it('loads the home page', () => {
      cy.visit('localhost:3000/')
    })
  })

  context('create/delete', () => {

    before(() => {
      cy.request('POST', 'localhost:3000/api/admin/clean')
    })

    it('creates a new short link', () => {
      cy.visit('localhost:3000/')
      const form = cy.get('#find-or-shorten-form')
      form.click()
      cy.intercept('POST', '/api/links').as('createLink')
      form.type('https://google.com{enter}')
      const req = cy.wait('@createLink').then((interception: Interception) => {
        expect(interception.request.body).to.equal(JSON.stringify({ 'url': 'https://google.com' }))
        expect(interception.response.statusCode).to.equal(201)
      })
    })
    it('fails to create an existing short link', () => {
      cy.visit('localhost:3000/')
      const form = cy.get('#find-or-shorten-form')
      form.click()
      cy.intercept('POST', '/api/links').as('createLink')
      form.type('https://google.com{enter}')
      const req = cy.wait('@createLink').then((interception: Interception) => {
        expect(interception.request.body).to.equal(JSON.stringify({ 'url': 'https://google.com' }))
        expect(interception.response.statusCode).to.equal(200)
        expect(interception.response.body).to.haveOwnProperty('short')
        expect(interception.response.body).to.haveOwnProperty('long')
        expect(interception.response.body).to.haveOwnProperty('views')
      })
    })
    it('deletes an existing short link', () => { })
  })

  context('search', () => {
    before(() => {
      const { urls } = require('../fixtures/data.json')
      urls.forEach((url) => {
        cy.request({ method: 'POST', url: 'localhost:3000/api/links', body: { url } })
      })
    })

    after(() => {
      // cy.request('POST', 'localhost:3000/api/admin/clean')
    })

    it('returns list of expected search results', () => {
      cy.visit('localhost:3000/')
      const label = cy.contains('🔍 Find or 🩳 shorten a 🔗 link')
      label.click()
      const form = cy.get('#find-or-shorten-form')
      form.should('be.focused')
      form.click()
      form.type('https://google.com')
      const list = cy.get('#find-or-shorten-form-listbox')
      list.should('be.visible')
      list.children().should('have.length', 4)
    })

    it('finds no search results except to create new link', () => {

    })
  })
})