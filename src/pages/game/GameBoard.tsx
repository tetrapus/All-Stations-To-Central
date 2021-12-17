import React, { useState } from "react";
import { DEFAULT_MAP_SETTINGS, Game, Player } from "data/Game";
import { Flex } from "atoms/Flex";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import { doc, serverTimestamp } from "firebase/firestore";
import { docRef, collectionRef } from "init/firebase";
import { generateMap } from "util/mapgen";
import { City } from "./City";
import { runPlayerAction } from "util/run-game-action";
import { isCurrentPlayer } from "util/is-current-player";
import styled from "@emotion/styled";
import { TrainLine } from "./TrainLine";

interface Props {
  game: Game;
  me?: Player;
  highlightedNodes: string[];
  players: Player[];
}

const BoardBackground = styled.div<{ game: Game; me?: Player }>(
  {
    backgroundSize: "cover",
    border: "5px solid black",
    margin: 16,
    position: "relative",
  },
  ({ game, me }) => ({
    width: game.map.size.width,
    height: game.map.size.height,
    background: me && isCurrentPlayer(game, me) ? "black" : "#333",
  })
);

export function GameBoard({ game, me, highlightedNodes, players }: Props) {
  const [mapSettings, setMapSettings] = useState(DEFAULT_MAP_SETTINGS);

  if (!game.map) return null;

  const playerColors = Object.fromEntries(
    players.map((player) => [player.name, player.color])
  );

  const map = game.map;

  return (
    <BoardBackground game={game} me={me}>
      <Flex>
        <span
          css={{
            color: "white",
            fontWeight: "bold",
            fontSize: 24,
            marginRight: "auto",
          }}
        >
          {map?.name}
        </span>
        {!game.isStarted ? (
          <Flex>
            <TextInput
              placeholder="Cities"
              value={mapSettings.cities}
              onChange={(e) => {
                setMapSettings({
                  ...mapSettings,
                  cities: Number(e.currentTarget.value),
                });
              }}
              css={{ width: 80 }}
            />
            <TextInput
              placeholder="Connectivity"
              value={mapSettings.connectivity}
              onChange={(e) => {
                setMapSettings({
                  ...mapSettings,
                  connectivity: Number(e.currentTarget.value),
                });
              }}
              css={{ width: 80 }}
            />
            <TextInput
              placeholder="Routes (46)"
              css={{ width: 80 }}
              value={mapSettings.routes}
              onChange={(e) => {
                setMapSettings({
                  ...mapSettings,
                  routes: Number(e.currentTarget.value),
                });
              }}
            />
            <TextInput
              placeholder="Width (1200)"
              css={{ width: 80 }}
              value={mapSettings.size.width}
              onChange={(e) => {
                setMapSettings({
                  ...mapSettings,
                  size: {
                    width: Number(e.currentTarget.value),
                    height: mapSettings.size.height,
                  },
                });
              }}
            />
            <TextInput
              placeholder="Height (1200)"
              css={{ width: 80 }}
              value={mapSettings.size.height}
              onChange={(e) => {
                setMapSettings({
                  ...mapSettings,
                  size: {
                    height: Number(e.currentTarget.value),
                    width: mapSettings.size.width,
                  },
                });
              }}
            />
            <TextButton
              onClick={() => {
                if (!me) {
                  return;
                }
                runPlayerAction(game, me, async ({ game, me, transaction }) => {
                  transaction.update(docRef("games", game.id), {
                    map: generateMap({
                      ...DEFAULT_MAP_SETTINGS,
                      ...mapSettings,
                    }),
                  });
                  await transaction.set(
                    doc(collectionRef("games", game.id, "events")),
                    {
                      author: me.name,
                      timestamp: serverTimestamp(),
                      message: `${me.name} updated the map`,
                    }
                  );
                });
              }}
            >
              Randomize Map
            </TextButton>
          </Flex>
        ) : null}
      </Flex>
      {map?.lines.map((line, lineNo) =>
        line.color.map((color, colorIdx) => (
          <TrainLine
            game={game}
            me={me}
            playerColors={playerColors}
            line={line}
            lineNo={lineNo}
            color={color}
            colorIdx={colorIdx}
            key={lineNo * 2 + colorIdx}
          />
        ))
      )}
      {map?.destinations.map((destination) => (
        <City
          destination={destination}
          isHighlighted={highlightedNodes.includes(destination.name)}
          key={destination.name}
        />
      ))}
    </BoardBackground>
  );
}
