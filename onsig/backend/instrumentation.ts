/**
 * Next.js 14 instrumentation hook.
 *
 * Runs ONCE per Node process at startup, before any route is registered.
 * Perfect place for global agents: Application Insights, OpenTelemetry, Sentry.
 *
 * Notes:
 *   - We dynamic-import `applicationinsights` so this file works even when the
 *     dep isn't installed (e.g. minimal CI builds).
 *   - We never throw from here — telemetry must be best-effort, otherwise a
 *     broken AI connection string would tank an entire production rollout.
 *   - We expose the client on `globalThis.__onsigTelemetry` so `lib/logger`
 *     can forward errors without importing the SDK directly.
 */

export async function register() {
  // The instrumentation hook fires for BOTH the nodejs and edge runtimes. We
  // only want App Insights in nodejs — the edge runtime has no fs, no native
  // modules, and Microsoft's SDK depends on both.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const conn = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING
  if (!conn) {
    // No connection string → silent no-op. Logged once for observability.
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({
        ts: new Date().toISOString(),
        level: 'info',
        msg: 'app insights disabled (no connection string)',
        service: 'onsig-backend',
      }))
    }
    return
  }

  try {
    // `webpackIgnore: true` keeps webpack out of this import entirely:
    //   - dev server doesn't crash when the package isn't installed yet
    //   - production bundle doesn't try to inline a 6 MB SDK we may not use
    //   - Fly machines resolve it lazily at boot, after env is wired
    const appInsights = await import(/* webpackIgnore: true */ 'applicationinsights')

    appInsights
      .setup(conn)
      .setAutoCollectRequests(true)
      .setAutoCollectExceptions(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(false)         // we already ship our own logs
      .setSendLiveMetrics(true)
      .setUseDiskRetryCaching(true)         // survive transient AI outages
      .setAutoDependencyCorrelation(true)
      .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
      .start()

    const client = appInsights.defaultClient

    // Tag every event with role + version so the AI UI can slice cleanly.
    client.context.tags[client.context.keys.cloudRole] = 'onsig-web'
    client.context.tags[client.context.keys.cloudRoleInstance] =
      process.env.WEBSITE_INSTANCE_ID ||
      process.env.HOSTNAME ||
      'local'

    // Expose the minimal surface our logger relies on. We narrow the type so
    // logger.ts doesn't need to depend on the SDK's type defs.
    globalThis.__onsigTelemetry = {
      trackTrace: (a) =>
        client.trackTrace({
          message: a.message,
          severity: a.severity,
          properties: a.properties as { [key: string]: string },
        }),
      trackException: (a) =>
        client.trackException({
          exception: a.exception,
          properties: a.properties as { [key: string]: string },
        }),
    }

    console.log(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'info',
      msg: 'app insights initialized',
      service: 'onsig-backend',
      role: 'onsig-web',
    }))
  } catch (err) {
    // Telemetry failures must never crash the app.
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      level: 'warn',
      msg: 'app insights failed to initialize',
      service: 'onsig-backend',
      err: (err as Error).message,
    }))
  }
}
