# Widget isolation contract

This is the contract every catalog widget signs. It is the same plain-language
version that gets sent to widget authors (and to the CBEY-affiliated economist
producing Lovable.dev exports). Light edits welcome; the principles below are
not negotiable.

---

## In plain language

When you build a widget for the CBEY site, it lives inside one block on the
page — think of it like a single figure inside a journal article. Above and
below your widget there might be text, images, other widgets, links,
navigation, sidebars. Editors choose what goes on the page and in what order,
page by page. You don't know ahead of time what's around your widget, and you
don't get to control it.

That means your widget needs to be self-contained:

- **It works alone.** If your widget is the only thing on the page, it has to
  be fully functional. Don't assume that some "controller" elsewhere on the
  page is feeding it data, telling it what to show, or signalling state
  changes — there might not be anything else there.
- **It doesn't reach outside its own box.** No changing the page's colours,
  fonts, scroll position, URL, or anything else around it. No pop-up alerts
  that float over other content. No modals that take over the screen. If you
  need to communicate with the reader, do it inside your widget's own area.
- **It doesn't talk to other widgets.** Even when you build two pieces that
  feel like they belong together, they can't coordinate across the page.
  Editors might put them on different pages, in different orders, or only use
  one of them. You can't rely on the other one being present.

If you find yourself wanting to wire two pieces together — "when the reader
picks a category here, both this chart and that chart update" — those two
pieces are actually **one widget with two visual sections**. Build them as a
single widget that renders both views internally, and let the editor turn
each section on or off through a configuration option.

The short version: **each widget is a sealed unit.** Like a published research
figure, it stands on its own, includes its own labels and legend, and doesn't
change based on what's around it. If a reader wants the data, they engage
with your widget. If they scroll past, the widget sits there quietly without
disrupting anything.

This isn't a frontend-team preference. It's a contract that lets us put your
widgets on any page, in any combination, with confidence that none of them
will break the rest of the site or the rest of your work.

---

## What this means technically

For implementers (this is the section the intake recipe enforces):

- A widget MUST work standalone. No assumption that another widget on the
  page is feeding it state, data, or signals.
- A widget MUST NOT mutate anything outside its own shadow root — no
  `document.body` mutations, no global CSS, no page-level scroll jacking,
  no URL changes, no browser-history pushes.
- A widget MUST NOT communicate with other widgets. No custom events on
  `window` or `document`, no shared `window.*` state, no `BroadcastChannel`,
  no `localStorage` coordination, no shared `QueryClient` or store.
- A widget MUST NOT depend on another widget being present on the page.
  Removing any other paragraph never breaks this one.
- A widget MUST NOT portal to `document.body`. No Sonner/Toaster overlays.
  Any Radix primitive that portals by default (`Tooltip`, `Dialog`, `Select`,
  `DropdownMenu`, `Popover`, `HoverCard`, `Menubar`, `NavigationMenu`,
  `ContextMenu`) must be configured with a `container` prop pointing at a
  div inside the shadow root, or replaced with a non-portaling alternative.
- A widget MAY observe the global page environment in read-only,
  side-effect-free ways: `prefers-reduced-motion`, `prefers-color-scheme`,
  the user's locale, and the widget's own paragraph-instance
  `drupalSettings`.

## Why no cross-widget messaging

We considered (and rejected) every technical option for letting widgets
talk to each other: custom DOM events with `composed: true`, a window-level
pub/sub bus, URL query parameters, `sessionStorage` plus the `storage`
event, `BroadcastChannel`.

They all work. None of them are allowed. Reasons:

- **Editor blast radius.** A removed paragraph silently breaks another
  paragraph; the CMS gives no warning because the contract lives in
  JavaScript event names, not in fields.
- **Worst-case-author principle.** The widget authors producing these
  exports have already demonstrated the failure mode (full-page SPA, page
  state, global side effects). Closing the channel keeps future submissions
  cheap to integrate.
- **Use cases collapse on inspection.** Every "two widgets that must
  coordinate" example resolves to "one widget with internal sections."
- **Accessibility and predictability.** A keyboard user shouldn't have their
  state mutated invisibly by passing through a different paragraph.
- **An escape hatch exists when truly needed.** Page-level state goes
  through Drupal (a region block, a setting, a cookie), not through
  inter-widget JS.

The policy: widgets *observe* the page; they don't *talk to* it. If we
ever relax this, it'll be for one specific use case, deliberately, not by
leaving the channel open by default.
