import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import SyncStatusBadge from "../SyncStatusBadge";

describe("SyncStatusBadge", () => {
  test("renders synced status for online state", () => {
    render(<SyncStatusBadge syncState="online" />);

    expect(screen.getByText("Synced")).toBeInTheDocument();
  });

  test("renders offline mode status", () => {
    render(<SyncStatusBadge syncState="offline" />);

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();
  });

  test("renders retrying sync status", () => {
    render(<SyncStatusBadge syncState="retrying" />);

    expect(screen.getByText("Retrying Sync...")).toBeInTheDocument();
  });

  test("renders sync issues status", () => {
    render(<SyncStatusBadge syncState="error" />);

    expect(screen.getByText("Sync Issues")).toBeInTheDocument();
  });

  test("renders spinner icon when retrying", () => {
    const { container } = render(
      <SyncStatusBadge syncState="retrying" />
    );

    const spinner = container.querySelector("svg");

    expect(spinner).toBeInTheDocument();
  });

  test("does not render spinner for non-retrying states", () => {
    const { container } = render(
      <SyncStatusBadge syncState="online" />
    );

    const spinner = container.querySelector("svg");

    expect(spinner).not.toBeInTheDocument();
  });

  test("falls back to offline mode for unknown state", () => {
    render(<SyncStatusBadge syncState="unknown" />);

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();
  });

  test("falls back to offline mode when syncState is undefined", () => {
    render(<SyncStatusBadge />);

    expect(screen.getByText("Offline Mode")).toBeInTheDocument();
  });
});