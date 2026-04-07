const OLD_URL = "https://mtepdeqkmnfhmhwgclhd.supabase.co/rest/v1";
const OLD_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZXBkZXFrbW5maG1od2djbGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5Mzc3MjUsImV4cCI6MjA5MDUxMzcyNX0.V6DJX28PJnyTmub-hfiFjTEmBavktbB4GNKtjfO8DnY";

const NEW_URL = "https://zxyvtgfzevbpsywajoeg.supabase.co/rest/v1";
const NEW_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eXZ0Z2Z6ZXZicHN5d2Fqb2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTA4OTMsImV4cCI6MjA5MTA2Njg5M30.6nHadZ3C38SgMRJn9cHA20J6l6O68XKpwl0QLYYlQ0Y";

const oldHeaders = {
    "apikey": OLD_KEY,
    "Authorization": `Bearer ${OLD_KEY}`,
    "Content-Type": "application/json"
};

const newHeaders = {
    "apikey": NEW_KEY,
    "Authorization": `Bearer ${NEW_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=minimal, resolution=merge-duplicates"
};

async function fetchAll(table) {
    let allData = [];
    let offset = 0;
    const limit = 1000;
    while(true) {
        let res = await fetch(`${OLD_URL}/${table}?select=*&limit=${limit}&offset=${offset}`, { headers: oldHeaders });
        const data = await res.json();
        if(!data || data.length === 0) break;
        allData = allData.concat(data);
        offset += data.length;
        if(data.length < limit) break;
    }
    return allData;
}

async function pushAll(table, data) {
    if(data.length === 0) return;
    
    // Chunk array to avoid Payload Too Large
    const chunkSize = 100;
    for(let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        console.log(`Pushing ${chunk.length} rows to ${table} (offset ${i})...`);
        const res = await fetch(`${NEW_URL}/${table}`, {
            method: 'POST',
            headers: newHeaders,
            body: JSON.stringify(chunk)
        });
        if(!res.ok) {
            const err = await res.text();
            console.error(`Failed to push to ${table}:`, res.status, res.statusText, err);
        }
    }
}

async function run() {
    console.log("Fetching old data...");
    const qs = await fetchAll("questions");
    console.log(`Fetched ${qs.length} questions`);
    const tqs = await fetchAll("tryout_questions");
    console.log(`Fetched ${tqs.length} tryout_questions`);
    
    console.log("Pushing questions...");
    await pushAll("questions", qs);
    
    // Push tryouts definitions statically
    const tryout = [{"id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","title":"Tryout UTBK SNBT Nasional Vol. 1","is_active":true,"created_at":"2026-04-02T15:43:01.319528+00:00","description":"Uji coba resmi berskala nasional SNBT dengan sistem IRT (Item Response Theory). Terdiri dari 7 subtes 155 soal.","duration_minutes":195}];
    await pushAll("tryouts", tryout);
    
    const sections = [{"id":"558b581e-feec-4ed2-aa3f-235c11d94466","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":1,"order_index":1,"duration_minutes":25},{"id":"2c6f7596-f15e-4db5-bded-8606a42b2748","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":2,"order_index":2,"duration_minutes":25},{"id":"caf8a14c-6dff-4c6d-b04d-be81c624a9b6","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":3,"order_index":3,"duration_minutes":25},{"id":"8556acd1-6d68-4bf1-b667-205933599cc6","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":4,"order_index":4,"duration_minutes":25},{"id":"03a1e70f-e18a-480b-90e7-53ba08a22268","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":5,"order_index":5,"duration_minutes":25},{"id":"f4320143-0fe4-4525-a146-dd43d2bdf7ff","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":6,"order_index":6,"duration_minutes":25},{"id":"e45a068c-8767-4523-95f9-27b64f8dcb6e","tryout_id":"7910cfb9-9baa-4ce3-8316-e7ff4c7ca166","subject_id":7,"order_index":7,"duration_minutes":25}];
    await pushAll("tryout_sections", sections);
    
    console.log("Pushing tryout_questions...");
    await pushAll("tryout_questions", tqs);
    
    console.log(`Success! Data migration completed via REST API.`);
}

run();
