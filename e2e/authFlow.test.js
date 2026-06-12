describe('Auth and Workout Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' }
    });
  });

  beforeEach(async () => {
    // A Firebase belső hálózati kapcsolatot tarthat fennt (WebSocket/long-polling)
    // Ezektől a Detox folyamatosan tölteni vár, hacsak ki nem kapcsoljuk.
    await device.setURLBlacklist(['.*firestore.*', '.*googleapis.*']);
    await device.reloadReactNative();
  });

  it('should register, login, and create a workout', async () => {
    const timestamp = Date.now();
    const testEmail = `test_${timestamp}@example.com`;

    try {
      await expect(element(by.text('Create an account'))).toBeVisible();
      await element(by.text('Create an account')).tap();
    } catch(e) { }

    await element(by.id('email-input')).typeText(testEmail);
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('password-input')).tapReturnKey();
    await element(by.id('register-button')).tap();

    try {
      await waitFor(element(by.text('Workout Plans'))).toBeVisible().withTimeout(15000);
    } catch(err) {
      // Ha esetleg elakadt volna a regisztráció után (bár friss emaillel át kell navigálnia)
      // Biztos ami biztos megyünk a loginra, ha ott lenne
      try {
        await element(by.text('Already have an account? Login')).tap();
      } catch (linkErr) {}
      
      await waitFor(element(by.id('email-input'))).toBeVisible().withTimeout(5000);
      await element(by.id('email-input')).replaceText(testEmail);
      await element(by.id('password-input')).replaceText('password123');
      await element(by.id('password-input')).tapReturnKey();
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.text('Workout Plans'))).toBeVisible().withTimeout(15000);
    }

    await element(by.id('add-workout-button')).tap();
    await waitFor(element(by.id('workout-name-input'))).toBeVisible().withTimeout(5000);
    await element(by.id('workout-name-input')).replaceText('E2E Test Workout');
    await element(by.id('workout-name-input')).tapReturnKey();
    
    // Sometimes the keyboard might obstruct the save button, although dismiss happens inside handleSave.
    // Tapping the button directly.
    await element(by.id('save-workout-button')).tap();
    
    // Kezeljük le a 'Success' felugró Alert ablakot
    try {
      await waitFor(element(by.text('OK'))).toBeVisible().withTimeout(5000);
      await element(by.text('OK')).tap();
    } catch (e) {}

    await waitFor(element(by.text('E2E Test Workout'))).toBeVisible().withTimeout(10000);
  });
});
