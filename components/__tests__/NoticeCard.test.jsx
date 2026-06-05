import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import NoticeCard from "../NoticeCard";

const mockPdfInstance = {
  internal: {
    pageSize: {
      getWidth: vi.fn(() => 210),
      getHeight: vi.fn(() => 297),
    },
  },
  setFont: vi.fn(),
  setFontSize: vi.fn(),
  text: vi.fn(),
  splitTextToSize: vi.fn(() => [
    "Exam Schedule Updated",
    "The exam timetable has been updated for next week.",
  ]),
  addPage: vi.fn(),
  save: vi.fn(),
  setFillColor: vi.fn(),
  rect: vi.fn(),
  setDrawColor: vi.fn(),
  setLineWidth: vi.fn(),
  line: vi.fn(),
  getTextWidth: vi.fn(() => 15),
  roundedRect: vi.fn(),
  setTextColor: vi.fn(),
};

vi.mock("jspdf", () => ({
  jsPDF: vi.fn(() => mockPdfInstance),
}));

const baseNotice = {
  id: "notice-1",
  title: "Exam Schedule Updated",
  category: "academic",
  content: "The exam timetable has been updated for next week.",
  tags: ["exam", "schedule"],
  author: "Admin Office",
  priority: "high",
  isPinned: true,
  createdAt: new Date("2026-05-24T10:00:00.000Z"),
};

const defaultProps = {
  notice: baseNotice,
  isRead: false,
  onToggleRead: vi.fn(),
  searchQuery: "",
  getRelativeTime: vi.fn(() => "2h ago"),
};

const readBlobAsText = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });

describe("NoticeCard", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:notice-export"),
    });

    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.values(mockPdfInstance).forEach((value) => {
      if (value && typeof value.mockClear === "function") {
        value.mockClear();
      }
    });
  });

  test("renders export and share actions and keeps read toggle working", async () => {
    const user = userEvent.setup();

    render(<NoticeCard {...defaultProps} />);

    expect(
      screen.getByRole("button", {
        name: /download exam schedule updated as text/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /download exam schedule updated as pdf/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /share exam schedule updated/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /read/i }));

    expect(defaultProps.onToggleRead).toHaveBeenCalledTimes(1);
  });

  test("downloads a formatted text export for the notice", async () => {
    const user = userEvent.setup();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<NoticeCard {...defaultProps} />);

    await user.click(
      screen.getByRole("button", {
        name: /download exam schedule updated as text/i,
      })
    );

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const exportedBlob = URL.createObjectURL.mock.calls[0][0];
    const exportedText = await readBlobAsText(exportedBlob);

    expect(exportedText).toContain("Exam Schedule Updated");
    expect(exportedText).toContain("Category: academic");
    expect(exportedText).toContain("Status: Unread");
    expect(exportedText).toContain("Tags: #exam, #schedule");
  });

  test("downloads a pdf export for the notice", async () => {
    const user = userEvent.setup();

    render(<NoticeCard {...defaultProps} />);

    await user.click(
      screen.getByRole("button", {
        name: /download exam schedule updated as pdf/i,
      })
    );

    expect(mockPdfInstance.setFont).toHaveBeenCalledWith("helvetica", "bold");
    expect(mockPdfInstance.save).toHaveBeenCalledWith(
      "exam-schedule-updated.pdf"
    );
  });

  test("shares the notice when the Web Share API is available", async () => {
    const user = userEvent.setup();
    const shareMock = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: shareMock,
    });

    render(<NoticeCard {...defaultProps} />);

    await user.click(
      screen.getByRole("button", { name: /share exam schedule updated/i })
    );

    await waitFor(() => expect(shareMock).toHaveBeenCalledTimes(1));
    expect(shareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Exam Schedule Updated",
        text: expect.stringContaining(
          "The exam timetable has been updated for next week."
        ),
      })
    );
  });
});
