import { Plugin, Notice, TFile, TFolder, MarkdownView } from 'obsidian';
import { DEFAULT_SETTINGS } from './interfaces';
import { CustomDailyNotesSettingTab } from './settings';
const isMobile = () => {
    return document.body.classList.contains('is-mobile');
};
export default class CustomDailyNotesPlugin extends Plugin {
    settings;
    constructor(app, manifest) {
        super(app, manifest);
        // Initialize settings with defaults
        this.settings = DEFAULT_SETTINGS;
    }
    async onload() {
        await this.loadSettings();
        // Register commands
        this.addCommand({
            id: 'open-custom-daily-note',
            name: 'Open today\'s custom daily note',
            callback: () => this.createOrOpenDailyNote()
        });
        this.addCommand({
            id: 'quick-daily-note-mobile',
            name: 'Quick Daily Note (Mobile Optimized)',
            callback: () => this.mobileCreateDailyNote(),
            mobileOnly: true
        });
        // Add settings tab
        this.addSettingTab(new CustomDailyNotesSettingTab(this.app, this));
        // Setup mobile features if on mobile
        if (isMobile()) {
            this.setupMobileFeatures();
        }
        // Open today's note on startup if enabled (mobile only)
        if (isMobile() && this.settings.mobileOptions.defaultOpenOnStartup) {
            this.app.workspace.onLayoutReady(() => {
                setTimeout(() => this.mobileCreateDailyNote(), 500);
            });
        }
    }
    async createOrOpenDailyNote() {
        const { vault } = this.app;
        const dateStr = window.moment().format('YYYY-MM-DD');
        const fileName = `${this.settings.dailyNotesPrefix}${dateStr}.md`;
        const folderPath = this.settings.dailyNotesFolder;
        try {
            // Ensure folder exists
            await this.ensureFolderExists(folderPath);
            // Check if file exists
            const filePath = `${folderPath}/${fileName}`;
            let file = vault.getAbstractFileByPath(filePath);
            if (!file) {
                // Create new file with template
                const content = await this.generateDailyNoteContent();
                file = await vault.create(filePath, content);
                new Notice(`Created new daily note: ${fileName}`);
            }
            // Open the file
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(file);
        }
        catch (error) {
            new Notice(`Error creating daily note: ${error}`);
            console.error(error);
        }
    }
    async ensureFolderExists(folderPath) {
        const { vault } = this.app;
        const folder = vault.getAbstractFileByPath(folderPath);
        if (!folder || !(folder instanceof TFolder)) {
            await vault.createFolder(folderPath);
        }
    }
    async generateDailyNoteContent() {
        const date = window.moment();
        let content = '';
        // Add YAML frontmatter if enabled
        if (this.settings.useYamlFrontmatter) {
            content += '---\n';
            content += `date: ${date.format('YYYY-MM-DD')}\n`;
            content += `day: ${date.format('dddd')}\n`;
            if (this.settings.defaultTags.length > 0) {
                content += `tags: [${this.settings.defaultTags.join(', ')}]\n`;
            }
            content += '---\n\n';
        }
        // Add title if configured
        if (this.settings.showTitle) {
            content += `# ${date.format(this.settings.titleFormat)}\n\n`;
        }
        // Add each section
        for (const section of this.settings.sections) {
            if (!section.enabled)
                continue;
            // Skip section if it's conditionally hidden
            if (section.weekdays && section.weekdays.length > 0) {
                const currentWeekday = date.format('dddd').toLowerCase();
                if (!section.weekdays.includes(currentWeekday)) {
                    continue;
                }
            }
            content += `## ${section.heading}\n`;
            // Special handling for tasks section
            if (section.id === 'tasks' && this.settings.inheritTasks) {
                const previousTasks = await this.getIncompleteTasksFromPreviousDay();
                if (previousTasks.length > 0) {
                    content += '<!-- Inherited from previous day -->\n';
                    for (const task of previousTasks) {
                        content += `${task}\n`;
                    }
                    content += '\n';
                }
            }
            content += `${section.content}\n\n`;
        }
        return content;
    }
    async getIncompleteTasksFromPreviousDay() {
        if (!this.settings.inheritTasks)
            return [];
        const previousDate = window.moment().subtract(1, 'day');
        const prevDateStr = previousDate.format('YYYY-MM-DD');
        const prevFileName = `${this.settings.dailyNotesPrefix}${prevDateStr}.md`;
        const prevFilePath = `${this.settings.dailyNotesFolder}/${prevFileName}`;
        try {
            const prevFile = this.app.vault.getAbstractFileByPath(prevFilePath);
            if (!prevFile || !(prevFile instanceof TFile))
                return [];
            const content = await this.app.vault.read(prevFile);
            const tasks = [];
            // Parse tasks section
            const tasksSectionMatch = content.match(/## Tasks\n([\s\S]*?)(?=\n## \w+|\n*$)/i);
            if (tasksSectionMatch) {
                const tasksContent = tasksSectionMatch[1];
                const taskLines = tasksContent.split('\n');
                for (const line of taskLines) {
                    if (line.includes('- [ ] ') &&
                        !line.includes(this.settings.taskInheritanceTag)) {
                        tasks.push(line.trim());
                    }
                }
            }
            return tasks;
        }
        catch (error) {
            console.error('Error reading previous day tasks:', error);
            return [];
        }
    }
    setupMobileFeatures() {
        // Add mobile header button
        this.addRibbonIcon('calendar-days', 'Daily Note', () => {
            this.mobileCreateDailyNote();
        });
        // Setup swipe gestures if enabled
        if (this.settings.mobileOptions.enableSwipeNavigation) {
            this.registerMobileGestures();
        }
    }
    registerMobileGestures() {
        let touchStartX = 0;
        let touchStartY = 0;
        const SWIPE_THRESHOLD = 50;
        const VERTICAL_THRESHOLD = 30;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;
            // Only horizontal swipes with minimal vertical movement
            if (Math.abs(diffY) > VERTICAL_THRESHOLD)
                return;
            if (Math.abs(diffX) > SWIPE_THRESHOLD) {
                if (diffX > 0) {
                    this.navigateToAdjacentDay(1); // Swipe left - next day
                }
                else {
                    this.navigateToAdjacentDay(-1); // Swipe right - previous day
                }
            }
        }, { passive: true });
    }
    async navigateToAdjacentDay(offset) {
        const currentFile = this.app.workspace.getActiveFile();
        if (!currentFile)
            return;
        // Parse date from current file name
        const dateMatch = currentFile.basename.match(/(\d{4}-\d{2}-\d{2})/);
        if (!dateMatch)
            return;
        const currentDate = window.moment(dateMatch[1]);
        const targetDate = currentDate.add(offset, 'days');
        const targetDateStr = targetDate.format('YYYY-MM-DD');
        const targetFileName = `${this.settings.dailyNotesPrefix}${targetDateStr}.md`;
        const targetFilePath = `${this.settings.dailyNotesFolder}/${targetFileName}`;
        try {
            let targetFile = this.app.vault.getAbstractFileByPath(targetFilePath);
            if (!targetFile) {
                // Create the file if it doesn't exist
                const content = await this.generateDailyNoteContentForDate(targetDate);
                targetFile = await this.app.vault.create(targetFilePath, content);
            }
            // Open the file
            const leaf = this.app.workspace.getLeaf();
            await leaf.openFile(targetFile);
        }
        catch (error) {
            new Notice(`Error navigating to day: ${error}`);
            console.error(error);
        }
    }
    async generateDailyNoteContentForDate(date) {
        let content = '';
        if (this.settings.useYamlFrontmatter) {
            content += '---\n';
            content += `date: ${date.format('YYYY-MM-DD')}\n`;
            content += `day: ${date.format('dddd')}\n`;
            if (this.settings.defaultTags.length > 0) {
                content += `tags: [${this.settings.defaultTags.join(', ')}]\n`;
            }
            content += '---\n\n';
        }
        if (this.settings.showTitle) {
            content += `# ${date.format(this.settings.titleFormat)}\n\n`;
        }
        for (const section of this.settings.sections) {
            if (!section.enabled)
                continue;
            if (section.weekdays && section.weekdays.length > 0) {
                const currentWeekday = date.format('dddd').toLowerCase();
                if (!section.weekdays.includes(currentWeekday)) {
                    continue;
                }
            }
            content += `## ${section.heading}\n${section.content}\n\n`;
        }
        return content;
    }
    async mobileCreateDailyNote() {
        try {
            await this.createOrOpenDailyNote();
            if (isMobile()) {
                const editor = this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                if (editor) {
                    editor.focus();
                    // Position cursor at first empty task if available
                    const content = editor.getValue();
                    const emptyTaskPos = content.indexOf('- [ ] ');
                    if (emptyTaskPos > -1) {
                        editor.setCursor(editor.offsetToPos(emptyTaskPos + 6));
                    }
                }
            }
        }
        catch (error) {
            new Notice(`Mobile error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
}
