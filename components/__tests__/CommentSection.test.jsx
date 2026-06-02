import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommentSection from "../CommentSection";

const createLocalStorageMock = () => {
  let store = {};

  return {
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key) => store[key] ?? null),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
  };
};

describe("CommentSection", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createLocalStorageMock(),
    });

    window.localStorage.clear();
  });

  it("persists homepage comments under a stable fallback thread key", async () => {
    const user = userEvent.setup();

    const { unmount } = render(React.createElement(CommentSection));

    await waitFor(() =>
      expect(window.localStorage.getItem("comments_homepage")).toBeTruthy(),
    );

    const input = screen.getByPlaceholderText(/write a comment or share feedback/i);
    await user.type(input, "This should persist");
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(
        JSON.parse(window.localStorage.getItem("comments_homepage")),
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ text: "This should persist" }),
        ]),
      );
    });
    expect(window.localStorage.getItem("comments_undefined")).toBeNull();

    unmount();
    render(React.createElement(CommentSection));

    expect(await screen.findByText("This should persist")).toBeInTheDocument();
  });
});
