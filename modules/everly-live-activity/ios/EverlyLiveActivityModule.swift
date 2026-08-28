import ActivityKit
import ExpoModulesCore

/// Everything the JS side needs to describe one running event. Times cross the
/// bridge as epoch milliseconds, since that's what `Date.getTime()` gives.
struct EverlyActivityOptions: Record {
  @Field var eventId: String = ""
  @Field var eventName: String = ""
  @Field var endsAt: Double = 0
  @Field var photoCount: Int = 0
  /// Deep links are built in JS with `Linking.createURL`, so the dev / preview /
  /// production schemes resolve without the native side knowing about variants.
  @Field var eventURL: String = ""
  @Field var captureURL: String = ""
}

public class EverlyLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EverlyLiveActivity")

    // False on iOS < 16.2, on anything but iOS, and when the user has switched
    // Live Activities off for Everly in Settings.
    Function("isAvailable") { () -> Bool in
      guard #available(iOS 16.2, *) else { return false }
      return ActivityAuthorizationInfo().areActivitiesEnabled
    }

    // Start-or-update: safe to call on every render pass. Returns the activity
    // id, or nil when nothing is running (unsupported, disabled, already over).
    AsyncFunction("start") { (options: EverlyActivityOptions) async throws -> String? in
      guard #available(iOS 16.2, *), ActivityAuthorizationInfo().areActivitiesEnabled else {
        return nil
      }

      let endsAt = Date(timeIntervalSince1970: options.endsAt / 1000)
      // An event that has already closed gets no card — and if one is somehow
      // still on screen, this is the moment to clear it.
      guard endsAt > Date() else {
        await EverlyLiveActivityModule.end(eventId: options.eventId)
        return nil
      }

      let state = EverlyEventAttributes.ContentState(
        photoCount: options.photoCount,
        endsAt: endsAt
      )
      let content = ActivityContent(state: state, staleDate: endsAt)

      if let running = EverlyLiveActivityModule.activity(for: options.eventId) {
        await running.update(content)
        return running.id
      }

      let attributes = EverlyEventAttributes(
        eventId: options.eventId,
        eventName: options.eventName,
        eventURL: options.eventURL,
        captureURL: options.captureURL
      )

      // ActivityKit wants the request on the main thread. `.runOnQueue` can't
      // do it here — it only exists on the synchronous-closure `AsyncFunction`,
      // so an `async` body plus that modifier stops compiling ("cannot pass
      // function of type ... async throws -> String? to parameter expecting
      // synchronous function type"). Hopping explicitly keeps the concurrency.
      return try await MainActor.run { () throws -> String in
        let activity = try Activity.request(
          attributes: attributes,
          content: content,
          pushType: nil
        )
        return activity.id
      }
    }

    AsyncFunction("end") { (eventId: String) async -> Void in
      guard #available(iOS 16.2, *) else { return }
      await EverlyLiveActivityModule.end(eventId: eventId)
    }

    AsyncFunction("endAll") { () async -> Void in
      guard #available(iOS 16.2, *) else { return }
      for activity in Activity<EverlyEventAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }

  @available(iOS 16.2, *)
  private static func activity(for eventId: String) -> Activity<EverlyEventAttributes>? {
    Activity<EverlyEventAttributes>.activities.first { $0.attributes.eventId == eventId }
  }

  @available(iOS 16.2, *)
  private static func end(eventId: String) async {
    guard let running = activity(for: eventId) else { return }
    await running.end(nil, dismissalPolicy: .immediate)
  }
}
