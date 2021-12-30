import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  // to fully reset the state between tests, clear the storage
  localStorage.clear();
  // and reset all mocks
  jest.clearAllMocks();

  // clearAllMocks will impact your other mocks too, so you can optionally reset individual mocks instead:
  // localStorage.setItem.mockClear();
});

test("renders username selector", () => {
  const { getByText } = render(<App />);
  const element = getByText(/Choose a username/i);
  expect(element).toBeInTheDocument();
});

test("renders homepage after username is selected", () => {
  localStorage.setItem("username", "Joey");
  const { getByText } = render(<App />);
  const element = getByText(/New Game/i);
  expect(element).toBeInTheDocument();
});
