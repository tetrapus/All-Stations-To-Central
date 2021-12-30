describe("Train Game", () => {
  it("successfully loads", () => {
    cy.visit("/traingame");
    cy.get('[placeholder="Enter 4 digits"]').type("9999");
    cy.contains("sqrt((9 * 9)) + (9 / 9)");
    cy.get('[placeholder="Enter 4 digits"]').clear().type("1234");
    cy.contains("1 * ((2 * 3) + 4)");
  });
});

describe("Homepage - Logged Out", () => {
  it("successfully loads", () => {
    cy.visit("/");
    cy.contains("Choose a Username");
    cy.get("input").type("Joey{enter}");
    cy.contains("All Stations To Central");
    cy.contains("New Game");
  });
});

describe("Homepage - Logged In", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.contains("Choose a Username");
    cy.get("input").type("Joey{enter}");
  });

  it("should fail on random codes", () => {
    cy.get('[placeholder="Enter Code"]').type("Hello world!{enter}");
    cy.contains("Invalid game code!");
  });
});
