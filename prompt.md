{
"project": {
"name": "Everly",
"type": "Expo React Native App",
"description": "Everly is a premium, emotionally elegant multi-event photo app where guests upload limited photos and everything unlocks together at reveal time."
},
"role": "You are a senior iOS product designer and Expo React Native TypeScript engineer. Build a production-ready mobile app using Expo, TypeScript, and NativeWind (Tailwind CSS for React Native).",
"technical_stack": {
"framework": "Expo",
"language": "TypeScript",
"styling": "NativeWind (Tailwind for React Native)",
"navigation": "React Navigation or Expo Router",
"monetization": "RevenueCat"
},
"styling_rules": {
"use_nativewind": true,
"requirements": [
"Use className with NativeWind for all styling",
"Avoid inline styles unless absolutely required for dynamic values",
"Extend Tailwind config with custom Everly color palette",
"Use consistent spacing scale",
"Use rounded-2xl or rounded-3xl for cards",
"Use shadow-sm only (very subtle shadows)"
]
},
"design_principles": {
"tone": [
"Soft",
"Romantic",
"Editorial",
"Apple-like",
"Minimal",
"Premium",
"Calm"
],
"avoid": [
"Bright gradients",
"Neon colors",
"Gamification",
"Playful UI",
"Tech startup aesthetic"
],
"ux_rules": [
"Large whitespace",
"Soft fade transitions",
"Subtle upward motion transitions",
"No clutter",
"Symmetrical layouts"
]
},
"navigation": {
"type": "Bottom Tab Navigator",
"tabs": [
"Events",
"Create",
"Settings"
],
"create_button": {
"position": "center",
"style": "Floating circular elevated button",
"icon": "Thin stroke plus icon"
}
},
"screens": {
"EventsScreen": {
"header": {
"title": "Your Moments",
"subtitle": "Private films for meaningful events."
},
"content": [
"Scrollable event card list",
"Empty state with centered text: 'Create your first event'"
],
"event_card": {
"elements": [
"Event name (serif)",
"Event date",
"Participant count",
"Status badge (Draft, Live, Revealed)",
"Soft thumbnail preview"
],
"style_guidelines": [
"rounded-3xl",
"bg-backgroundSecondary",
"p-6",
"shadow-sm"
]
}
},
"CreateScreen": {
"header": "Create a New Moment",
"form_fields": [
"Event Name",
"Event Type (Dropdown)",
"Event Date (Date Picker)",
"Reveal Mode (Instant, End, Scheduled)",
"Shot Limit per Guest",
"Participant Limit"
],
"primary_button": {
"label": "Create Event",
"style_guidelines": [
"bg-accent",
"rounded-2xl",
"py-4",
"items-center"
]
}
},
"EventDetailScreen": {
"header": [
"Event name (large serif)",
"Event date"
],
"sections": [
{
"name": "QRCodeCard",
"elements": [
"Centered QR Code",
"Scan to Join text",
"Copy Link button"
]
},
{
"name": "SettingsSummaryCard",
"elements": [
"Shot limit",
"Participant cap",
"Reveal time",
"Tier badge"
]
},
{
"name": "GalleryPreview",
"behavior": "Blurred if not revealed, grid if revealed"
},
{
"name": "UpgradeButton",
"condition": "Shown if over free limit",
"label": "Upgrade Event"
}
]
},
"SettingsScreen": {
"header": "Settings",
"sections": [
"Profile",
"Purchases",
"Notifications",
"Storage",
"Help",
"Delete Account"
]
}
},
"design_system": {
"colors": {
"backgroundPrimary": "#F6F1EB",
"backgroundSecondary": "#EFE6E1",
"accent": "#C6A96B",
"textPrimary": "#2B2B2B",
"textSecondary": "#6F6A66",
"error": "#D8A7A0"
},
"tailwind_extension": {
"theme": {
"extend": {
"colors": {
"backgroundPrimary": "#F6F1EB",
"backgroundSecondary": "#EFE6E1",
"accent": "#C6A96B",
"textPrimary": "#2B2B2B",
"textSecondary": "#6F6A66",
"error": "#D8A7A0"
},
"borderRadius": {
"card": "24px"
}
}
}
},
"typography": {
"headingFont": "Playfair Display style serif",
"bodyFont": "Inter or SF Pro style",
"usage": {
"H1": "text-3xl font-serif",
"H2": "text-2xl font-serif",
"Body": "text-base font-sans",
"Buttons": "uppercase tracking-widest text-sm"
}
}
},
"monetization": {
"provider": "RevenueCat",
"tiers": [
{ "name": "Free", "participants": 5 },
{ "name": "Intimate", "participants": 30 },
{ "name": "Celebration", "participants": 100 },
{ "name": "Grand", "participants": "Unlimited" }
],
"upgrade_flow": [
"Trigger RevenueCat paywall modal",
"Validate entitlement with backend",
"Unlock participant cap server-side"
]
},
"technical_requirements": {
"language": "TypeScript",
"architecture": "Modular folder structure",
"folder_structure": {
"components": [
"Card.tsx",
"Button.tsx",
"Input.tsx",
"EventCard.tsx",
"PaywallModal.tsx"
],
"screens": [
"EventsScreen.tsx",
"CreateScreen.tsx",
"EventDetailScreen.tsx",
"SettingsScreen.tsx"
],
"navigation": [
"BottomTabs.tsx"
],
"theme": [
"tailwind.config.js",
"colors.ts",
"typography.ts"
],
"services": [
"api.ts",
"revenuecat.ts"
]
}
},
"output_requirements": [
"Production-ready Expo app",
"NativeWind fully configured",
"Reusable components",
"Clean modular structure",
"Scalable architecture",
"No inline hardcoded styling"
]
}
