import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import AchievementSection from "../AchievementSection";
import toast from "react-hot-toast";

jest.mock("react-hot-toast", () => ({
__esModule: true,
default: {
success: jest.fn(),
},
}));

jest.mock("framer-motion", () => ({
motion: {
section: ({ children, ...props }) => (
<section {...props}>{children}</section>
),
},
}));

jest.mock("../AttendanceBadge", () => ({
__esModule: true,
default: ({ title, unlocked }) => ( <div
   data-testid="attendance-badge"
   data-unlocked={unlocked}
 >
{title} </div>
),
}));

describe("AchievementSection", () => {
beforeEach(() => {
jest.clearAllMocks();
jest.useFakeTimers();
});

afterEach(() => {
jest.runOnlyPendingTimers();
jest.useRealTimers();
});

test("renders achievement section heading", () => {
render( <AchievementSection
     attendancePercentage={92}
     streakDays={8}
   />
);


expect(
  screen.getByRole("heading", {
    name: /attendance rewards & progress/i,
  })
).toBeInTheDocument();


});

test("renders all achievement badges", () => {
render( <AchievementSection
     attendancePercentage={92}
     streakDays={8}
   />
);

expect(screen.getAllByTestId("attendance-badge")).toHaveLength(5);


});

test("displays correct unlocked count", () => {
render( <AchievementSection
     attendancePercentage={92}
     streakDays={8}
   />
);

expect(screen.getByText("3/5")).toBeInTheDocument();


});

test("displays attendance and streak summary", () => {
render( <AchievementSection
     attendancePercentage={92}
     streakDays={8}
   />
);

expect(
  screen.getByText(/92% attendance.*8 day streak/i)
).toBeInTheDocument();


});

test("shows toast notifications only for unlocked badges", () => {
render( <AchievementSection
     attendancePercentage={92}
     streakDays={8}
   />
);


jest.runAllTimers();

expect(toast.success).toHaveBeenCalledTimes(3);

expect(toast.success).toHaveBeenCalledWith(
  "Unlocked Regular Attendee!",
  expect.objectContaining({
    icon: "✨",
  })
);

expect(toast.success).toHaveBeenCalledWith(
  "Unlocked Consistent Learner!",
  expect.objectContaining({
    icon: "📚",
  })
);

expect(toast.success).toHaveBeenCalledWith(
  "Unlocked Weekly Streak!",
  expect.objectContaining({
    icon: "🔥",
  })
);

});

test("shows all badge unlock toasts when attendance is perfect", () => {
render( <AchievementSection
     attendancePercentage={100}
     streakDays={10}
   />
);

jest.runAllTimers();

expect(toast.success).toHaveBeenCalledTimes(5);


});

test("uses default props when no props are provided", () => {
render(<AchievementSection />);


expect(
  screen.getByText(/92% attendance.*8 day streak/i)
).toBeInTheDocument();

expect(screen.getByText("3/5")).toBeInTheDocument();

jest.runAllTimers();

expect(toast.success).toHaveBeenCalledTimes(3);


});

test("shows no unlocked badges when attendance and streak are low", () => {
render( <AchievementSection
     attendancePercentage={20}
     streakDays={2}
   />
);


expect(screen.getByText("0/5")).toBeInTheDocument();

jest.runAllTimers();

expect(toast.success).not.toHaveBeenCalled();


});
});
