"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
debugger;
const obsidian_1 = require("obsidian");
const interfaces_1 = require("./interfaces");
const settings_1 = require("./settings");
const isMobile = () => {
    return document.body.classList.contains('is-mobile');
};
class CustomDailyNotesPlugin extends obsidian_1.Plugin {
    constructor(app, manifest) {
        super(app, manifest);
        // Initialize settings with defaults
        this.settings = interfaces_1.DEFAULT_SETTINGS;
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
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
            this.addSettingTab(new settings_1.CustomDailyNotesSettingTab(this.app, this));
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
        });
    }
    createOrOpenDailyNote() {
        return __awaiter(this, void 0, void 0, function* () {
            const { vault } = this.app;
            const dateStr = window.moment().format('YYYY-MM-DD');
            const fileName = `${this.settings.dailyNotesPrefix}${dateStr}.md`;
            const folderPath = this.settings.dailyNotesFolder;
            try {
                // Ensure folder exists
                yield this.ensureFolderExists(folderPath);
                // Check if file exists
                const filePath = `${folderPath}/${fileName}`;
                let file = vault.getAbstractFileByPath(filePath);
                if (!file) {
                    // Create new file with template
                    const content = yield this.generateDailyNoteContent();
                    file = yield vault.create(filePath, content);
                    new obsidian_1.Notice(`Created new daily note: ${fileName}`);
                }
                // Open the file
                const leaf = this.app.workspace.getLeaf();
                yield leaf.openFile(file);
            }
            catch (error) {
                new obsidian_1.Notice(`Error creating daily note: ${error}`);
                console.error(error);
            }
        });
    }
    ensureFolderExists(folderPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const { vault } = this.app;
            const folder = vault.getAbstractFileByPath(folderPath);
            if (!folder || !(folder instanceof obsidian_1.TFolder)) {
                yield vault.createFolder(folderPath);
            }
        });
    }
    generateDailyNoteContent() {
        return __awaiter(this, void 0, void 0, function* () {
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
                    const previousTasks = yield this.getIncompleteTasksFromPreviousDay();
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
        });
    }
    getIncompleteTasksFromPreviousDay() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settings.inheritTasks)
                return [];
            const previousDate = window.moment().subtract(1, 'day');
            const prevDateStr = previousDate.format('YYYY-MM-DD');
            const prevFileName = `${this.settings.dailyNotesPrefix}${prevDateStr}.md`;
            const prevFilePath = `${this.settings.dailyNotesFolder}/${prevFileName}`;
            try {
                const prevFile = this.app.vault.getAbstractFileByPath(prevFilePath);
                if (!prevFile || !(prevFile instanceof obsidian_1.TFile))
                    return [];
                const content = yield this.app.vault.read(prevFile);
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
        });
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
    navigateToAdjacentDay(offset) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    const content = yield this.generateDailyNoteContentForDate(targetDate);
                    targetFile = yield this.app.vault.create(targetFilePath, content);
                }
                // Open the file
                const leaf = this.app.workspace.getLeaf();
                yield leaf.openFile(targetFile);
            }
            catch (error) {
                new obsidian_1.Notice(`Error navigating to day: ${error}`);
                console.error(error);
            }
        });
    }
    generateDailyNoteContentForDate(date) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    mobileCreateDailyNote() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                yield this.createOrOpenDailyNote();
                if (isMobile()) {
                    const editor = (_a = this.app.workspace.getActiveViewOfType(obsidian_1.MarkdownView)) === null || _a === void 0 ? void 0 : _a.editor;
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
                new obsidian_1.Notice(`Mobile error: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, interfaces_1.DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
}
exports.default = CustomDailyNotesPlugin;
//# sourceMappingURL=main.js.map