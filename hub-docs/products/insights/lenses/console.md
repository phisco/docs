---
title: Using lenses in the Console
sidebar_position: 2
description: Open, save, share, and manage lenses from the Hub Console.
---

This guide covers how to open, save, share, and manage lenses in the Hub Console. Lenses let you return to a saved view without rebuilding filters, sort order, or table layout each time.

## Open a lens

<div style={{display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px'}}>
<div style={{flex: '1 1 280px'}}>

On the Resources page, open the Lenses panel on the left. The panel lists every lens you can use, grouped into three sections:

- My Lenses: Lenses created and owned by you
- Shared by Team: Lenses owned by a teammate, accessible to you
- Pre-built Lenses: Default Lenses shipped with the Hub

Select a lens from the list to apply its saved filter, sort, and column layout. The main area updates to show that lens's name, filters, and results.

Use the "Search lenses" field at the top of the panel to find a lens by name.

</div>
<img
  src="/img/hub/lenses/lens-picker.png"
  alt="Lens picker"
  style={{flex: '0 1 auto', maxWidth: '300px', width: '100%', height: 'auto'}}
/>
</div>

You can filter and sort the Resources table directly without selecting a lens.
Changes settings will affect what you see right now, but they are not saved
until you create or update a lens. Switching to another lens replaces your
current view with that lens's saved settings.

## Save your current view as a lens

<div style={{display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px'}}>
<div style={{flex: '1 1 280px'}}>

New lenses are private by default. They appear under "My Lenses" and show a lock icon. Only you can see and edit them until you share one with your team.

1. Adjust filters, sort, and columns until the view looks right. Active filters appear as chips above the table.
2. Click "Create Lens" in the Lenses panel header.
3. Enter a name and, if you want, a short description. Hub saves the current filter, sort, and table layout to that lens.

After you save, the lens appears under "My Lenses".

</div>
<img
  src="/img/hub/lenses/create-lens.png"
  alt="Lens picker"
  style={{flex: '0 1 auto', maxWidth: '300px', width: '100%', height: 'auto'}}
/>
</div>

## Share a lens with your team

There are two ways to share a view with teammates, and they do different things.

### Copy a public URL

<div style={{display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px'}}>
<div style={{flex: '1 1 280px'}}>

Right-click a lens in the Lenses panel and choose "Copy public URL". Hub copies a link that opens the Resources page with the same filter criteria applied.

The link contains the current filtering criteria for your teammates to use. Copying the link does not make your lens public. The lens stays private, and teammates open the same view from the URL rather than selecting your lens from the list.

</div>
<img
  src="/img/hub/lenses/copy-public-url.png"
  alt="Lens picker"
  style={{flex: '0 1 auto', maxWidth: '300px', width: '100%', height: 'auto'}}
/>
</div>

Use this when you want to send someone a specific view quickly, such as in a chat message or incident thread, without making the lens visible to everyone in Hub.

:::tip
Sharing the public URL shares the filtering criteria for the lens, not ownership
of the lens itself.
:::

### Share a lens permanently

<div style={{display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '16px'}}>
<div style={{flex: '1 1 280px'}}>

To make a lens available to everyone in Hub, right-click the lens and choose "Edit Lens". In the dialog, change "Visibility" to "Public", then save.

Shared lenses appear under "Shared by Team", where anyone can select and reuse them. Making a lens public does not give others edit rights. Only you can change or remove a lens you created.

</div>
<img
  src="/img/hub/lenses/public-lens.png"
  alt="Lens picker"
  style={{flex: '0 1 auto', maxWidth: '300px', width: '100%', height: 'auto'}}
/>
</div>

:::tip
Mark a lens publicly available when your team needs a reliable view of resources they can return to.
:::

## Edit or delete a lens you own

Open one of your lenses under "My Lenses", adjust the view, and save your changes from the menu on the lens header. Saving replaces the lens's stored view entirely.

You cannot edit or delete pre-built lenses or lenses owned by someone else. If you need a variant, adjust the view and click "Create Lens" to save it as a new lens.

## See also

- [Lenses](overview.md)
