it("renews lock while critical section is still running", async () => {
    vi.useFakeTimers();
    let resolveFn;
    const promise = withLock("user123", async () => {
        await new Promise(resolve => {
            resolveFn = resolve;
        });
    }, 100);
    await vi.advanceTimersByTimeAsync(250);
    const second = await acquireLock("user123", 100);
    expect(second).toBeFalsy();
    resolveFn();
    await promise;
    vi.useRealTimers();
});

it("releases lock after function completes", async () => {
    await withLock("abc", async () => {});
    const token = await acquireLock("abc");
    expect(token).toBeTruthy();
});