class JobsPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Jobs Section in Case Details
        this.jobsHeading = page.getByRole('heading', { name: 'Jobs', exact: true });
        this.searchJobsInput = page.getByPlaceholder('Search jobs…')
            .or(page.getByPlaceholder('Search jobs...'));
        this.newJobButton = page.getByRole('button', { name: 'New Job' })
            .or(page.locator('button:has-text("New Job")')).first();
        this.jobsTable = page.locator('table').filter({ has: page.locator('th:has-text("Name"), th:has-text("Ref")') })
            .or(page.locator('table').last());
        this.jobRows = this.jobsTable.locator('tbody tr');
        this.noDataMessage = page.getByText(/No data found|No jobs match your search/i);
        this.clearSearchButton = page.getByRole('button', { name: 'Clear search' })
            .or(page.locator('button:has(svg)').filter({ has: page.locator('xpath=preceding-sibling::input[@placeholder="Search jobs…"]') }));

        // Create Job Dialog
        this.createJobDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Create Job' })
        });
        this.createJobHeading = this.createJobDialog.getByRole('heading', { name: 'Create Job' });
        this.createJobSubtitle = this.createJobDialog.getByText(/Enter basics now/i);
        this.closeDialogButton = this.createJobDialog.getByRole('button', { name: 'Close', exact: true });

        // Basic / Required Fields
        this.jobNameInput = this.createJobDialog.locator('#job-name')
            .or(this.createJobDialog.getByPlaceholder('e.g., Smith Deposition — Volume 1'));
        this.categorySelect = this.createJobDialog.locator('#job-category')
            .or(this.createJobDialog.getByRole('combobox').nth(0));
        this.clientJobRefInput = this.createJobDialog.locator('#job-ref')
            .or(this.createJobDialog.getByPlaceholder('e.g., CAPTURE-J-0091'));
        this.descriptionInput = this.createJobDialog.locator('#job-desc')
            .or(this.createJobDialog.locator('textarea').first());
        this.scheduledDateTimeInput = this.createJobDialog.locator('#job-scheduled')
            .or(this.createJobDialog.locator('input[type="datetime-local"]'));
        this.modeSelect = this.createJobDialog.locator('#job-mode')
            .or(this.createJobDialog.getByRole('combobox').nth(1));
        this.witnessNameInput = this.createJobDialog.locator('#job-witness')
            .or(this.createJobDialog.getByPlaceholder('e.g., Jane Doe'));

        // Details (optional) Accordion & Fields
        this.detailsToggle = this.createJobDialog.getByRole('button', { name: /Details \(optional\)/i });
        this.locationInput = this.createJobDialog.locator('#job-location')
            .or(this.createJobDialog.getByPlaceholder('Address or meeting link'));
        this.assignedReporterSelect = this.createJobDialog.locator('#job-reporter')
            .or(this.createJobDialog.getByRole('combobox').filter({ hasText: /reporter/i }));
        this.durationInput = this.createJobDialog.locator('#job-duration');
        this.notesInput = this.createJobDialog.locator('#job-notes')
            .or(this.createJobDialog.locator('textarea').last());

        // Actions
        this.createJobSubmitButton = this.createJobDialog.getByRole('button', { name: 'Create Job', exact: true });
        this.cancelButton = this.createJobDialog.getByRole('button', { name: 'Cancel', exact: true });

        // Job Details Page Elements
        this.jobTitleHeading = page.locator('h1, h2, h3').filter({ hasText: /^Job_/i }).first();
        this.backToCaseButton = page.getByRole('button', { name: /Back to/i }).or(page.getByText(/Back to/i)).first();
        this.draftBadge = page.getByText('Draft', { exact: true });
        this.depositionBadge = page.getByText('Deposition', { exact: true });
        this.editJobButton = page.getByRole('button', { name: 'Edit', exact: true });
        this.savePushToTMEButton = page.getByRole('button', { name: /Save, Then Push to TME/i });

        // Assigned Reporter Section & Modal
        this.assignedReporterHeading = page.getByRole('heading', { name: 'Assigned Reporter' });
        this.assignedReporterSection = page.locator('section, div').filter({ has: page.getByRole('heading', { name: 'Assigned Reporter' }) }).first();
        this.assignReporterButton = page.getByRole('button', { name: 'Assign Reporter' });
        this.noReporterAssignedMessage = page.getByText('No reporter assigned yet.');
        this.assignReporterDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Assign Reporter' })
        });
        this.assignReporterModalHeading = this.assignReporterDialog.getByRole('heading', { name: 'Assign Reporter' });
        this.assignReporterCloseButton = this.assignReporterDialog.getByRole('button', { name: 'Close', exact: true });
        this.assignReporterCombobox = this.assignReporterDialog.getByRole('combobox');
        this.assignReporterSubmitButton = this.assignReporterDialog.getByRole('button', { name: 'Assign', exact: true });

        // Artifacts Section
        this.artifactsSection = page.locator('div.rounded-lg, div.border, section').filter({ has: page.getByRole('heading', { name: /Artifacts/i }) }).first();
        this.artifactsHeading = this.artifactsSection.getByRole('heading', { name: /Artifacts/i });
        this.uploadArtifactButton = page.getByRole('button', { name: 'Upload', exact: true });
        this.artifactFileInput = this.artifactsSection.locator('input[type="file"]');
        this.noArtifactsMessage = page.getByText(/No artifacts yet/i);
        this.sendToPublicationNotice = page.getByText('Job must be Approved or have Publish artifacts to enable Send To publication.');
        this.sendToButton = page.getByRole('button', { name: 'Send To' });
        this.sendToNoticeReady = page.getByText(/Publish deposition results & secure repository link to recipients/i);
        this.sendToGeneratingButton = page.getByRole('button', { name: /Generating link/i });

        // Send To Modal & Elements
        this.sendToDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: /Send To/i })
        });
        this.sendToHeading = this.sendToDialog.getByRole('heading', { name: /Send To/i });
        this.sendToCloseButton = this.sendToDialog.getByRole('button', { name: 'Close', exact: true })
            .or(this.sendToDialog.locator('button.absolute.right-4.top-4'));

        // Send To - Job / Deposition Information
        this.sendToDepositionInfo = this.sendToDialog.getByText(/JOB \/ DEPOSITION INFORMATION/i);
        this.sendToCaseName = this.sendToDialog.locator('div').filter({ has: page.getByText('Case Name') }).locator('span').nth(1);

        // Send To - Send Configuration
        this.sendConfigurationHeading = this.sendToDialog.getByText(/SEND CONFIGURATION/i);
        this.emailTemplateCombobox = this.sendToDialog.getByRole('combobox').nth(0);
        this.emailPreviewButton = this.sendToDialog.locator('button[title="Preview email"]');
        this.accessTypeCombobox = this.sendToDialog.getByRole('combobox').nth(1);
        this.accessTypeOptions = page.locator('[role="option"]');
        this.filesToSendButton = this.sendToDialog.locator('button[title*="formats of files to send"]');
        this.filesToSendMenuItems = page.locator('[role="menuitemcheckbox"], [role="menuitem"]');
        this.sendDateInput = this.sendToDialog.locator('input[type="date"]').nth(0);
        this.sendTimeInput = this.sendToDialog.locator('input[type="time"]').nth(0);
        this.expirationDateInput = this.sendToDialog.locator('input[type="date"]').nth(1);
        this.expirationHelperText = this.sendToDialog.getByText(/Leave blank if the link should never expire/i);

        // Send To - Recipients Section
        this.recipientsHeading = this.sendToDialog.getByText(/RECIPIENTS \(\d+\)/i);
        this.addGroupButton = this.sendToDialog.getByRole('button', { name: /Add Group/i });
        this.addRecipientButton = this.sendToDialog.getByRole('button', { name: /Add Recipient/i });
        this.recipientsTable = this.sendToDialog.locator('table');
        this.recipientsEmptyState = this.sendToDialog.getByText(/No recipients or groups added yet/i);
        this.recipientsRows = this.recipientsTable.locator('tbody tr');

        // Send To - Bottom Actions
        this.sendToCancelButton = this.sendToDialog.getByRole('button', { name: 'Cancel', exact: true });
        this.sendToSubmitButton = this.sendToDialog.getByRole('button', { name: /Send/i }).filter({ hasText: /Send/i }).last();

        // Add Recipient Modal (Nested)
        this.addRecipientDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Add Recipient' })
        });
        this.recipientFirstNameInput = this.addRecipientDialog.getByPlaceholder('First name');
        this.recipientLastNameInput = this.addRecipientDialog.getByPlaceholder('Last name');
        this.recipientEmailInput = this.addRecipientDialog.getByPlaceholder('user@lawfirm.com');
        this.recipientChooseCombobox = this.addRecipientDialog.getByRole('combobox').first();
        this.recipientGroupCombobox = this.addRecipientDialog.getByRole('combobox').filter({ hasText: /None \(Ungrouped\)|Group/i })
            .or(this.addRecipientDialog.getByRole('combobox').last());
        this.submitAddRecipientButton = this.addRecipientDialog.getByRole('button', { name: 'Add Recipient', exact: true });
        this.cancelAddRecipientButton = this.addRecipientDialog.getByRole('button', { name: 'Cancel', exact: true });

        // Add Group Modal (Nested)
        this.addGroupDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: /Select Recipient Groups/i })
        });
        this.addGroupCloseButton = this.addGroupDialog.getByRole('button', { name: 'Cancel', exact: true })
            .or(this.addGroupDialog.getByRole('button', { name: 'Close', exact: true }));

        // Artifact Deletion Dialog
        this.deleteArtifactDialog = page.getByRole('alertdialog').or(page.getByRole('dialog'))
            .filter({ has: page.getByRole('heading', { name: 'Delete Artifact' }) }).first();
        this.confirmDeleteArtifactButton = this.deleteArtifactDialog.getByRole('button', { name: 'Delete', exact: true });
        this.cancelDeleteArtifactButton = this.deleteArtifactDialog.getByRole('button', { name: 'Cancel', exact: true });

        // Repository Link Section
        this.repositoryLinkSection = page.locator('div, section')
            .filter({ has: page.getByRole('heading', { name: 'Repository Link' }) }).first();
        this.repositoryLinkHeading = page.getByRole('heading', { name: 'Repository Link' });
        this.repositoryLinkSubtext = page.getByText(/Single guest URL that grants access to both Sync Generator deliverables and Publish artifacts/i);
        this.formatsButton = page.getByRole('button', { name: /Formats/i });
        this.regenerateRepoButton = page.getByRole('button', { name: /Regenerate/i });
        this.generateRepoButton = page.getByRole('button', { name: 'Generate', exact: true });
        this.repoDisabledNotice = page.getByText(/Approve and finalize the sync job, upload manual sync deliverables, or generate Publish output/i);

        // Formats Dropdown Menu
        this.formatsMenu = page.locator('[role="menu"]')
            .filter({ hasText: 'INCLUDE IN REPOSITORY' });
        this.formatsMenuHeading = page.getByText('INCLUDE IN REPOSITORY');
        this.formatsMenuItems = page.locator('[role="menuitemcheckbox"]');

        // Active Repository Links
        this.activeRepoLinksHeading = page.getByText('ACTIVE REPOSITORY LINKS');
        this.fullAccessCard = page.locator('div.rounded-md, div.border')
            .filter({ hasText: 'Full Access Link' }).first();
        this.fullAccessLinkLabel = page.locator('p').filter({ hasText: /^Full Access Link$/ });
        this.fullAccessLinkAnchor = page.locator('a[href*="/r/"]').filter({ hasText: /\/r\// }).first();
        this.fullAccessCopyButton = page.getByRole('button', { name: /Copy/i }).nth(0);
        this.fullAccessExternalLink = page.locator('a[target="_blank"][title="Open link in new tab"]').nth(0);

        this.viewOnlyCard = page.locator('div.rounded-md, div.border')
            .filter({ hasText: 'View-Only Link' }).first();
        this.viewOnlyLinkLabel = page.locator('p').filter({ hasText: /^View-Only Link$/ });
        this.viewOnlyLinkAnchor = page.locator('a[href*="/r/"]').filter({ hasText: /\/r\// }).nth(1);
        this.viewOnlyCopyButton = page.getByRole('button', { name: /Copy/i }).nth(1);
        this.viewOnlyExternalLink = page.locator('a[target="_blank"][title="Open link in new tab"]').nth(1);

        this.fullAccessBullet = page.getByText(/Full Access Link allows downloading and viewing all deposition files/i);
        this.viewOnlyBullet = page.getByText(/View-Only Link permits viewing PDF, Word, and TXT files directly in the browser/i);

        // Publication History & Sync Generator
        this.publicationHistoryHeading = page.getByRole('heading', { name: 'Publication History' });
        this.syncGeneratorSection = page.locator('div, section')
            .filter({ has: page.getByRole('heading', { name: 'Sync Generator' }) }).first();
        this.syncGeneratorHeading = page.getByRole('heading', { name: 'Sync Generator' });
        this.syncCompletedBadge = this.syncGeneratorSection.locator('div').filter({ hasText: /^Completed$/ }).first();
        this.syncAlignmentStats = this.syncGeneratorSection.getByText(/Aligned [\d,]+ of [\d,]+ ASR words/i);
        this.openSyncGeneratorButton = this.syncGeneratorSection.getByRole('button', { name: /Open Sync Generator|Create sync job/i });
        this.createSyncJobButton = this.syncGeneratorSection.getByRole('button', { name: /Create sync job|Open Sync Generator/i });
    }

    async openCreateJobModal() {
        await this.newJobButton.click();
        await this.createJobDialog.waitFor();
    }

    async closeCreateJobModal() {
        await this.closeDialogButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }

    async expandDetails() {
        if (await this.detailsToggle.isVisible()) {
            const isExpanded = await this.detailsToggle.getAttribute('aria-expanded');
            if (isExpanded !== 'true') {
                await this.detailsToggle.click();
            }
        }
    }

    async selectCategory(category) {
        await this.categorySelect.click();
        await this.page.getByRole('option', { name: category, exact: true }).click();
    }

    async selectMode(mode) {
        await this.modeSelect.click();
        await this.page.getByRole('option', { name: mode, exact: true }).click();
    }

    async selectReporter(reporter) {
        await this.expandDetails();
        await this.assignedReporterSelect.click();
        await this.page.getByRole('option', { name: reporter, exact: true }).click();
    }

    async fillJobDetails({
        name,
        category,
        clientJobRef,
        description,
        scheduledDateTime,
        mode,
        witnessName,
        location,
        reporter,
        duration,
        notes
    } = {}) {
        if (name !== undefined) {
            await this.jobNameInput.fill(name);
        }
        if (category !== undefined) {
            await this.selectCategory(category);
        }
        if (clientJobRef !== undefined) {
            await this.clientJobRefInput.fill(clientJobRef);
        }
        if (description !== undefined) {
            await this.descriptionInput.fill(description);
        }
        if (scheduledDateTime !== undefined) {
            await this.scheduledDateTimeInput.fill(scheduledDateTime);
        }
        if (mode !== undefined) {
            await this.selectMode(mode);
        }
        if (witnessName !== undefined) {
            await this.witnessNameInput.fill(witnessName);
        }
        if (location !== undefined || reporter !== undefined || duration !== undefined || notes !== undefined) {
            await this.expandDetails();
            if (location !== undefined) {
                await this.locationInput.fill(location);
            }
            if (reporter !== undefined) {
                await this.selectReporter(reporter);
            }
            if (duration !== undefined) {
                await this.durationInput.fill(duration.toString());
            }
            if (notes !== undefined) {
                await this.notesInput.fill(notes);
            }
        }
    }

    async submitCreateJob() {
        await this.createJobSubmitButton.click();
    }

    async searchJobs(term) {
        await this.searchJobsInput.fill(term);
    }

    async clearSearch() {
        if (await this.clearSearchButton.isVisible()) {
            await this.clearSearchButton.click();
        } else {
            await this.searchJobsInput.fill('');
        }
    }

    rowForJob(name) {
        return this.jobsTable.locator('tbody tr').filter({ hasText: name }).first();
    }

    // Job Details Actions
    async openJobFromTable(name) {
        const row = this.rowForJob(name);
        await row.locator('td').first().click();
        await this.page.waitForURL(/\/jobs\/.+/);
        await this.assignedReporterHeading.waitFor();
    }

    async openAssignReporterModal() {
        await this.assignReporterButton.click();
        await this.assignReporterDialog.waitFor();
    }

    async closeAssignReporterModal() {
        await this.assignReporterCloseButton.click();
        await this.assignReporterDialog.waitFor({ state: 'hidden' });
    }

    async selectAssignReporterUser(userName) {
        await this.assignReporterCombobox.click();
        if (userName) {
            await this.page.getByRole('option', { name: userName, exact: true }).click();
        } else {
            await this.page.getByRole('option').first().click();
        }
    }

    async submitAssignReporter() {
        await this.assignReporterSubmitButton.click();
        await this.assignReporterDialog.waitFor({ state: 'hidden' });
    }

    artifactCardFor(filename) {
        return this.artifactsSection.locator('div.border.rounded-lg').filter({ hasText: filename }).first();
    }

    artifactDownloadButton(filename) {
        return this.artifactCardFor(filename).locator('button[title="Download"]');
    }

    artifactDeleteButton(filename) {
        return this.artifactCardFor(filename).locator('button[title="Delete"]');
    }

    async uploadArtifactFile(filePath) {
        await this.artifactFileInput.setInputFiles(filePath);
    }

    async uploadMultipleArtifactFiles(filePaths) {
        await this.artifactFileInput.setInputFiles(filePaths);
    }

    async deleteArtifact(filename) {
        await this.artifactDeleteButton(filename).click();
        await this.deleteArtifactDialog.waitFor();
        await this.confirmDeleteArtifactButton.click();
        await this.deleteArtifactDialog.waitFor({ state: 'hidden' });
    }

    async uploadArtifact(filePath) {
        const fileChooserPromise = this.page.waitForEvent('filechooser', { timeout: 8000 }).catch(() => null);
        await this.uploadArtifactButton.click();
        const fileChooser = await fileChooserPromise;
        if (fileChooser) {
            await fileChooser.setFiles(filePath);
        } else if (await this.artifactFileInput.count() > 0) {
            await this.artifactFileInput.setInputFiles(filePath);
        }
    }

    // Repository Link Helpers
    async openFormatsMenu() {
        if (!(await this.formatsMenu.isVisible())) {
            await this.formatsButton.click();
            await this.formatsMenu.waitFor({ state: 'visible', timeout: 5000 });
        }
    }

    async closeFormatsMenu() {
        if (await this.formatsMenu.isVisible()) {
            await this.page.keyboard.press('Escape');
            await this.formatsMenu.waitFor({ state: 'hidden', timeout: 5000 });
        }
    }

    getFormatCheckbox(formatName) {
        const escaped = formatName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return this.formatsMenuItems.filter({
            has: this.page.locator('span').filter({ hasText: new RegExp(`^${escaped}$`) })
        }).first();
    }

    async toggleFormat(formatName) {
        await this.openFormatsMenu();
        const item = this.getFormatCheckbox(formatName);
        await item.click();
        await this.closeFormatsMenu();
    }

    async clickRegenerate() {
        const responsePromise = this.page.waitForResponse(
            res => res.url().includes('/repository-links') && res.status() === 200,
            { timeout: 15000 }
        );
        await this.regenerateRepoButton.click();
        return await responsePromise;
    }

    async openSyncGenerator() {
        await this.openSyncGeneratorButton.click();
        await this.page.waitForURL(/\/sync-generator\/.+/);
    }

    // Send To Helpers
    async openSendToModal() {
        await this.sendToButton.click();
        await this.sendToDialog.waitFor({ state: 'visible', timeout: 15000 });
    }

    async closeSendToModal() {
        if (await this.sendToCloseButton.isVisible()) {
            await this.sendToCloseButton.click();
        } else if (await this.sendToCancelButton.isVisible()) {
            await this.sendToCancelButton.click();
        }
        await this.sendToDialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    }

    async selectAccessType(type) {
        await this.accessTypeCombobox.click();
        await this.page.waitForTimeout(500);
        const option = this.accessTypeOptions.filter({ hasText: new RegExp(type, 'i') }).first();
        await option.click();
        await this.page.waitForTimeout(500);
    }

    async openAddRecipientModal() {
        await this.addRecipientButton.click();
        await this.addRecipientDialog.waitFor({ state: 'visible', timeout: 8000 });
    }

    async fillAndSubmitRecipient({ firstName, lastName, email, group } = {}) {
        await this.recipientFirstNameInput.fill(firstName);
        await this.recipientLastNameInput.fill(lastName);
        await this.recipientEmailInput.fill(email);
        if (group) {
            await this.recipientGroupCombobox.click();
            await this.page.getByRole('option', { name: group, exact: true }).click();
        }
        await this.submitAddRecipientButton.click();
        await this.addRecipientDialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    }

    async openAddGroupModal() {
        await this.addGroupButton.click();
        await this.addGroupDialog.waitFor({ state: 'visible', timeout: 8000 });
    }

    async closeAddGroupModal() {
        const cancelBtn = this.addGroupDialog.getByRole('button', { name: 'Cancel', exact: true });
        if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cancelBtn.click();
        } else {
            await this.page.keyboard.press('Escape');
        }
        await this.addGroupDialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    }
}

module.exports = JobsPage;
