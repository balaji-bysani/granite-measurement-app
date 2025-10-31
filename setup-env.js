#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 Environment Setup Helper');
console.log('============================\n');

const questions = [
    {
        key: 'VERCEL_APP_NAME',
        question: 'Enter your Vercel app name (e.g., granite-measurement-app): ',
        required: true
    },
    {
        key: 'DB_HOST',
        question: 'Enter your Supabase database host (e.g., db.xxx.supabase.co): ',
        required: true
    },
    {
        key: 'DB_PASSWORD',
        question: 'Enter your Supabase database password: ',
        required: true,
        hidden: true
    }
];

const answers = {};

function askQuestion(index) {
    if (index >= questions.length) {
        generateEnvFile();
        return;
    }

    const q = questions[index];
    rl.question(q.question, (answer) => {
        if (q.required && !answer.trim()) {
            console.log('❌ This field is required. Please try again.');
            askQuestion(index);
            return;
        }
        
        answers[q.key] = answer.trim();
        askQuestion(index + 1);
    });
}

function generateEnvFile() {
    const envContent = `# Production Environment Variables for Vercel
# Copy these to your Vercel project settings

NODE_ENV=production
DB_HOST=${answers.DB_HOST}
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=${answers.DB_PASSWORD}
DATABASE_URL=postgresql://postgres:${answers.DB_PASSWORD}@${answers.DB_HOST}:5432/postgres
REACT_APP_API_URL=https://${answers.VERCEL_APP_NAME}.vercel.app/api
`;

    fs.writeFileSync('.env.production', envContent);
    
    console.log('\n✅ Environment file created: .env.production');
    console.log('\n📋 Copy these environment variables to Vercel:');
    console.log('=====================================');
    console.log(envContent);
    console.log('=====================================');
    console.log('\n🔗 Add them at: https://vercel.com/dashboard → Your Project → Settings → Environment Variables');
    
    rl.close();
}

console.log('This will help you create environment variables for deployment.\n');
askQuestion(0);