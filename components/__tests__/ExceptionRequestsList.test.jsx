import React, { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExceptionRequestsList } from "../dashboard/ExceptionRequestsList";

describe("ExceptionRequestsList Focus Trap and Accessibility", () => {
  const defaultProps = {
    exceptionRequests: [],
    isLoadingRequests: false,
    requestsError: null,
    fetchAllRequests: jest.fn(),
    showAllRequestsModal: false,
    setShowAllRequestsModal: jest.fn(),
    allRequests: [],
    handleExceptionRequest: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not render modal when showAllRequestsModal is false", () => {
    render(<ExceptionRequestsList {...defaultProps} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("All Exception Requests")).not.toBeInTheDocument();
  });

  test("renders modal and implements dynamic focus trap with async loading content", async () => {
    const user = userEvent.setup();

    // Helper wrapper component to allow state change of allRequests simulating async rendering
    const TestWrapper = () => {
      const [allRequests, setAllRequests] = useState([]);
      const [showModal, setShowModal] = useState(false);

      return (
        <div>
          <button id="trigger-btn" onClick={() => setShowModal(true)}>Open</button>
          <button id="load-async-btn" onClick={() => setAllRequests([
            {
              id: "req-1",
              studentName: "Student One",
              studentId: "STU001",
              className: "Class A",
              reason: "medical_emergency",
              details: "Doctor visit",
              status: "pending",
              timestamp: new Date().toISOString(),
            }
          ])}>Load Async</button>
          <ExceptionRequestsList
            {...defaultProps}
            showAllRequestsModal={showModal}
            setShowAllRequestsModal={setShowModal}
            allRequests={allRequests}
          />
        </div>
      );
    };

    render(<TestWrapper />);

    // Capture the trigger button that opens the modal
    const triggerBtn = screen.getByRole("button", { name: "Open" });
    
    // Click to open the modal
    await user.click(triggerBtn);

    // Verify modal is shown
    expect(screen.getByText("All Exception Requests")).toBeInTheDocument();

    // Dynamic focus shift on open: should focus the close button (the X button)
    const closeBtn = screen.getByRole("button", { name: "" }); // lucide X button has no text
    await waitFor(() => {
      expect(document.activeElement).toBe(closeBtn);
    });

    // Currently only two focusable elements exist inside the empty modal: Close (X) and Close at the bottom
    const bottomCloseBtn = screen.getByRole("button", { name: "Close" });
    
    // Press Tab - should move focus to the bottom Close button
    await user.tab();
    expect(document.activeElement).toBe(bottomCloseBtn);

    // Press Tab again - should wrap back to the first element (the X close button)
    await user.tab();
    expect(document.activeElement).toBe(closeBtn);

    // Now trigger the asynchronous rendering / loading of requests
    const loadAsyncBtn = screen.getByRole("button", { name: "Load Async" });
    await user.click(loadAsyncBtn);

    // Verify that the new asynchronous request card has been rendered
    expect(screen.getByText("Student One")).toBeInTheDocument();

    // Focus is on loadAsyncBtn now. Let's move focus back inside the modal close button to test escape key focus restoration
    closeBtn.focus();
    expect(document.activeElement).toBe(closeBtn);

    // Let's press Escape to verify modal close
    await user.keyboard("{Escape}");
    
    // Verify that focus is restored back to the original trigger button!
    expect(document.activeElement).toBe(triggerBtn);
  });
});
