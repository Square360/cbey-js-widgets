<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    /** Dot colour of the alum's display org type. */
    color: string;
    size?: 'sm' | 'lg';
  }

  const { color, size = 'sm' }: Props = $props();
</script>

<div
  class={size === 'lg' ? 'profile-avatar' : 'avatar'}
  style="background:{color}"
  aria-hidden="true"
>
  <Icon name="user" />
</div>
