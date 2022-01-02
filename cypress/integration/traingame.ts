describe("Train Game", () => {
  it("successfully loads", () => {
    cy.visit("/traingame");
    cy.get('[placeholder="Enter 4 digits"]').type("9999");
    cy.contains("sqrt((9 * 9)) + (9 / 9)");
    cy.get('[placeholder="Enter 4 digits"]').clear().type("1234");
    cy.contains("1 * ((2 * 3) + 4)");
  });
});
