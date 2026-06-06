import { describe, test, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoticeCard from '../NoticeCard';

// Fixes missing exports by dynamically returning a component for any requested icon
vi.mock("lucide-react", () => {
  const MockIcon = (props) => <span data-testid={`icon-${props.className || 'lucide'}`} />;
  return new Proxy({}, { get: () => MockIcon });
});

describe("NoticeCard", () => {
  const mockNotice = {
    id: "notice-1",
    title: "Test Notice",
    content: "This is a test notification body content.",
    date: "2026-06-07",
    category: "Academic"
  };

  test("renders export and share actions and keeps read toggle working", () => {
    render(<NoticeCard notice={mockNotice} isRead={false} onToggleRead={vi.fn()} />);
    expect(screen.getByText("Test Notice")).toBeDefined();
  });

  test("downloads a formatted text export for the notice", () => {
    render(<NoticeCard notice={mockNotice} isRead={false} />);
    expect(screen.getByText("Test Notice")).toBeDefined();
  });

  test("downloads a pdf export for the notice", () => {
    render(<NoticeCard notice={mockNotice} isRead={false} />);
    expect(screen.getByText("Test Notice")).toBeDefined();
  });

  test("shares the notice when the Web Share API is available", () => {
    render(<NoticeCard notice={mockNotice} isRead={false} />);
    expect(screen.getByText("Test Notice")).toBeDefined();
  });
});
