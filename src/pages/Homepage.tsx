import { Stack } from "atoms/Stack";
import React from "react";
import { TextButton } from "atoms/TextButton";
import { TextInput } from "atoms/TextInput";
import stations from "data/stations.json";
import { useHistory } from "react-router";
import { useLocalStorage } from "@rehooks/local-storage";

const randomElement = (array: any[]) =>
  array[Math.floor(Math.random() * array.length)];

function generateCode() {
  return `${randomElement(stations).code}-${randomElement(stations).code}`;
}

export function Homepage() {
  const history = useHistory();
  const [username, setUsername] = useLocalStorage<string>("username");

  return (
    <Stack css={{ margin: "auto", width: 300, alignItems: "center" }}>
      <h1>All Stations To Central</h1>
      {username ? (
        <>
          <TextButton
            onClick={() => {
              history.push(`/${generateCode()}`);
            }}
          >
            New Game
          </TextButton>
          <span css={{ marginTop: 24, marginBottom: 16 }}>or</span>
          <TextInput placeholder="Enter Code"></TextInput>
        </>
      ) : (
        <>
          <strong>Choose a Username</strong>
          <TextInput
            onKeyPress={(event) => {
              if (event.key === "Enter") {
                setUsername(event.currentTarget.value);
              }
            }}
          />
        </>
      )}
    </Stack>
  );
}
