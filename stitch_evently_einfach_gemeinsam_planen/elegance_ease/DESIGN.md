---
name: Elegance & Ease
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#46474a'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#76777b'
  outline-variant: '#c6c6ca'
  surface-tint: '#5e5e62'
  primary: '#090a0d'
  on-primary: '#ffffff'
  primary-container: '#202124'
  on-primary-container: '#88888c'
  inverse-primary: '#c7c6ca'
  secondary: '#5b5f64'
  on-secondary: '#ffffff'
  secondary-container: '#dde0e6'
  on-secondary-container: '#5f6368'
  tertiary: '#0d0906'
  on-tertiary: '#ffffff'
  tertiary-container: '#25201c'
  on-tertiary-container: '#8f8781'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3e2e6'
  primary-fixed-dim: '#c7c6ca'
  on-primary-fixed: '#1a1b1e'
  on-primary-fixed-variant: '#46474a'
  secondary-fixed: '#dfe3e8'
  secondary-fixed-dim: '#c3c7cc'
  on-secondary-fixed: '#181c20'
  on-secondary-fixed-variant: '#43474c'
  tertiary-fixed: '#ebe0da'
  tertiary-fixed-dim: '#cfc5be'
  on-tertiary-fixed: '#1f1b17'
  on-tertiary-fixed-variant: '#4c4641'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  surface-alt: '#E8EAED'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The design system embodies a philosophy of "Elegance & Ease," focusing on a sophisticated, utility-driven aesthetic that prioritizes clarity and effortless navigation. The brand personality is professional yet approachable, leaning into a **Corporate / Modern** design style influenced by high-end SaaS and systematic information architecture.

The UI evokes an emotional response of organized calm through generous whitespace, a restricted palette, and a focus on high-legibility typography. It is designed for users who value efficiency and refined precision in their digital tools.

## Colors

This design system utilizes a grayscale-dominant palette to emphasize content and structure. The primary color is a deep, near-black charcoal used for high-contrast elements and text. The secondary color is a medium gray reserved for metadata and supportive UI elements. The background relies on a bright, off-white neutral to maintain a clean and expansive feel, while an alternate surface gray provides subtle containment for secondary sections.

## Typography

The typography strategy leverages two modern, high-performance typefaces to balance character with utility. 

**Hanken Grotesk** is used for all headlines. Its sharp, contemporary geometry provides a distinctive visual anchor for the brand. Headlines utilize tighter letter-spacing and substantial weight to establish a clear information hierarchy.

**Inter** is utilized for all body copy and labels. Its systematic, neutral design ensures maximum readability across various screen densities. Body text is set with comfortable line-heights to facilitate long-form reading, while labels use slightly increased tracking and medium-to-bold weights for rapid identification at small sizes.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop screens to maintain control over line lengths and visual balance, transitioning to a fluid model for mobile devices. 

A 12-column grid is used for desktop layouts with a consistent 24px gutter. Spacing is governed by an 8px base unit, ensuring all margins, paddings, and component heights are multiples of this unit to maintain rhythmic consistency. For mobile, the margins are reduced to 16px to maximize the utility of the smaller viewport.

## Elevation & Depth

Visual hierarchy is established primarily through **Tonal Layers** and extremely soft **Ambient Shadows**. Surfaces at the base level use the neutral background, while elevated containers like cards or menus utilize white backgrounds with a subtle, low-opacity shadow (4-8% opacity) and a 1px border using the "surface-alt" color. This creates a sense of "lift" without introducing heavy visual noise, keeping the interface feeling light and airy.

## Shapes

The shape language is consistently **Rounded**. This choice softens the professional aesthetic, making the systematic layout feel more approachable. A radius of 0.5rem (8px) is the standard for primary components like buttons and inputs, while larger containers such as cards should utilize 1rem (16px) to emphasize their role as structural sections.

## Components

- **Buttons:** Use high-contrast fills (Primary color) for primary actions and subtle outlines for secondary actions. Text is set in `label-md`.
- **Input Fields:** Utilize the "surface-alt" border color with a 1px width. Upon focus, the border weight remains consistent but shifts to the primary color.
- **Cards:** White backgrounds with a subtle shadow and 1rem rounded corners. Headlines within cards should use `headline-md`.
- **Chips:** Small, rounded pill-shapes using a light tint of the secondary color for backgrounds and `label-sm` for text.
- **Lists:** Clean, borderless rows with 16px vertical padding, using the secondary color for metadata icons or text.
- **Checkboxes & Radios:** Sharp, high-contrast markers when active, ensuring they align perfectly with the `body-md` text baseline.