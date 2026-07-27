const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const fdKeys = (env.FOOTBALL_DATA_KEYS || '').split(',').map(k => k.trim()).filter(Boolean);

async function testFootballData() {
  const key = fdKeys[0];
  console.log('Testing Football-Data key:', key);
  
  const res = await fetch('https://api.football-data.org/v4/competitions/PL/teams', {
    headers: { 'X-Auth-Token': key }
  });

  const data = await res.json();
  console.log('Status:', res.status);
  if (data.teams && data.teams[0]) {
    console.log('Sample team:', data.teams[0].name);
    console.log('Sample squad player:', data.teams[0].squad[0]);
  }
}

testFootballData().catch(console.error);
