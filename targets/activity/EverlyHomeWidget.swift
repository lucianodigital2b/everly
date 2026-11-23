import SwiftUI
import WidgetKit

// Home Screen / Lock Screen widget: the wedding countdown, the next tasks and
// the RSVP count. The app writes a JSON snapshot of the plan into the shared App
// Group (modules/everly-live-activity, `setWidgetSnapshot`) every time the plan
// or the guest list changes; the widget only reads it. The day count is worked
// out here from the wedding date, one timeline entry per midnight, so it stays
// right even when the app isn't opened.

// ─── Shared data ──────────────────────────────────────────────────────────────

enum EverlyShared {
  static let snapshotKey = "everly.widget.snapshot"

  /// The app's group is `group.<app bundle id>` (see app.config.js). This
  /// extension's bundle id is the app's plus one component
  /// (`com.get.everly.widget`), so dropping the last component gives the app's.
  static var appGroup: String? {
    guard let bundleId = Bundle.main.bundleIdentifier else { return nil }
    var parts = bundleId.split(separator: ".")
    guard parts.count > 1 else { return nil }
    parts.removeLast()
    return "group." + parts.joined(separator: ".")
  }

  static func loadSnapshot() -> PlanSnapshot? {
    guard let group = appGroup,
          let json = UserDefaults(suiteName: group)?.string(forKey: snapshotKey),
          let data = json.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(PlanSnapshot.self, from: data)
  }
}

/// Labels arrive already translated by the app (i18n lives in JS). `{n}`,
/// `{done}`, `{total}`, `{attending}` and `{invited}` are filled in here.
struct PlanLabels: Codable {
  var daysToGo: String
  var dayToGo: String
  var today: String
  var married: String
  var upNext: String
  var allDone: String
  var rsvp: String
  var tasks: String
  var emptyTitle: String
  var emptySubtitle: String

  /// Used before the app has written anything (fresh install, signed out).
  static var fallback: PlanLabels {
    let pt = Locale.preferredLanguages.first?.hasPrefix("pt") ?? false
    return pt
      ? PlanLabels(
          daysToGo: "dias", dayToGo: "dia", today: "É hoje!", married: "Recém-casados",
          upNext: "PRÓXIMAS", allDone: "Tudo em dia", rsvp: "{attending} de {invited} confirmados",
          tasks: "{done}/{total} tarefas", emptyTitle: "Seu casamento",
          emptySubtitle: "Abra o Everly e monte seu plano")
      : PlanLabels(
          daysToGo: "days to go", dayToGo: "day to go", today: "It's today!", married: "Just married",
          upNext: "UP NEXT", allDone: "All caught up", rsvp: "{attending} of {invited} coming",
          tasks: "{done}/{total} tasks", emptyTitle: "Your wedding",
          emptySubtitle: "Open Everly to build your plan")
  }
}

struct PlanSnapshot: Codable {
  /// `yyyy-MM-dd`, or nil before the couple sets a date.
  var weddingDate: String?
  var couple: String
  var nextTasks: [String]
  var doneCount: Int
  var total: Int
  var attending: Int
  var invited: Int
  /// Deep link to the Plan tab (built by the app, so each variant's scheme works).
  var url: String
  var labels: PlanLabels

  static let sample = PlanSnapshot(
    weddingDate: nil, couple: "Sofia & Daniel",
    nextTasks: ["Book the photographer", "Send the invitations", "Taste the menu"],
    doneCount: 18, total: 64, attending: 86, invited: 120, url: "",
    labels: .fallback)

  var weddingDay: Date? {
    guard let weddingDate else { return nil }
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = .current
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.date(from: weddingDate)
  }

  /// Whole days from `date` to the wedding (negative once it's past).
  func daysUntil(from date: Date) -> Int? {
    guard let wedding = weddingDay else { return nil }
    let calendar = Calendar.current
    return calendar.dateComponents(
      [.day], from: calendar.startOfDay(for: date), to: calendar.startOfDay(for: wedding)
    ).day
  }
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

struct PlanEntry: TimelineEntry {
  let date: Date
  let snapshot: PlanSnapshot?
  var isPlaceholder = false

  var days: Int? { snapshot?.daysUntil(from: date) }
}

struct PlanProvider: TimelineProvider {
  func placeholder(in context: Context) -> PlanEntry {
    PlanEntry(date: Date(), snapshot: Self.preview, isPlaceholder: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (PlanEntry) -> Void) {
    // The widget gallery shows a filled example when there's no plan yet.
    let stored = EverlyShared.loadSnapshot()
    let snapshot: PlanSnapshot? = (stored?.weddingDate == nil && context.isPreview) ? Optional(Self.preview) : stored
    completion(PlanEntry(date: Date(), snapshot: snapshot))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PlanEntry>) -> Void) {
    let snapshot = EverlyShared.loadSnapshot()
    let calendar = Calendar.current
    let now = Date()
    var entries = [PlanEntry(date: now, snapshot: snapshot)]
    // One entry per midnight for the next week, so the count ticks down on its
    // own; the app reloads the timeline whenever the plan changes.
    var midnight = calendar.startOfDay(for: now)
    for _ in 0..<7 {
      guard let next = calendar.date(byAdding: .day, value: 1, to: midnight) else { break }
      midnight = next
      entries.append(PlanEntry(date: midnight, snapshot: snapshot))
    }
    completion(Timeline(entries: entries, policy: .atEnd))
  }

  /// Gallery / placeholder sample: 128 days out.
  static var preview: PlanSnapshot {
    var sample = PlanSnapshot.sample
    let date = Calendar.current.date(byAdding: .day, value: 128, to: Date()) ?? Date()
    let formatter = DateFormatter()
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    sample.weddingDate = formatter.string(from: date)
    return sample
  }
}

// ─── Pieces ───────────────────────────────────────────────────────────────────

private func fillTemplate(_ template: String, _ values: [String: Int]) -> String {
  values.reduce(template) { $0.replacingOccurrences(of: "{\($1.key)}", with: "\($1.value)") }
}

/// "128" + "days to go", or the wedding-day / after-the-wedding lines.
private struct DayCount: View {
  let days: Int
  let labels: PlanLabels
  let numberSize: CGFloat

  var body: some View {
    if days > 0 {
      VStack(alignment: .leading, spacing: 0) {
        Text("\(days)")
          .font(EverlyFont.extraBold(numberSize))
          .monospacedDigit()
          .minimumScaleFactor(0.6)
          .lineLimit(1)
          .foregroundStyle(Everly.ink)
        Text(days == 1 ? labels.dayToGo : labels.daysToGo)
          .font(EverlyFont.medium(13))
          .foregroundStyle(Everly.inkSoft)
      }
    } else {
      Text(days == 0 ? labels.today : labels.married)
        .font(EverlyFont.extraBold(22))
        .foregroundStyle(Everly.accentDeep)
        .minimumScaleFactor(0.7)
        .lineLimit(2)
    }
  }
}

private struct ProgressLine: View {
  let snapshot: PlanSnapshot

  var body: some View {
    let ratio = snapshot.total == 0 ? 0 : Double(snapshot.doneCount) / Double(snapshot.total)
    VStack(alignment: .leading, spacing: 5) {
      GeometryReader { geo in
        ZStack(alignment: .leading) {
          Capsule().fill(Everly.well)
          Capsule().fill(Everly.accent).frame(width: max(6, geo.size.width * ratio))
        }
      }
      .frame(height: 6)
      Text(fillTemplate(snapshot.labels.tasks, ["done": snapshot.doneCount, "total": snapshot.total]))
        .font(EverlyFont.medium(11))
        .foregroundStyle(Everly.inkSoft)
        .lineLimit(1)
    }
  }
}

private struct CoupleLine: View {
  let couple: String

  var body: some View {
    HStack(spacing: 4) {
      Text("everly")
        .font(EverlyFont.wordmark(18))
        .foregroundStyle(Everly.accentDeep)
      if !couple.isEmpty {
        Text(couple)
          .font(EverlyFont.semiBold(11))
          .foregroundStyle(Everly.inkSoft)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
      }
    }
  }
}

private struct EmptyPlan: View {
  let labels: PlanLabels

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("everly")
        .font(EverlyFont.wordmark(22))
        .foregroundStyle(Everly.accentDeep)
      Spacer(minLength: 0)
      Text(labels.emptyTitle)
        .font(EverlyFont.extraBold(17))
        .foregroundStyle(Everly.ink)
      Text(labels.emptySubtitle)
        .font(EverlyFont.medium(12))
        .foregroundStyle(Everly.inkSoft)
        .lineLimit(3)
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
  }
}

// ─── Families ─────────────────────────────────────────────────────────────────

private struct SmallView: View {
  let entry: PlanEntry

  var body: some View {
    if let snapshot = entry.snapshot, let days = entry.days {
      VStack(alignment: .leading, spacing: 0) {
        CoupleLine(couple: "")
        Spacer(minLength: 0)
        DayCount(days: days, labels: snapshot.labels, numberSize: 44)
        Spacer(minLength: 6)
        ProgressLine(snapshot: snapshot)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    } else {
      EmptyPlan(labels: entry.snapshot?.labels ?? .fallback)
    }
  }
}

private struct MediumView: View {
  let entry: PlanEntry

  var body: some View {
    if let snapshot = entry.snapshot, let days = entry.days {
      HStack(alignment: .top, spacing: 16) {
        VStack(alignment: .leading, spacing: 0) {
          CoupleLine(couple: "")
          Spacer(minLength: 0)
          DayCount(days: days, labels: snapshot.labels, numberSize: 44)
          Spacer(minLength: 6)
          ProgressLine(snapshot: snapshot)
        }
        .frame(width: 118, alignment: .leading)

        VStack(alignment: .leading, spacing: 7) {
          if !snapshot.couple.isEmpty {
            Text(snapshot.couple)
              .font(EverlyFont.semiBold(12))
              .foregroundStyle(Everly.ink)
              .lineLimit(1)
          }
          Text(snapshot.labels.upNext)
            .font(EverlyFont.semiBold(10))
            .tracking(0.8)
            .foregroundStyle(Everly.accentDeep)
          if snapshot.nextTasks.isEmpty {
            Text(snapshot.labels.allDone)
              .font(EverlyFont.medium(13))
              .foregroundStyle(Everly.ink)
          } else {
            ForEach(Array(snapshot.nextTasks.prefix(3).enumerated()), id: \.offset) { _, title in
              HStack(alignment: .firstTextBaseline, spacing: 6) {
                Circle()
                  .strokeBorder(Everly.accent, lineWidth: 1.5)
                  .frame(width: 9, height: 9)
                Text(title)
                  .font(EverlyFont.medium(12))
                  .foregroundStyle(Everly.ink)
                  .lineLimit(1)
              }
            }
          }
          Spacer(minLength: 0)
          if snapshot.invited > 0 {
            Text(fillTemplate(snapshot.labels.rsvp, ["attending": snapshot.attending, "invited": snapshot.invited]))
              .font(EverlyFont.medium(11))
              .foregroundStyle(Everly.inkSoft)
              .lineLimit(1)
          }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
      }
    } else {
      EmptyPlan(labels: entry.snapshot?.labels ?? .fallback)
    }
  }
}

/// Lock Screen: days in a ring.
@available(iOSApplicationExtension 16.0, *)
private struct CircularView: View {
  let entry: PlanEntry

  var body: some View {
    ZStack {
      AccessoryWidgetBackground()
      if let days = entry.days {
        VStack(spacing: -2) {
          Image(systemName: "heart.fill").font(.system(size: 9))
          Text(days > 0 ? "\(days)" : "♥")
            .font(.system(size: 18, weight: .bold, design: .rounded))
            .monospacedDigit()
            .minimumScaleFactor(0.6)
        }
      } else {
        Image(systemName: "heart")
      }
    }
  }
}

/// Lock Screen: days + the next task.
@available(iOSApplicationExtension 16.0, *)
private struct RectangularView: View {
  let entry: PlanEntry

  var body: some View {
    let labels = entry.snapshot?.labels ?? .fallback
    VStack(alignment: .leading, spacing: 1) {
      if let days = entry.days {
        Text(days > 0 ? "\(days) \(days == 1 ? labels.dayToGo : labels.daysToGo)" : (days == 0 ? labels.today : labels.married))
          .font(.headline)
          .lineLimit(1)
        Text(entry.snapshot?.nextTasks.first ?? labels.allDone)
          .font(.caption)
          .lineLimit(2)
      } else {
        Text(labels.emptyTitle).font(.headline)
        Text(labels.emptySubtitle).font(.caption).lineLimit(2)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

struct EverlyPlanWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: PlanEntry

  var body: some View {
    content
      .widgetURL(URL(string: entry.snapshot?.url ?? ""))
      .redacted(reason: entry.isPlaceholder ? .placeholder : [])
  }

  @ViewBuilder private var content: some View {
    if #available(iOSApplicationExtension 16.0, *) {
      switch family {
      case .accessoryCircular:
        CircularView(entry: entry).accessoryGround()
      case .accessoryRectangular:
        RectangularView(entry: entry).accessoryGround()
      case .systemMedium:
        MediumView(entry: entry).widgetGround()
      default:
        SmallView(entry: entry).widgetGround()
      }
    } else {
      switch family {
      case .systemMedium:
        MediumView(entry: entry).widgetGround()
      default:
        SmallView(entry: entry).widgetGround()
      }
    }
  }
}

private extension View {
  /// iOS 17 wants the background through `containerBackground` (and draws its
  /// own margins); before that, pad and paint it by hand.
  @ViewBuilder func widgetGround() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget) { Everly.ground }
    } else {
      self.padding(16).background(Everly.ground)
    }
  }

  /// Lock Screen widgets draw no ground of their own, but iOS 17 still
  /// requires the containerBackground call or it shows an error card.
  @ViewBuilder func accessoryGround() -> some View {
    if #available(iOSApplicationExtension 17.0, *) {
      self.containerBackground(for: .widget) { Color.clear }
    } else {
      self
    }
  }
}

struct EverlyPlanWidget: Widget {
  let kind = "EverlyPlanWidget"

  private var families: [WidgetFamily] {
    if #available(iOSApplicationExtension 16.0, *) {
      return [.systemSmall, .systemMedium, .accessoryCircular, .accessoryRectangular]
    }
    return [.systemSmall, .systemMedium]
  }

  private var pt: Bool { Locale.preferredLanguages.first?.hasPrefix("pt") ?? false }

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: PlanProvider()) { entry in
      EverlyPlanWidgetView(entry: entry)
    }
    .configurationDisplayName(pt ? "Contagem do casamento" : "Wedding countdown")
    .description(pt
      ? "Os dias até o casamento, as próximas tarefas e quantos convidados confirmaram."
      : "Days until your wedding, your next tasks and how many guests are coming.")
    .supportedFamilies(families)
  }
}
