import { Stack } from "atoms/Stack";
import React from "react";

export function Instructions() {
  return (
    <Stack css={{ minWidth: "min(100vw, 800px)" }}>
      <h1>How to Play</h1>
      <p>
        <strong>TL;DR:</strong> Player with the highest score at the end of the
        game wins. Win points by connecting all of your routes, building lines,
        and collecting bonuses. You <i>lose</i> points for routes you don't
        finish before the end of the game!
      </p>
      <h2>Setting Up</h2>
      <p>
        Before starting the game, take a second to customize the map! The more
        players you have, the bigger your board should be and the more cities
        you should have. The "Max Players" number will optimise the board for
        that number of players by adding <i>double routes</i>, but you don't
        want too many of these!
      </p>
      <p>
        Once everyone has joined the game, click start. Players can leave at any
        point, but any addtional players must spectate until the next game. Each
        player must choose to keep at least 2 of 5 random route cards before the
        game starts.
      </p>
      <p>
        Along with your route cards, you also start off with 4 colored cards and
        3 stations. These are described in the next section.
      </p>
      <h2>Your Turn</h2>
      <p>
        On your turn, you can choose to either buy a line, buy a station, draw
        cards, or pick new routes. After the first round, each player only has{" "}
        <b>2 minutes</b> to make their move, so plan your move in advance!
      </p>
      <p>
        <i>
          Hint: Even when it isn't your turn, you can still choose lines and
          stations to build on for your next turn.
        </i>
      </p>
      <h3>Buying a Line</h3>
      <p>
        To win a route, you must connect the cities by purchasing the train
        lines in between. Once a train line has been taken, it cannot be
        purchased by anyone else, but may be used by a player who purchases an
        adjacent station. Train lines have different lengths - in order to buy a
        line, you need to spend that many cards of the same color.
        <i>Rainbow train lines</i> allow you to choose a color to use.{" "}
        <i>Rainbow cards</i> can be used in place of any color. There are two
        types of <i>special</i> train lines that have additional rules, ferry
        lines and tunnels.
      </p>
      <p>
        Even without completing a route, purchased routes contribute to your
        score, with bigger routes being worth more points. See the score card in
        the top right for more details.{" "}
      </p>
      <h4>Ferries</h4>
      <p>
        Ferry lines are marked with a locomotive symbol. To buy these lines, you
        can only use a rainbow card for each track marked with a locomotive
        symbol on the line.
      </p>
      <h4>Tunnels</h4>
      <p>
        Tunnels are marked with a broken border, and can cost up to 3 cards more
        than the length of the line. You must choose which cards you are willing
        to spend prior to purchasing the tunnel. When you attempt to buy a
        tunnel, three cards are revealed from the deck - for each matching card,
        the tunnel's price increases by one card. If you fail to buy the tunnel,
        all your cards will be returned, otherwise any unused cards are returned
        to your hand. After attempting to buy a tunnel, your turn ends
        immediately, regardless of whether you succeeded.
      </p>
      <h3>Buying a Station</h3>
      <p>
        You can build a station on a city to use one adjacent train line owned
        by another player. You can change which line your station is using at
        any point in the game, until the game ends. Stations can be built on any
        unoccupied city. For each station you build, the price of your next
        station increases by 1, starting at 1 card for your first station.
        Unused stations are worth 4 points each at the end of the game.
      </p>
      <h3>Drawing Cards</h3>
      <p>
        You can choose to draw at most 2 cards per turn, either from the face-up
        cards or the deck. If you choose a rainbow card from the face-up pile,
        your turn ends immediately. You cannot select a face-up rainbow card as
        your second card.
      </p>
      <h3>Drawing Routes</h3>
      <p>
        You can choose to draw 3 route cards from the deck. You must keep at
        least one of these cards. You lose points for any incomplete routes at
        the end of the game.
        <br />
        <i>Hint: Click on a card to see the cities on the map</i>
      </p>
      <h2>Ending the Game</h2>
      <p>
        Once someone has less than 3 trains remaining, the final round kicks
        off. Each player gets 1 more turn before the game ends. Players get
        points for any purchased trains, remaining stations, and completed
        routes. Players lose points for incomplete routes. A bonus of 10 points
        is awarded to the player(s) with the most completed routes.
      </p>
    </Stack>
  );
}
