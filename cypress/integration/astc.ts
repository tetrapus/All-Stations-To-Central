function should(
  spec: { [method: string]: string | string[] },
  should = ["be.visible"],
  root = cy
) {
  Object.entries(spec).forEach(([method, selectors]) => {
    if (!Array.isArray(selectors)) {
      selectors = [selectors];
    }
    selectors.forEach((selector) => root[method](selector).should(...should));
  });
}

function clearState() {
  cy.window().then((win) => {
    win.indexedDB.databases().then((dbs) =>
      dbs.forEach((db) => {
        win.indexedDB.deleteDatabase(db.name);
      })
    );
  });
}

describe("Homepage - Logged Out", () => {
  it("successfully loads", () => {
    clearState();
    cy.visit("/");
    cy.contains("Choose a Username");
    cy.get("input").type("Joey{enter}");
    cy.contains("All Stations To Central");
    cy.contains("New Game");
  });
});

describe("Logged In", () => {
  it("should fail on random codes", () => {
    clearState();
    cy.visit("/");
    cy.contains("Choose a Username");
    cy.get("input").type("Joey{enter}");
    cy.get('[placeholder="Enter Code"]').type("Hello world!{enter}");
    cy.contains("Invalid game code!");
  });

  describe("Game Interface", () => {
    beforeEach(() => {
      clearState();
      cy.visit("/");
      cy.contains("Choose a Username");
      cy.get("input").type("Joey{enter}");
      cy.contains("New Game").click();
    });

    it("should create a new game successfully", () => {
      should({
        contains: [
          "Joey",
          "Leave Game",
          "Start Game",
          "Points",
          "Randomize Map",
          "Rardon",
        ],
      });
    });

    describe("Waiting Room", () => {
      it("should allow you to navigate to the created game", () => {
        cy.visit("/");
        cy.get('[placeholder="Enter Code"]').type("CYP-SBB{enter}");
        should({
          contains: [
            "Joey",
            "Leave Game",
            "Start Game",
            "Points",
            "Randomize Map",
            "Rardon",
          ],
        });
      });

      it("should allow you to update the map", () => {
        cy.contains("Randomize Map").click();
        should({
          contains: ["Hex", "Nan", "Nollbury", "Joey updated the map"],
        });
      });

      it("should allow you to leave the game", () => {
        // Should be able to leave the game
        cy.contains("Leave Game").click();
        should({
          contains: ["Joey left the game", "Join Game"],
        });
        should(
          {
            contains: ["Leave Game", "Start Game", "Randomize Map"],
          },
          ["not.exist"]
        );
      });

      it("should allow you to join the game", () => {
        cy.window()
          .then((win) => {
            win.localStorage.setItem("username", "Mitch");
          })
          .then(() => {
            cy.visit("/CYP-SBB");
            should({ contains: ["Join Game"] });
            should(
              { contains: ["Leave Game", "Start Game", "Randomize Map"] },
              ["not.exist"]
            );
            cy.contains("Join Game").click();
            should({
              contains: ["Joey", "Mitch", "Mitch joined the game"],
            });
          });
      });
    });
  });
});
