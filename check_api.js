const url='https://zxyvtgfzevbpsywajoeg.supabase.co/rest/v1/tryouts?select=*,tryout_sections(*,tryout_questions(id,questions(*)))&limit=1';
fetch(url, {headers: {'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eXZ0Z2Z6ZXZicHN5d2Fqb2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTA4OTMsImV4cCI6MjA5MTA2Njg5M30.6nHadZ3C38SgMRJn9cHA20J6l6O68XKpwl0QLYYlQ0Y'}})
.then(r=>r.json())
.then(d => {
    const q = d[0].tryout_sections[0].tryout_questions[0].questions;
    console.log("Is array?", Array.isArray(q));
    console.log("Value:", JSON.stringify(q));
});
