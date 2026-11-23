import ActivityKit
import SwiftUI
import WidgetKit

// ─── Pieces ───────────────────────────────────────────────────────────────────

/// Photos-so-far counter. Reads as a chip on light grounds and as a frosted
/// pill inside the Dynamic Island, which is always dark.
private struct PhotoPill: View {
  let count: Int
  let fill: Color
  let tint: Color

  var body: some View {
    HStack(spacing: 5) {
      Image(systemName: "film")
        .font(.system(size: 12, weight: .semibold))
      Text("\(count)")
        .font(EverlyFont.semiBold(15))
    }
    .foregroundStyle(tint)
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .background(fill, in: Capsule())
  }
}

/// Live countdown to the end of the event. `Text(timerInterval:)` ticks on its
/// own, so the activity stays honest between updates without a push.
private struct Countdown: View {
  let endsAt: Date
  let tint: Color

  var body: some View {
    HStack(spacing: 6) {
      Image(systemName: "clock")
        .font(.system(size: 11, weight: .semibold))
      Text(timerInterval: Date()...Countdown.safeEnd(endsAt), countsDown: true)
        .font(EverlyFont.medium(13))
        .monospacedDigit()
        .fixedSize()
      Text("left")
        .font(EverlyFont.medium(13))
    }
    .foregroundStyle(tint)
  }

  /// An inverted range traps at runtime, so an event that has already run out
  /// is clamped to now and simply reads zero until the app ends the activity.
  static func safeEnd(_ date: Date) -> Date {
    max(date, Date().addingTimeInterval(1))
  }
}

/// The blush action button. The accent is a pastel, so the glyph is ink — never
/// white.
private struct CaptureButton: View {
  let url: URL?

  private var badge: some View {
    Image(systemName: "camera.fill")
      .font(.system(size: 18, weight: .semibold))
      .foregroundStyle(Everly.ink)
      .frame(width: 64, height: 42)
      .background(Everly.accent, in: RoundedRectangle(cornerRadius: 15, style: .continuous))
  }

  var body: some View {
    if let url {
      Link(destination: url) { badge }
    } else {
      badge
    }
  }
}

// ─── Lock Screen / banner ─────────────────────────────────────────────────────

private struct LockScreenView: View {
  let context: ActivityViewContext<EverlyEventAttributes>

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .center) {
        Text("everly")
          .font(EverlyFont.wordmark(26))
          .foregroundStyle(Everly.accent)
        Spacer(minLength: 8)
        PhotoPill(count: context.state.photoCount, fill: Everly.nightWell, tint: .white)
      }

      HStack(alignment: .bottom, spacing: 12) {
        VStack(alignment: .leading, spacing: 7) {
          Text(context.attributes.eventName)
            .font(EverlyFont.extraBold(20))
            .tracking(-0.5)
            .foregroundStyle(.white)
            .lineLimit(1)
          Countdown(endsAt: context.state.endsAt, tint: Everly.nightSoft)
        }
        Spacer(minLength: 8)
        CaptureButton(url: URL(string: context.attributes.captureURL))
      }
    }
    .padding(.horizontal, 18)
    .padding(.vertical, 16)
    // The tint paints the card, but the system draws its own chrome (the
    // app-name row, the permission prompt) on the same ground, so the whole
    // container has to be told it is dark — otherwise that chrome keeps
    // rendering dark-on-dark.
    .environment(\.colorScheme, .dark)
  }
}

// ─── Widget ───────────────────────────────────────────────────────────────────

struct EverlyEventActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: EverlyEventAttributes.self) { context in
      LockScreenView(context: context)
        .widgetURL(URL(string: context.attributes.eventURL))
        .activityBackgroundTint(Everly.night)
        .activitySystemActionForegroundColor(Everly.accent)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text("everly")
            .font(EverlyFont.wordmark(22))
            .foregroundStyle(Everly.accent)
            .padding(.leading, 4)
        }
        DynamicIslandExpandedRegion(.trailing) {
          PhotoPill(
            count: context.state.photoCount,
            fill: Color.white.opacity(0.14),
            tint: .white
          )
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .bottom, spacing: 12) {
            VStack(alignment: .leading, spacing: 7) {
              Text(context.attributes.eventName)
                .font(EverlyFont.extraBold(18))
                .tracking(-0.4)
                .foregroundStyle(.white)
                .lineLimit(1)
              Countdown(endsAt: context.state.endsAt, tint: Color.white.opacity(0.7))
            }
            Spacer(minLength: 8)
            CaptureButton(url: URL(string: context.attributes.captureURL))
          }
          .padding(.top, 6)
        }
      } compactLeading: {
        Image(systemName: "camera.fill")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(Everly.accent)
      } compactTrailing: {
        // Unbounded timer text gets clipped in the compact slot.
        Text(timerInterval: Date()...Countdown.safeEnd(context.state.endsAt), countsDown: true)
          .font(EverlyFont.medium(13))
          .monospacedDigit()
          .multilineTextAlignment(.trailing)
          .frame(maxWidth: 56)
          .foregroundStyle(Everly.accent)
      } minimal: {
        Image(systemName: "camera.fill")
          .font(.system(size: 12, weight: .semibold))
          .foregroundStyle(Everly.accent)
      }
      .widgetURL(URL(string: context.attributes.eventURL))
      .keylineTint(Everly.accent)
    }
  }
}

@main
struct EverlyWidgetBundle: WidgetBundle {
  var body: some Widget {
    // Home Screen / Lock Screen widget (App Review 4.4: the extension must
    // offer a real widget, not only the Live Activity).
    EverlyPlanWidget()
    EverlyEventActivity()
  }
}
