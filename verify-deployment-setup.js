#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Deployment Setup...\n');

const checks = [
    {
        name: 'vercel.json configuration',
        check: () => fs.existsSync('vercel.json'),
        fix: 'vercel.json file is missing'
    },
    {
        name: '.gitignore file',
        check: () => fs.existsSync('.gitignore'),
        fix: '.gitignore file is missing'
    },
    {
        name: '.env.example file',
        check: () => fs.existsSync('.env.example'),
        fix: '.env.example file is missing'
    },
    {
        name: 'Package.json has vercel-build script',
        check: () => {
            const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            return pkg.scripts && pkg.scripts['vercel-build'];
        },
        fix: 'Add "vercel-build": "npm run build" to package.json scripts'
    },
    {
        name: 'Server API entry point',
        check: () => fs.existsSync('server/api/index.js'),
        fix: 'server/api/index.js file is missing'
    },
    {
        name: 'Deployment guide',
        check: () => fs.existsSync('DEPLOYMENT.md'),
        fix: 'DEPLOYMENT.md file is missing'
    }
];

let allPassed = true;

checks.forEach((check, index) => {
    const passed = check.check();
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    
    if (!passed) {
        console.log(`   Fix: ${check.fix}`);
        allPassed = false;
    }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
    console.log('🎉 All checks passed! Your app is ready for deployment.');
    console.log('\n📋 Next steps:');
    console.log('1. Run: ./deploy.sh');
    console.log('2. Follow the DEPLOYMENT.md guide');
    console.log('3. Set up Supabase database');
    console.log('4. Deploy to Vercel');
} else {
    console.log('⚠️  Some checks failed. Please fix the issues above.');
}

console.log('\n📖 For detailed instructions, see: DEPLOYMENT.md');