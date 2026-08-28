import SwiftUI

// The widget bundle can't import constants/colors.ts or the app's font
// registration, so both are restated here. Keep in sync with
// constants/colors.ts and the `useFonts` map in app/_layout.tsx.

enum Everly {
  /// #FBF8F5 — soft warm white page.
  static let ground = Color(red: 0.984, green: 0.973, blue: 0.961)
  /// #F5EDEA — blush-tinted well, used for chips.
  static let well = Color(red: 0.961, green: 0.929, blue: 0.918)
  /// #2E2429 — primary ink.
  static let ink = Color(red: 0.180, green: 0.141, blue: 0.161)
  /// #8B7C82 — secondary ink.
  static let inkSoft = Color(red: 0.545, green: 0.486, blue: 0.510)
  /// #E6A9B4 — blush rose accent.
  static let accent = Color(red: 0.902, green: 0.663, blue: 0.706)
  /// #C77E8D — deep rose, readable as text on a light ground.
  static let accentDeep = Color(red: 0.780, green: 0.494, blue: 0.553)
}

// Registered through UIAppFonts in this target's Info.plist. The names are the
// fonts' PostScript names, which happen to match the keys the RN app uses.
enum EverlyFont {
  /// Sacramento — the `everly` wordmark only, never UI text.
  static func wordmark(_ size: CGFloat) -> Font {
    .custom("Sacramento-Regular", size: size)
  }
  static func extraBold(_ size: CGFloat) -> Font {
    .custom("Inter-ExtraBold", size: size)
  }
  static func semiBold(_ size: CGFloat) -> Font {
    .custom("Inter-SemiBold", size: size)
  }
  static func medium(_ size: CGFloat) -> Font {
    .custom("Inter-Medium", size: size)
  }
}
