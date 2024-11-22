import React from "react";
import { describe, expect, afterEach, test } from "vitest";
import { ThemeProvider } from "styled-components";
import { cleanup, render } from "@testing-library/react";
import Light from "@Renderer/theme/LightTheme";
import BadgeFirmware from "./BadgeFirmware";

describe("BadgeFirmware", () => {
  afterEach(() => {
    cleanup();
  });

  test.each([
    { countdown: -1, text: "" },
    { countdown: 0, text: "" },
    { countdown: 1, text: "Keep holding" },
    { countdown: 2, text: "Release the key" },
    { countdown: 3, text: "Release the key" },
    { countdown: 4, text: "" },
    { countdown: 10, text: "" },
  ])("should render '$text' for countdown=$countdown", ({ countdown, text }) => {
    const { queryByTestId } = render(
      <ThemeProvider theme={Light}>
        <BadgeFirmware countdown={countdown} />
      </ThemeProvider>,
    );
    if (text === "") {
      expect(queryByTestId("badge-firmware")).toBeNull();
    } else {
      expect(queryByTestId("badge-firmware").textContent?.trim()).toBe(text);
    }
  });
});
