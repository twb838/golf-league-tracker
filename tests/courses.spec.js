import { test, expect } from '@playwright/test';

test.describe('Courses Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/courses');
    });

    test('should display courses page title', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Golf Courses' })).toBeVisible();
    });

    test('should add a new course', async ({ page }) => {
        // Fill in course details
        await page.getByLabel('Course Name:').fill('Test Golf Course');
        
        // Fill in hole details
        const holeInputs = await page.locator('.hole-row').all();
        await holeInputs[0].locator('input[type="number"]').nth(0).fill('4'); // par
        await holeInputs[0].locator('input[type="number"]').nth(1).fill('1'); // handicap

        // Submit form
        await page.getByRole('button', { name: 'Add Course' }).click();

        // Verify success message
        await expect(page.locator('.success-modal')).toBeVisible();
        await expect(page.locator('.success-modal')).toContainText('Course created successfully');

        // Verify course appears in list
        await expect(page.locator('.courses-list')).toContainText('Test Golf Course');
    });

    test('should validate minimum hole requirements', async ({ page }) => {
        // Try to submit without any holes
        await page.getByLabel('Course Name:').fill('Invalid Course');
        await page.getByRole('button', { name: 'Add Course' }).click();

        // Verify error message
        await expect(page.locator('.error-message')).toBeVisible();
        await expect(page.locator('.error-message')).toContainText('Please fill in at least one hole');
    });

    test('should delete a course', async ({ page }) => {
        // Assuming there's at least one course in the list
        const courseName = await page.locator('.course-item span').first().textContent();
        
        // Click delete button and confirm
        await page.locator('.delete-button').first().click();
        await page.getByRole('button', { name: 'Delete' }).click();

        // Verify success message
        await expect(page.locator('.success-modal')).toBeVisible();
        await expect(page.locator('.success-modal')).toContainText('Course deleted successfully');

        // Verify course is removed from list
        await expect(page.locator('.courses-list')).not.toContainText(courseName);
    });

    test('should display course details', async ({ page }) => {
        // Click view details button on first course
        await page.locator('.view-button').first().click();

        // Verify modal appears with course details
        await expect(page.locator('.team-details-modal')).toBeVisible();
        await expect(page.locator('.team-details-content')).toContainText('Course Details');
        
        // Close modal
        await page.getByRole('button', { name: 'Close' }).click();
        await expect(page.locator('.team-details-modal')).not.toBeVisible();
    });
});