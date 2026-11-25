class SyncGeneratorPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Top Bar & Breadcrumb
        this.breadcrumbSyncSetup = page.getByText('Sync Generator Setup', { exact: true });
        this.backToJobButton = page.getByRole('button', { name: /Back to Job/i })
            .or(page.getByText(/Back to Job/i));
        this.setupHeading = page.getByRole('heading', { name: 'Set up Sync job' })
            .or(page.getByText('Set up Sync job', { exact: true }));
        this.refreshButton = page.getByRole('button', { name: /Refresh/i });

        // Stats Badges
        this.linesStat = page.getByText(/\d+ lines/i);
        this.transcriptWordsStat = page.getByText(/[\d,]+ transcript words/i);
        this.mediaDurationStat = page.getByText(/Media duration: \d+m \d+s/i);
        this.alignedWordsStat = page.getByText(/Aligned [\d,]+ \/ [\d,]+ ASR words/i);

        // Section 1: Inputs
        this.inputsHeading = page.getByText(/1\.\s*Inputs/i);

        // Transcript Card
        this.transcriptHeading = page.getByText('Transcript (.txt, .mdb, .ytg, .xmef)');
        this.uploadTranscriptButton = page.getByRole('button', { name: 'Upload' }).nth(0);
        this.showTranscriptArtifactsButton = page.getByRole('button', { name: 'Show Artifacts' }).nth(0);
        this.transcriptFileInput = page.locator('input[type="file"][accept*=".txt"], input[type="file"]').nth(0);

        // Selected Transcript Radio Card
        this.transcriptRadioItem = page.locator('[role="radio"][aria-checked="true"]').first();
        this.transcriptRadioInput = page.locator('input[type="radio"][name="syncTranscriptSelect"]');
        this.transcriptName = this.transcriptRadioItem.locator('p.text-sm.font-medium, p.font-medium').first();
        this.finalTranscriptBadge = this.transcriptRadioItem.getByText('Final Transcript');
        this.sourceBadge = this.transcriptRadioItem.getByText('Source');
        this.setTranscriptLinesButton = page.getByRole('button', { name: /Set Transcript Lines/i }).first();
        this.removeTranscriptButton = page.locator('button[title="Remove from setup"]').first();

        // Spoken Lines Status
        this.spokenLinesStatus = page.getByText(/Spoken lines set/i);
        this.bottomSetLinesButton = page.getByRole('button', { name: /Set Transcript Lines/i }).last();

        // Media Card
        this.mediaHeading = page.getByText('Media (in order)');
        this.uploadMediaButton = page.getByRole('button', { name: 'Upload' }).nth(1);
        this.showMediaArtifactsButton = page.getByRole('button', { name: 'Show Artifacts' }).nth(1);
        this.mediaFileInput = page.locator('input[type="file"][accept*=".mpg"], input[type="file"]').nth(1);
        this.mediaOrderedItem = page.locator('li').filter({ hasText: '#1' }).or(page.locator('li').filter({ hasText: 'Sullivan_15min.mpg' })).first();
        this.mediaListItems = page.locator('li').filter({ hasText: /#\d+/ });
        this.mediaStitchWarning = page.getByText(/Media files are stitched in this order to build one continuous timeline/i);

        // Exhibits Card
        this.exhibitsHeading = page.getByText(/^Exhibits/i).first();
        this.uploadExhibitsButton = page.getByRole('button', { name: 'Upload' }).nth(2);
        this.showExhibitsArtifactsButton = page.getByRole('button', { name: 'Show Artifacts' }).nth(2);
        this.exhibitsFileInput = page.locator('input[type="file"][accept*=".pdf"], input[type="file"]').nth(2);
        this.exhibitsNotice = page.getByText(/Exhibits \(\.pdf, \.jpg, \.png, \.tif\) are populated from Artifacts and linkable in Sync Generator/i);
        this.exhibitsCountBadge = page.getByText(/\d+ added/i);
        this.exhibitsList = page.locator('ul.space-y-1');
        this.exhibitsListItems = page.locator('ul.space-y-1 li');
        this.requiredFooterNote = page.getByText('Required: transcript + at least one media file.');

        // Toasts & Notifications
        this.toastAlert = page.locator('[data-sonner-toast], [role="alert"]').first();
        this.toasts = page.locator('[data-sonner-toast], [role="alert"]');

        // Section 2: Sync Type
        this.syncTypeHeading = page.getByText(/2\.\s*Sync Type/i);
        this.syncTypeCombobox = page.getByRole('combobox').first();
        this.syncTypeDescription = page.getByText(/Process this job using ASR alignment/i);
        this.syncTypePriceEstimate = page.getByText(/Price: \$0\.50 per media minute/i);
        this.syncTypeOptions = page.getByRole('option');

        // Section 3: Process
        this.processHeading = page.getByText(/3\.\s*Process/i);
        this.processButton = page.getByRole('button', { name: /^Process$/i })
            .or(page.getByRole('button', { name: /Process/i })).first();
        this.readyToProcessText = page.getByText(/Ready to run alignment\. Click Process to begin\./i);
        this.processingStatusText = page.getByText(/Processing alignment…|Job submitted for processing|Processing/i);
        this.alignmentReadyText = page.getByText(/Alignment ready — [\d,]+ of [\d,]+ ASR words anchored/i);
        this.orderReferenceText = page.getByText(/Order S\d+ · Sync Generator/i);
        this.openEditorButton = page.getByRole('link', { name: /Open Editor/i })
            .or(page.getByRole('button', { name: /Open Editor/i }));
        this.reprocessButton = page.getByRole('button', { name: /Re-process/i });
        this.debugDetailsSummary = page.locator('summary').filter({ hasText: /Debug details/i });
        this.debugDetailsContent = page.locator('details[open]');

        // Modals / Dialogs
        this.dialog = page.getByRole('dialog').first();
        this.dialogHeading = this.dialog.locator('h2, h3').first();
        this.dialogCloseButton = this.dialog.getByRole('button', { name: 'Close', exact: true }).first();

        // Set Transcript Lines Modal
        this.setLinesDialog = page.getByRole('dialog')
            .filter({ has: page.getByRole('heading', { name: 'Set Transcript Lines' }) }).first();
        this.setLinesHeading = this.setLinesDialog.getByRole('heading', { name: 'Set Transcript Lines' });
        this.setLinesDescription = this.setLinesDialog.getByText(/Auto-detected Start and End mark the spoken portion/i);
        this.useAutoDetectedCheckbox = this.setLinesDialog.getByRole('checkbox');
        this.transcriptPreviewPanel = this.setLinesDialog.getByText('Transcript Preview');
        this.startLocationHeading = this.setLinesDialog.getByText('Start Location');
        this.startPageInput = this.setLinesDialog.locator('input').nth(0);
        this.startLineInput = this.setLinesDialog.locator('input').nth(1);
        this.endLocationHeading = this.setLinesDialog.getByText('End Location');
        this.endPageInput = this.setLinesDialog.locator('input').nth(2);
        this.endLineInput = this.setLinesDialog.locator('input').nth(3);
        this.confirmDefaultsButton = this.setLinesDialog.getByRole('button', { name: /Confirm defaults/i });
        this.setLinesCloseButton = this.setLinesDialog.getByRole('button', { name: 'Close', exact: true }).first();

        // Sync Generator Editor Page (/edit)
        // Header & Navigation
        this.editorBackButton = page.locator('button:has(svg.lucide-arrow-left)').first();
        this.editorTitle = page.getByRole('heading', { level: 1 }).first();
        this.editorCompletedBadge = page.locator('div.rounded-full, span.rounded-full').filter({ hasText: /Completed|Finalized/i }).first();
        this.editorStatusBadge = this.editorCompletedBadge;
        this.editorAnchoredStat = page.locator('div.rounded-full, span.rounded-full').filter({ hasText: /anchored/i }).first();
        this.editorInterpolatedStat = page.locator('div.rounded-full, span.rounded-full').filter({ hasText: /interpolated/i }).first();
        this.editorEditExhibitsButton = page.getByRole('button', { name: 'Edit Exhibits', exact: true });
        this.editorSetupButton = page.getByRole('button', { name: 'Setup', exact: true })
            .or(page.getByRole('link', { name: /Setup/i }));
        this.editorRefreshButton = page.getByRole('button', { name: 'Refresh', exact: true });
        this.editorExportButton = page.getByRole('button', { name: 'Export', exact: true });
        this.editorApproveButton = page.getByRole('button', { name: 'Approve', exact: true });

        // Finalize / Approve Dialog
        this.finalizeDialog = page.locator('[role="alertdialog"], [role="dialog"]').filter({
            hasText: /Finalize this sync job\?/i
        });
        this.finalizeHeading = this.finalizeDialog.getByText(/Finalize this sync job\?/i);
        this.finalizeDescription = this.finalizeDialog.getByText(/You won't be able to edit timecodes after finalizing/i);
        this.finalizeConfirmButton = this.finalizeDialog.getByRole('button', { name: 'Finalize', exact: true });
        this.finalizeCancelButton = this.finalizeDialog.getByRole('button', { name: 'Cancel', exact: true });

        // Media Player
        this.playerContainer = page.locator('div').filter({ has: page.locator('video, audio, svg.lucide-music') }).first();
        this.playButton = page.locator('button[title="Play"], button:has(svg.lucide-play)').first();
        this.pauseButton = page.locator('button[title="Pause"], button:has(svg.lucide-pause)').first();
        this.timeSlider = page.locator('input[type="range"][max]').first();
        this.timecodeDisplay = page.getByText(/\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/).first();
        this.speedSelect = page.locator('select').filter({ has: page.locator('option[value="1"]') }).first();
        this.muteButton = page.locator('button[title="Mute"], button[aria-label="Mute"]').first();
        this.volumeSlider = page.locator('input[aria-label="Volume"]').first();

        // Right Panel: Search & Filters
        this.searchLinesInput = page.getByPlaceholder(/Search lines/i);
        this.filterAllButton = page.getByRole('button', { name: 'All', exact: true });
        this.filterLowConfidenceButton = page.getByRole('button', { name: 'Low Confidence', exact: true });
        this.filterInterpolatedButton = page.getByRole('button', { name: 'Interpolated', exact: true });
        this.moreOptionsButton = page.locator('button[aria-label="More options"]').first();

        // Secondary Toolbar
        this.clearInterpButton = page.getByRole('button', { name: 'Clear interp', exact: true });
        this.undoButton = page.getByRole('button', { name: 'Undo', exact: true });
        this.redoButton = page.getByRole('button', { name: 'Redo', exact: true });
        this.reviewModeButton = page.getByRole('button', { name: 'Review', exact: true });
        this.editModeButton = page.getByRole('button', { name: 'Edit', exact: true });
        this.timecodeSettingsButton = page.locator('button[title="Timecode Adjustment Options"]').first();

        // Transcript Line Rows
        this.transcriptLines = page.getByText(/P\d+:L\d+/);
        this.timestampButtons = page.locator('button').filter({ hasText: /^\d{2}:\d{2}\.\d{2}$/ });
    }

    async selectSyncType(optionName) {
        await this.syncTypeCombobox.click();
        await this.page.getByRole('option', { name: optionName, exact: true }).click();
    }

    async openShowArtifacts(section) {
        if (section === 'transcript') {
            await this.showTranscriptArtifactsButton.click();
        } else if (section === 'media') {
            await this.showMediaArtifactsButton.click();
        } else if (section === 'exhibits') {
            await this.showExhibitsArtifactsButton.click();
        }
        await this.dialog.waitFor({ state: 'visible', timeout: 5000 });
    }

    async closeArtifactsDialog() {
        if (await this.dialog.isVisible()) {
            await this.dialogCloseButton.click().catch(() => {});
            await this.dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(async () => {
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);
            });
        }
    }

    async openSetTranscriptLinesModal() {
        await this.setTranscriptLinesButton.click();
        await this.setLinesDialog.waitFor({ state: 'visible', timeout: 5000 });
    }

    async closeSetTranscriptLinesModal() {
        if (await this.setLinesDialog.isVisible()) {
            await this.setLinesCloseButton.click().catch(() => {});
            await this.setLinesDialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(async () => {
                await this.page.keyboard.press('Escape');
                await this.page.waitForTimeout(500);
            });
        }
    }

    async togglePlayback() {
        if (await this.playButton.isVisible()) {
            await this.playButton.click();
        } else if (await this.pauseButton.isVisible()) {
            await this.pauseButton.click();
        }
    }

    async setPlaybackSpeed(speedValue) {
        await this.speedSelect.selectOption(String(speedValue));
    }

    async searchTranscript(query) {
        await this.searchLinesInput.fill(query);
        await this.page.waitForTimeout(500);
    }

    async clearTranscriptSearch() {
        await this.searchLinesInput.clear();
        await this.page.waitForTimeout(500);
    }

    async setEditorMode(mode) {
        if (mode === 'Edit') {
            await this.editModeButton.click();
        } else {
            await this.reviewModeButton.click();
        }
        await this.page.waitForTimeout(300);
    }

    // Upload & Artifact Helper Methods
    async uploadTranscript(filePath) {
        await this.transcriptFileInput.setInputFiles(filePath);
    }

    async uploadMedia(filePaths) {
        await this.mediaFileInput.setInputFiles(filePaths);
    }

    async uploadExhibits(filePaths) {
        await this.exhibitsFileInput.setInputFiles(filePaths);
    }

    async getToastMessages() {
        return await this.toasts.allInnerTexts();
    }

    async removeTranscript() {
        if (await this.removeTranscriptButton.isVisible()) {
            await this.removeTranscriptButton.click();
        }
    }

    async removeExhibit(filename) {
        const item = this.exhibitsListItems.filter({ hasText: filename }).first();
        const removeBtn = item.locator('button[title*="Remove"]').first();
        await removeBtn.click();
    }

    async finalizeSyncJob() {
        if (await this.editorApproveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await this.editorApproveButton.click();
            await this.finalizeDialog.waitFor({ state: 'visible', timeout: 8000 });
            await this.finalizeConfirmButton.click();
            await this.finalizeDialog.waitFor({ state: 'hidden', timeout: 10000 });
        }
    }
}

module.exports = SyncGeneratorPage;
