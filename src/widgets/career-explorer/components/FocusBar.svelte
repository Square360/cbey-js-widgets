<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    /** The focused row or column label. */
    label: string;
    onClear: () => void;
  }

  const { label, onClear }: Props = $props();
</script>

<div class="focusbar">
  <span>Focused on</span>
  <span class="focus-chip">
    <span>{label}</span>
    <button aria-label="Clear focus" onclick={onClear}><Icon name="x" /></button>
  </span>
  <span style="color:var(--faint)">
    — everything else dimmed. Click the header again to release.
  </span>
</div>
