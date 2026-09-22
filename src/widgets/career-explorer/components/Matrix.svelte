<script lang="ts">
  import type { GridRow, Sector } from '../types';

  interface Props {
    sectors: Sector[];
    rows: GridRow[];
    focusCol: number | null;
    /**
     * Each callback takes the element that triggered it. The root stores it
     * so focus can be returned there when the detail panel closes
     * (WCAG 2.4.3 Focus Order, A — focus must not be dropped to the top of
     * the document when a disclosure is dismissed).
     */
    onToggleRow: (label: string, trigger: HTMLElement) => void;
    onToggleCol: (i: number, trigger: HTMLElement) => void;
    onOpenCell: (cat: string, i: number, trigger: HTMLElement) => void;
  }

  const { sectors, rows, focusCol, onToggleRow, onToggleCol, onOpenCell }: Props = $props();
</script>

<!--
  A11Y — why this is a plain <table> and not role="grid".

  The supplied page made the header cells clickable by putting role="button"
  and tabindex="0" straight onto the <th> and <td>. That is an override, not
  an addition: an element with role="button" is no longer a columnheader or
  a cell, so the 207 data cells below lost their header association — the
  one affordance that makes a 23x9 matrix navigable by ear. The activation
  is carried by a real <button> inside each cell instead, which restores the
  table semantics AND gets Enter/Space, the button role and the pressed
  state for free (the hand-rolled keydown handler is gone with it).

  role="grid" with arrow-key navigation was considered and deliberately not
  taken — see README.md, "Matrix semantics". Short version: grid buys one
  tab stop at the cost of a bespoke keyboard model over 207 cells, and this
  is a read-and-drill-down table, not a spreadsheet.
-->
<div class="matrix-shell">
  <!--
    Decorative duplicate: the rotated y-axis label repeats what the <caption>
    below states in full, so hiding it avoids reading the same words twice.
    The information itself is NOT hidden — that is the caption's job.
  -->
  <div class="axis-y" aria-hidden="true"><span>IRIS+ Impact Theme</span></div>
  <div class="wrap">
    <table>
      <caption class="ce-vh">
        Yale alumni in social impact. Rows are IRIS+ impact themes, columns
        are job functions. Each populated cell is a link to the alumni
        working at that intersection; the coloured dots in a cell show which
        organisation types are represented there.
      </caption>
      <thead>
        <tr class="axis-row">
          <th class="axis-corner"></th>
          <th class="axis-col" scope="colgroup" colspan={sectors.length}>Job Function</th>
        </tr>
        <tr>
          <th class="corner"></th>
          {#each sectors as sector, i (sector.label)}
            <th
              class:colfocus={focusCol === i}
              scope="col"
            >
              <button
                type="button"
                title="Focus this career function"
                aria-pressed={focusCol === i}
                onclick={(e) => onToggleCol(i, e.currentTarget)}
              >
                {sector.label}<span class="sub">{sector.sub}</span>
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        <!--
          Every category gets a row, including categories no alum is placed
          against (the supplied dataset has one: "Transportation"). The row
          renders as nine empty cells rather than collapsing — an absent
          impact theme is information, and a missing row would silently
          renumber nothing but would read as a data error.
        -->
        {#each rows as row (row.cat.label)}
          <tr>
            <th
              class="row-label"
              class:rowfocus={row.focused}
              scope="row"
            >
              <button
                type="button"
                title="Focus this impact theme"
                aria-pressed={row.focused}
                onclick={(e) => onToggleRow(row.cat.label, e.currentTarget)}
              >
                {row.cat.label}<span class="sub">{row.cat.sub}</span>
              </button>
            </th>
            {#each row.cells as cell (cell.i)}
              <td class={cell.cls}>
                {#if cell.interactive}
                  <button
                    type="button"
                    aria-label={cell.ariaLabel}
                    onclick={(e) => onOpenCell(row.cat.label, cell.i, e.currentTarget)}
                  >
                    <!--
                      .dots was a <div>; a <button> may not contain flow
                      content, so it is a <span> now. The .dots rule in
                      styles.css sets display:flex, so the box is identical.
                    -->
                    <span class="dots">
                      {#each cell.dots as color, index (index)}
                        <span class="dot" style="background:{color}"></span>
                      {/each}
                      {#if cell.count > 1}
                        <span class="cell-count">{cell.count}</span>
                      {/if}
                    </span>
                  </button>
                {:else}
                  <span class="dots">
                    {#each cell.dots as color, index (index)}
                      <span class="dot" style="background:{color}"></span>
                    {/each}
                    {#if cell.count > 1}
                      <span class="cell-count">{cell.count}</span>
                    {/if}
                  </span>
                  <!--
                    A11Y (1.4.1 Use of Colour, A). A cell holding alumni that
                    the current filters exclude renders at 13% opacity, which
                    is indistinguishable from an empty cell — for a screen
                    reader it WAS an empty cell, because nothing was there to
                    read. The note says what the opacity was trying to say.
                  -->
                  {#if cell.note}
                    <span class="ce-vh">{cell.note}</span>
                  {/if}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
