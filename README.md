# Obsidian Custom Daily Notes

Enhanced daily notes plugin with customizable sections and template support for Obsidian.

![Plugin Screenshot](screenshot.png) *(optional: add screenshot later)*


## Mobile screenshots:

### Settings

![5818652849322706099](https://github.com/user-attachments/assets/41475869-7125-43bc-ae1e-969c72847dd8)

![5818652849322706100](https://github.com/user-attachments/assets/33f1dee2-9186-439e-ae8a-db06d2f3d566)


![5818652849322706097](https://github.com/user-attachments/assets/0b17dca8-8c2d-4523-ad58-80a44b9bc849)


### My Plugin usage on mobile:

![5818652849322706101](https://github.com/user-attachments/assets/c6d472f7-dc0b-40cc-a517-c667fadc3184)


![5818652849322706098](https://github.com/user-attachments/assets/caf12d30-9035-4d10-80e6-6207e43ed15c)



## Features

- 📅 **Customizable sections** for your daily notes
- 📝 **Template support** for journal/note sections
- 🔄 **Task inheritance** - carry over unfinished tasks automatically
- 📱 **Mobile optimized** with touch-friendly controls
- ⚙️ **Flexible configuration** to match your workflow
- 🕒 **Date variables** in templates ({{date}}, {{time}}, {{day}})

## Installation

### Via BRAT (recommended)
1. Install the [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat)
2. Add this plugin's repository URL to BRAT
3. Enable the plugin in your community plugins list

### Manual Installation
1. Download the latest release
2. Extract to your vault's plugins folder: `.obsidian/plugins/custom-daily-notes`
3. Reload Obsidian and enable the plugin

## Usage

### Basic Setup
1. Open plugin settings (`Settings → Community Plugins → Custom Daily Notes`)
2. Configure your preferred:
   - Daily notes folder location
   - File name format
   - Default tags

### Creating Daily Notes
- Use the command palette and search for "Open today's custom daily note"
- On mobile, use the ribbon icon (calendar) for quick access

### Section Templates
1. Create template files in your vault (e.g., in `Templates/` folder)
2. In plugin settings, set template paths for sections.
3. Available template variables:
- `{{date}}` - Current date (YYYY-MM-DD)
- `{{time}}` - Current time (HH:mm)
- `{{day}}` - Weekday name (e.g., "Monday")
- `{{title}}` - Note title from your format settings

## Configuration Options

### Sections
- Add/remove sections as needed
- Set default content or template paths
- Enable/disable sections for specific weekdays

### Task Management
- Toggle automatic task inheritance
- Set exclusion tag (@done by default)

### Mobile
- Enable/disable swipe navigation
- Set default open on startup
- Configure quick entry sections

## Example Templates
### Basic Journal Template

```markdown
### Morning Reflections
{{time}} - 

### Daily Goals
- [ ] 

### Evening Review
What went well today?
- 
```

```markdown
### {{title}} Meetings

#### 9:00 AM Standup
- 

#### Action Items
- [ ] 
```

## Troubleshooting
#### Templates not loading?

Check the template file path is correct
Verify the file exists in your vault
Look for errors in the console (Ctrl+Shift+I)

#### Tasks not inheriting?

Ensure inheritance is enabled in settings
Check previous day's note has tasks section
Verify tasks use - [ ] format

## Development
Want to contribute? Here's how to set up the development environment:
use node version 22+
```bash
git clone [repository-url]
cd custom-daily-notes
npm install
npm run build
```
## Support
Found a bug or have a feature request?
Please open an issue
