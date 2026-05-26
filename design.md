---
version: alpha
name: Claude Calm Editorial
description: A warm, minimal, high-trust system balancing serif editorial hero type with restrained neutral UI chrome.
colors:
  primary: "#141413"
  primary-contrast: "#FFFFFF"
  secondary: "#73726C"
  tertiary: "#1F1E1D4D"
  neutral: "#F8F8F6"
  surface: "#FFFFFF"
  surface-muted: "#F3F1EC"
  on-surface: "#141413"
  on-surface-muted: "#73726C"
  border: "#1F1E1D4D"
  border-strong: "#1B67B233"
  accent: "#000000"
  accent-soft: "#C7C3BA"
  error: "#B5473C"
typography:
  headline-display:
    fontFamily: "Anthropic Serif"
    fontSize: "56px"
    fontWeight: 330
    lineHeight: "67px"
    letterSpacing: "0px"
  headline-lg:
    fontFamily: "Anthropic Serif"
    fontSize: "41px"
    fontWeight: 330
    lineHeight: "67px"
    letterSpacing: "0px"
  headline-md:
    fontFamily: "Anthropic Sans"
    fontSize: "30px"
    fontWeight: 330
    lineHeight: "36px"
    letterSpacing: "0px"
  headline-sm:
    fontFamily: "Anthropic Sans"
    fontSize: "22px"
    fontWeight: 330
    lineHeight: "26px"
    letterSpacing: "0px"
  body-lg:
    fontFamily: "Anthropic Sans"
    fontSize: "16px"
    fontWeight: 330
    lineHeight: "24px"
    letterSpacing: "0px"
  body-md:
    fontFamily: "Anthropic Sans"
    fontSize: "16px"
    fontWeight: 330
    lineHeight: "24px"
    letterSpacing: "0px"
  body-sm:
    fontFamily: "Anthropic Sans"
    fontSize: "14px"
    fontWeight: 330
    lineHeight: "20px"
    letterSpacing: "0px"
  label-lg:
    fontFamily: "Anthropic Sans"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
    letterSpacing: "0px"
  label-md:
    fontFamily: "Anthropic Sans"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
    letterSpacing: "0px"
  label-sm:
    fontFamily: "Anthropic Sans"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0px"
  nav-link:
    fontFamily: "Anthropic Sans"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0px"
  button:
    fontFamily: "Anthropic Sans"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
    letterSpacing: "0px"
  caption:
    fontFamily: "Anthropic Sans"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0px"
rounded:
  none: 0px
  sm: 4px
  md: 10px
  lg: 16px
  xl: 24px
  full: 9999px
spacing:
  xs: 8px
  sm: 16px
  md: 28px
  lg: 40px
  xl: 80px
  gutter: 32px
  margin: 40px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "0px 20px"
    height: "44px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "0px 12px"
    height: "44px"
  chip:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "0px 16px"
  segmented-control:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.full}"
    padding: "0px 16px"
---
# Claude Calm Editorial

## Overview
Claude’s visual language feels calm, intelligent, and premium without becoming stiff. The interface should use a spacious editorial composition that mixes a refined serif hero with quiet, utilitarian sans-serif UI, suggesting a product for thoughtful professionals and builders. The tone is warm, minimal, and confident, with strong hierarchy and very little visual noise.

For this desktop app, apply that system to a three-panel workspace:

- a restrained projects rail on the left
- a spacious calendar canvas in the middle
- a calm detail workspace on the right

## Colors
- **Primary (#141413):** The deep ink used for major headlines, strong button fills, and the clearest text moments. It reads almost black but stays slightly softened and brand-forward.
- **Primary contrast (#FFFFFF):** Clean white used for text on dark buttons and for high-clarity surfaces inside cards and controls.
- **Secondary (#73726C):** A muted warm gray used for supporting text, nav links, placeholder treatment, and low-emphasis labels.
- **Tertiary / Border (#1F1E1D4D):** A translucent hairline tone used for subtle outlines around buttons, inputs, cards, and segmented controls.
- **Neutral (#F8F8F6):** The page background color, creating a soft ivory canvas that feels quieter than pure white.
- **Surface (#FFFFFF):** The card and control base color, reserved for interactive elements that need separation from the neutral page field.
- **Surface muted (#F3F1EC):** A gentle warm panel tone useful for selected states, segmented-control rails, and low-contrast containers.
- **Border strong (#1B67B233):** A faint cool-tinted border/shadow-adjacent tone used to separate cards without making them feel heavy.
- **Accent (#000000):** Used sparingly for the strongest contrast moments and iconographic emphasis.
- **Accent soft (#C7C3BA):** An understated warm gray-beige for subtle UI division and quiet decorative detail.
- **Error (#B5473C):** A restrained warm red for destructive or invalid states; it should remain uncommon.

## Typography
The system combines Anthropic Sans and Anthropic Serif to create a modern editorial contrast. Headlines use Anthropic Serif for the largest hero and Anthropic Sans for smaller product headings, while body copy stays in Anthropic Sans with a light, elegant weight around 330. Labels and buttons use a slightly stronger 500 weight for clarity, and the overall feel is spacious rather than compressed.

In this app:

- the workspace title should carry the serif display feel
- panel titles, controls, labels, and editing surfaces should stay sans-serif
- eyebrow text may stay uppercase, but do not spread that treatment across ordinary labels

## Layout
The app should use a generous desktop composition with negative space, not a dense SaaS dashboard. Spacing follows a soft rhythm anchored by `8px`, `16px`, `28px`, `40px`, and `80px`, with substantial outer margins and roomy internal padding. Cards and panels should use `32px`-adjacent breathing room where the window allows it.

For this app:

- keep the projects rail visually quiet and narrow
- let the month canvas dominate the center
- keep the selected-day panel calm and highly legible
- preserve a real desktop feeling even when the window is resized

## Elevation & Depth
Depth is extremely restrained. Instead of dramatic shadows, rely on thin borders, slight tonal shifts, and clear contrast between the neutral page background and white surfaces. Cards are separated with subtle outlines and only a soft shadow when needed. Hierarchy should come more from typography scale and spacing than from heavy elevation.

## Shapes
The shape language is rounded and approachable, but not bubbly. Buttons and inputs use a medium radius, while large cards and panels use a `24px` radius for a soft architectural feel. Pills and compact chips are fully rounded.

## Components
- **Buttons:** Primary buttons use a solid dark fill with white text, `44px` height, `20px` horizontal padding, and medium radius. Secondary buttons are outlined or light-bordered with transparent backgrounds and dark text. Tertiary/link buttons are minimal and quiet.
- **Cards:** Cards are white, bordered, and generously padded. They should feel like content containers, not floating chrome.
- **Inputs:** Inputs are simple, white, and lightly bordered with a `44px` minimum height and medium radius. Placeholders and helper text should use muted gray.
- **Segmented controls:** Use a pill-shaped rail with a lighter muted background and a white active segment. Selected states should be obvious through contrast and shape, not strong color.
- **Chips:** Chips should be soft, low-contrast pills with quiet typography and ample horizontal padding.
- **Navigation links:** Sidebar and month controls should stay understated and avoid heavy emphasis unless active.
- **Inline helper text:** Supporting copy should remain small, muted, and comfortably spaced from primary actions.

## App-Specific Rules

### Projects Rail
- Treat the left rail like calm desktop navigation.
- The collapsed state should feel intentional, not hidden.
- Use quiet surfaces and small metadata.

### Month Grid
- Keep date cards square.
- Empty days should stay visually quiet.
- Use compact counts and selection contrast instead of verbose state words.
- Do not show repeated `Empty` / `Active` labels if they create noise.

### Right Detail Panel
- Keep the organizer area compact and utility-like.
- Let notes/tasks sections read like editorial cards, not utility trays.
- Stack controls earlier when width tightens.

## Do's and Don'ts
- Do keep the composition spacious and editorial, with clear separation between navigation, calendar, and detail.
- Do use the serif voice only where you need a premium headline moment; rely on sans-serif for most UI and body content.
- Do preserve the soft ivory background and white surfaces to maintain the calm contrast system.
- Do favor thin borders and subtle tonal layering over strong shadows or loud color fills.
- Don’t introduce saturated accent colors or playful gradients that break the restrained Claude tone.
- Don’t tighten spacing into a dense SaaS layout; this system needs air to feel premium.
- Don’t over-round every element equally; reserve full pills for chips and compact states, and keep buttons/cards more measured.
- Don’t use heavy uppercase labels or aggressive tracking beyond small eyebrow text.
