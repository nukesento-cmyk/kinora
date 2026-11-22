// Runs once when the server starts: a misconfigured deployment fails immediately.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getServerEnv } = await import("./env");
    getServerEnv();
  }
}
