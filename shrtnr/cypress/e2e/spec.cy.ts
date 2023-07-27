import { Interception } from "cypress/types/net-stubbing"

describe('shrtnr', () => {

  context('home', () => {
    it('loads the home page', () => {
      cy.visit('localhost:3000/')
    })
  })

  context('create/delete', () => {

    before(() => {
      cy.request('POST', 'localhost:3000/api/admin/clean').its('status').should('equal', 200)
    })

    after(() => {
      cy.request('POST', 'localhost:3000/api/admin/clean').its('status').should('equal', 200)
    })

    it('creates a short link', () => {
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

    it('returns existing short link on exact search', () => {
      cy.request('POST', 'localhost:3000/api/links', { url: 'https://anewlink.com' }).then((response) => {
        expect(response.status).to.equal(201)
        expect(response.body).to.haveOwnProperty('short')
        expect(response.body).to.haveOwnProperty('long')
        expect(response.body).to.haveOwnProperty('views')
        expect(response.body.long).to.equal('https://anewlink.com')
      }).then(() => {
        cy.visit('localhost:3000/')
        const form = cy.get('#find-or-shorten-form')
        form.click()
        cy.intercept('POST', '/api/links').as('createLink')
        form.type('https://anewlink.com')
        cy.get('#find-or-shorten-form-option-0').contains('anewlink.com')
      })
    })

    it('deletes an existing short link', () => {
      cy.request('POST', 'localhost:3000/api/links', { url: 'https://anewlink-2.com' }).then((res) => {
        const loc = res.headers.location
        cy.visit('localhost:3000/')
        const form = cy.get('#find-or-shorten-form')
        form.click()
        cy.intercept('POST', '/api/links').as('createLink')
        form.type('https://anewlink-2.com{enter}')
        cy.intercept('DELETE', loc).as('deleteLink')
        const deleteButton = cy.get(':nth-child(2) > .MuiButton-root')
        deleteButton.click()
        cy.get('.MuiBox-root > .MuiButton-variantSolid').click()
        cy.wait('@deleteLink').then((interception: Interception) => {
          expect(interception.response.statusCode).to.equal(200)
        })
      })
    })
  })

  context('search', () => {
    before(() => {
      cy.request('POST', 'localhost:3000/api/admin/clean')
      const { urls } = require('../fixtures/data.json')
      return urls.forEach((url) => {
        cy.request({ method: 'POST', url: 'localhost:3000/api/links', body: { url } }).its('status').should('equal', 201)
      })
    })

    after(() => {
      cy.request('POST', 'localhost:3000/api/admin/clean')
    })

    it('returns list of clickable search results', () => {
      cy.visit('localhost:3000/')
      const label = cy.contains('🔍 Find or 🩳 shorten a 🔗 link')
      label.click()
      const form = cy.get('#find-or-shorten-form')
      form.should('be.focused')
      form.click()
      form.type('https://google.com')
      const list = cy.get('#find-or-shorten-form-listbox')
      list.should('be.visible')
      list.children().should('have.length', 6)
      cy.get('#find-or-shorten-form-option-0 > .MuiGrid-container > .MuiGrid-grid-xs-8').click()
      cy.get('.MuiCard-root').should('be.visible')
    })

    it('finds results by hostname', () => { })
    it('finds results filtered by protocol', () => { })

    it('finds no search results except to create new link', () => {
      cy.visit('localhost:3000/')
      const label = cy.contains('🔍 Find or 🩳 shorten a 🔗 link')
      label.click()
      const form = cy.get('#find-or-shorten-form')
      form.should('be.focused')
      form.click()
      form.type('notalinkiveeverheardofbuddy.com')
      const list = cy.get('#find-or-shorten-form-listbox')
      list.should('be.visible')
      list.children().should('have.length', 1)
      cy.get('#find-or-shorten-form-option-0').click()
      cy.get('.MuiCard-root').should('be.visible')
    })
  })
})