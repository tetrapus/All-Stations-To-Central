import useLocalStorage from "@rehooks/local-storage";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { TextButton } from "atoms/TextButton";
import { deleteDoc, setDoc } from "@firebase/firestore";
import { Game, Map, Player, trainColors } from "data/Game";
import { docRef } from "init/firebase";
import { distance, generateMap } from "../../util/mapgen";
import { Flex } from "atoms/Flex";

interface Props {
  players: Player[];
  game: Game;
}

export function WaitingRoom({ players }: Props) {
  const [username] = useLocalStorage<string>("username");
  const { id } = useParams<{ id: string }>();

  const [map, setMap] = useState<Map>();
  useEffect(() => {
    setMap(
      generateMap({
        cities: 30,
        connectivity: 3,
        ferries: 0,
        tunnels: 0,
        players: { min: 2, max: 6 },
        canMonopolizeLineMin: 2,
        scoringTable: {
          1: 1,
          2: 2,
          3: 4,
          4: 7,
          5: 10,
          6: 15,
        },
      })
    );
  }, []);

  if (!username || !players) {
    return null;
  }

  const ratio = [16, 9];
  const width = 90;
  const height = (width * ratio[1]) / ratio[0];

  return (
    <>
      {" "}
      <span>
        {players.find((player) => player.name === username) ? (
          <TextButton
            onClick={async (event) => {
              await deleteDoc(docRef("games", id, "players", username));
            }}
          >
            Leave Game
          </TextButton>
        ) : (
          <TextButton
            onClick={async (event) => {
              const player: Player = {
                name: username,
                order: 1,
                hand: [],
                routes: [],
                trainCount: 45,
                stationCount: 0,
              };
              await setDoc(docRef("games", id, "players", username), player);
            }}
          >
            Join Game
          </TextButton>
        )}
      </span>
      <div
        css={{
          width: `${width}vw`,
          height: `${height}vw`,
          background: "#111",
          border: "5px solid black",
          margin: 8,
          position: "relative",
        }}
      >
        <span css={{ color: "white", fontWeight: "bold", fontSize: 24 }}>
          {map?.name}
        </span>
        {map?.lines.map((line) => {
          const start = map.destinations.find(
            (destination) => line.start === destination.name
          );
          const end = map.destinations.find(
            (destination) => line.end === destination.name
          );
          if (!start || !end) return;
          return (
            <Flex
              css={{
                left: `${(start.position.x * width) / ratio[0]}vw`,
                position: "absolute",
                top: `${(start.position.y * height) / ratio[1]}vw`,
                transform: `rotate(${
                  Math.atan2(
                    end.position.y - start.position.y,
                    end.position.x - start.position.x
                  ) *
                  (180 / Math.PI)
                }deg) translateY(-50%)`,
                transformOrigin: "top left",
                height: 12,
                width: `${distance(start, end) * 5.6}vw`,
              }}
            >
              <Flex css={{ width: "100%", paddingLeft: 12, paddingRight: 12 }}>
                {new Array(line.length).fill(0).map((_, idx) => (
                  <Flex
                    key={idx}
                    css={{
                      borderColor: trainColors[line.color[0]],
                      borderWidth: 2,
                      borderStyle: "solid",
                      margin: "0px 8px 0px 8px",
                      flexGrow: 1,
                      transform: `translateY(${
                        (8 * line.length) / 2 -
                        Math.abs(
                          (idx + 0.5 - Math.ceil(line.length / 2)) / line.length
                        ) *
                          (8 * line.length - 8)
                      }px) rotate(${
                        -((idx + 0.5 - line.length / 2) / line.length) * 20
                      }deg)`,
                    }}
                  ></Flex>
                ))}
              </Flex>
            </Flex>
          );
        })}
        {map?.destinations.map((destination) => (
          <Flex
            css={{
              left: `${(destination.position.x * width) / ratio[0]}vw`,
              position: "absolute",
              top: `${(destination.position.y * height) / ratio[1]}vw`,
              color: "white",
              transform: "translateY(-50%)",
            }}
          >
            <div
              css={{
                borderRadius: 10,
                width: 16,
                height: 16,
                background: "black",
                border: "2px solid grey",
                transform: "translateX(-50%)",
              }}
            ></div>
            <span
              css={{
                background: "rgba(0, 0, 0, 0.5)",
                fontSize: 12,
                maxWidth: "5vw",
              }}
            >
              {destination.name}
            </span>
          </Flex>
        ))}
      </div>
    </>
  );
}
