const fs = require('fs');
const path = require('path');

const extractJson = (content) => {
    const match = content.match(/<untrusted-data-[^>]+>\s*([\s\S]*?)\s*<\/untrusted-data-[^>]+>/);
    return match ? JSON.parse(match[1]) : null;
};

const paths = [
    '158/output.txt',
    '159/output.txt',
    '160/output.txt',
    '161/output.txt'
];

let allQuestions = [];
for (const p of paths) {
    const fullPath = path.join(`C:/Users/ASUS/.gemini/antigravity/brain/ce690af0-b223-4010-9f63-e53ea489fb91/.system_generated/steps`, p);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = extractJson(content);
        if (parsed && parsed[0] && parsed[0].jsonb_agg) {
            allQuestions = allQuestions.concat(parsed[0].jsonb_agg);
        }
    }
}

// Extract tryout_questions
let allTryoutQuestions = [];
const tqPaths = ['166/output.txt', '167/output.txt', '168/output.txt'];
for (const p of tqPaths) {
    const fullPath = path.join(`C:/Users/ASUS/.gemini/antigravity/brain/ce690af0-b223-4010-9f63-e53ea489fb91/.system_generated/steps`, p);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = extractJson(content);
        if (parsed && parsed[0] && parsed[0].jsonb_agg) {
            allTryoutQuestions = allTryoutQuestions.concat(parsed[0].jsonb_agg);
        }
    }
}

const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return "'" + val.replace(/'/g, "''") + "'";
    if (typeof val === 'object') return "'" + JSON.stringify(val).replace(/'/g, "''") + "'";
    return val;
};

let sqlDoc = `-- Data Migration Script
-- Contains ${allQuestions.length} questions and ${allTryoutQuestions.length} tryout questions

BEGIN;

`;

for (const q of allQuestions) {
    sqlDoc += `INSERT INTO public.questions (id, subject_id, type, difficulty, content, options, correct_answer, explanation) VALUES (${escapeSql(q.id)}, ${q.subject_id}, ${escapeSql(q.type)}, ${escapeSql(q.difficulty)}, ${escapeSql(q.content)}, ${escapeSql(q.options)}::jsonb, ${escapeSql(q.correct_answer)}::jsonb, ${escapeSql(q.explanation)}) ON CONFLICT (id) DO NOTHING;\n`;
}

// Tryouts
const tryout = [{"id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","title":"Tryout UTBK SNBT Nasional Vol. 1","is_active":true,"created_at":"2026-04-02T15:43:01.319528+00:00","description":"Uji coba resmi berskala nasional SNBT dengan sistem IRT (Item Response Theory). Terdiri dari 7 subtes 155 soal.","duration_minutes":195}];
for (const t of tryout) {
    sqlDoc += `INSERT INTO public.tryouts (id, title, description, duration_minutes, is_active, created_at) VALUES (${escapeSql(t.id)}, ${escapeSql(t.title)}, ${escapeSql(t.description)}, ${t.duration_minutes}, ${t.is_active}, ${escapeSql(t.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}

// Sections
const sections = [{"id":"558b581e-feec-4ed2-aa3f-235c11d94466","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":1,"order_index":1,"duration_minutes":25},{"id":"2c6f7596-f15e-4db5-bded-8606a42b2748","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":2,"order_index":2,"duration_minutes":25},{"id":"caf8a14c-6dff-4c6d-b04d-be81c624a9b6","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":3,"order_index":3,"duration_minutes":25},{"id":"8556acd1-6d68-4bf1-b667-205933599cc6","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":4,"order_index":4,"duration_minutes":25},{"id":"03a1e70f-e18a-480b-90e7-53ba08a22268","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":5,"order_index":5,"duration_minutes":25},{"id":"f4320143-0fe4-4525-a146-dd43d2bdf7ff","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":6,"order_index":6,"duration_minutes":25},{"id":"e45a068c-8767-4523-95f9-27b64f8dcb6e","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":7,"order_index":7,"duration_minutes":25}];
for (const s of sections) {
    sqlDoc += `INSERT INTO public.tryout_sections (id, tryout_id, subject_id, order_index, duration_minutes) VALUES (${escapeSql(s.id)}, ${escapeSql(s.tryout_id)}, ${escapeSql(s.subject_id)}, ${escapeSql(s.order_index)}, ${escapeSql(s.duration_minutes)}) ON CONFLICT (id) DO NOTHING;\n`;
}

for (const tq of allTryoutQuestions) {
    sqlDoc += `INSERT INTO public.tryout_questions (id, section_id, question_id, order_index) VALUES (${escapeSql(tq.id)}, ${escapeSql(tq.section_id)}, ${escapeSql(tq.question_id)}, ${escapeSql(tq.order_index)}) ON CONFLICT (id) DO NOTHING;\n`;
}

sqlDoc += `COMMIT;\n`;

fs.writeFileSync('supabase/migrations/004_data_migration.sql', sqlDoc);
console.log('Done generating 004_data_migration.sql with ' + allQuestions.length + ' questions and ' + allTryoutQuestions.length + ' tryout links.');
