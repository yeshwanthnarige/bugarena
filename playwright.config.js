import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./runs',testMatch:'**/regression.spec.js',workers:1,retries:0,use:{headless:true,screenshot:'only-on-failure'},reporter:'list'});
