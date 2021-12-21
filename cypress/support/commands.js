// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('login', () =>
  cy.window().then(win => {
    win.localStorage.setItem(
      'notes.gh-user',
      `{"data":"${Cypress.env('TEST_GH_USERNAME')}","version":1}`,
    );

    win.localStorage.setItem(
      'notes.gh-token',
      `{"data":"${Cypress.env('TEST_GH_TOKEN')}","version":1}`,
    );
  }),
);

Cypress.Commands.add('deleteRepo', () =>
  cy.request({
    method: 'DELETE',
    url: `https://api.github.com/repos/${Cypress.env(
      'TEST_GH_USERNAME',
    )}/pensieve-data`,
    headers: {
      Authorization: `token ${Cypress.env('TEST_GH_TOKEN')}`,
    },
  }),
);

Cypress.Commands.add('expectCommitFrom', action => {
  cy.intercept('POST', '/commit').as('commit');
  action();
  cy.wait('@commit');
});

Cypress.Commands.add('selectEditor', () => cy.get('.editor').click().focused());

Cypress.Commands.add('writeToEditor', text =>
  cy.selectEditor().type('{cmd}a').clear().type(text),
);

Cypress.Commands.add('saveNote', () =>
  cy.expectCommitFrom(() => cy.selectEditor().type('{cmd}s')),
);
