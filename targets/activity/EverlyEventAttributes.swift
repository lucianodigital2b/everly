import ActivityKit
import Foundation

// ⚠️ Mirrored byte-for-byte in
//    modules/everly-live-activity/ios/EverlyEventAttributes.swift
//
// The app starts the activity from a CocoaPods target and this extension draws
// it from another, so the type can't literally be shared — ActivityKit pairs a
// running activity with this widget by the *unqualified* type name, which is
// why two identical copies work. Add a field to one copy only and the Live
// Activity silently stops rendering, so change both together.
struct EverlyEventAttributes: ActivityAttributes {
  /// The parts that change while the event runs.
  public struct ContentState: Codable, Hashable {
    /// Photos uploaded so far — the counter in the pill.
    var photoCount: Int
    /// When the event closes. Drives the live countdown and the stale date.
    var endsAt: Date
  }

  /// Event id, used to find this event's activity among any others running.
  var eventId: String
  /// Display name, e.g. "Luciano Gude's party".
  var eventName: String
  /// Deep link to the event screen — where a tap on the card lands.
  var eventURL: String
  /// Deep link to this event's capture screen — the camera button.
  var captureURL: String
}
