interface State {
  started: boolean;
  players: string[];
}

function choose<T>(choices: T[]) {
  return choices[Math.floor(Math.random() * choices.length)];
}

function runMachine(
  state,
  spec: {
    [name: string]: {
      if: (state: State) => boolean;
      then: (me: string) => void;
      as: (state: State) => string;
      to: (me: string, state: State) => Partial<State>;
    };
  },
  invariants: {
    [name: string]: {
      if: (state: State) => boolean;
      as: (state: State) => string;
      expect: () => void;
    };
  }
) {
  const [name, { then: result, as: pickMe, to: effect }] = choose(
    Object.entries(spec).filter(([_, { if: condition }]) => condition(state))
  );
  const me = pickMe(state);

  const newState = { ...state, ...effect(me, state) };
  describe(`${me} can ${name}`, () => {
    before(() => {
      cy.window().then((win) => {
        win.localStorage.setItem("username", me);
        win.dispatchEvent(
          new StorageEvent("storage", { key: "username", newValue: me })
        );
      });
    });
    it(`${me} should be able to ${name}`, () => result(me));
    // Pick an invariant to check
    // TODO: check more!

    Object.entries(invariants)
      .filter(([, { if: condition }]) => condition(newState))
      .forEach(([name, { as: pickMe, expect }]) => {
        const me = pickMe(newState);
        it(`${me} ${name}`, () => {
          cy.window()
            .then((win) => {
              win.localStorage.setItem("username", me);
              win.dispatchEvent(
                new StorageEvent("storage", { key: "username", newValue: me })
              );
            })
            .then(() => {
              expect();
            });
        });
      });
  });
  return newState;
}

function randid() {
  return "xxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

describe("All Stations To Central", () => {
  before(() => {
    cy.visit("/");
    cy.window().then((win) => {
      win.indexedDB.databases().then((dbs) =>
        dbs.forEach((db) => {
          win.indexedDB.deleteDatabase(db.name);
        })
      );
    });
    cy.get("input").type("Joey{enter}");
    cy.contains("New Game").click();
  });

  let state: State = {
    started: false,
    players: ["Joey"],
  };

  for (let i = 0; i < 10; i++) {
    // Possible actions
    const any = (state: State) => choose(state.players);
    const psy = cy;

    state = runMachine(
      state,
      {
        "join the game": {
          if: ({ started }) => !started,
          as: randid,
          then: (name) => {
            psy.contains("Join Game").click();
            psy.contains(name);
          },
          to: (name, { players }) => ({ players: [...players, name] }),
        },
        "leave the game": {
          if: ({ started, players }) => !started && !!players.length,
          as: any,
          then: (name) => {
            psy.contains(name);
            psy.contains("Leave Game").click();
            psy.contains(`${name} left the game`);
          },
          to: (name, { players }) => ({
            players: players.filter((player) => player !== name),
          }),
        },
        "randomize the map": {
          if: ({ started, players }) => !started && !!players.length,
          as: any,
          then: (name) => {
            psy
              .get('[placeholder="Cities (50)"]')
              .clear()
              .type((Math.floor(Math.random() * 80) + 2).toString());
            psy
              .get('[placeholder="Connectivity (3.5)"]')
              .clear()
              .type((Math.random() * 7).toFixed(1));
            psy
              .get('[placeholder="Routes (46)"]')
              .clear()
              .type(Math.floor(Math.random() * 100).toString());
            psy
              .get('[placeholder="Width (1600)"]')
              .clear()
              .type(Math.floor(Math.random() * 3000).toString());
            psy
              .get('[placeholder="Height (900)"]')
              .clear()
              .type(Math.floor(Math.random() * 3000).toString());
            psy
              .get('[placeholder="Max Players (6)"]')
              .clear()
              .type(Math.floor(Math.random() * 20).toString());
            psy.contains("Randomize Map").click();
            psy.contains(`${name} updated the map`);
          },
          to: () => ({}),
        },
      },
      {
        /*
        "can start the game or randomize the map if the game isn't started": {
          if: ({ started, players }) => !started && !!players.length,
          as: any,
          expect: () => {
            psy.contains("Randomize Map");
            psy.contains("Randomize Map");
        },
        },*/
      }
    );

    // Run all invariants
    // If the game isn't started, you can start the game or randomize the map
    // If a player is in the game, they should have an event saying so
    // If the game isn't started, you cannot perform a move.
    // Spectators cannot perform an action.
  }
});
