# Website UI/UX Design Principles Guide

Guidelines for designing accessible, scalable, and consistent websites
without fixed visual values. Focus on ratios, relationships, and
scalable systems rather than hard-coded sizes.

Aligned with WCAG 2.2 AA accessibility principles.

------------------------------------------------------------------------

# Typography Principles

Typography must prioritize readability, hierarchy, accessibility, and
scalable systems.

Avoid fixed font sizes. Use relative scaling systems.

## Base Typography Rules

-   Use a readable base text size defined by the browser or system.
-   Ensure comfortable line height relative to the text size.
-   Maintain readable line length.

Recommended ratios:

  Property            Ratio / Rule
  ------------------- ---------------------------
  Line height         \~1.4 -- 1.6 × font size
  Paragraph spacing   \~0.75 -- 1 × line height
  Letter spacing      minimal for body text
  Line length         \~45 -- 75 characters

## Typography Hierarchy

Use a type scale ratio.

  Scale Type       Ratio
  ---------------- -------
  Minor Second     1.067
  Major Second     1.125
  Minor Third      1.2
  Major Third      1.25
  Perfect Fourth   1.333

Example concept:

H1 = Base × Scale × Scale × Scale\
H2 = Base × Scale × Scale\
H3 = Base × Scale\
Body = Base\
Small = Base ÷ Scale

------------------------------------------------------------------------

# Color System Principles

Avoid hard-coded colors. Use semantic roles.

  Token            Purpose
  ---------------- ---------------------
  primary          brand emphasis
  secondary        supporting elements
  background       page background
  surface          cards and panels
  text-primary     main text
  text-secondary   supporting text
  border           separators
  success          positive state
  warning          caution state
  error            error state

## Contrast Rules

  Content             Minimum Ratio
  ------------------- ---------------
  Body text           4.5 : 1
  Large text          3 : 1
  UI components       3 : 1
  Graphical objects   3 : 1

Never communicate information using color alone.

------------------------------------------------------------------------

# Layout System

Use structured layout systems.

## Grid System

Common pattern:

-   multi-column grid
-   consistent gutters
-   flexible containers

Example: multi-column grid such as twelve-column structures.

## Spacing System

Spacing should follow consistent scale relationships.

Examples:

  System            Pattern
  ----------------- ------------------------------
  Linear scale      1×, 2×, 3×, 4×
  Geometric scale   multiplied spacing
  Modular scale     spacing linked to typography

Spacing should create rhythm and visual grouping.

------------------------------------------------------------------------

# Interactive Elements

Interactive elements must be easily discoverable and operable.

Principles:

-   clear affordances
-   sufficient interaction area
-   visible states

States should include:

-   default
-   hover
-   focus
-   active
-   disabled

Focus states must remain visible.

------------------------------------------------------------------------

# Form Design

Forms should minimize user effort.

Guidelines:

-   label every input
-   group related fields
-   provide clear error messages
-   show validation feedback

Errors should explain the problem and suggest correction.

------------------------------------------------------------------------

# Accessibility Principles

Accessibility follows the POUR framework.

  Principle        Meaning
  ---------------- --------------------------------------
  Perceivable      content must be perceivable
  Operable         interface must be operable
  Understandable   content must be understandable
  Robust           compatible with assistive technology

## Keyboard Navigation

  Key           Behavior
  ------------- -------------------
  Tab           move forward
  Shift + Tab   move backward
  Enter         activate controls
  Space         toggle controls

Focus indicators must remain visible.

------------------------------------------------------------------------

# Images

Images must include alternative text.

  Image Type      Requirement
  --------------- ----------------------
  Informational   descriptive alt text
  Decorative      empty alt
  Functional      describe action

------------------------------------------------------------------------

# Responsive Design

Design must adapt across screen sizes.

Principles:

-   fluid layouts
-   flexible containers
-   adaptable typography
-   responsive media

Use content-driven breakpoints rather than device assumptions.

------------------------------------------------------------------------

# Motion

Motion should support usability.

Guidelines:

-   subtle transitions
-   avoid unnecessary animation
-   support reduced motion preferences

------------------------------------------------------------------------

# Navigation

Navigation must be predictable.

Principles:

-   consistent placement
-   clear labels
-   limited options
-   visible current location

Users should always know where they are and how to navigate.

------------------------------------------------------------------------

# Icons

Icons should reinforce meaning and support text labels.

Icons should not be the only indicator of meaning.

------------------------------------------------------------------------

# Media

Media should be optimized, responsive, and meaningful.

Video or audio content should include captions and transcripts when
possible.

------------------------------------------------------------------------

# Performance

Design affects performance.

Principles:

-   minimize asset weight
-   prioritize content loading
-   avoid unnecessary effects

------------------------------------------------------------------------

# Consistency

Consistency should be maintained using:

-   design tokens
-   reusable components
-   consistent interaction patterns

------------------------------------------------------------------------

# Validation Checklist

Before launch verify:

-   contrast ratios meet accessibility requirements
-   keyboard navigation works
-   focus indicators are visible
-   alt text exists for images
-   headings follow logical hierarchy
-   navigation remains consistent
-   layout adapts across screens

------------------------------------------------------------------------

# Goal

Create websites that are:

-   accessible
-   readable
-   responsive
-   inclusive
-   consistent

Design should work for all users, including those using assistive
technologies.
