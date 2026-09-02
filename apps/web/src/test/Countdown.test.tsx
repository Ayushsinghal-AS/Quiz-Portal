import { act, render, screen } from "@testing-library/react";
import { Countdown } from "../components/Countdown";
import { vi } from "vitest";

describe("Countdown", () => {
  it("calls onExpire when time reaches zero", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const expiresAt = new Date(Date.now() + 1000).toISOString();

    render(<Countdown expiresAt={expiresAt} onExpire={onExpire} />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(screen.getByText("00:00")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
