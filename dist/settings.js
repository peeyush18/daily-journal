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
exports.CustomDailyNotesSettingTab = void 0;
const obsidian_1 = require("obsidian");
class CustomDailyNotesSettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        // Basic Settings
        containerEl.createEl('h2', { text: 'Basic Settings' });
        new obsidian_1.Setting(containerEl)
            .setName('Daily notes folder')
            .setDesc('Folder where daily notes will be stored')
            .addText(text => text
            .setValue(this.plugin.settings.dailyNotesFolder)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.dailyNotesFolder = value;
            yield this.plugin.saveSettings();
        })));
        // Task Inheritance Settings
        containerEl.createEl('h2', { text: 'Task Inheritance' });
        new obsidian_1.Setting(containerEl)
            .setName('Enable task inheritance')
            .setDesc('Automatically carry over incomplete tasks from previous day')
            .addToggle(toggle => toggle
            .setValue(this.plugin.settings.inheritTasks)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.inheritTasks = value;
            yield this.plugin.saveSettings();
        })));
        // Mobile Settings
        containerEl.createEl('h2', { text: 'Mobile Settings' });
        new obsidian_1.Setting(containerEl)
            .setName('Enable mobile swipe navigation')
            .setDesc('Swipe left/right to navigate between days')
            .addToggle(toggle => toggle
            .setValue(this.plugin.settings.mobileOptions.enableSwipeNavigation)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.mobileOptions.enableSwipeNavigation = value;
            yield this.plugin.saveSettings();
        })));
        // Sections Configuration
        containerEl.createEl('h2', { text: 'Note Sections' });
        this.plugin.settings.sections.forEach((section, index) => {
            const sectionDiv = containerEl.createDiv('section-setting');
            new obsidian_1.Setting(sectionDiv)
                .setName(`Section ${index + 1}: ${section.heading}`)
                .setHeading();
            new obsidian_1.Setting(sectionDiv)
                .setName('Enabled')
                .addToggle(toggle => toggle
                .setValue(section.enabled)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                section.enabled = value;
                yield this.plugin.saveSettings();
            })));
            new obsidian_1.Setting(sectionDiv)
                .setName('Heading')
                .addText(text => text
                .setValue(section.heading)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                section.heading = value;
                yield this.plugin.saveSettings();
            })));
            new obsidian_1.Setting(sectionDiv)
                .setName('Default content')
                .addTextArea(text => text
                .setValue(section.content)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                section.content = value;
                yield this.plugin.saveSettings();
            })));
        });
    }
}
exports.CustomDailyNotesSettingTab = CustomDailyNotesSettingTab;
//# sourceMappingURL=settings.js.map