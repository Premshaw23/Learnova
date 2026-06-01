import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmptyNoticeState from "../EmptyNoticeState";

describe("EmptyNoticeState", () => {
  const defaultProps = {
    query: "",
    onResetFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders default message correctly when search query is empty", () => {
    render(<EmptyNoticeState {...defaultProps} />);

    // Verify main header
    expect(screen.getByText("No notices found")).toBeInTheDocument();

    // Verify default body message
    expect(
      screen.getByText(
        "There are no notices available right now. Reset filters or try again later."
      )
    ).toBeInTheDocument();

    // Verify reset button is rendered
    expect(
      screen.getByRole("button", { name: /reset filters/i })
    ).toBeInTheDocument();
  });

  test("renders search query correctly in the warning message when search filters return no results", () => {
    const props = {
      ...defaultProps,
      query: "exam schedule",
    };
    render(<EmptyNoticeState {...props} />);

    // Verify customized query warning message
    expect(
      screen.getByText(
        'No notices match "exam schedule". Try broadening the keywords, selecting a different category, or removing some filters.'
      )
    ).toBeInTheDocument();
  });

  test("triggers the onResetFilters callback function when the 'Reset filters' button is clicked", async () => {
    const user = userEvent.setup();
    render(<EmptyNoticeState {...defaultProps} />);

    const resetBtn = screen.getByRole("button", { name: /reset filters/i });
    await user.click(resetBtn);

    expect(defaultProps.onResetFilters).toHaveBeenCalledTimes(1);
  });
});
