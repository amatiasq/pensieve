describe('Happy path', () => {
  const getFirstNote = () => cy.get('.note-item');
  const firstNoteTitle = () => getFirstNote().get('.title-part');
  const getFirstNoteStar = () => getFirstNote().get('.fa-star');
  const getFirstGroupCounter = () => cy.get('.counter');
  const getFirstGroupFavCounter = () => cy.get('.fav-counter');
  const evenIfNotVisible = { force: true };

  before(() => {
    cy.login();
    cy.visit('/');
  });

  after(async () => {
    await cy.deleteRepo();
    cy.window().then(win => {
      win.localStorage.clear();
      return indexedDB.deleteDatabase('pensieve-data');
    });
  });

  it('Create note', () => {
    const clickCreateNote = () => cy.get(`aside .fa-plus`).click();

    cy.expectCommitFrom(clickCreateNote);
    getFirstNote().should('be.exist');
  });

  it('Unfavorite note', () => {
    getFirstNoteStar().should('have.class', 'fas');
    cy.expectCommitFrom(() => getFirstNoteStar().click());
    getFirstNoteStar().should('have.class', 'far');
  });

  it('Favorite note', () => {
    getFirstNoteStar().should('have.class', 'far');
    cy.expectCommitFrom(() => getFirstNoteStar().click(evenIfNotVisible));
    getFirstNoteStar().should('have.class', 'fas');
  });

  it('Edit note title', () => {
    getFirstNote().click();
    cy.writeToEditor('TESTING');
    firstNoteTitle().should('include.text', 'TESTING');
    cy.saveNote();
  });

  it('Move note to folder', () => {
    const getFirstGroup = () => cy.get('.group');
    const getFirstGroupTitle = () => getFirstGroup().get('.group-title');

    getFirstNote().click();
    cy.writeToEditor('MY FOLDER / NOTE NAME');
    firstNoteTitle().contains('NOTE NAME');
    cy.saveNote();
    getFirstGroup().should('be.exist');
    getFirstGroupTitle().contains('MY FOLDER');
    getFirstGroupCounter().contains('1');
  });

  it('Unfavorite note in group', () => {
    getFirstGroupFavCounter().contains('1');
    getFirstNoteStar().should('have.class', 'fas');
    cy.expectCommitFrom(() => getFirstNoteStar().click());
    getFirstNoteStar().should('have.class', 'far');
    getFirstGroupFavCounter().should('not.exist');
  });

  it('Favorite note in group', () => {
    getFirstGroupFavCounter().should('not.exist');
    getFirstNoteStar().should('have.class', 'far');
    cy.expectCommitFrom(() => getFirstNoteStar().click(evenIfNotVisible));
    getFirstNoteStar().should('have.class', 'fas');
    getFirstGroupFavCounter().contains('1');
  });

  it('Delete note', () => {
    const deleteFirstNote = () =>
      cy.get('.note-item .fa-trash').click(evenIfNotVisible);

    cy.expectCommitFrom(deleteFirstNote);
    getFirstNote().should('not.exist');
  });
});
