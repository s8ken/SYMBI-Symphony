const { request, chromium } = require('@playwright/test');

const API = process.env.PW_API_BASE || 'http://localhost:5001';

module.exports = async () => {
  console.log('🚀 Global setup: Setting up authenticated session...');
  
  const requestContext = await request.newContext();
  const email = 'e2e+playwright@ycqsonate.com';
  const password = 'Playwright#123';

  try {
    // 1) Ensure user exists
    console.log(`📝 Registering test user: ${email}`);
    const regResponse = await requestContext.post(`${API}/api/auth/register`, {
      data: { name: 'E2E User', email, password }
    });
    
    if (regResponse.status() >= 400 && regResponse.status() !== 409) {
      throw new Error(`Register failed: ${regResponse.status()} ${await regResponse.text()}`);
    }
    
    if (regResponse.status() === 409) {
      console.log('✅ Test user already exists');
    } else {
      console.log('✅ Test user registered successfully');
    }

    // 2) Login and get JWT
    console.log('🔑 Logging in to get JWT token...');
    const loginResponse = await requestContext.post(`${API}/api/auth/login`, {
      data: { email, password }
    });
    
    if (loginResponse.status() !== 200) {
      throw new Error(`Login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
    }
    
    const { token } = await loginResponse.json();
    console.log('✅ Login successful, JWT token received');

    // 3) Persist localStorage token (frontend uses localStorage)
    console.log('💾 Storing authentication state...');
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    await page.goto('http://localhost:3002');
    await page.evaluate((jwt) => {
      localStorage.setItem('token', jwt);
    }, token);
    
    await context.storageState({ path: 'playwright/.auth/ycq.json' });
    await browser.close();
    
    console.log('✅ Authentication state saved to playwright/.auth/ycq.json');
    console.log('🎉 Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await requestContext.dispose();
  }
};